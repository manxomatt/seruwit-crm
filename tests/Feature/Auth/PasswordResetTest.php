<?php

namespace Tests\Feature\Auth;

use App\Models\Setting;
use App\Models\User;
use App\Support\SystemMode;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_link_screen_can_be_rendered(): void
    {
        $this->get('/forgot-password')->assertStatus(200);
    }

    // ── Development mode ──────────────────────────────────────────────────────

    public function test_dev_mode_returns_reset_url_in_session_without_sending_email(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email])
            ->assertSessionHas('dev_reset_url')
            ->assertRedirect();

        Notification::assertNothingSent();
    }

    public function test_dev_mode_reset_url_contains_valid_token(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/forgot-password', ['email' => $user->email]);

        $resetUrl = $response->getSession()->get('dev_reset_url');
        $this->assertNotNull($resetUrl);
        $this->assertStringContainsString('/reset-password/', $resetUrl);
        $this->assertStringContainsString(urlencode($user->email), $resetUrl);
    }

    public function test_dev_mode_returns_error_for_unknown_email(): void
    {
        $this->post('/forgot-password', ['email' => 'nobody@example.com'])
            ->assertSessionHasErrors('email');
    }

    // ── Production mode ───────────────────────────────────────────────────────

    private function setProductionMode(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => SystemMode::KEY],
            [
                'group' => 'general',
                'value' => SystemMode::PRODUCTION,
                'type' => 'select',
                'label' => 'System Mode',
                'is_public' => false,
                'sort_order' => 8,
            ],
        );
    }

    public function test_production_mode_sends_reset_notification(): void
    {
        $this->setProductionMode();
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_production_mode_reset_screen_can_be_rendered(): void
    {
        $this->setProductionMode();
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) {
            $this->get('/reset-password/'.$notification->token)->assertStatus(200);

            return true;
        });
    }

    public function test_production_mode_password_can_be_reset_with_valid_token(): void
    {
        $this->setProductionMode();
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $this->post('/reset-password', [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'password1',
                'password_confirmation' => 'password1',
            ])
                ->assertSessionHasNoErrors()
                ->assertRedirect(route('login'));

            return true;
        });
    }
}
