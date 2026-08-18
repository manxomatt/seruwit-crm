<?php

namespace Tests\Feature\Reseller;

use App\Models\ResellerCommission;
use App\Models\ResellerCommissionRule;
use App\Models\ResellerProfile;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

class ResellerAdminTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    private User $admin;

    private User $reseller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());

        $this->reseller = User::factory()->create();
        $this->reseller->assignRole(Role::query()->where('slug', 'reseller')->firstOrFail());
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function profilePayload(array $overrides = []): array
    {
        $profile = ResellerProfile::ensureFor($this->reseller->global_id);

        return array_merge([
            'status' => ResellerProfile::STATUS_ACTIVE,
            'referral_code' => $profile->referral_code,
            'minimum_payout' => 0,
        ], $overrides);
    }

    public function test_admin_can_set_a_resellers_default_rate(): void
    {
        $this->actingAs($this->admin)
            ->patch(route('module.resellers.update', $this->reseller->global_id), $this->profilePayload([
                'company_name' => 'PT Mitra Jaya',
                'default_commission_type' => 'percent',
                'default_commission_value' => 25,
                'renewal_commission_value' => 8,
                'payout_bank_name' => 'BCA',
                'payout_account_number' => '1234567890',
                'payout_account_name' => 'PT Mitra Jaya',
            ]))
            ->assertRedirect();

        $profile = ResellerProfile::query()->where('reseller_global_id', $this->reseller->global_id)->firstOrFail();

        $this->assertSame('PT Mitra Jaya', $profile->company_name);
        $this->assertEqualsWithDelta(25, (float) $profile->default_commission_value, 0.01);
        $this->assertEqualsWithDelta(8, (float) $profile->renewal_commission_value, 0.01);
        $this->assertSame('BCA', $profile->payout_bank_name);
    }

    public function test_percentage_rate_above_one_hundred_is_rejected(): void
    {
        $this->actingAs($this->admin)
            ->patch(route('module.resellers.update', $this->reseller->global_id), $this->profilePayload([
                'default_commission_type' => 'percent',
                'default_commission_value' => 150,
            ]))
            ->assertSessionHasErrors('default_commission_value');
    }

    public function test_referral_code_must_be_unique(): void
    {
        $other = User::factory()->create();
        $taken = ResellerProfile::ensureFor($other->global_id);

        $this->actingAs($this->admin)
            ->patch(route('module.resellers.update', $this->reseller->global_id), $this->profilePayload([
                'referral_code' => $taken->referral_code,
            ]))
            ->assertSessionHasErrors('referral_code');
    }

    public function test_a_reseller_keeps_their_own_code_when_saving_other_fields(): void
    {
        $profile = ResellerProfile::ensureFor($this->reseller->global_id);

        $this->actingAs($this->admin)
            ->patch(route('module.resellers.update', $this->reseller->global_id), $this->profilePayload([
                'company_name' => 'Unchanged Code',
            ]))
            ->assertSessionHasNoErrors();

        $this->assertSame($profile->referral_code, $profile->fresh()->referral_code);
    }

    public function test_admin_can_create_a_rule_that_the_resolver_then_uses(): void
    {
        $plan = $this->makePlan(1_000_000);

        $this->actingAs($this->admin)
            ->post(route('module.reseller-rules.store'), [
                'reseller_global_id' => $this->reseller->global_id,
                'plan_id' => $plan->id,
                'applies_to' => 'all',
                'type' => 'percent',
                'value' => 30,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertSame(1, ResellerCommissionRule::query()->count());

        $order = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $plan));
        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();

        $this->assertEqualsWithDelta(300_000, (float) $commission->commission_amount, 0.01);
    }

    public function test_rule_percentage_is_capped_at_one_hundred(): void
    {
        $this->actingAs($this->admin)
            ->post(route('module.reseller-rules.store'), [
                'reseller_global_id' => $this->reseller->global_id,
                'applies_to' => 'all',
                'type' => 'percent',
                'value' => 120,
            ])
            ->assertSessionHasErrors('value');
    }

    /**
     * A rule's scope is the agreement; re-pointing it would silently rewrite
     * who gets paid for which plan.
     */
    public function test_updating_a_rule_cannot_move_it_to_another_reseller(): void
    {
        $other = User::factory()->create();
        $rule = ResellerCommissionRule::query()->create([
            'reseller_global_id' => $this->reseller->global_id,
            'applies_to' => 'all',
            'type' => 'percent',
            'value' => 10,
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->patch(route('module.reseller-rules.update', $rule->id), [
                'reseller_global_id' => $other->global_id,
                'applies_to' => 'all',
                'type' => 'percent',
                'value' => 20,
            ])
            ->assertRedirect();

        $rule->refresh();

        $this->assertSame($this->reseller->global_id, $rule->reseller_global_id);
        $this->assertEqualsWithDelta(20, (float) $rule->value, 0.01);
    }

    public function test_admin_can_delete_a_rule_without_touching_recorded_commissions(): void
    {
        $plan = $this->makePlan(1_000_000);
        $rule = ResellerCommissionRule::query()->create([
            'reseller_global_id' => $this->reseller->global_id,
            'plan_id' => $plan->id,
            'applies_to' => 'all',
            'type' => 'percent',
            'value' => 30,
            'is_active' => true,
        ]);

        $order = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $plan));

        $this->actingAs($this->admin)
            ->delete(route('module.reseller-rules.destroy', $rule->id))
            ->assertRedirect();

        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();

        $this->assertSame(0, ResellerCommissionRule::query()->count());
        $this->assertEqualsWithDelta(300_000, (float) $commission->commission_amount, 0.01);
        $this->assertEqualsWithDelta(30, (float) $commission->rate_value, 0.01);
    }

    public function test_admin_can_void_a_pending_commission(): void
    {
        $plan = $this->makePlan(1_000_000);
        $order = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $plan));
        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('module.reseller-commissions.void', $commission->id), ['reason' => 'Pembayaran direfund'])
            ->assertRedirect();

        $commission->refresh();

        $this->assertSame(ResellerCommission::STATUS_VOID, $commission->status);
        $this->assertSame('Pembayaran direfund', $commission->void_reason);
    }

    public function test_voiding_requires_a_reason(): void
    {
        $plan = $this->makePlan(1_000_000);
        $order = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $plan));
        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('module.reseller-commissions.void', $commission->id), [])
            ->assertSessionHasErrors('reason');
    }

    public function test_paid_commission_cannot_be_voided_from_the_queue(): void
    {
        $plan = $this->makePlan(1_000_000);
        $order = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $plan));
        $commission = ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();
        $commission->forceFill(['status' => ResellerCommission::STATUS_PAID, 'paid_at' => now()])->save();

        $this->actingAs($this->admin)
            ->post(route('module.reseller-commissions.void', $commission->id), ['reason' => 'Terlambat'])
            ->assertRedirect();

        $this->assertSame(ResellerCommission::STATUS_PAID, $commission->fresh()->status);
    }

    public function test_commission_queue_shows_every_resellers_rows(): void
    {
        $plan = $this->makePlan(1_000_000);
        $other = User::factory()->create();

        $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($other->global_id), $plan));

        $this->actingAs($this->admin)
            ->get(route('module.reseller-commissions.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Resellers/Commissions')
                ->count('commissions.data', 2)
                ->where('totals.pending.count', 2));
    }
}
