<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Pos\Models\PosPayment;
use Modules\Pos\Models\PosShift;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingPosShiftVarianceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    /**
     * @return array{shift: PosShift, product: Product, user: \App\Models\User}
     */
    private function seededOpenShift(): array
    {
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $store->createDefaultLocations();
        $location = $store->locations()->where('code', 'STOCK')->firstOrFail();

        $product = Product::factory()->create([
            'category' => 'merchandise',
            'status' => 'active',
            'price' => 10000,
            'warehouse_id' => $store->id,
            'cost' => 4000,
        ]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $store->id,
            'location_id' => $location->id,
            'batch_number' => 'LOT-VAR-1',
            'expiry_date' => now()->addMonths(3)->toDateString(),
            'on_hand' => 20,
            'reserved' => 0,
        ]);

        $user = $this->createAdminUser();

        $shift = PosShift::query()->create([
            'warehouse_id' => $store->id,
            'opened_by' => $user->id,
            'status' => PosShift::STATUS_OPEN,
            'opening_float' => 100000,
            'opened_at' => now(),
        ]);

        return compact('shift', 'product', 'user');
    }

    public function test_closing_shift_with_shortage_posts_cash_variance(): void
    {
        ['shift' => $shift, 'product' => $product, 'user' => $user] = $this->seededOpenShift();

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 10000,
        ])->assertRedirect();

        // expected = 100000 + 10000 = 110000; counted 109500 → shortage 500
        $this->actingAs($user)
            ->post(route('module.pos.shifts.close', $shift, false), [
                'closing_cash_counted' => 109500,
            ])
            ->assertRedirect();

        $cash = CompanyBankAccount::query()
            ->where('kind', CompanyBankAccount::KIND_CASH)
            ->firstOrFail()
            ->ledgerAccount;
        $variance = Account::query()->where('system_role', 'cash_variance')->firstOrFail();

        $journal = JournalEntry::query()
            ->where('source_type', $shift->getMorphClass())
            ->where('source_id', $shift->id)
            ->where('event', 'pos_shift.shortage')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines')
            ->first();

        $this->assertNotNull($journal);
        $this->assertNotNull($cash);
        $this->assertTrue(
            $journal->lines->contains(
                fn ($line) => (int) $line->account_id === (int) $variance->id && (float) $line->debit === 500.0
            )
        );
        $this->assertTrue(
            $journal->lines->contains(
                fn ($line) => (int) $line->account_id === (int) $cash->id && (float) $line->credit === 500.0
            )
        );
    }

    public function test_closing_shift_with_overage_posts_cash_variance_credit(): void
    {
        ['shift' => $shift, 'product' => $product, 'user' => $user] = $this->seededOpenShift();

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 10000,
        ])->assertRedirect();

        $this->actingAs($user)
            ->post(route('module.pos.shifts.close', $shift, false), [
                'closing_cash_counted' => 110250,
            ])
            ->assertRedirect();

        $journal = JournalEntry::query()
            ->where('source_id', $shift->id)
            ->where('event', 'pos_shift.overage')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->first();

        $this->assertNotNull($journal);
    }

    public function test_closing_shift_with_zero_variance_skips_posting(): void
    {
        ['shift' => $shift, 'product' => $product, 'user' => $user] = $this->seededOpenShift();

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 10000,
        ])->assertRedirect();

        $this->actingAs($user)
            ->post(route('module.pos.shifts.close', $shift, false), [
                'closing_cash_counted' => 110000,
            ])
            ->assertRedirect();

        $this->assertSame(
            0,
            JournalEntry::query()
                ->where('source_id', $shift->id)
                ->whereIn('event', ['pos_shift.shortage', 'pos_shift.overage'])
                ->count()
        );
    }
}
