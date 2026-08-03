<?php

namespace Tests\Feature\Auth;

use App\Actions\Auth\EnsureUserHasGlobalId;
use App\Models\OnboardingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class UserGlobalIdTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_ensure_action_assigns_missing_global_id(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['global_id' => null])->saveQuietly();

        $this->assertNull($user->fresh()->global_id);

        $healed = app(EnsureUserHasGlobalId::class)->execute($user->fresh());

        $this->assertNotNull($healed->global_id);
        $this->assertSame($healed->global_id, $user->fresh()->global_id);
    }

    public function test_onboarding_store_heals_null_global_id_before_creating_session(): void
    {
        Bus::fake();

        $user = User::factory()->create();
        $user->forceFill(['global_id' => null])->saveQuietly();

        $this->actingAs($user->fresh())
            ->post(route('central.onboarding.store'), [
                'company_name' => 'Heal Co',
                'subdomain' => 'heal-co',
                'verticals' => ['rental'],
            ])
            ->assertRedirect(route('central.onboarding.status', absolute: false));

        $user->refresh();
        $this->assertNotNull($user->global_id);

        $session = OnboardingSession::query()
            ->where('global_user_id', $user->global_id)
            ->first();

        $this->assertNotNull($session);
        $this->assertSame('heal-co', $session->subdomain);
        $this->assertNotNull($session->global_user_id);
    }

    public function test_registration_persists_global_id(): void
    {
        $this->post('/register', [
            'name' => 'Global Id User',
            'email' => 'global-id@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect();

        $user = User::query()->firstWhere('email', 'global-id@example.com');

        $this->assertNotNull($user);
        $this->assertNotNull($user->global_id);
        $this->assertTrue(\Illuminate\Support\Str::isUuid($user->global_id));
    }
}
