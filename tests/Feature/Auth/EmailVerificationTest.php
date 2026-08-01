<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $this->withoutVite();

        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->get('/verify-email')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/VerifyEmail')
                ->has('settings'));
    }

    public function test_html_encoded_verification_link_from_log_is_accepted(): void
    {
        $user = User::factory()->unverified()->create();

        $verifyRoute = Route::has('central.verification.verify')
            ? 'central.verification.verify'
            : 'verification.verify';

        $verificationUrl = URL::temporarySignedRoute(
            $verifyRoute,
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $htmlEncoded = str_replace('&', '&amp;', $verificationUrl);

        $this->actingAs($user)
            ->get($htmlEncoded)
            ->assertRedirect($verificationUrl);

        $this->actingAs($user)
            ->get($verificationUrl);

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_can_be_verified_and_redirects_to_onboarding(): void
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $verifyRoute = Route::has('central.verification.verify')
            ? 'central.verification.verify'
            : 'verification.verify';

        $verificationUrl = URL::temporarySignedRoute(
            $verifyRoute,
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $response->assertRedirect(route('central.onboarding.show', absolute: false).'?verified=1');
    }

    public function test_email_is_not_verified_with_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $verifyRoute = Route::has('central.verification.verify')
            ? 'central.verification.verify'
            : 'verification.verify';

        $verificationUrl = URL::temporarySignedRoute(
            $verifyRoute,
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong-email')]
        );

        $this->actingAs($user)->get($verificationUrl);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }
}
