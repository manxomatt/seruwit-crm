<?php

namespace Tests\Feature\Modules\DriverScoring;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\DriverScoring\DriverScoringModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class DriverScoringModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_scoring_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Scoring Install Co', 'scoring-install-co', 'owner@scoring-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new DriverScoringModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('driver_scoring_settings'));
            $this->assertTrue(Schema::hasTable('driving_events'));
            $this->assertTrue(Schema::hasTable('driver_daily_scores'));
            $this->assertTrue(Schema::hasTable('driver_incentive_rules'));
            $this->assertTrue(Schema::hasTable('driver_incentive_awards'));
            $this->assertDatabaseHas('permissions', ['module' => 'scoring', 'action' => 'award']);
            $this->assertDatabaseHas('menus', ['slug' => 'scoring']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'fleet']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'tracking']);
        });
    }
}
