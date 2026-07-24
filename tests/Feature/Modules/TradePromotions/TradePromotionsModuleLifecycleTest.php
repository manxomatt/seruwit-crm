<?php

namespace Tests\Feature\Modules\TradePromotions;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\TradePromotions\TradePromotionsModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class TradePromotionsModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_promotions_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Promo Install Co', 'promo-install-co', 'owner@promo-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new TradePromotionsModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('trade_promo_programs'));
            $this->assertTrue(Schema::hasTable('trade_promo_tiers'));
            $this->assertTrue(Schema::hasTable('trade_promo_rebate_rules'));
            $this->assertTrue(Schema::hasTable('trade_promo_realizations'));
            $this->assertTrue(Schema::hasTable('trade_promo_awards'));
            $this->assertDatabaseHas('permissions', ['module' => 'promotions', 'action' => 'settle']);
            $this->assertDatabaseHas('menus', ['slug' => 'promotions']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'partners']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'products']);
        });
    }
}
