<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Modules\ModuleInstaller;
use Modules\Orders\OrdersModule;
use Modules\TransportationManagement\TransportationManagementModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Proves Orders behaves like any other optional module and that its declared
 * requirement chain (transportation → fleet/customers/products) is installed
 * transitively, while Transportation stays uninstallable while Orders depends
 * on it.
 */
class OrdersModuleLifecycleTest extends TestCase
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

    private function orders(): OrdersModule
    {
        return app(OrdersModule::class);
    }

    private function transportation(): TransportationManagementModule
    {
        return app(TransportationManagementModule::class);
    }

    public function test_installing_requires_a_plan_entitled_to_orders(): void
    {
        $tenant = $this->provisionTenant('Basic Orders Co', 'basic-orders-co', 'owner@basic-orders.test');

        // The default plan (basic) does not include orders.
        $this->expectException(\RuntimeException::class);
        $this->installer()->install($tenant, $this->orders());
    }

    public function test_installing_orders_auto_installs_its_whole_requirement_chain(): void
    {
        $tenant = $this->provisionTenant('Chain Co', 'chain-co', 'owner@chain.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->orders());

        $tenant->run(function () {
            foreach (['orders', 'transportation', 'fleet', 'customers', 'products'] as $key) {
                $this->assertTrue(
                    InstalledModule::query()->where('key', $key)->installed()->exists(),
                    "Expected module [{$key}] to be installed.",
                );
            }
        });
    }

    public function test_transportation_cannot_be_uninstalled_while_orders_depends_on_it(): void
    {
        $tenant = $this->provisionTenant('Orders Guard Co', 'orders-guard-co', 'owner@orders-guard.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->orders());

        $this->expectException(\RuntimeException::class);
        $this->installer()->uninstall($tenant, $this->transportation());
    }
}
