<?php

namespace Tests\Feature\Reseller;

use App\Models\Plan;
use App\Models\ResellerCommission;
use App\Models\ResellerPayout;
use App\Models\ResellerProfile;
use App\Models\Role;
use App\Models\User;
use App\Notifications\ResellerPayoutPaidNotification;
use App\Services\ResellerPayoutService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

class PayoutTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    private User $admin;

    private User $reseller;

    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
        config()->set('reseller.minimum_payout', 0);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());

        $this->reseller = User::factory()->create();
        $this->reseller->assignRole(Role::query()->where('slug', 'reseller')->firstOrFail());

        $this->plan = $this->makePlan(1_000_000);
    }

    /**
     * Accrue a commission and push it past its hold, which is the only state a
     * payout batch will pick up.
     */
    private function approvedCommission(?User $reseller = null): ResellerCommission
    {
        $owner = $reseller ?? $this->reseller;
        $order = $this->confirmOrder($this->makeOrder($this->makeTenant($owner->global_id), $this->plan));

        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();
        $commission->forceFill([
            'status' => ResellerCommission::STATUS_APPROVED,
            'approved_at' => now(),
        ])->save();

        return $commission;
    }

    private function service(): ResellerPayoutService
    {
        return app(ResellerPayoutService::class);
    }

    private function buildForThisMonth(?User $reseller = null): ?ResellerPayout
    {
        return $this->service()->buildDraft(
            ($reseller ?? $this->reseller)->global_id,
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth(),
        );
    }

    // -----------------------------------------------------------------------
    // Building a batch
    // -----------------------------------------------------------------------

    public function test_draft_collects_approved_commissions_and_locks_them_to_the_batch(): void
    {
        $first = $this->approvedCommission();
        $second = $this->approvedCommission();

        $payout = $this->buildForThisMonth();

        $this->assertNotNull($payout);
        $this->assertSame(ResellerPayout::STATUS_DRAFT, $payout->status);
        $this->assertEqualsWithDelta(200_000, (float) $payout->gross_amount, 0.01);
        $this->assertEqualsWithDelta(200_000, (float) $payout->net_amount, 0.01);
        $this->assertSame($payout->id, $first->fresh()->payout_id);
        $this->assertSame($payout->id, $second->fresh()->payout_id);
        $this->assertMatchesRegularExpression('/^PAY-\d{4}-\d{2}-\d{4}$/', $payout->reference);
    }

    public function test_commissions_still_on_hold_are_left_out(): void
    {
        $this->approvedCommission();
        $held = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));

        $payout = $this->buildForThisMonth();

        $this->assertEqualsWithDelta(100_000, (float) $payout->net_amount, 0.01);
        $this->assertNull(
            ResellerCommission::query()->where('payment_order_id', $held->id)->firstOrFail()->payout_id,
        );
    }

    public function test_another_resellers_commissions_are_never_swept_in(): void
    {
        $other = User::factory()->create();
        $this->approvedCommission();
        $theirs = $this->approvedCommission($other);

        $payout = $this->buildForThisMonth();

        $this->assertEqualsWithDelta(100_000, (float) $payout->net_amount, 0.01);
        $this->assertNull($theirs->fresh()->payout_id);
    }

    public function test_commissions_outside_the_period_are_left_out(): void
    {
        $old = $this->approvedCommission();
        $old->forceFill(['created_at' => now()->subMonths(3)])->save();

        $this->assertNull($this->buildForThisMonth());
        $this->assertNull($old->fresh()->payout_id);
    }

    public function test_a_commission_already_in_a_batch_is_not_taken_twice(): void
    {
        $this->approvedCommission();

        $this->assertNotNull($this->buildForThisMonth());
        $this->assertNull($this->buildForThisMonth());
        $this->assertSame(1, ResellerPayout::query()->count());
    }

    public function test_total_below_the_minimum_payout_rolls_over_instead_of_batching(): void
    {
        config()->set('reseller.minimum_payout', 500_000);
        $commission = $this->approvedCommission();

        $this->assertNull($this->buildForThisMonth());
        $this->assertNull($commission->fresh()->payout_id);
        $this->assertSame(ResellerCommission::STATUS_APPROVED, $commission->fresh()->status);
    }

    public function test_a_resellers_own_minimum_overrides_the_platform_default(): void
    {
        config()->set('reseller.minimum_payout', 0);
        $this->makeProfile($this->reseller, ['minimum_payout' => 500_000]);
        $this->approvedCommission();

        $this->assertNull($this->buildForThisMonth());
    }

    public function test_bank_details_are_snapshotted_onto_the_batch(): void
    {
        $profile = $this->makeProfile($this->reseller, [
            'payout_bank_name' => 'BCA',
            'payout_account_number' => '1234567890',
            'payout_account_name' => 'PT Mitra Jaya',
        ]);
        $this->approvedCommission();

        $payout = $this->buildForThisMonth();

        $this->assertSame('BCA', $payout->bank_name);
        $this->assertSame('1234567890', $payout->account_number);

        // Later profile edits must not rewrite what the batch says it paid.
        $profile->update(['payout_account_number' => '9999999999']);

        $this->assertSame('1234567890', $payout->fresh()->account_number);
    }

    public function test_a_suspended_reseller_cannot_be_paid(): void
    {
        $this->makeProfile($this->reseller, ['status' => ResellerProfile::STATUS_SUSPENDED]);
        $this->approvedCommission();

        $this->expectException(RuntimeException::class);

        $this->buildForThisMonth();
    }

    // -----------------------------------------------------------------------
    // Approving and paying
    // -----------------------------------------------------------------------

    public function test_paying_a_batch_settles_every_commission_in_it(): void
    {
        Notification::fake();

        $commission = $this->approvedCommission();
        $payout = $this->buildForThisMonth();

        $this->service()->approve($payout, $this->admin);
        $this->service()->markPaid($payout->fresh(), $this->admin, UploadedFile::fake()->create('bukti.jpg', 50), 'Transfer BCA');

        $payout->refresh();
        $commission->refresh();

        $this->assertSame(ResellerPayout::STATUS_PAID, $payout->status);
        $this->assertNotNull($payout->paid_at);
        $this->assertNotNull($payout->transfer_proof_path);
        $this->assertSame('Transfer BCA', $payout->notes);
        $this->assertSame(ResellerCommission::STATUS_PAID, $commission->status);
        $this->assertNotNull($commission->paid_at);

        Notification::assertSentTo($this->reseller, ResellerPayoutPaidNotification::class);
    }

    public function test_a_draft_cannot_be_paid_before_it_is_approved(): void
    {
        $this->approvedCommission();
        $payout = $this->buildForThisMonth();

        $this->expectException(RuntimeException::class);

        $this->service()->markPaid($payout, $this->admin);
    }

    public function test_a_batch_cannot_be_approved_twice(): void
    {
        $this->approvedCommission();
        $payout = $this->buildForThisMonth();

        $this->service()->approve($payout, $this->admin);

        $this->expectException(RuntimeException::class);

        $this->service()->approve($payout->fresh(), $this->admin);
    }

    public function test_cancelling_a_batch_returns_its_commissions_to_the_queue(): void
    {
        $commission = $this->approvedCommission();
        $payout = $this->buildForThisMonth();

        $this->service()->cancel($payout);

        $commission->refresh();

        $this->assertSame(ResellerPayout::STATUS_CANCELLED, $payout->fresh()->status);
        $this->assertNull($commission->payout_id);
        $this->assertSame(ResellerCommission::STATUS_APPROVED, $commission->status);

        // And they are available to the next batch.
        $this->assertNotNull($this->buildForThisMonth());
    }

    public function test_a_paid_batch_cannot_be_cancelled(): void
    {
        $this->approvedCommission();
        $payout = $this->buildForThisMonth();
        $this->service()->approve($payout, $this->admin);
        $this->service()->markPaid($payout->fresh(), $this->admin);

        $this->expectException(RuntimeException::class);

        $this->service()->cancel($payout->fresh());
    }

    // -----------------------------------------------------------------------
    // HTTP surface
    // -----------------------------------------------------------------------

    public function test_admin_can_build_a_batch_from_the_payout_desk(): void
    {
        $this->approvedCommission();

        $this->actingAs($this->admin)
            ->post(route('module.reseller-payouts.store'), [
                'reseller_global_id' => $this->reseller->global_id,
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertSame(1, ResellerPayout::query()->count());
    }

    public function test_building_with_nothing_to_pay_reports_back_instead_of_creating_an_empty_batch(): void
    {
        $this->actingAs($this->admin)
            ->post(route('module.reseller-payouts.store'), [
                'reseller_global_id' => $this->reseller->global_id,
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
            ])
            ->assertSessionHas('error');

        $this->assertSame(0, ResellerPayout::query()->count());
    }

    public function test_payout_desk_lists_who_is_owed_money(): void
    {
        $this->approvedCommission();

        $this->actingAs($this->admin)
            ->get(route('module.reseller-payouts.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Resellers/Payouts')
                ->count('candidates', 1)
                ->where('candidates.0.reseller_global_id', $this->reseller->global_id));
    }

    public function test_reseller_cannot_reach_the_payout_desk(): void
    {
        $this->actingAs($this->reseller)->get(route('module.reseller-payouts.index'))->assertForbidden();
        $this->actingAs($this->reseller)->post(route('module.reseller-payouts.store'), [])->assertForbidden();
    }

    public function test_reseller_sees_only_their_own_payout_history(): void
    {
        $other = User::factory()->create();
        $this->approvedCommission();
        $this->approvedCommission($other);

        $this->buildForThisMonth();
        $this->buildForThisMonth($other);

        $this->actingAs($this->reseller)
            ->get(route('module.reseller.payouts'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Reseller/Payouts')
                ->count('payouts.data', 1)
                ->where('payouts.data.0.reseller_global_id', $this->reseller->global_id));
    }
}
