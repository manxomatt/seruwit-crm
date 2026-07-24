<?php

namespace Tests\Feature\Modules\Purchasing;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Purchasing\PurchasingModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class PurchasingModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_purchasing_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Purchasing Install Co', 'purchasing-install-co', 'owner@purchasing-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new PurchasingModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('purchase_orders'));
            $this->assertTrue(Schema::hasTable('purchase_order_items'));
            $this->assertTrue(Schema::hasTable('good_receipt_notes'));
            $this->assertTrue(Schema::hasTable('good_receipt_note_items'));
            $this->assertTrue(Schema::hasColumn('stock_movements', 'batch_number'));
            $this->assertTrue(Schema::hasColumn('stock_movements', 'expiry_date'));
            $this->assertDatabaseHas('permissions', ['module' => 'purchasing', 'action' => 'view']);
            $this->assertDatabaseHas('permissions', ['module' => 'purchasing', 'action' => 'receive']);
            $this->assertDatabaseHas('menus', ['slug' => 'purchasing']);
        });
    }
}
