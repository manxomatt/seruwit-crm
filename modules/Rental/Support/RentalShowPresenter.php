<?php

namespace Modules\Rental\Support;

use App\Modules\Facades\Modules;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;

/**
 * Builds the Inertia props for the rental Show page (Modules/Rental/Show).
 *
 * Extracted from RentalController::show so the controller stays a thin
 * validate → delegate → render seam. Soft dependencies (Tracking, Receivables,
 * Accounting, AI) are resolved here exactly as before, guarded by availability.
 */
class RentalShowPresenter
{
    public function __construct(private readonly RentalInvoiceService $invoices) {}

    /**
     * @return array<string, mixed>
     */
    public function props(Rental $rental, string $routePrefix = 'module'): array
    {
        $rental->load([
            'vehicle:id,name,plate_number,type,status,photo_url',
            'driver:id,name,phone',
            'partner:id,name,code,phone',
            'confirmedBy:id,name',
            'appliedPeriodTier:id,tier_type,min_threshold,max_threshold,rate_per_period,discount_percent,discount_flat,priority,is_active',
            'appliedLoyaltyTier:id,tier_type,min_threshold,max_threshold,rate_per_period,discount_percent,discount_flat,priority,is_active',
            'extensions',
            'extensionRequests' => fn ($query) => $query
                ->where('status', \Modules\Rental\Models\RentalExtensionRequest::STATUS_PENDING)
                ->latest('id'),
            'damages',
            'latestAiInspection.createdByUser:id,name',
            'insurancePackage',
            'depositCompanyBankAccount:id,name,bank_name,account_number,account_holder',
            // Do not eager-load pickupLocation/returnLocation here: Laravel serializes
            // those relations as pickup_location / return_location and overwrites the
            // text snapshot columns, which crashes React when rendered as children.
            'vehicleSwaps.fromVehicle:id,name,plate_number',
            'vehicleSwaps.toVehicle:id,name,plate_number',
            'vehicleSwaps.swappedByUser:id,name',
            'charges' => fn ($query) => $query
                ->where('kind', RentalCharge::KIND_ADDON)
                ->with('invoiceLine.invoice')
                ->orderBy('id'),
        ]);

        [$trackingEnabled, $hasGpsDevice, $livePosition, $gpsSummary] = $this->trackingData($rental);

        return [
            'rental' => $rental->append('is_overdue'),
            'addonCharges' => $rental->charges->map(fn (RentalCharge $charge): array => [
                'id' => $charge->id,
                'addon_code' => $charge->addon_code,
                'description' => $charge->description,
                'amount' => (float) $charge->amount,
                'is_invoiced' => $charge->isInvoiced(),
                'can_delete' => ! $charge->isInvoiced()
                    || $charge->invoiceLine?->invoice?->status === \Modules\Invoicing\Models\Invoice::STATUS_DRAFT,
            ])->values()->all(),
            'addonCodes' => collect(RentalAddonCatalog::codes())
                ->map(fn (string $code): array => [
                    'value' => $code,
                    'label' => RentalAddonCatalog::label($code),
                ])
                ->all(),
            'swapVehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->where('id', '!=', $rental->vehicle_id)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'vehicleSwaps' => $rental->vehicleSwaps->map(fn ($swap): array => [
                'id' => $swap->id,
                'from_vehicle' => $swap->fromVehicle
                    ? $swap->fromVehicle->name.' — '.$swap->fromVehicle->plate_number
                    : null,
                'to_vehicle' => $swap->toVehicle
                    ? $swap->toVehicle->name.' — '.$swap->toVehicle->plate_number
                    : null,
                'odometer_km' => $swap->odometer_km,
                'notes' => $swap->notes,
                'swapped_at' => $swap->swapped_at?->toDateTimeString(),
                'swapped_by' => $swap->swappedByUser?->name,
            ])->values()->all(),
            'trackingEnabled' => $trackingEnabled,
            'hasGpsDevice' => $hasGpsDevice,
            'livePosition' => $livePosition,
            'gpsSummary' => $gpsSummary,
            'payment' => $this->invoices->paymentSummary($rental),
            'invoicingEnabled' => $this->invoices->isAvailable(),
            'checklistItems' => RentalHandoverChecklist::itemKeys(),
            'fuelLevels' => RentalHandoverChecklist::fuelLevels(),
            'handoverEvidence' => [
                'checkout_photos' => app(RentalHandoverMedia::class)->publicUrls($rental->checkout_photos),
                'checkout_signature_url' => app(RentalHandoverMedia::class)->publicUrl($rental->checkout_signature_path),
                'checkout_staff_signature_url' => app(RentalHandoverMedia::class)->publicUrl($rental->checkout_staff_signature_path),
                'return_photos' => app(RentalHandoverMedia::class)->publicUrls($rental->return_photos),
                'return_signature_url' => app(RentalHandoverMedia::class)->publicUrl($rental->return_signature_path),
            ],
            'depositProofUrl' => app(\Modules\Rental\Support\RentalPassengerDocMedia::class)->publicUrl($rental->deposit_proof_path),
            'pickupCustomerSignatureUrl' => app(\Modules\Rental\Support\RentalPassengerDocMedia::class)->publicUrl($rental->pickup_customer_signature_path),
            'gatewayEnabled' => class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
                && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable(),
            'canPayDepositOnline' => class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
                && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable()
                && (float) $rental->deposit_amount > 0
                && $rental->deposit_received_at === null
                && in_array($rental->status, [
                    Rental::STATUS_DRAFT,
                    Rental::STATUS_PENDING,
                    Rental::STATUS_PENDING_RESERVED,
                    Rental::STATUS_CONFIRMED,
                    Rental::STATUS_ACTIVE,
                ], true),
            'companyBankAccounts' => class_exists(\Modules\Accounting\Support\PaymentAccountResolver::class)
                ? \Modules\Accounting\Support\PaymentAccountResolver::optionsForForms()
                : [],
            'postConfirm' => app(RentalPostConfirmProgress::class)->for($rental),
            'aiInspectionEnabled' => \App\Support\CentralAiSettings::isEnabled() && \Modules\Rental\Support\RentalGeneralSettings::all()['ai_inspection_enabled'],
            'aiKycEnabled' => \App\Support\CentralAiSettings::isEnabled() && \Modules\Rental\Support\RentalGeneralSettings::all()['ai_kyc_enabled'],
            'latestAiInspection' => $rental->latestAiInspection,
            'aiInspectLiveUrl' => route($routePrefix.'.rental.ai_inspect_live', $rental),
            'aiInspectExistingUrl' => route($routePrefix.'.rental.ai_inspect_existing', $rental),
            'aiApplyDamageUrl' => route($routePrefix.'.rental.ai_apply_damage', $rental),
            'aiScanKycUrl' => route($routePrefix.'.rental.ai_scan_kyc', $rental),
            'aiSyncKycPartnerUrl' => route($routePrefix.'.rental.ai_sync_kyc_partner', $rental),
        ];
    }

    /**
     * Live GPS position + trail summary, only when Tracking is available for this tenant.
     *
     * @return array{0: bool, 1: bool, 2: array<string, mixed>|null, 3: array<string, mixed>|null}
     */
    private function trackingData(Rental $rental): array
    {
        $trackingEnabled = Modules::available('tracking');
        $livePosition = null;
        $hasGpsDevice = false;
        $gpsSummary = null;

        // Soft dependency: Tracking registers Vehicle::gpsDevice at boot. Only
        // surface a fix when the module is actually available for this tenant.
        if ($trackingEnabled && $rental->vehicle) {
            $device = $rental->vehicle->gpsDevice;
            $hasGpsDevice = $device !== null;

            if ($device?->hasPosition()) {
                $livePosition = [
                    'latitude' => $device->last_latitude,
                    'longitude' => $device->last_longitude,
                    'speed_kph' => $device->last_speed_kph,
                    'recorded_at' => $device->last_recorded_at?->toDateTimeString(),
                ];
            }

            if (
                class_exists(\Modules\Tracking\Models\VehiclePosition::class)
                && class_exists(\Modules\Tracking\Support\PositionTrail::class)
            ) {
                $from = $rental->checked_out_at ?? $rental->start_date;
                $to = $rental->returned_at ?? now();

                $positions = \Modules\Tracking\Models\VehiclePosition::query()
                    ->where('vehicle_id', $rental->vehicle_id)
                    ->whereBetween('recorded_at', [$from, $to])
                    ->orderBy('recorded_at')
                    ->get();

                $odometerKm = null;
                if ($rental->start_odometer !== null && $rental->end_odometer !== null) {
                    $odometerKm = max(0, (int) $rental->end_odometer - (int) $rental->start_odometer);
                }

                $gpsSummary = [
                    'distance_km' => \Modules\Tracking\Support\PositionTrail::distanceKm($positions),
                    'points' => $positions->count(),
                    'odometer_km' => $odometerKm,
                    'from' => \Illuminate\Support\Carbon::parse($from)->toDateTimeString(),
                    'to' => \Illuminate\Support\Carbon::parse($to)->toDateTimeString(),
                ];
            }
        }

        return [$trackingEnabled, $hasGpsDevice, $livePosition, $gpsSummary];
    }
}
