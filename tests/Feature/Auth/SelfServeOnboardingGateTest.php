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

    public function test_inactive_plans_are_hidden_from_onboarding(): void
    {
        $this->seed(PlanSeeder::class);
        Plan::query()->firstWhere('key', 'pro')->update(['is_active' => false]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('central.onboarding.show'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/Onboarding')
                ->where('availablePlans', fn ($plans) => collect($plans)->every(
                    fn ($plan): bool => $plan['key'] !== 'pro',
                ))
            );
    }

    public function test_an_inactive_plan_cannot_be_chosen_at_onboarding(): void
    {
        $this->seed(PlanSeeder::class);
        Plan::query()->firstWhere('key', 'pro')->update(['is_active' => false]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('central.onboarding.store'), [
                'company_name' => 'Inactive Plan Co',
                'subdomain' => 'inactive-plan-co',
                'plan_key' => 'pro',
                'verticals' => ['rental'],
            ])
            ->assertSessionHasErrors('plan_key');
    }

    public function test_inactive_plans_are_hidden_from_the_landing_pricing_table(): void
    {
        $this->seed(PlanSeeder::class);
        Plan::query()->firstWhere('key', 'pro')->update(['is_active' => false]);

        $html = \Modules\Pages\Support\PricingTableRenderer::render();

        $pro = Plan::query()->firstWhere('key', 'pro');
        $basic = Plan::query()->firstWhere('key', 'basic');

        $this->assertStringNotContainsString($pro->name, $html);
        $this->assertStringContainsString($basic->name, $html);
    }

    public function test_trial_plan_is_seeded_with_onboarding_entitlements(): void
    {
        $this->seed(PlanSeeder::class);

        $trial = Plan::query()->firstWhere('key', Plan::KEY_TRIAL);

        $this->assertNotNull($trial);
        $this->assertFalse($trial->is_default);
        $this->assertContains('pages', $trial->modules);
        $this->assertNotContains('accounting', $trial->modules);
        $this->assertNotContains('partners', $trial->modules);
        $this->assertContains('rental', $trial->modules);
        $this->assertContains('shuttle', $trial->modules);
        $this->assertContains('receivables', $trial->modules);
        $this->assertSame(Plan::trialModuleKeys(), $trial->modules);
    }
}
