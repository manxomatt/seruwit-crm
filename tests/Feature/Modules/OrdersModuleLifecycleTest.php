<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Models\Permission;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Orders\OrdersModule;
use Modules\TransportationManagement\TransportationManagementModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Proves Orders behaves like any other optional module and that its declared
 * requirement chain (transportation → fleet/partners/products) is installed
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
            foreach (['orders', 'transportation', 'fleet', 'partners', 'products'] as $key) {
                $this->assertTrue(
                    InstalledModule::query()->where('key', $key)->installed()->exists(),
                    "Expected module [{$key}] to be installed.",
                );
            }
        });
    }

    public function test_installing_creates_the_pod_tables_and_seeds_the_deliver_capability(): void
    {
        $tenant = $this->provisionTenant('POD Co', 'pod-co', 'owner@pod.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->orders());

        $tenant->run(function () {
            foreach (['proof_of_deliveries', 'pod_photos', 'pod_items'] as $table) {
                $this->assertTrue(Schema::hasTable($table), "Expected table [{$table}] to exist.");
            }

            $this->assertTrue(
                Permission::query()->where('module', 'orders')->where('action', 'deliver')->exists(),
                'Expected the orders,deliver permission to be seeded.',
            );
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
