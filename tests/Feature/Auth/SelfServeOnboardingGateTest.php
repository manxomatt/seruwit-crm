<?php

namespace Tests\Feature\Auth;

use App\Models\Plan;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SelfServeOnboardingGateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_verified_user_without_workspace_is_sent_to_onboarding(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertRedirect(route('central.onboarding.show', absolute: false));

        $this->actingAs($user)
            ->get(route('central.onboarding.show'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Central/Onboarding'));
    }

    public function test_unverified_user_cannot_open_onboarding(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->get(route('central.onboarding.show'))
            ->assertRedirect(route('verification.notice', absolute: false));
    }

    public function test_trial_plan_is_seeded_with_onboarding_entitlements(): void
    {
        $this->seed(PlanSeeder::class);

        $trial = Plan::query()->firstWhere('key', Plan::KEY_TRIAL);

        $this->assertNotNull($trial);
        $this->assertFalse($trial->is_default);
        $this->assertContains('pages', $trial->modules);
        $this->assertContains('accounting', $trial->modules);
        $this->assertContains('rental', $trial->modules);
        $this->assertContains('shuttle', $trial->modules);
        $this->assertContains('partners', $trial->modules);
        $this->assertSame(Plan::trialModuleKeys(), $trial->modules);
    }
}
