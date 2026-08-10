<?php

namespace Tests\Feature\Auth;

use App\Models\Setting;
use App\Models\User;
use App\Support\SystemMode;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DevelopmentVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function seedSystemMode(string $mode): void
    {
        Setting::query()->updateOrCreate(
            ['key' => SystemMode::KEY],
            [
                'group' => 'general',
                'value' => $mode,
                'type' => 'select',
                'label' => 'System Mode',
                'is_public' => false,
                'sort_order' => 8,
            ],
        );
    }

    public function test_development_registration_shows_verification_url_without_sending_mail(): void
    {
        $this->withoutVite();
        $this->seedSystemMode(SystemMode::DEVELOPMENT);
        Notification::fake();

        $response = $this->post('/register', [
            'name' => 'Dev User',
            'email' => 'dev@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'terms' => '1',
        ]);

        Notification::assertNotSentTo(
            User::query()->firstWhere('email', 'dev@example.com'),
            VerifyEmail::class,
        );

        $notice = Route::has('central.verification.notice')
            ? 'central.verification.notice'
            : 'verification.notice';

        $response->assertRedirect(route($notice, absolute: false));

        $this->get('/verify-email')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/VerifyEmail')
                ->where('verificationUrl', fn ($url) => is_string($url) && str_contains((string) $url, 'verify-email'))
            );
    }

    public function test_production_registration_sends_verification_email(): void
    {
        $this->seedSystemMode(SystemMode::PRODUCTION);
        Notification::fake();

        $this->post('/register', [
            'name' => 'Prod User',
            'email' => 'prod@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'terms' => '1',
        ]);

        Notification::assertSentTo(
            User::query()->firstWhere('email', 'prod@example.com'),
            VerifyEmail::class,
        );
    }

    public function test_development_resend_flashes_verification_url(): void
    {
        $this->withoutVite();
        $this->seedSystemMode(SystemMode::DEVELOPMENT);
        Notification::fake();

        $user = User::factory()->unverified()->create();

        $sendRoute = Route::has('central.verification.send')
            ? 'central.verification.send'
            : 'verification.send';

        $this->actingAs($user)
            ->from('/verify-email')
            ->post(route($sendRoute))
            ->assertRedirect('/verify-email');

        Notification::assertNothingSent();

        $this->actingAs($user)
            ->get('/verify-email')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/VerifyEmail')
                ->where('verificationUrl', fn ($url) => is_string($url) && str_contains((string) $url, 'verify-email'))
            );
    }
}
