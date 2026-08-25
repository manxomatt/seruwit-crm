<?php

namespace Tests\Feature\Modules;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\DemoDatasets;
use App\Modules\ModuleInstaller;
use Database\Seeders\TenantDocumentDemoSeeder;
use Database\Seeders\TenantDriverDemoSeeder;
use Database\Seeders\TenantFuelDemoSeeder;
use Database\Seeders\TenantMaintenanceDemoSeeder;
use Database\Seeders\TenantPartnerDemoSeeder;
use Database\Seeders\TenantPartnerIndustriesSeeder;
use Database\Seeders\TenantVehicleDemoSeeder;
use Modules\Document\DocumentModule;
use Modules\Document\Models\Document;
use Modules\Fleet\FleetModule;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\MaintenanceModule;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class DemoDataInstallTest extends TestCase
{
    use WithTenant;

    private function ownerOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
    }

    public function test_workspace_without_flag_cannot_install_demo_data(): void
    {
        $tenant = $this->provisionTenant('No Demo Co', 'no-demo-co', 'owner@no-demo.test');
        $owner = $this->ownerOf($tenant, 'owner@no-demo.test');
        $tenant->update(['can_install_demo_data' => false]);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://no-demo-co.localhost/module/modules/demos/'.DemoDatasets::PARTNERS.'/install')
            ->assertForbidden();

        $tenant->run(fn () => $this->assertSame(
            0,
            Partner::query()->where('notes', 'like', '%'.TenantPartnerDemoSeeder::TAG.'%')->count(),
        ));
    }

    public function test_development_system_mode_grants_demo_data_on_new_tenants(): void
    {
        \App\Models\PlatformSetting::setValue(\App\Support\SystemMode::KEY, \App\Support\SystemMode::DEVELOPMENT);

        $tenant = $this->provisionTenant('Dev Demo Co', 'dev-demo-co', 'owner@dev-demo.test');

        $this->assertTrue($tenant->fresh()->canInstallDemoData());
    }

    public function test_production_system_mode_does_not_grant_demo_data_on_new_tenants(): void
    {
        \App\Models\PlatformSetting::setValue(\App\Support\SystemMode::KEY, \App\Support\SystemMode::PRODUCTION);

        $tenant = $this->provisionTenant('Prod Demo Co', 'prod-demo-co', 'owner@prod-demo.test');

        $this->assertFalse($tenant->fresh()->canInstallDemoData());
    }

    public function test_workspace_admin_can_install_and_uninstall_partners_demo(): void
    {
        $tenant = $this->provisionTenant('Partners Demo Co', 'partners-demo-co', 'owner@partners-demo.test');
        $owner = $this->ownerOf($tenant, 'owner@partners-demo.test');
        $tenant->update(['can_install_demo_data' => true]);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://partners-demo-co.localhost/module/modules/demos/'.DemoDatasets::PARTNERS.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::PARTNERS));
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::PARTNER_INDUSTRIES));
            $this->assertSame(20, Partner::query()->where('notes', 'like', '%'.TenantPartnerDemoSeeder::TAG.'%')->count());
            $this->assertSame(
                count(TenantPartnerIndustriesSeeder::CODES),
                PartnerIndustry::query()->whereIn('code', TenantPartnerIndustriesSeeder::CODES)->count(),
            );
        });

        $this->actingAs($owner)
            ->delete('http://partners-demo-co.localhost/module/modules/demos/'.DemoDatasets::PARTNERS)
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::PARTNERS));
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::PARTNER_INDUSTRIES));
            $this->assertSame(0, Partner::query()->where('notes', 'like', '%'.TenantPartnerDemoSeeder::TAG.'%')->count());
            $this->assertSame(
                0,
                PartnerIndustry::query()->whereIn('code', TenantPartnerIndustriesSeeder::CODES)->count(),
            );
        });
    }

    public function test_workspace_admin_can_install_partner_industries_alone(): void
    {
        $tenant = $this->provisionTenant('Industries Demo Co', 'industries-demo-co', 'owner@industries-demo.test');
        $owner = $this->ownerOf($tenant, 'owner@industries-demo.test');
        $tenant->update(['can_install_demo_data' => true]);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://industries-demo-co.localhost/module/modules/demos/'.DemoDatasets::PARTNER_INDUSTRIES.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::PARTNER_INDUSTRIES));
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::PARTNERS));
            $this->assertSame(
                count(TenantPartnerIndustriesSeeder::CODES),
                PartnerIndustry::query()->whereIn('code', TenantPartnerIndustriesSeeder::CODES)->count(),
            );
        });
    }

    public function test_vehicle_and_driver_demos_require_fleet_then_install_and_uninstall(): void
    {
        $tenant = $this->provisionTenant('Fleet Demo Co', 'fleet-demo-co', 'owner@fleet-demo.test');
        $owner = $this->ownerOf($tenant, 'owner@fleet-demo.test');
        $tenant->update([
            'plan' => 'pro',
            'can_install_demo_data' => true,
        ]);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://fleet-demo-co.localhost/module/modules/demos/'.DemoDatasets::VEHICLES.'/install')
            ->assertRedirect()
            ->assertSessionHas('error');

        app(ModuleInstaller::class)->install($tenant, app(FleetModule::class));
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://fleet-demo-co.localhost/module/modules/demos/'.DemoDatasets::VEHICLES.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->actingAs($owner)
            ->post('http://fleet-demo-co.localhost/module/modules/demos/'.DemoDatasets::DRIVERS.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::VEHICLES));
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::DRIVERS));
            $this->assertSame(30, Vehicle::query()->where('notes', 'like', '%'.TenantVehicleDemoSeeder::TAG.'%')->count());
            $this->assertSame(30, Driver::query()->where('notes', 'like', '%'.TenantDriverDemoSeeder::TAG.'%')->count());
        });

        $this->actingAs($owner)
            ->delete('http://fleet-demo-co.localhost/module/modules/demos/'.DemoDatasets::VEHICLES)
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->actingAs($owner)
            ->delete('http://fleet-demo-co.localhost/module/modules/demos/'.DemoDatasets::DRIVERS)
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::VEHICLES));
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::DRIVERS));
            $this->assertSame(0, Vehicle::query()->where('notes', 'like', '%'.TenantVehicleDemoSeeder::TAG.'%')->count());
            $this->assertSame(0, Driver::query()->where('notes', 'like', '%'.TenantDriverDemoSeeder::TAG.'%')->count());
        });
    }

    public function test_fuel_demo_requires_fleet_then_install_and_uninstall(): void
    {
        $tenant = $this->provisionTenant('Fuel Demo Co', 'fuel-demo-co', 'owner@fuel-demo.test');
        $owner = $this->ownerOf($tenant, 'owner@fuel-demo.test');
        $tenant->update([
            'plan' => 'pro',
            'can_install_demo_data' => true,
        ]);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://fuel-demo-co.localhost/module/modules/demos/'.DemoDatasets::FUEL.'/install')
            ->assertRedirect()
            ->assertSessionHas('error');

        app(ModuleInstaller::class)->install($tenant, app(FleetModule::class));
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://fuel-demo-co.localhost/module/modules/demos/'.DemoDatasets::FUEL.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::FUEL));
            $this->assertSame(
                10,
                FuelLog::query()->where('receipt_number', 'like', TenantFuelDemoSeeder::RECEIPT_PREFIX.'%')->count(),
            );
        });

        $this->actingAs($owner)
            ->delete('http://fuel-demo-co.localhost/module/modules/demos/'.DemoDatasets::FUEL)
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::FUEL));
            $this->assertSame(
                0,
                FuelLog::query()->where('receipt_number', 'like', TenantFuelDemoSeeder::RECEIPT_PREFIX.'%')->count(),
            );
        });
    }

    public function test_document_and_maintenance_demos_require_modules_then_install_and_uninstall(): void
    {
        $tenant = $this->provisionTenant('Docs Maint Demo Co', 'docs-maint-demo', 'owner@docs-maint.test');
        $owner = $this->ownerOf($tenant, 'owner@docs-maint.test');
        $tenant->update([
            'plan' => 'pro',
            'can_install_demo_data' => true,
        ]);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://docs-maint-demo.localhost/module/modules/demos/'.DemoDatasets::DOCUMENTS.'/install')
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->actingAs($owner)
            ->post('http://docs-maint-demo.localhost/module/modules/demos/'.DemoDatasets::MAINTENANCE.'/install')
            ->assertRedirect()
            ->assertSessionHas('error');

        app(ModuleInstaller::class)->install($tenant, app(FleetModule::class));
        app(ModuleInstaller::class)->install($tenant, app(DocumentModule::class));
        app(ModuleInstaller::class)->install($tenant, app(MaintenanceModule::class));
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://docs-maint-demo.localhost/module/modules/demos/'.DemoDatasets::DOCUMENTS.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->actingAs($owner)
            ->post('http://docs-maint-demo.localhost/module/modules/demos/'.DemoDatasets::MAINTENANCE.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::DOCUMENTS));
            $this->assertTrue(DemoDatasets::isInstalled(DemoDatasets::MAINTENANCE));
            $this->assertGreaterThan(
                60,
                Document::query()->where('notes', 'like', '%'.TenantDocumentDemoSeeder::TAG.'%')->count(),
            );
            $this->assertGreaterThanOrEqual(
                10,
                WorkOrder::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count(),
            );
        });

        $this->actingAs($owner)
            ->delete('http://docs-maint-demo.localhost/module/modules/demos/'.DemoDatasets::DOCUMENTS)
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->actingAs($owner)
            ->delete('http://docs-maint-demo.localhost/module/modules/demos/'.DemoDatasets::MAINTENANCE)
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::DOCUMENTS));
            $this->assertFalse(DemoDatasets::isInstalled(DemoDatasets::MAINTENANCE));
            $this->assertSame(
                0,
                Document::query()->where('notes', 'like', '%'.TenantDocumentDemoSeeder::TAG.'%')->count(),
            );
            $this->assertSame(
                0,
                WorkOrder::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count(),
            );
        });
    }

    public function test_installer_rejects_demo_when_flag_is_off(): void
    {
        $tenant = $this->provisionTenant('Blocked Demo Co', 'blocked-demo-co', 'owner@blocked-demo.test');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('not allowed');

        app(ModuleInstaller::class)->installDemo($tenant, DemoDatasets::PARTNERS);
    }

    public function test_non_admin_cannot_install_demo_even_with_flag(): void
    {
        $tenant = $this->provisionTenant('Member Demo Co', 'member-demo-co', 'owner@member-demo.test');
        $tenant->update(['can_install_demo_data' => true]);

        $member = $tenant->run(function (): User {
            $user = User::factory()->create(['email' => 'member@member-demo.test']);
            $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());

            return $user;
        });

        $this->actingAs($member)
            ->post('http://member-demo-co.localhost/module/modules/demos/'.DemoDatasets::PARTNERS.'/install')
            ->assertForbidden();
    }

    public function test_central_admin_can_toggle_demo_data_flag(): void
    {
        $tenant = $this->provisionTenant('Toggle Demo Co', 'toggle-demo-co', 'owner@toggle-demo.test');
        tenancy()->end();

        $admin = User::factory()->create(['email' => 'super@toggle-demo.test']);
        $role = Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Platform admin', 'is_system' => true, 'dashboard_path' => '/module/dashboard'],
        );
        $admin->assignRole($role);

        $this->actingAs($admin)
            ->patch(route('module.tenants.update', $tenant), [
                'name' => $tenant->name,
                'subdomain' => 'toggle-demo-co',
                'status' => 'active',
                'plan' => $tenant->planKey(),
                'can_install_demo_data' => true,
            ])
            ->assertRedirect();

        $this->assertTrue($tenant->fresh()->canInstallDemoData());
    }
}
