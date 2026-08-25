<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\Setting;
use App\Support\CentralAiSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CentralAiSettingsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_central_ai_is_enabled_by_default(): void
    {
        $this->assertTrue(CentralAiSettings::isEnabled());
    }

    public function test_disabling_central_ai_setting_returns_false_and_blocks_endpoints(): void
    {
        PlatformSetting::setValue(CentralAiSettings::KEY, '0');

        $this->assertFalse(CentralAiSettings::isEnabled());

        $user = $this->createAdminUser();

        // 1. Rental Visual Inspection blocked
        $rental = Rental::factory()->create();
        $this->actingAs($user)
            ->postJson(route('module.rental.ai_inspect_live', $rental), [
                'return_photos' => ['data:image/jpeg;base64,samplephoto'],
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // 2. Rental KYC OCR scan blocked
        $this->actingAs($user)
            ->postJson(route('module.rental.ai_scan_document'), [
                'image' => 'data:image/jpeg;base64,sampledoc',
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // 3. Rental Dynamic Pricing blocked
        $this->actingAs($user)
            ->postJson(route('module.rental.ai_pricing_analyze'))
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // 4. Maintenance Predictive blocked
        $this->actingAs($user)
            ->postJson(route('module.maintenance.ai_predictive_analyze'))
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        $vehicle = Vehicle::factory()->create();
        $this->actingAs($user)
            ->postJson(route('module.maintenance.ai_predictive_vehicle', $vehicle))
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_central_ai_setting_is_hidden_from_tenant_generic_settings(): void
    {
        $this->assertContains(CentralAiSettings::KEY, Setting::centralOnlyKeys());
    }
}
