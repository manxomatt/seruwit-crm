<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Modules\ModuleInstaller;
use Modules\Billing\BillingModule;
use Modules\Billing\Models\OrderCharge;
use Modules\Customer\Models\Customer;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\OrdersModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Proves Billing behaves like any other optional module: entitlement-gated,
 * installed with its whole requirement chain, and holding Orders in place
 * while it depends on it. Also proves the pricing observer is inert in a
 * tenant that does not have Billing installed.
 */
class BillingModuleLifecycleTest extends TestCase
{
    use WithTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function billing(): BillingModule
    {
        return app(BillingModule::class);
    }

    private function orders(): OrdersModule
    {
        return app(OrdersModule::class);
    }

    public function test_installing_requires_a_plan_entitled_to_billing(): void
    {
        $tenant = $this->provisionTenant('Basic Billing Co', 'basic-billing-co', 'owner@basic-billing.test');

        // The default plan (basic) does not include billing.
        $this->expectException(\RuntimeException::class);
        $this->installer()->install($tenant, $this->billing());
    }

    public function test_installing_billing_auto_installs_its_whole_requirement_chain(): void
    {
        $tenant = $this->provisionTenant('Billing Chain Co', 'billing-chain-co', 'owner@billing-chain.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->billing());

        $tenant->run(function () {
            foreach (['billing', 'orders', 'transportation', 'fleet', 'customers', 'products'] as $key) {
                $this->assertTrue(
                    InstalledModule::query()->where('key', $key)->installed()->exists(),
                    "Expected module [{$key}] to be installed.",
                );
            }
        });
    }

    public function test_orders_cannot_be_uninstalled_while_billing_depends_on_it(): void
    {
        $tenant = $this->provisionTenant('Billing Guard Co', 'billing-guard-co', 'owner@billing-guard.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->billing());

        $this->expectException(\RuntimeException::class);
        $this->installer()->uninstall($tenant, $this->orders());
    }

    public function test_the_pricing_observer_is_inert_where_billing_is_not_installed(): void
    {
        $tenant = $this->provisionTenant('No Billing Co', 'no-billing-co', 'owner@no-billing.test');
        $tenant->plan = 'pro';
        $tenant->save();

        // Orders (and its chain) installed, but not Billing — the order_charges
        // table does not exist in this tenant, so the observer must no-op.
        $this->installer()->install($tenant, $this->orders());

        $tenant->run(function () {
            $order = DeliveryOrder::create([
                'code' => DeliveryOrder::nextCode(),
                'customer_id' => Customer::factory()->create()->id,
                'status' => DeliveryOrder::STATUS_DRAFT,
                'order_date' => now()->toDateString(),
                'pickup_address' => 'Gudang A',
                'delivery_address' => 'Toko B',
            ]);

            $order->update(['status' => DeliveryOrder::STATUS_CONFIRMED, 'confirmed_at' => now()]);

            $this->assertSame(DeliveryOrder::STATUS_CONFIRMED, $order->fresh()->status);
        });

        // Reaching here without a QueryException proves the gate held.
        $this->assertSame(0, OrderCharge::query()->count());
    }
}
