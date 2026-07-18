<?php

namespace Tests\Feature\Tenancy;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class TenantProvisioningTest extends TestCase
{
    use WithTenant;

    public function test_creating_a_tenant_provisions_and_migrates_its_database(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Company']);

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('users'));
            $this->assertTrue(Schema::hasTable('roles'));
            $this->assertTrue(Schema::hasTable('permissions'));
            $this->assertTrue(Schema::hasTable('settings'));
            $this->assertTrue(Schema::hasTable('media'));
            $this->assertTrue(Schema::hasTable('installed_modules'));

            // Pages and Posts are installable modules now — their tables only
            // appear when a workspace installs them, same as Carousels.
            $this->assertFalse(Schema::hasTable('pages'));
            $this->assertFalse(Schema::hasTable('posts'));
        });
    }

    public function test_tenant_data_is_isolated_from_the_central_database(): void
    {
        User::factory()->create(['email' => 'central@example.com']);

        $tenant = Tenant::create(['name' => 'Demo Company']);

        $tenant->run(function (): void {
            $this->assertSame(0, User::query()->count());

            User::factory()->create(['email' => 'tenant@example.com']);

            $this->assertSame(1, User::query()->count());
            $this->assertFalse(User::query()->where('email', 'central@example.com')->exists());
        });

        // The central user never leaks into the tenant schema. The tenant user
        // does get a synced identity copy in central (resource syncing), but
        // the tenant schema itself only ever contains its own single user.
        $this->assertTrue(User::query()->where('email', 'central@example.com')->exists());
        $this->assertSame(1, $tenant->run(fn (): int => User::query()->count()));
    }

    public function test_tenant_domain_serves_the_tenant_application(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Company']);
        $tenant->domains()->create(['domain' => 'demo.localhost']);

        $response = $this->get('http://demo.localhost/');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Welcome'));
    }

    public function test_tenant_routes_are_not_accessible_from_central_domains(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Company']);
        $tenant->domains()->create(['domain' => 'demo.localhost']);

        $response = $this->get('http://localhost/');

        $response->assertOk();
        $response->assertDontSee($tenant->id);
    }

    public function test_tenant_status_defaults_to_active(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Company']);

        $this->assertSame('active', $tenant->fresh()->status);
    }
}
