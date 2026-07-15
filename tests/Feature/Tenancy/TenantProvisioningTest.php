<?php

namespace Tests\Feature\Tenancy;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TenantProvisioningTest extends TestCase
{
    /**
     * DatabaseMigrations (not RefreshDatabase) on purpose: tenant provisioning
     * issues DDL (CREATE/DROP SCHEMA) that must commit, which deadlocks inside
     * the transaction RefreshDatabase wraps around each test.
     */
    use DatabaseMigrations;

    protected function tearDown(): void
    {
        // End tenancy first so the default connection points back at the
        // central database, then delete tenants to trigger the DeleteDatabase
        // pipeline that drops the schemas created during the test.
        tenancy()->end();
        Tenant::query()->get()->each->delete();

        parent::tearDown();
    }

    public function test_creating_a_tenant_provisions_and_migrates_its_database(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Company']);

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('users'));
            $this->assertTrue(Schema::hasTable('roles'));
            $this->assertTrue(Schema::hasTable('permissions'));
            $this->assertTrue(Schema::hasTable('pages'));
            $this->assertTrue(Schema::hasTable('posts'));
            $this->assertTrue(Schema::hasTable('settings'));
            $this->assertTrue(Schema::hasTable('media'));
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

        $this->assertFalse(User::query()->where('email', 'tenant@example.com')->exists());
        $this->assertTrue(User::query()->where('email', 'central@example.com')->exists());
    }

    public function test_tenant_domain_serves_the_tenant_application(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Company']);
        $tenant->domains()->create(['domain' => 'demo.localhost']);

        $response = $this->get('http://demo.localhost/');

        $response->assertOk();
        $response->assertJson([
            'tenant_id' => $tenant->id,
            'tenant_name' => 'Demo Company',
            'users_in_tenant_schema' => 0,
        ]);
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
