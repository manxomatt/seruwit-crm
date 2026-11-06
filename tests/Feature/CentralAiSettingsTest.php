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

        // 5. Fleet vehicle AI generate blocked
        $this->actingAs($user)
            ->postJson(route('module.fleet.vehicles.ai-generate'), [
                'text' => 'Avanza 1.5 G MT 2023 Putih plat D 1234 ABC',
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_central_ai_ocr_is_enabled_by_default(): void
    {
        $this->assertTrue(CentralAiSettings::isOcrEnabled());
    }

    public function test_central_ai_quick_fill_is_enabled_by_default(): void
    {
        $this->assertTrue(CentralAiSettings::isQuickFillEnabled());
    }

    public function test_disabling_central_quick_fill_setting_blocks_quick_fill(): void
    {
        PlatformSetting::setValue(CentralAiSettings::KEY_QUICK_FILL, '0');

        $this->assertFalse(CentralAiSettings::isQuickFillEnabled());
        $this->assertTrue(CentralAiSettings::isEnabled());

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->postJson(route('module.fleet.vehicles.ai-generate'), [
                'text' => 'Avanza 1.5 G MT 2023 Putih plat D 1234 ABC',
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        $this->actingAs($user)
            ->get(route('module.fleet.vehicles.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Create')
                ->where('ai_quick_fill_enabled', false)
            );
    }

    public function test_disabling_central_ocr_setting_blocks_ocr_and_hides_tenant_urls(): void
    {
        PlatformSetting::setValue(CentralAiSettings::KEY_OCR, '0');

        $this->assertFalse(CentralAiSettings::isOcrEnabled());
        $this->assertTrue(CentralAiSettings::isEnabled());

        $user = $this->createAdminUser();

        // 1. Rental single document OCR scan blocked
        $this->actingAs($user)
            ->postJson(route('module.rental.ai_scan_document'), [
                'image' => 'data:image/jpeg;base64,sampledoc',
            ])
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // 2. Rental KYC document scan blocked
        $rental = Rental::factory()->create();
        $this->actingAs($user)
            ->postJson(route('module.rental.ai_scan_kyc', $rental))
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // 3. Rental create page hides aiScanDocUrl and disables aiKycEnabled
        $this->actingAs($user)
            ->get(route('module.rental.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->where('aiScanDocUrl', null)
                ->where('aiKycEnabled', false)
            );
    }

    public function test_central_ai_setting_is_hidden_from_tenant_generic_settings(): void
    {
        $this->assertContains(CentralAiSettings::KEY, Setting::centralOnlyKeys());
        $this->assertContains(CentralAiSettings::KEY_OCR, Setting::centralOnlyKeys());
        $this->assertContains(CentralAiSettings::KEY_QUICK_FILL, Setting::centralOnlyKeys());
    }
}
