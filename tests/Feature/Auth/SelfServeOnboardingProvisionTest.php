<?php

namespace Tests\Feature\Auth;

use App\Jobs\ProvisionSelfServeTenantJob;
use App\Models\OnboardingSession;
use App\Models\User;
use App\Support\Onboarding\SelfServeProvisioningPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class SelfServeOnboardingProvisionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_verified_user_sees_onboarding_form(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('central.onboarding.show'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/Onboarding')
                ->has('verticalOptions', 2)
                ->where('verticalOptions.0.key', SelfServeProvisioningPlan::VERTICAL_RENTAL)
                ->where('verticalOptions.0.available', true)
                ->where('verticalOptions.1.key', SelfServeProvisioningPlan::VERTICAL_TRAVEL)
                ->where('verticalOptions.1.available', false)
                ->has('settings')
                ->where('user.email', $user->email));
    }

    public function test_travel_vertical_cannot_be_selected_yet(): void
    {
        Bus::fake();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('central.onboarding.store'), [
                'company_name' => 'Travel Co',
                'subdomain' => 'travel-co',
                'verticals' => ['travel'],
            ])
            ->assertSessionHasErrors('verticals.0');

        $this->assertDatabaseCount('onboarding_sessions', 0);
        Bus::assertNothingDispatched();
    }

    public function test_failed_session_does_not_prefill_unavailable_verticals(): void
    {
        $user = User::factory()->create();

        OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Legacy Co',
            'subdomain' => 'legacy-co',
            'verticals' => ['rental', 'travel'],
            'status' => OnboardingSession::STATUS_FAILED,
            'error_message' => 'Boom',
        ]);

        $this->actingAs($user)
            ->get(route('central.onboarding.show'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/Onboarding')
                ->where('failedSession.verticals', ['rental']));
    }

    public function test_onboarding_requires_at_least_one_vertical(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('central.onboarding.store'), [
                'company_name' => 'No Vertical Co',
                'subdomain' => 'no-vertical-co',
                'verticals' => [],
            ])
            ->assertSessionHasErrors('verticals');
    }

    public function test_submitting_onboarding_creates_session_and_dispatches_job(): void
    {
        Bus::fake();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('central.onboarding.store'), [
                'company_name' => 'Rental Co',
                'subdomain' => 'rental-co',
                'verticals' => ['rental'],
            ])
            ->assertRedirect(route('central.onboarding.status', absolute: false));

        $session = OnboardingSession::query()
            ->where('global_user_id', $user->global_id)
            ->first();

        $this->assertNotNull($session);
        $this->assertSame('Rental Co', $session->company_name);
        $this->assertSame('rental-co', $session->subdomain);
        $this->assertSame(['rental'], $session->verticals);
        $this->assertSame(OnboardingSession::STATUS_PENDING, $session->status);

        Bus::assertDispatched(
            ProvisionSelfServeTenantJob::class,
            fn (ProvisionSelfServeTenantJob $job): bool => $job->onboardingSessionId === $session->id,
        );
    }

    public function test_status_page_is_shown_while_provisioning(): void
    {
        $user = User::factory()->create();

        OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Status Co',
            'subdomain' => 'status-co',
            'verticals' => ['rental'],
            'status' => OnboardingSession::STATUS_PROVISIONING,
        ]);

        $this->actingAs($user)
            ->get(route('central.onboarding.status'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/OnboardingStatus')
                ->where('session.status', OnboardingSession::STATUS_PROVISIONING)
                ->where('session.company_name', 'Status Co')
                ->has('settings'));
    }

    public function test_ready_status_exposes_enter_url_for_hard_navigation(): void
    {
        $user = User::factory()->create();

        $tenantId = (string) \Illuminate\Support\Str::uuid();

        OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Ready Co',
            'subdomain' => 'ready-co',
            'verticals' => ['rental'],
            'status' => OnboardingSession::STATUS_READY,
            'tenant_id' => $tenantId,
        ]);

        $this->withoutVite();

        $this->actingAs($user)
            ->get(route('central.onboarding.status'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/OnboardingStatus')
                ->where('session.status', OnboardingSession::STATUS_READY)
                ->where('session.tenant_id', $tenantId)
                ->where('enterUrl', route('central.workspaces.enter', $tenantId)));
    }

    public function test_provisioning_plan_maps_verticals_to_packs_and_content(): void
    {
        $this->assertSame(
            ['pages', 'posts', 'carousels'],
            SelfServeProvisioningPlan::defaultContentModules(),
        );

        $this->assertSame(
            ['rental_mobil', 'travel_shuttle'],
            SelfServeProvisioningPlan::packKeysForVerticals(['rental', 'travel']),
        );

        $preview = SelfServeProvisioningPlan::previewModules(['travel']);
        $this->assertContains('pages', $preview);
        $this->assertContains('shuttle', $preview);
        $this->assertContains('fleet', $preview);
        $this->assertContains('invoicing', $preview);
        $this->assertContains('receivables', $preview);
        $this->assertNotContains('products', $preview);
        $this->assertNotContains('partners', $preview);
        $this->assertNotContains('accounting', $preview);

        $rentalPreview = SelfServeProvisioningPlan::previewModules(['rental']);
        $this->assertContains('rental', $rentalPreview);
        $this->assertContains('invoicing', $rentalPreview);
        $this->assertContains('receivables', $rentalPreview);
        $this->assertNotContains('products', $rentalPreview);
    }
}
