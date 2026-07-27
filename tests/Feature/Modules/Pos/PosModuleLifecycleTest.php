<?php

namespace Tests\Feature\Modules\Pos;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Pos\PosModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class PosModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_pos_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('POS Install Co', 'pos-install-co', 'owner@pos-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new PosModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('pos_shifts'));
            $this->assertTrue(Schema::hasTable('pos_sales'));
            $this->assertTrue(Schema::hasTable('pos_sale_items'));
            $this->assertTrue(Schema::hasTable('pos_payments'));
            $this->assertDatabaseHas('permissions', ['module' => 'pos', 'action' => 'sell']);
            $this->assertDatabaseHas('permissions', ['module' => 'pos', 'action' => 'open_shift']);
            $this->assertDatabaseHas('permissions', ['module' => 'pos', 'action' => 'close_shift']);
            $this->assertDatabaseHas('permissions', ['module' => 'pos', 'action' => 'void']);
            $this->assertDatabaseHas('permissions', ['module' => 'pos', 'action' => 'refund']);
            $this->assertDatabaseHas('menus', ['slug' => 'pos']);
        });
    }
}
