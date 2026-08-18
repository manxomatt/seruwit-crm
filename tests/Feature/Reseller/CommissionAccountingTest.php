<?php

namespace Tests\Feature\Reseller;

use App\Jobs\PostResellerCommissionJob;
use App\Jobs\PostResellerPayoutJob;
use App\Models\ResellerCommission;
use App\Models\ResellerPayout;
use App\Models\Role;
use App\Models\User;
use App\Services\ResellerCommissionService;
use App\Services\ResellerPayoutService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Accounting\Models\JournalEntry;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

/**
 * Journal entries the commission programme writes into the operator's ledger.
 */
class CommissionAccountingTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    private User $admin;

    private User $reseller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
        config()->set('reseller.minimum_payout', 0);
        config()->set('reseller.withholding', ['enabled' => false, 'with_npwp' => 2, 'without_npwp' => 4]);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());
        $this->reseller = $this->makeReseller();
    }

    private function accrue(): ResellerCommission
    {
        $order = $this->confirmOrder(
            $this->makeOrder($this->makeTenant($this->reseller->global_id), $this->makePlan(1_000_000, 'acct-'.uniqid())),
        );

        return ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();
    }

    private function entryFor(string $sourceType, int $sourceId, string $event): ?JournalEntry
    {
        return JournalEntry::query()
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->where('event', $event)
            ->with('lines')
            ->first();
    }

    public function test_accrual_books_a_balanced_expense_and_liability(): void
    {
        $commission = $this->accrue();

        $entry = $this->entryFor(ResellerCommission::class, $commission->id, PostResellerCommissionJob::EVENT_ACCRUED);

        $this->assertNotNull($entry);
        $this->assertSame(JournalEntry::STATUS_POSTED, $entry->status);
        $this->assertEqualsWithDelta(
            (float) $entry->lines->sum('debit'),
            (float) $entry->lines->sum('credit'),
            0.001,
        );
        $this->assertEqualsWithDelta(100_000, (float) $entry->lines->sum('debit'), 0.01);
    }

    public function test_withheld_tax_gets_its_own_credit_line(): void
    {
        config()->set('reseller.withholding', ['enabled' => true, 'with_npwp' => 2, 'without_npwp' => 4]);
        $this->makeProfile($this->reseller, ['tax_id' => '01.234.567.8-901.000']);

        $commission = $this->accrue();
        $entry = $this->entryFor(ResellerCommission::class, $commission->id, PostResellerCommissionJob::EVENT_ACCRUED);

        $this->assertNotNull($entry);
        $this->assertCount(3, $entry->lines);
        $this->assertEqualsWithDelta(
            (float) $entry->lines->sum('debit'),
            (float) $entry->lines->sum('credit'),
            0.001,
        );
    }

    public function test_posting_the_same_commission_twice_writes_one_entry(): void
    {
        $commission = $this->accrue();

        (new PostResellerCommissionJob($commission->id))->handle();
        (new PostResellerCommissionJob($commission->id))->handle();

        $this->assertSame(1, JournalEntry::query()
            ->where('source_type', ResellerCommission::class)
            ->where('source_id', $commission->id)
            ->where('event', PostResellerCommissionJob::EVENT_ACCRUED)
            ->count());
    }

    /**
     * A voided commission must not leave an expense sitting on the books.
     */
    public function test_voiding_posts_a_mirrored_reversal(): void
    {
        $commission = $this->accrue();
        app(ResellerCommissionService::class)->void($commission, 'Pembayaran direfund');

        $accrual = $this->entryFor(ResellerCommission::class, $commission->id, PostResellerCommissionJob::EVENT_ACCRUED);
        $reversal = $this->entryFor(ResellerCommission::class, $commission->id, PostResellerCommissionJob::EVENT_VOIDED);

        $this->assertNotNull($reversal);
        $this->assertEqualsWithDelta((float) $accrual->lines->sum('debit'), (float) $reversal->lines->sum('credit'), 0.001);
        $this->assertEqualsWithDelta((float) $accrual->lines->sum('credit'), (float) $reversal->lines->sum('debit'), 0.001);
    }

    public function test_a_reversal_is_not_posted_for_a_commission_that_still_stands(): void
    {
        $commission = $this->accrue();

        (new PostResellerCommissionJob($commission->id, reversal: true))->handle();

        $this->assertNull($this->entryFor(ResellerCommission::class, $commission->id, PostResellerCommissionJob::EVENT_VOIDED));
    }

    public function test_paying_a_batch_clears_the_liability_against_the_bank(): void
    {
        $commission = $this->accrue();
        $commission->forceFill([
            'status' => ResellerCommission::STATUS_APPROVED,
            'approved_at' => now(),
        ])->save();

        $payouts = app(ResellerPayoutService::class);
        $payout = $payouts->buildDraft(
            $this->reseller->global_id,
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth(),
        );

        $payouts->approve($payout, $this->admin);
        $payouts->markPaid($payout->fresh(), $this->admin);

        $entry = $this->entryFor(ResellerPayout::class, $payout->id, PostResellerPayoutJob::EVENT);

        $this->assertNotNull($entry);
        $this->assertCount(2, $entry->lines);
        $this->assertEqualsWithDelta(100_000, (float) $entry->lines->sum('debit'), 0.01);
        $this->assertEqualsWithDelta(
            (float) $entry->lines->sum('debit'),
            (float) $entry->lines->sum('credit'),
            0.001,
        );
    }

    public function test_an_unpaid_batch_posts_nothing(): void
    {
        $commission = $this->accrue();
        $commission->forceFill(['status' => ResellerCommission::STATUS_APPROVED, 'approved_at' => now()])->save();

        $payout = app(ResellerPayoutService::class)->buildDraft(
            $this->reseller->global_id,
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth(),
        );

        (new PostResellerPayoutJob($payout->id))->handle();

        $this->assertNull($this->entryFor(ResellerPayout::class, $payout->id, PostResellerPayoutJob::EVENT));
    }
}
