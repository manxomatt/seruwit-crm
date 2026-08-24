<?php

namespace Modules\Rental;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Console\Application as Artisan;
use Illuminate\Support\Facades\Route;
use Modules\Rental\Console\Commands\RentalExpirePendingReserved;
use Modules\Rental\Console\Commands\RentalScanEnding;
use Modules\Rental\Http\Controllers\PartnerPortalController;
use Modules\Rental\Http\Controllers\RentalActionController;
use Modules\Rental\Http\Controllers\RentalAiInspectionController;
use Modules\Rental\Http\Controllers\RentalAiKycController;
use Modules\Rental\Http\Controllers\RentalAiPricingController;
use Modules\Rental\Http\Controllers\RentalAvailabilityController;
use Modules\Rental\Http\Controllers\RentalCalendarController;
use Modules\Rental\Http\Controllers\RentalController;
use Modules\Rental\Http\Controllers\RentalDashboardController;
use Modules\Rental\Http\Controllers\RentalPdfController;
use Modules\Rental\Http\Controllers\RentalRateController;
use Modules\Rental\Http\Controllers\RentalReservationWizardController;
use Modules\Rental\Http\Controllers\RentalSettingsController;

/**
 * Vehicle rental management: booking, checkout, return, damage reporting, and
 * pricing tariffs.
 *
 * A Vertical module that depends on Fleet for vehicles and drivers, Partners for
 * customers, and Invoicing for billing. Fleet stays ignorant of Rental; the
 * availability check flows downward via Rental::vehicleAvailabilityReasons().
 *
 * When Transportation is also installed, StoreRentalRequest checks for trip
 * conflicts via Modules::available('transportation') so the two Verticals share
 * Fleet without double-booking.
 */
class RentalModule implements ModuleContract
{
    public function key(): string
    {
        return 'rental';
    }

    public function label(): string
    {
        return 'Rental';
    }

    public function description(): string
    {
        return 'Vehicle rental management: bookings, checkout, returns, damage reports, and tariff rates.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'approve'];
    }

    public function requires(): array
    {
        return ['fleet', 'partners', 'invoicing'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Rental',
            'slug' => 'rental',
            'icon' => 'key',
            'route_name' => 'rental.dashboard',
            'permission_module' => 'rental',
            'permission_action' => 'view',
            'sort_order' => 11,
        ];
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
        Artisan::starting(fn (Artisan $artisan) => $artisan->resolveCommands([
            RentalScanEnding::class,
            RentalExpirePendingReserved::class,
        ]));
    }

    public function routes(): void
    {
        // GET /rental serves the dashboard (same URI as POST store — Orders pattern).
        // Avoid Route::redirect() here: absolute destinations drop the /module prefix.
        Route::get('/rental', [RentalDashboardController::class, 'index'])
            ->middleware('permission:rental,view');
        Route::get('/rental/dashboard', [RentalDashboardController::class, 'index'])
            ->middleware('permission:rental,view')
            ->name('rental.dashboard');
        Route::get('/rental/dashboard/export', [RentalDashboardController::class, 'export'])
            ->middleware('permission:rental,view')
            ->name('rental.dashboard.export');

        // Settings (General & Document Templates)
        Route::get('/rental/settings', [RentalSettingsController::class, 'index'])
            ->middleware('permission:rental,view')
            ->name('rental.settings.index');
        Route::patch('/rental/settings/general', [RentalSettingsController::class, 'updateGeneral'])
            ->middleware('permission:rental,update')
            ->name('rental.settings.general.update');
        Route::patch('/rental/settings/storefront', [RentalSettingsController::class, 'updateStorefront'])
            ->middleware('permission:rental,update')
            ->name('rental.settings.storefront.update');
        Route::patch('/rental/settings/documents/{code}', [RentalSettingsController::class, 'updateDocument'])
            ->middleware('permission:rental,update')
            ->name('rental.settings.documents.update');
        Route::post('/rental/settings/documents/{code}/reset', [RentalSettingsController::class, 'resetDocument'])
            ->middleware('permission:rental,update')
            ->name('rental.settings.documents.reset');
        Route::get('/rental/settings/documents/{code}/preview', [RentalSettingsController::class, 'previewDocument'])
            ->middleware('permission:rental,view')
            ->name('rental.settings.documents.preview');

        // Tariff rates (CRUD)
        Route::get('/rental/rates', [RentalRateController::class, 'index'])->middleware('permission:rental,view')->name('rental.rates.index');
        Route::get('/rental/rates/create', [RentalRateController::class, 'create'])->middleware('permission:rental,create')->name('rental.rates.create');
        Route::get('/rental/rates/suggest', [RentalRateController::class, 'suggest'])->middleware('permission:rental,create')->name('rental.rates.suggest');
        Route::post('/rental/rates', [RentalRateController::class, 'store'])->middleware('permission:rental,create')->name('rental.rates.store');
        Route::patch('/rental/rates/batch-status', [RentalRateController::class, 'batchUpdateStatus'])->middleware('permission:rental,update')->name('rental.rates.batch-status');
        Route::post('/rental/rates/batch-destroy', [RentalRateController::class, 'batchDestroy'])->middleware('permission:rental,delete')->name('rental.rates.batch-destroy');
        Route::get('/rental/rates/{rate}/edit', [RentalRateController::class, 'edit'])->middleware('permission:rental,update')->name('rental.rates.edit');
        Route::patch('/rental/rates/{rate}', [RentalRateController::class, 'update'])->middleware('permission:rental,update')->name('rental.rates.update');
        Route::delete('/rental/rates/{rate}', [RentalRateController::class, 'destroy'])->middleware('permission:rental,delete')->name('rental.rates.destroy');

        // Availability board (before {rental} wildcard)
        Route::get('/rental/availability', [RentalAvailabilityController::class, 'index'])->middleware('permission:rental,view')->name('rental.availability.index');

        // Vehicle usage calendar (before {rental} wildcard)
        Route::get('/rental/calendar', [RentalCalendarController::class, 'index'])->middleware('permission:rental,view')->name('rental.calendar.index');

        // Reservation wizard JSON helpers (before {rental} wildcard)
        Route::get('/rental/reservations/available-vehicles', [RentalReservationWizardController::class, 'availableVehicles'])
            ->middleware('permission:rental,view')
            ->name('rental.reservations.available_vehicles');
        Route::post('/rental/reservations/quote', [RentalReservationWizardController::class, 'quote'])
            ->middleware('permission:rental,view')
            ->name('rental.reservations.quote');

        // Rentals CRUD
        Route::get('/rental/list', [RentalController::class, 'index'])->middleware('permission:rental,view')->name('rental.index');
        Route::get('/rental/create', [RentalController::class, 'create'])->middleware('permission:rental,create')->name('rental.create');
        Route::post('/rental/walk-in-customers', [RentalController::class, 'storeWalkInCustomer'])->middleware('permission:rental,create')->name('rental.walk_in_customers.store');
        Route::post('/rental', [RentalController::class, 'store'])->middleware('permission:rental,create')->name('rental.store');
        Route::get('/rental/{rental}', [RentalController::class, 'show'])->middleware('permission:rental,view')->name('rental.show');
        Route::get('/rental/{rental}/edit', [RentalController::class, 'edit'])->middleware('permission:rental,update')->name('rental.edit');
        Route::get('/rental/{rental}/checkout', [RentalController::class, 'checkoutPage'])->middleware('permission:rental,update')->name('rental.checkout_page');
        Route::get('/rental/{rental}/return', [RentalController::class, 'returnPage'])->middleware('permission:rental,update')->name('rental.return_page');
        Route::patch('/rental/{rental}', [RentalController::class, 'update'])->middleware('permission:rental,update')->name('rental.update');
        Route::delete('/rental/{rental}', [RentalController::class, 'destroy'])->middleware('permission:rental,delete')->name('rental.destroy');

        // PDFs
        Route::get('/rental/{rental}/pdf/contract', [RentalPdfController::class, 'contract'])->middleware('permission:rental,view')->name('rental.pdf.contract');
        Route::get('/rental/{rental}/pdf/handover', [RentalPdfController::class, 'handover'])->middleware('permission:rental,view')->name('rental.pdf.handover');

        // Lifecycle actions
        Route::post('/rental/{rental}/confirm', [RentalActionController::class, 'confirm'])->middleware('permission:rental,approve')->name('rental.confirm');
        Route::post('/rental/{rental}/checkout', [RentalActionController::class, 'checkout'])->middleware('permission:rental,update')->name('rental.checkout');
        Route::post('/rental/{rental}/return', [RentalActionController::class, 'return'])->middleware('permission:rental,update')->name('rental.return');
        Route::post('/rental/{rental}/complete', [RentalActionController::class, 'complete'])->middleware('permission:rental,approve')->name('rental.complete');
        Route::post('/rental/{rental}/cancel', [RentalActionController::class, 'cancel'])->middleware('permission:rental,update')->name('rental.cancel');
        Route::post('/rental/{rental}/no-show', [RentalActionController::class, 'markNoShow'])->middleware('permission:rental,update')->name('rental.no_show');
        Route::post('/rental/{rental}/mark-fee-paid', [RentalActionController::class, 'markFeePaid'])->middleware('permission:rental,update')->name('rental.mark_fee_paid');
        Route::post('/rental/{rental}/extend', [RentalActionController::class, 'extend'])->middleware('permission:rental,update')->name('rental.extend');
        Route::post('/rental/{rental}/extension-requests/{extensionRequest}/approve', [RentalActionController::class, 'approveExtensionRequest'])
            ->middleware('permission:rental,update')
            ->name('rental.extension_requests.approve');
        Route::post('/rental/{rental}/extension-requests/{extensionRequest}/reject', [RentalActionController::class, 'rejectExtensionRequest'])
            ->middleware('permission:rental,update')
            ->name('rental.extension_requests.reject');
        Route::post('/rental/{rental}/swap-vehicle', [RentalActionController::class, 'swapVehicle'])->middleware('permission:rental,update')->name('rental.swap');
        Route::post('/rental/{rental}/deposit-receive', [RentalActionController::class, 'receiveDeposit'])->middleware('permission:rental,update')->name('rental.deposit.receive');
        Route::post('/rental/{rental}/deposit-pay-online', [RentalActionController::class, 'payDepositOnline'])->middleware('permission:rental,update')->name('rental.deposit.pay_online');
        Route::post('/rental/{rental}/deposit-settle', [RentalActionController::class, 'settleDeposit'])->middleware('permission:rental,update')->name('rental.deposit.settle');
        Route::post('/rental/{rental}/pay-invoices', [RentalActionController::class, 'payInvoices'])->middleware('permission:rental,update')->name('rental.invoices.pay');
        Route::post('/rental/{rental}/approve-deposit-proof', [RentalActionController::class, 'approveDepositProof'])->middleware('permission:rental,approve')->name('rental.approve_deposit_proof');
        Route::post('/rental/{rental}/reject-deposit-proof', [RentalActionController::class, 'rejectDepositProof'])->middleware('permission:rental,approve')->name('rental.reject_deposit_proof');
        Route::post('/rental/{rental}/damages', [RentalActionController::class, 'storeDamage'])->middleware('permission:rental,update')->name('rental.damages.store');
        Route::delete('/rental/{rental}/damages/{damage}', [RentalActionController::class, 'destroyDamage'])->middleware('permission:rental,update')->name('rental.damages.destroy');
        Route::post('/rental/{rental}/addons', [RentalActionController::class, 'storeAddon'])->middleware('permission:rental,update')->name('rental.addons.store');
        Route::delete('/rental/{rental}/addons/{charge}', [RentalActionController::class, 'destroyAddon'])->middleware('permission:rental,update')->name('rental.addons.destroy');

        // AI Handover Inspection
        Route::post('/rental/{rental}/ai-inspect-live', [RentalAiInspectionController::class, 'inspectLive'])
            ->middleware('permission:rental,update')
            ->name('rental.ai_inspect_live');
        Route::post('/rental/{rental}/ai-inspect-existing', [RentalAiInspectionController::class, 'inspectExisting'])
            ->middleware('permission:rental,update')
            ->name('rental.ai_inspect_existing');
        Route::post('/rental/{rental}/ai-apply-damage', [RentalAiInspectionController::class, 'applyDamage'])
            ->middleware('permission:rental,update')
            ->name('rental.ai_apply_damage');

        // AI Smart KYC & Document OCR
        Route::post('/rental/{rental}/ai-scan-kyc', [RentalAiKycController::class, 'scanRentalDocuments'])
            ->middleware('permission:rental,update')
            ->name('rental.ai_scan_kyc');
        Route::post('/rental/ai-scan-document', [RentalAiKycController::class, 'scanSingleDocument'])
            ->middleware('permission:rental,create')
            ->name('rental.ai_scan_document');
        Route::post('/rental/{rental}/ai-sync-kyc-partner', [RentalAiKycController::class, 'syncToPartner'])
            ->middleware('permission:rental,update')
            ->name('rental.ai_sync_kyc_partner');

        // AI Smart Dynamic Pricing & Fleet Optimizer
        Route::post('/rental/ai-pricing/analyze', [RentalAiPricingController::class, 'analyze'])
            ->middleware('permission:rental,view')
            ->name('rental.ai_pricing_analyze');
        Route::post('/rental/ai-pricing/apply', [RentalAiPricingController::class, 'apply'])
            ->middleware('permission:rental,update')
            ->name('rental.ai_pricing_apply');

        // B2B partner self-serve (linked via partners.portal_user_id)
        Route::middleware(['auth'])->prefix('portal')->name('portal.')->group(function (): void {
            Route::get('/rentals', [PartnerPortalController::class, 'index'])->name('rentals.index');
            Route::get('/rentals/{rental}', [PartnerPortalController::class, 'show'])->name('rentals.show');
            Route::post('/rentals/{rental}/pay-deposit', [PartnerPortalController::class, 'payDeposit'])->name('rentals.pay_deposit');
            Route::post('/invoices/{invoice}/pay', [PartnerPortalController::class, 'payInvoice'])->name('invoices.pay');
        });
    }
}
