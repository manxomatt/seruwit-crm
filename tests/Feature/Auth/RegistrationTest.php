<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->withoutVite();

        $this->get('/register')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Register')
                ->has('settings'));
    }

    public function test_new_users_can_register_without_creating_a_tenant(): void
    {
        Notification::fake();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertTrue(User::query()->where('email', 'test@example.com')->exists());
        $this->assertSame(0, Tenant::query()->count());
        $registered = User::query()->firstWhere('email', 'test@example.com');
        $this->assertNull($registered->email_verified_at);
        $this->assertNotNull($registered->global_id);

        Notification::assertSentTo(
            User::query()->firstWhere('email', 'test@example.com'),
            VerifyEmail::class,
        );

        $notice = Route::has('central.verification.notice')
            ? 'central.verification.notice'
            : 'verification.notice';

        $response->assertRedirect(route($notice, absolute: false));
    }

    public function test_registration_does_not_require_company_fields(): void
    {
        Notification::fake();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertAuthenticated();
    }
}
