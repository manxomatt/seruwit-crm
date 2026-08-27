<?php

namespace Tests\Feature;

use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PlanUpdateTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_toggling_is_active_off_persists(): void
    {
        $plan = Plan::create([
            'key' => 'basic',
            'name' => 'Basic',
            'is_active' => true,
            'is_default' => false,
            'pricing_model' => 'fixed',
            'modules' => [],
            'sort_order' => 1,
            'currency' => 'IDR',
            'price' => 0,
        ]);

        $this->assertTrue($plan->fresh()->is_active);

        $response = $this->actingAs($this->createAdminUser())
            ->patch(route('module.plans.update', $plan->id), [
                'name' => 'Basic',
                'modules' => [],
                'is_active' => false,
                'is_default' => false,
                'pricing_model' => 'fixed',
                'sort_order' => 1,
            ]);

        $response->assertRedirect();

        $this->assertFalse(
            $plan->fresh()->is_active,
            'is_active should be false after toggling off',
        );
    }
}
