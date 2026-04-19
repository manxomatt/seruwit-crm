<?php

namespace Tests\Feature\Auth;

use App\Actions\Auth\LoginAction;
use App\DTOs\ExternalUserData;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DualAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helper: build a real-shaped external API response
    // -------------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function apiResponse(array $overrides = []): array
    {
        return array_replace_recursive([
            'success' => true,
            'authorization' => [
                'access_token' => 'access.jwt.token',
                'token_type' => 'bearer',
                'expires_in' => 1209600,
                'refresh_token' => 'refresh.jwt.token',
            ],
            'user' => [
                'id' => 16,
                'name' => 'Test User',
                'email' => 'test@example.com',
                'role' => 'user',
                'status' => 'true',
                'manager_id' => 16,
            ],
        ], $overrides);
    }

    // -------------------------------------------------------------------------
    // Local authentication
    // -------------------------------------------------------------------------

    public function test_local_authentication_succeeds_with_valid_credentials(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->withUserRole()->create();

        $response = $this->post('/login', [
            'login' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect();
    }

    public function test_local_authentication_updates_last_login_at(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->withUserRole()->create(['last_login_at' => null]);

        $this->post('/login', [
            'login' => $user->email,
            'password' => 'password',
        ]);

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_local_authentication_fails_with_wrong_password(): void
    {
        Http::fake(); // prevent any real outbound calls

        $user = User::factory()->create();

        $this->post('/login', [
            'login' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    // -------------------------------------------------------------------------
    // External API fallback
    // -------------------------------------------------------------------------

    public function test_external_api_is_called_when_local_login_fails(): void
    {
        $this->seed(RoleSeeder::class);

        $user = User::factory()->create(['password' => 'not-this-password']);

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'user' => ['id' => 1, 'name' => $user->name, 'email' => $user->email],
            ]), 200),
        ]);

        $response = $this->post('/login', [
            'login' => $user->email,
            'password' => 'external-pass',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect();
    }

    public function test_external_authentication_creates_new_user_when_not_in_local_db(): void
    {
        $this->seed(RoleSeeder::class);

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'user' => [
                    'id' => 999,
                    'name' => 'New External User',
                    'email' => 'newexternal@example.com',
                    'role' => 'user',
                    'status' => 'true',
                ],
            ]), 200),
        ]);

        $this->post('/login', [
            'login' => 'newexternal@example.com',
            'password' => 'any-password',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'newexternal@example.com',
            'external_id' => '999',
            'name' => 'New External User',
            'status' => 'active',
        ]);
    }

    public function test_external_authentication_syncs_role_to_local_db(): void
    {
        $this->seed(RoleSeeder::class);

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'user' => ['id' => 123, 'name' => 'Role Sync User', 'email' => 'rolesync@example.com', 'role' => 'user'],
            ]), 200),
        ]);

        $this->post('/login', [
            'login' => 'rolesync@example.com',
            'password' => 'any-password',
        ]);

        $user = User::query()->where('email', 'rolesync@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('user'));
    }

    public function test_external_authentication_does_not_overwrite_existing_password(): void
    {
        $this->seed(RoleSeeder::class);

        $existingUser = User::factory()->withUserRole()->create([
            'email' => 'existing@example.com',
            'external_id' => null,
        ]);

        $originalPasswordHash = $existingUser->password;

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'user' => ['id' => 456, 'name' => $existingUser->name, 'email' => 'existing@example.com'],
            ]), 200),
        ]);

        // Local login fails (wrong password given), triggers external fallback
        $this->post('/login', [
            'login' => 'existing@example.com',
            'password' => 'not-their-local-password',
        ]);

        $this->assertEquals($originalPasswordHash, $existingUser->fresh()->password);
    }

    public function test_external_authentication_sets_external_id_on_sync(): void
    {
        $this->seed(RoleSeeder::class);

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'user' => ['id' => 789, 'name' => 'External Sync', 'email' => 'extsync@example.com'],
            ]), 200),
        ]);

        $this->post('/login', [
            'login' => 'extsync@example.com',
            'password' => 'any-password',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'extsync@example.com',
            'external_id' => '789',
        ]);
    }

    // -------------------------------------------------------------------------
    // Failure cases
    // -------------------------------------------------------------------------

    public function test_login_fails_when_both_local_and_external_auth_fail(): void
    {
        Http::fake([
            '*/auth/login' => Http::response(['message' => 'Unauthorized'], 401),
        ]);

        $user = User::factory()->create();

        $response = $this->post('/login', [
            'login' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('login');
    }

    public function test_login_fails_when_external_api_is_unreachable(): void
    {
        Http::fake([
            '*/auth/login' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Connection refused');
            },
        ]);

        $user = User::factory()->create();

        $response = $this->post('/login', [
            'login' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('login');
    }

    public function test_inactive_external_user_cannot_login(): void
    {
        $this->seed(RoleSeeder::class);

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'user' => [
                    'id' => 55,
                    'name' => 'Inactive User',
                    'email' => 'inactive@example.com',
                    'status' => 'false',
                ],
            ]), 200),
        ]);

        $response = $this->post('/login', [
            'login' => 'inactive@example.com',
            'password' => 'any-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('login');
    }

    public function test_validation_requires_login_and_password(): void
    {
        $response = $this->post('/login', []);

        $response->assertSessionHasErrors(['login', 'password']);
    }

    // -------------------------------------------------------------------------
    // ExternalUserData DTO
    // -------------------------------------------------------------------------

    public function test_external_user_data_dto_maps_from_real_api_response(): void
    {
        $dto = ExternalUserData::fromApiResponse([
            'success' => true,
            'authorization' => [
                'access_token' => 'access.jwt',
                'token_type' => 'bearer',
                'expires_in' => 1209600,
                'refresh_token' => 'refresh.jwt',
            ],
            'user' => [
                'id' => 16,
                'name' => 'andito',
                'email' => 'anditowilly2@gmail.com',
                'role' => 'manager',
                'status' => 'true',
                'manager_id' => 16,
            ],
        ]);

        $this->assertSame('16', $dto->externalId);
        $this->assertSame('andito', $dto->name);
        $this->assertSame('anditowilly2@gmail.com', $dto->email);
        $this->assertSame('manager', $dto->role);
        $this->assertSame('active', $dto->status);
        $this->assertSame('access.jwt', $dto->accessToken);
        $this->assertSame('refresh.jwt', $dto->refreshToken);
    }

    public function test_dto_normalizes_string_false_status_to_inactive(): void
    {
        $dto = ExternalUserData::fromApiResponse([
            'success' => true,
            'authorization' => [],
            'user' => [
                'id' => 1,
                'name' => 'Inactive',
                'email' => 'inactive@example.com',
                'status' => 'false',
            ],
        ]);

        $this->assertSame('inactive', $dto->status);
    }

    public function test_dto_defaults_role_to_user_when_absent(): void
    {
        $dto = ExternalUserData::fromApiResponse([
            'success' => true,
            'authorization' => [],
            'user' => [
                'id' => 2,
                'name' => 'No Role',
                'email' => 'norole@example.com',
            ],
        ]);

        $this->assertSame('user', $dto->role);
    }

    // -------------------------------------------------------------------------
    // Access token session storage
    // -------------------------------------------------------------------------

    public function test_access_and_refresh_tokens_are_stored_in_session_after_login(): void
    {
        $this->seed(RoleSeeder::class);

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'authorization' => [
                    'access_token' => 'access.jwt.here',
                    'refresh_token' => 'refresh.jwt.here',
                ],
                'user' => ['id' => 77, 'email' => 'tokenuser@example.com', 'name' => 'Token User'],
            ]), 200),
        ]);

        $this->post('/login', [
            'login' => 'tokenuser@example.com',
            'password' => 'any-password',
        ]);

        $this->assertAuthenticated();
        $this->assertSame('access.jwt.here', session(LoginAction::EXTERNAL_TOKEN_KEY));
        $this->assertSame('refresh.jwt.here', session(LoginAction::EXTERNAL_REFRESH_TOKEN_KEY));
    }

    public function test_no_tokens_stored_in_session_when_api_omits_authorization(): void
    {
        $this->seed(RoleSeeder::class);

        Http::fake([
            '*/auth/login' => Http::response([
                'success' => true,
                'user' => [
                    'id' => 88,
                    'name' => 'No Token User',
                    'email' => 'notoken@example.com',
                    'role' => 'user',
                    'status' => 'true',
                ],
            ], 200),
        ]);

        $this->post('/login', [
            'login' => 'notoken@example.com',
            'password' => 'any-password',
        ]);

        $this->assertAuthenticated();
        $this->assertNull(session(LoginAction::EXTERNAL_TOKEN_KEY));
        $this->assertNull(session(LoginAction::EXTERNAL_REFRESH_TOKEN_KEY));
    }

    public function test_no_external_tokens_stored_for_local_only_login(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->withUserRole()->create();

        $this->post('/login', [
            'login' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertNull(session(LoginAction::EXTERNAL_TOKEN_KEY));
        $this->assertNull(session(LoginAction::EXTERNAL_REFRESH_TOKEN_KEY));
    }

    // -------------------------------------------------------------------------
    // Username-based login
    // -------------------------------------------------------------------------

    public function test_local_authentication_succeeds_with_username(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->withUserRole()->create(['username' => 'andito']);

        $response = $this->post('/login', [
            'login' => 'andito',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect();
    }

    public function test_username_login_falls_back_to_external_api_via_resolved_email(): void
    {
        $this->seed(RoleSeeder::class);

        // User exists locally with username but wrong password → external fallback
        $user = User::factory()->withUserRole()->create([
            'username' => 'andito',
            'email' => 'andito@example.com',
        ]);

        Http::fake([
            '*/auth/login' => Http::response($this->apiResponse([
                'user' => ['id' => $user->id, 'name' => $user->name, 'email' => 'andito@example.com'],
            ]), 200),
        ]);

        $response = $this->post('/login', [
            'login' => 'andito',
            'password' => 'external-pass',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect();
    }

    public function test_username_login_fails_when_username_not_found_locally(): void
    {
        Http::fake(); // ensure no external calls made

        $response = $this->post('/login', [
            'login' => 'unknown_user',
            'password' => 'any-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('login');
    }

    public function test_validation_rejects_login_shorter_than_three_chars(): void
    {
        $response = $this->post('/login', [
            'login' => 'ab',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('login');
    }
}
