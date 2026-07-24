<?php

namespace Tests\Feature\Modules\Outbound;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Outbound\OutboundModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class OutboundModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_outbound_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Outbound Install Co', 'outbound-install-co', 'owner@outbound-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new OutboundModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('pick_lists'));
            $this->assertTrue(Schema::hasTable('pick_list_items'));
            $this->assertTrue(Schema::hasTable('packs'));
            $this->assertTrue(Schema::hasTable('pack_items'));
            $this->assertDatabaseHas('permissions', ['module' => 'outbound', 'action' => 'pick']);
            $this->assertDatabaseHas('permissions', ['module' => 'outbound', 'action' => 'pack']);
            $this->assertDatabaseHas('permissions', ['module' => 'outbound', 'action' => 'dispatch']);
            $this->assertDatabaseHas('menus', ['slug' => 'outbound']);
        });
    }
}
