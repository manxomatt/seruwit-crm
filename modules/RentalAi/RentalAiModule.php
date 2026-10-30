<?php

namespace Modules\RentalAi;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\RentalAi\Http\Controllers\RentalAiInspectionController;
use Modules\RentalAi\Http\Controllers\RentalAiKycController;
use Modules\RentalAi\Http\Controllers\RentalAiPricingController;

/**
 * AI Rental Intelligence module:
 * AI Vision inspection for vehicle handovers/returns, Smart KYC OCR for identity documents,
 * Dynamic Pricing fleet optimizer, and AI Tariff rate generator.
 */
class RentalAiModule implements ModuleContract
{
    public function key(): string
    {
        return 'rental-ai';
    }

    public function label(): string
    {
        return 'AI Rental Intelligence (Vision & KYC)';
    }

    public function description(): string
    {
        return 'Kecerdasan buatan rental: inspeksi visual serah-terima armada, verifikasi KYC KTP/SIM penyewa via OCR, optimasi harga dinamis, dan generator tarif AI.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'inspect', 'kyc', 'pricing'];
    }

    public function requires(): array
    {
        return ['rental'];
    }

    public function menu(): ?array
    {
        return null;
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): ?string
    {
        return __DIR__.'/resources/views';
    }

    public function boot(): void
    {
        // Service bindings are registered in AppServiceProvider
    }

    public function routes(): void
    {
        // AI Handover Inspection
        Route::post('/rental-ai/{rental}/inspect-live', [RentalAiInspectionController::class, 'inspectLive'])
            ->middleware('permission:rental,dispatch')
            ->name('rental-ai.inspect_live');
        Route::post('/rental-ai/{rental}/inspect-existing', [RentalAiInspectionController::class, 'inspectExisting'])
            ->middleware('permission:rental,dispatch')
            ->name('rental-ai.inspect_existing');
        Route::post('/rental-ai/{rental}/apply-damage', [RentalAiInspectionController::class, 'applyDamage'])
            ->middleware('permission:rental,dispatch')
            ->name('rental-ai.apply_damage');

        // AI Smart KYC & Document OCR
        Route::post('/rental-ai/{rental}/scan-kyc', [RentalAiKycController::class, 'scanRentalDocuments'])
            ->middleware('permission:rental,dispatch')
            ->name('rental-ai.scan_kyc');
        Route::post('/rental-ai/scan-document', [RentalAiKycController::class, 'scanSingleDocument'])
            ->middleware('permission:rental,dispatch')
            ->name('rental-ai.scan_document');
        Route::post('/rental-ai/{rental}/sync-kyc-partner', [RentalAiKycController::class, 'syncToPartner'])
            ->middleware('permission:rental,dispatch')
            ->name('rental-ai.sync_kyc_partner');

        // AI Dynamic Pricing
        Route::post('/rental-ai/pricing/analyze', [RentalAiPricingController::class, 'analyze'])
            ->middleware('permission:rental,rates')
            ->name('rental-ai.pricing_analyze');
        Route::post('/rental-ai/pricing/apply', [RentalAiPricingController::class, 'apply'])
            ->middleware('permission:rental,rates')
            ->name('rental-ai.pricing_apply');
    }
}
