<?php

namespace Tests\Feature;

use App\Models\SubscriptionTier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

/**
 * Guards the central SubscriptionTierController redirects. store/update/destroy
 * each build a route() to the index; a wrong route name (the old
 * `central.subscription-tiers.index`) throws RouteNotFoundException while
 * generating the redirect, which these assertions catch.
 */
class SubscriptionTierRedirectTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_store_redirects_to_index(): void
    {
        $response = $this->actingAs($this->createAdminUser())
            ->post(route('module.subscription-tiers.store'), [
                'name' => 'Tier X',
                'min_vehicles' => 1,
                'max_vehicles' => 10,
                'price_per_vehicle' => 20000,
            ]);

        $response->assertRedirect(route('module.subscription-tiers.index'));
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('subscription_tiers', ['name' => 'Tier X']);
    }

    public function test_update_redirects_to_index(): void
    {
        $tier = SubscriptionTier::create([
            'name' => 'Tier X',
            'min_vehicles' => 1,
            'max_vehicles' => 10,
            'price_per_vehicle' => 20000,
        ]);

        $response = $this->actingAs($this->createAdminUser())
            ->patch(route('module.subscription-tiers.update', $tier->id), [
                'name' => 'Tier X Updated',
                'min_vehicles' => 1,
                'max_vehicles' => 12,
                'price_per_vehicle' => 18000,
            ]);

        $response->assertRedirect(route('module.subscription-tiers.index'));
        $response->assertSessionHasNoErrors();
        $this->assertSame('Tier X Updated', $tier->fresh()->name);
    }

    public function test_destroy_redirects_to_index(): void
    {
        $tier = SubscriptionTier::create([
            'name' => 'Tier X',
            'min_vehicles' => 1,
            'max_vehicles' => 10,
            'price_per_vehicle' => 20000,
        ]);

        $response = $this->actingAs($this->createAdminUser())
            ->delete(route('module.subscription-tiers.destroy', $tier->id));

        $response->assertRedirect(route('module.subscription-tiers.index'));
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('subscription_tiers', ['id' => $tier->id]);
    }
}
