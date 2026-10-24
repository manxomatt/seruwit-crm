<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\CentralUser;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CentralAuthApiTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected CentralUser $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        $this->user = CentralUser::create([
            'global_id' => (string) Str::uuid(),
            'name' => 'Budi Santoso',
            'username' => 'budisantoso',
            'email' => 'budi@seruwit.test',
            'password' => Hash::make('secret123'),
            'phone' => '081234567890',
            'phone_verified_at' => now(),
            'email_verified_at' => now(),
        ]);
    }

    public function test_user_can_login_at_central_and_receive_tenants_list(): void
    {
        $tenant1Id = (string) Str::uuid();
        $tenant2Id = (string) Str::uuid();

        $tenant1 = Tenant::withoutEvents(fn () => Tenant::create([
            'id' => $tenant1Id,
            'name' => 'Acme Rental Jakarta',
            'status' => 'active',
        ]));
        $tenant1->domains()->create(['domain' => 'acme.seruwit-crm.test']);

        $tenant2 = Tenant::withoutEvents(fn () => Tenant::create([
            'id' => $tenant2Id,
            'name' => 'Bali Vacation Trans',
            'status' => 'active',
        ]));
        $tenant2->domains()->create(['domain' => 'bali.seruwit-crm.test']);

        DB::table('tenant_users')->insert([
            ['tenant_id' => $tenant1Id, 'global_user_id' => $this->user->global_id, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenant2Id, 'global_user_id' => $this->user->global_id, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->postJson(route('central.api.v1.auth.login'), [
            'login' => 'budi@seruwit.test',
            'password' => 'secret123',
            'device_name' => 'Samsung Galaxy S24',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'name' => 'Budi Santoso',
                        'email' => 'budi@seruwit.test',
                    ],
                    'has_multiple_tenants' => true,
                ],
            ]);

        $this->assertNotEmpty($response->json('data.central_token'));
        $this->assertCount(2, $response->json('data.tenants'));
        $this->assertEquals('Acme Rental Jakarta', $response->json('data.tenants.0.name'));
        $this->assertEquals('https://acme.seruwit-crm.test/api/staff/v1', $response->json('data.tenants.0.api_base_url'));
    }

    public function test_login_with_invalid_credentials_returns_401(): void
    {
        $response = $this->postJson(route('central.api.v1.auth.login'), [
            'login' => 'budi@seruwit.test',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_CREDENTIALS',
                ],
            ]);
    }

    public function test_authenticated_user_can_fetch_workspaces_list(): void
    {
        $tenantId = (string) Str::uuid();
        $tenant = Tenant::withoutEvents(fn () => Tenant::create([
            'id' => $tenantId,
            'name' => 'Lombok Rent Car',
            'status' => 'active',
        ]));
        $tenant->domains()->create(['domain' => 'lombok.seruwit-crm.test']);

        DB::table('tenant_users')->insert([
            'tenant_id' => $tenantId,
            'global_user_id' => $this->user->global_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $this->user->createToken('central_test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('central.api.v1.workspaces.index'));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'count' => 1,
                    'tenants' => [
                        [
                            'id' => $tenantId,
                            'name' => 'Lombok Rent Car',
                            'domain' => 'lombok.seruwit-crm.test',
                            'api_base_url' => 'https://lombok.seruwit-crm.test/api/staff/v1',
                        ],
                    ],
                ],
            ]);
    }

    public function test_exchange_token_rejects_unauthorized_workspace(): void
    {
        $otherTenantId = (string) Str::uuid();
        Tenant::withoutEvents(fn () => Tenant::create([
            'id' => $otherTenantId,
            'name' => 'Unauthorized Rental',
            'status' => 'active',
        ]));

        $token = $this->user->createToken('central_test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson(route('central.api.v1.workspaces.token', ['tenant' => $otherTenantId]));

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'NOT_A_MEMBER',
                ],
            ]);
    }

    public function test_exchange_token_rejects_inactive_workspace(): void
    {
        $tenantId = (string) Str::uuid();
        Tenant::withoutEvents(fn () => Tenant::create([
            'id' => $tenantId,
            'name' => 'Suspended Rental',
            'status' => 'suspended',
        ]));

        DB::table('tenant_users')->insert([
            'tenant_id' => $tenantId,
            'global_user_id' => $this->user->global_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $this->user->createToken('central_test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson(route('central.api.v1.workspaces.token', ['tenant' => $tenantId]));

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'WORKSPACE_INACTIVE',
                ],
            ]);
    }
}
