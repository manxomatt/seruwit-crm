<?php

namespace Tests\Feature\Reseller;

use App\Models\PaymentOrder;
use App\Models\ResellerCommission;
use App\Models\ResellerProfile;
use App\Models\User;
use App\Services\PaymentOrderService;
use App\Services\ResellerCommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

class CommissionAccrualTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
        config()->set('reseller.renewal_rate', ['type' => 'percent', 'value' => 5]);
        config()->set('reseller.hold_days', 7);
    }

    public function test_confirming_a_payment_accrues_a_commission(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan(1_000_000);

        $order = $this->confirmOrder($this->makeOrder($tenant, $plan));

        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->first();

        $this->assertNotNull($commission);
        $this->assertSame($reseller->global_id, $commission->reseller_global_id);
        $this->assertSame($tenant->id, $commission->tenant_id);
        $this->assertSame(ResellerCommission::EVENT_FIRST, $commission->event);
        $this->assertSame(1, $commission->occurrence);
        $this->assertSame(ResellerCommission::STATUS_PENDING, $commission->status);
        $this->assertEqualsWithDelta(100_000, (float) $commission->commission_amount, 0.01);
        $this->assertEqualsWithDelta(100_000, (float) $commission->net_amount, 0.01);
        $this->assertSame($order->plan_id, $commission->plan_id);
        $this->assertSame($order->subscription_id, $commission->subscription_id);
    }

    /**
     * The transfer unique code is a reconciliation artifact, not revenue — the
     * revenue journal books it to cash_variance, and the commission base has to
     * agree with that or the two will never reconcile.
     */
    public function test_commission_base_excludes_the_transfer_unique_code(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan(1_000_000);

        $order = $this->confirmOrder($this->makeOrder($tenant, $plan));

        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();

        $this->assertGreaterThan(0, $order->unique_code);
        $this->assertEqualsWithDelta((float) $order->amount, (float) $commission->base_amount, 0.01);
        $this->assertNotEqualsWithDelta((float) $order->total_amount, (float) $commission->base_amount, 0.01);
    }

    public function test_hold_period_is_stamped_from_the_confirmation(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan();

        $order = $this->confirmOrder($this->makeOrder($tenant, $plan));

        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();

        $this->assertNotNull($commission->hold_until);
        $this->assertTrue($commission->isHeld());
        $this->assertEqualsWithDelta(
            $order->confirmed_at->copy()->addDays(7)->timestamp,
            $commission->hold_until->timestamp,
            5,
        );
    }

    public function test_tenant_without_a_reseller_accrues_nothing(): void
    {
        $tenant = $this->makeTenant();
        $plan = $this->makePlan();

        $this->confirmOrder($this->makeOrder($tenant, $plan));

        $this->assertSame(0, ResellerCommission::query()->count());
    }

    public function test_accrual_is_idempotent_for_the_same_order(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan();

        $order = $this->confirmOrder($this->makeOrder($tenant, $plan));

        $service = app(ResellerCommissionService::class);
        $service->accrueFor($order);
        $service->accrueFor($order);

        $this->assertSame(1, ResellerCommission::query()->where('payment_order_id', $order->id)->count());
    }

    public function test_unconfirmed_order_accrues_nothing(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan();

        $order = $this->makeOrder($tenant, $plan);

        $this->assertNull(app(ResellerCommissionService::class)->accrueFor($order));
        $this->assertSame(0, ResellerCommission::query()->count());
    }

    public function test_rejected_order_accrues_nothing(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan();

        $order = $this->makeOrder($tenant, $plan);
        app(PaymentOrderService::class)->reject($order, User::factory()->create(), 'Bukti tidak valid');

        $this->assertSame(PaymentOrder::STATUS_REJECTED, $order->fresh()->status);
        $this->assertSame(0, ResellerCommission::query()->count());
    }

    public function test_expired_attribution_accrues_nothing(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id, [
            'reseller_attribution_ends_at' => now()->subDay(),
        ]);
        $plan = $this->makePlan();

        $this->confirmOrder($this->makeOrder($tenant, $plan));

        $this->assertSame(0, ResellerCommission::query()->count());
    }

    public function test_terminated_reseller_accrues_nothing(): void
    {
        $reseller = $this->makeReseller();
        $this->makeProfile($reseller, ['status' => ResellerProfile::STATUS_TERMINATED]);
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan();

        $this->confirmOrder($this->makeOrder($tenant, $plan));

        $this->assertSame(0, ResellerCommission::query()->count());
    }

    /**
     * Suspension is a payout freeze, not an earnings freeze — a partner in a
     * temporary dispute must not silently lose fees they earned meanwhile.
     */
    public function test_suspended_reseller_still_accrues(): void
    {
        $reseller = $this->makeReseller();
        $this->makeProfile($reseller, ['status' => ResellerProfile::STATUS_SUSPENDED]);
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan();

        $this->confirmOrder($this->makeOrder($tenant, $plan));

        $this->assertSame(1, ResellerCommission::query()->count());
    }

    public function test_renewal_uses_the_renewal_rate_and_advances_the_occurrence(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan(1_000_000);

        $this->confirmOrder($this->makeOrder($tenant, $plan));
        $renewal = $this->confirmOrder($this->makeOrder($tenant->fresh(), $plan, 'renew'));

        $commission = ResellerCommission::query()->where('payment_order_id', $renewal->id)->firstOrFail();

        $this->assertSame(ResellerCommission::EVENT_RENEWAL, $commission->event);
        $this->assertSame(2, $commission->occurrence);
        $this->assertEqualsWithDelta(50_000, (float) $commission->commission_amount, 0.01);
    }

    public function test_annual_interval_commissions_the_annual_price(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant($reseller->global_id);
        $plan = $this->makePlan(1_000_000);

        $order = $this->confirmOrder($this->makeOrder($tenant, $plan, 'activate', 'annual'));

        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();

        $this->assertEqualsWithDelta(10_000_000, (float) $commission->base_amount, 0.01);
        $this->assertEqualsWithDelta(1_000_000, (float) $commission->commission_amount, 0.01);
    }
}
