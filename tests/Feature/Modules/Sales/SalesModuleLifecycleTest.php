<?php

namespace Tests\Feature\Modules\Sales;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Sales\SalesModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class SalesModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_sales_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Sales Install Co', 'sales-install-co', 'owner@sales-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new SalesModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('sales_orders'));
            $this->assertTrue(Schema::hasTable('sales_order_items'));
            $this->assertTrue(Schema::hasTable('goods_issue_notes'));
            $this->assertTrue(Schema::hasTable('goods_issue_note_items'));
            $this->assertTrue(Schema::hasTable('sales_returns'));
            $this->assertTrue(Schema::hasTable('sales_return_items'));
            $this->assertDatabaseHas('permissions', ['module' => 'sales', 'action' => 'view']);
            $this->assertDatabaseHas('permissions', ['module' => 'sales', 'action' => 'issue']);
            $this->assertDatabaseHas('menus', ['slug' => 'sales']);
        });
    }
}
