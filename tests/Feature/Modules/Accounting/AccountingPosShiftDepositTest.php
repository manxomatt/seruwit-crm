<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\BankTransaction;
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

class AccountingPosShiftDepositTest extends TestCase
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
     * @return array{shift: PosShift, product: Product, user: \App\Models\User, cash: CompanyBankAccount, bank: CompanyBankAccount}
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
            'batch_number' => 'LOT-DEP-1',
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

        $cash = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_CASH)->firstOrFail();
        $bank = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();

        return compact('shift', 'product', 'user', 'cash', 'bank');
    }

    public function test_closing_shift_deposits_cash_to_bank_with_transfer_journal(): void
    {
        ['shift' => $shift, 'product' => $product, 'user' => $user, 'cash' => $cash, 'bank' => $bank] = $this->seededOpenShift();

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 10000,
        ])->assertRedirect();

        // expected/counted 110000; deposit all to bank
        $this->actingAs($user)
            ->post(route('module.pos.shifts.close', $shift, false), [
                'closing_cash_counted' => 110000,
                'deposit_to_company_bank_account_id' => $bank->id,
                'deposit_amount' => 110000,
            ])
            ->assertRedirect();

        $shift->refresh();
        $this->assertSame(PosShift::STATUS_CLOSED, $shift->status);
        $this->assertSame($bank->id, (int) $shift->deposit_to_company_bank_account_id);
        $this->assertEquals(110000, (float) $shift->deposit_amount);

        $this->assertSame(
            2,
            BankTransaction::query()
                ->where('source_type', $shift->getMorphClass())
                ->where('source_id', $shift->id)
                ->where('type', BankTransaction::TYPE_TRANSFER)
                ->where('status', BankTransaction::STATUS_POSTED)
                ->count()
        );

        $this->assertDatabaseHas('bank_transactions', [
            'company_bank_account_id' => $cash->id,
            'direction' => BankTransaction::DIRECTION_OUT,
            'amount' => 110000,
            'source_id' => $shift->id,
        ]);
        $this->assertDatabaseHas('bank_transactions', [
            'company_bank_account_id' => $bank->id,
            'direction' => BankTransaction::DIRECTION_IN,
            'amount' => 110000,
            'source_id' => $shift->id,
        ]);

        $journal = JournalEntry::query()
            ->where('source_id', $shift->id)
            ->where('event', 'pos_shift.deposit')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines')
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue(
            $journal->lines->contains(
                fn ($line) => (int) $line->account_id === (int) $bank->account_id && (float) $line->debit === 110000.0
            )
        );
        $this->assertTrue(
            $journal->lines->contains(
                fn ($line) => (int) $line->account_id === (int) $cash->account_id && (float) $line->credit === 110000.0
            )
        );
    }

    public function test_deposit_same_as_cash_account_skips_transfer(): void
    {
        ['shift' => $shift, 'product' => $product, 'user' => $user, 'cash' => $cash] = $this->seededOpenShift();

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 10000,
        ])->assertRedirect();

        $this->actingAs($user)
            ->post(route('module.pos.shifts.close', $shift, false), [
                'closing_cash_counted' => 110000,
                'deposit_to_company_bank_account_id' => $cash->id,
                'deposit_amount' => 110000,
            ])
            ->assertRedirect();

        $this->assertSame(
            0,
            BankTransaction::query()
                ->where('source_id', $shift->id)
                ->count()
        );
        $this->assertSame(
            0,
            JournalEntry::query()
                ->where('source_id', $shift->id)
                ->where('event', 'pos_shift.deposit')
                ->count()
        );
    }

    public function test_deposit_cannot_exceed_counted_cash(): void
    {
        ['shift' => $shift, 'product' => $product, 'user' => $user, 'bank' => $bank] = $this->seededOpenShift();

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 10000,
        ])->assertRedirect();

        $this->actingAs($user)
            ->from(route('module.pos.shifts.show', $shift, false))
            ->post(route('module.pos.shifts.close', $shift, false), [
                'closing_cash_counted' => 110000,
                'deposit_to_company_bank_account_id' => $bank->id,
                'deposit_amount' => 120000,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('deposit_amount');

        $this->assertSame(PosShift::STATUS_OPEN, $shift->fresh()->status);
    }
}
