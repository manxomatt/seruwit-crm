<?php

namespace Tests\Feature\Modules\RentalAi;

use App\Modules\Facades\Modules;
use App\Support\SystemRolePermissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface as LegacyDocumentKycServiceInterface;
use Modules\Rental\AI\Contracts\DynamicPricingServiceInterface as LegacyDynamicPricingServiceInterface;
use Modules\Rental\AI\Contracts\RentalRateAiGeneratorServiceInterface as LegacyRentalRateAiGeneratorServiceInterface;
use Modules\Rental\AI\Contracts\VisionInspectionServiceInterface as LegacyVisionInspectionServiceInterface;
use Modules\Rental\Models\RentalAiInspection as LegacyRentalAiInspection;
use Modules\RentalAi\Contracts\DocumentKycServiceInterface;
use Modules\RentalAi\Contracts\DynamicPricingServiceInterface;
use Modules\RentalAi\Contracts\RentalRateAiGeneratorServiceInterface;
use Modules\RentalAi\Contracts\VisionInspectionServiceInterface;
use Modules\RentalAi\DTO\DetectedDamageItem;
use Modules\RentalAi\DTO\HandoverInspectionResult;
use Modules\RentalAi\Models\RentalAiInspection;
use Modules\RentalAi\RentalAiModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAiModuleTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('rental-ai');
        SystemRolePermissions::syncAllSystemRoles();
    }

    public function test_module_is_registered_with_correct_properties(): void
    {
        $module = Modules::find('rental-ai');

        $this->assertNotNull($module);
        $this->assertInstanceOf(RentalAiModule::class, $module);
        $this->assertSame('rental-ai', $module->key());
        $this->assertSame('AI Rental Intelligence (Vision & KYC)', $module->label());
        $this->assertEquals(['rental'], $module->requires());
        $this->assertContains('view', $module->permissions());
        $this->assertContains('inspect', $module->permissions());
        $this->assertContains('kyc', $module->permissions());
        $this->assertContains('pricing', $module->permissions());
    }

    public function test_ai_service_interfaces_are_bound_in_container(): void
    {
        $this->assertTrue(app()->bound(VisionInspectionServiceInterface::class));
        $this->assertTrue(app()->bound(DocumentKycServiceInterface::class));
        $this->assertTrue(app()->bound(DynamicPricingServiceInterface::class));
        $this->assertTrue(app()->bound(RentalRateAiGeneratorServiceInterface::class));

        // Legacy contract aliases are also bound
        $this->assertTrue(app()->bound(LegacyVisionInspectionServiceInterface::class));
        $this->assertTrue(app()->bound(LegacyDocumentKycServiceInterface::class));
        $this->assertTrue(app()->bound(LegacyDynamicPricingServiceInterface::class));
        $this->assertTrue(app()->bound(LegacyRentalRateAiGeneratorServiceInterface::class));
    }

    public function test_model_and_dto_backward_compatibility(): void
    {
        $legacyModel = new LegacyRentalAiInspection;
        $this->assertInstanceOf(RentalAiInspection::class, $legacyModel);

        $dto = new HandoverInspectionResult(
            extractedOdometer: 12500,
            extractedFuelLevel: 'Full',
            conditionSummary: 'Mulus',
            overallStatus: 'clean',
            damages: [
                new DetectedDamageItem(
                    panel: 'front_bumper',
                    damageType: 'scratch',
                    severity: 'minor',
                    description: 'Goresan halus',
                    confidenceScore: 0.95
                ),
            ]
        );

        $this->assertSame(12500, $dto->extractedOdometer);
        $this->assertCount(1, $dto->damages);
        $this->assertSame('front_bumper', $dto->damages[0]->panel);
    }
}
