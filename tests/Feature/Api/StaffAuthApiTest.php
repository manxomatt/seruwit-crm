<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StaffAuthApiTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_staff_can_login_with_valid_email_and_receive_sanctum_token(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'checker@seruwit.test',
            'password' => Hash::make('password123'),
        ]);

        $role = Role::query()->firstOrCreate(['slug' => 'field_checker'], ['name' => 'Field Checker']);
        $user->roles()->attach($role);

        $response = $this->postJson(route('staff.v1.auth.login'), [
            'login' => 'checker@seruwit.test',
            'password' => 'password123',
            'device_name' => 'Pixel 8 (Checker Test)',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'global_id',
                        'name',
                        'username',
                        'email',
                        'phone',
                        'roles',
                        'permissions',
                    ],
                ],
            ]);

        $this->assertNotNull($response->json('data.token'));
        $this->assertContains('field_checker', $response->json('data.user.roles'));
    }

    public function test_staff_can_login_with_username(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'username' => 'doni_checker',
            'email' => 'doni@seruwit.test',
            'password' => Hash::make('secretpass'),
        ]);

        $response = $this->postJson(route('staff.v1.auth.login'), [
            'login' => 'doni_checker',
            'password' => 'secretpass',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.username', 'doni_checker');
    }

    public function test_staff_cannot_login_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'wrongpass@seruwit.test',
            'password' => Hash::make('correctpass'),
        ]);

        $response = $this->postJson(route('staff.v1.auth.login'), [
            'login' => 'wrongpass@seruwit.test',
            'password' => 'invalidpass',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'INVALID_CREDENTIALS');
    }

    public function test_authenticated_staff_can_view_own_profile(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'profile@seruwit.test',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('staff.v1.auth.me'));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'profile@seruwit.test');
    }

    public function test_staff_can_logout_and_revoke_sanctum_token(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'logout@seruwit.test',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        $token = $user->createToken('logout-device')->plainTextToken;

        $logoutResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson(route('staff.v1.auth.logout'));

        $logoutResponse->assertOk()
            ->assertJsonPath('success', true);

        // Assert token row was deleted from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);

        // Forget cached auth guard state in the test runner
        $this->app['auth']->forgetGuards();

        // Attempting to access auth.me with the revoked token must fail with 401
        $meResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('staff.v1.auth.me'));

        $meResponse->assertStatus(401);
    }
}
