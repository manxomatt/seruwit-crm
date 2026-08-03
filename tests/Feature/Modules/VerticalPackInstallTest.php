<?php

namespace Tests\Feature\Modules;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\ModuleInstaller;
use App\Modules\VerticalPacks;
use Database\Seeders\TenantFinanceDemoSeeder;
use Database\Seeders\TenantPayablesDemoSeeder;
use Database\Seeders\TenantRentalDemoSeeder;
use Illuminate\Support\Facades\Schema;
use Modules\Billing\Models\Tariff;
use Modules\Invoicing\Models\Invoice;
use Modules\Payables\Models\SupplierBill;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class VerticalPackInstallTest extends TestCase
{
    use WithTenant;

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function ownerOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
    }

    public function test_catalog_hides_vertical_packs_and_demo_section_by_default(): void
    {
        $tenant = $this->provisionTenant('Pack Co', 'pack-co', 'owner@pack.test');
        $owner = $this->ownerOf($tenant, 'owner@pack.test');
        $tenant->update(['plan' => 'pro']);
        tenancy()->end();

        $this->actingAs($owner)->get('http://pack-co.localhost/module/modules')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Modules/Index')
                ->missing('packs')
                ->where('canInstallDemoData', false)
                ->where('demos', [])
            );
    }

    public function test_catalog_shows_demos_when_tenant_is_allowed(): void
    {
        $tenant = $this->provisionTenant('Demo Catalog Co', 'demo-catalog-co', 'owner@demo-catalog.test');
        $owner = $this->ownerOf($tenant, 'owner@demo-catalog.test');
        $tenant->update([
            'plan' => 'pro',
            'can_install_demo_data' => true,
        ]);
        tenancy()->end();

        $this->actingAs($owner)->get('http://demo-catalog-co.localhost/module/modules')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Modules/Index')
                ->where('canInstallDemoData', true)
                ->has('demos', 1)
                ->where('demos.0.key', \App\Modules\DemoDatasets::PARTNERS)
            );
    }

    public function test_workspace_admin_can_install_rental_mobil_pack(): void
    {
        $tenant = $this->provisionTenant('Rental Pack Co', 'rental-pack-co', 'owner@rental-pack.test');
        $owner = $this->ownerOf($tenant, 'owner@rental-pack.test');
        $tenant->update(['plan' => 'pro']);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://rental-pack-co.localhost/module/modules/packs/'.VerticalPacks::RENTAL_MOBIL.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('rentals'));
            $this->assertTrue(Schema::hasTable('vehicles'));
            $this->assertGreaterThan(
                0,
                Rental::query()->where('notes', 'like', '%'.TenantRentalDemoSeeder::TAG.'%')->count(),
            );
        });
    }

    public function test_pack_install_respects_plan_entitlement(): void
    {
        $tenant = $this->provisionTenant('Free Pack Co', 'free-pack-co', 'owner@free-pack.test');
        $owner = $this->ownerOf($tenant, 'owner@free-pack.test');
        $tenant->update(['plan' => 'free']);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://free-pack-co.localhost/module/modules/packs/'.VerticalPacks::RENTAL_MOBIL.'/install')
            ->assertSessionHas('error');

        $this->assertFalse(
            $this->installer()->isInstalled($tenant, app(\Modules\Rental\RentalModule::class)),
        );
    }

    public function test_non_admin_cannot_install_pack(): void
    {
        $tenant = $this->provisionTenant('Member Pack Co', 'member-pack-co', 'owner@member-pack.test');
        $tenant->update(['plan' => 'pro']);

        $member = $tenant->run(function (): User {
            $user = User::factory()->create(['email' => 'member@member-pack.test']);
            $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());

            return $user;
        });

        $this->actingAs($member)
            ->post('http://member-pack-co.localhost/module/modules/packs/'.VerticalPacks::RENTAL_MOBIL.'/install')
            ->assertForbidden();
    }

    public function test_workspace_admin_can_install_and_uninstall_finance_pack(): void
    {
        $tenant = $this->provisionTenant('Finance Pack Co', 'finance-pack-co', 'owner@finance-pack.test');
        $owner = $this->ownerOf($tenant, 'owner@finance-pack.test');
        $tenant->update(['plan' => 'pro']);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://finance-pack-co.localhost/module/modules/packs/'.VerticalPacks::FINANCE.'/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('invoices'));
            $this->assertTrue(Schema::hasTable('supplier_bills'));
            $this->assertTrue(Schema::hasTable('tariffs'));
            $this->assertGreaterThan(
                0,
                Invoice::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count(),
            );
            $this->assertGreaterThan(
                0,
                SupplierBill::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count(),
            );
            $this->assertGreaterThan(
                0,
                Tariff::query()->where('origin', 'like', 'FIN-DEMO %')->count(),
            );
        });

        $this->actingAs($owner)
            ->delete('http://finance-pack-co.localhost/module/modules/packs/'.VerticalPacks::FINANCE)
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $this->assertSame(
                0,
                Invoice::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count(),
            );
            $this->assertSame(
                0,
                SupplierBill::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count(),
            );
            $this->assertSame(
                0,
                Tariff::query()->where('origin', 'like', 'FIN-DEMO %')->count(),
            );
        });
    }
}
