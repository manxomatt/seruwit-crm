<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    /**
     * DatabaseMigrations (not RefreshDatabase): registration provisions a
     * tenant schema (DDL), which cannot run inside a wrapping transaction.
     */
    use DatabaseMigrations;

    protected function tearDown(): void
    {
        tenancy()->end();
        Tenant::query()->get()->each->delete();

        parent::tearDown();
    }

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register_and_get_a_workspace(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'company_name' => 'Test Company',
            'subdomain' => 'test-company',
        ]);

        $this->assertAuthenticated();

        $tenant = Tenant::query()->firstWhere('name', 'Test Company');
        $this->assertNotNull($tenant);
        $response->assertRedirect(route('central.workspaces.enter', $tenant, absolute: false));
    }

    public function test_registration_requires_company_fields(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors(['company_name', 'subdomain']);
        $this->assertGuest();
        $this->assertFalse(User::query()->where('email', 'test@example.com')->exists());
    }
}
