<?php

namespace Tests\Feature\Reseller;

use App\Models\ResellerCommission;
use App\Services\ResellerCommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

class CommissionLifecycleTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
        config()->set('reseller.hold_days', 7);
    }

    private function accrueCommission(): ResellerCommission
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $order = $this->confirmOrder($this->makeOrder($tenant, $this->makePlan(1_000_000, 'plan-'.uniqid())));

        return ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();
    }

    public function test_matured_commissions_are_approved(): void
    {
        $commission = $this->accrueCommission();
        $commission->forceFill(['hold_until' => now()->subMinute()])->save();

        $this->assertSame(1, app(ResellerCommissionService::class)->approveMatured());

        $commission->refresh();
        $this->assertSame(ResellerCommission::STATUS_APPROVED, $commission->status);
        $this->assertNotNull($commission->approved_at);
    }

    public function test_commissions_still_in_their_hold_window_are_left_alone(): void
    {
        $commission = $this->accrueCommission();

        $this->assertSame(0, app(ResellerCommissionService::class)->approveMatured());
        $this->assertSame(ResellerCommission::STATUS_PENDING, $commission->refresh()->status);
    }

    public function test_pending_commission_can_be_voided(): void
    {
        $commission = $this->accrueCommission();

        $this->assertTrue(app(ResellerCommissionService::class)->void($commission, 'Pembayaran direfund'));

        $commission->refresh();
        $this->assertSame(ResellerCommission::STATUS_VOID, $commission->status);
        $this->assertSame('Pembayaran direfund', $commission->void_reason);
        $this->assertNotNull($commission->voided_at);
    }

    public function test_paid_commission_cannot_be_voided(): void
    {
        $commission = $this->accrueCommission();
        $commission->forceFill([
            'status' => ResellerCommission::STATUS_PAID,
            'paid_at' => now(),
        ])->save();

        $this->assertFalse(app(ResellerCommissionService::class)->void($commission, 'Terlambat'));
        $this->assertSame(ResellerCommission::STATUS_PAID, $commission->refresh()->status);
    }

    public function test_voiding_by_order_finds_the_ledger_row(): void
    {
        $commission = $this->accrueCommission();
        $order = $commission->paymentOrder;

        $this->assertTrue(app(ResellerCommissionService::class)->voidForOrder($order, 'Refund'));
        $this->assertSame(ResellerCommission::STATUS_VOID, $commission->refresh()->status);
    }

    /**
     * A voided commission stops counting as a live claim, so the next payment
     * for that tenant reuses the cycle number rather than skipping one.
     */
    public function test_voided_commissions_free_up_their_occurrence(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan(1_000_000);

        $first = $this->confirmOrder($this->makeOrder($tenant, $plan));
        $firstCommission = ResellerCommission::query()->where('payment_order_id', $first->id)->firstOrFail();
        app(ResellerCommissionService::class)->void($firstCommission, 'Refund');

        $second = $this->confirmOrder($this->makeOrder($tenant->fresh(), $plan, 'renew'));
        $secondCommission = ResellerCommission::query()->where('payment_order_id', $second->id)->firstOrFail();

        $this->assertSame(1, $secondCommission->occurrence);
    }
}
