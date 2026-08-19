<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Rental\AI\Contracts\VisionInspectionServiceInterface;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalAiInspection;
use Modules\Rental\Models\RentalDamage;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalInvoiceService;
use Throwable;

class RentalAiInspectionController extends Controller
{
    public function __construct(
        protected VisionInspectionServiceInterface $visionInspectionService,
        protected RentalInvoiceService $invoices,
        protected RentalAccountingService $accounting,
    ) {}

    /**
     * Run live visual inspection on incoming data URLs from return modal.
     */
    public function inspectLive(Request $request, Rental $rental): JsonResponse
    {
        if (! \App\Support\CentralAiSettings::isEnabled() || ! \Modules\Rental\Support\RentalGeneralSettings::all()['ai_inspection_enabled']) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur AI Visual Inspection dinonaktifkan oleh administrator central atau pengaturan rental.',
            ], 403);
        }
        $request->validate([
            'return_photos' => ['required', 'array', 'min:1', 'max:5'],
            'return_photos.*' => ['string', 'starts_with:data:image/'],
        ], [
            'return_photos.required' => __('rental.errors.handover_photo_required'),
            'return_photos.min' => __('rental.errors.handover_photo_required'),
        ]);

        $rental->loadMissing('vehicle');

        $context = [
            'vehicle_info' => $rental->vehicle ? sprintf('%s (%s)', $rental->vehicle->name, $rental->vehicle->plate_number) : 'Kendaraan Rental',
            'start_odometer' => $rental->start_odometer,
            'start_fuel_level' => $rental->start_fuel_level,
        ];

        try {
            $result = $this->visionInspectionService->inspectHandover(
                checkoutPhotos: $rental->checkout_photos ?? [],
                returnPhotos: $request->input('return_photos', []),
                context: $context,
            );

            $inspection = RentalAiInspection::query()->create([
                'rental_id' => $rental->id,
                'inspection_type' => RentalAiInspection::TYPE_LIVE_PREVIEW,
                'model_used' => $result->modelUsed,
                'extracted_odometer' => $result->extractedOdometer,
                'extracted_fuel_level' => $result->extractedFuelLevel,
                'condition_summary' => $result->conditionSummary,
                'overall_status' => $result->overallStatus,
                'detected_damages' => array_map(fn ($d) => $d->toArray(), $result->damages),
                'raw_response' => $result->rawResponse,
                'created_by_user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'success' => true,
                'inspection' => [
                    'id' => $inspection->id,
                    'extracted_odometer' => $inspection->extracted_odometer,
                    'extracted_fuel_level' => $inspection->extracted_fuel_level,
                    'condition_summary' => $inspection->condition_summary,
                    'overall_status' => $inspection->overall_status,
                    'detected_damages' => $inspection->detected_damages,
                    'created_at' => $inspection->created_at?->toIso8601String(),
                ],
                'message' => __('rental.ai.inspection_success'),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Run visual inspection on existing saved checkout and return photos.
     */
    public function inspectExisting(Request $request, Rental $rental): JsonResponse|RedirectResponse
    {
        if (! \App\Support\CentralAiSettings::isEnabled() || ! \Modules\Rental\Support\RentalGeneralSettings::all()['ai_inspection_enabled']) {
            $message = 'Fitur AI Visual Inspection dinonaktifkan oleh administrator central atau pengaturan rental.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 403);
            }

            return back()->with('error', $message);
        }

        if (empty($rental->return_photos)) {
            $message = __('rental.ai.no_return_photos_saved');
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 422);
            }

            return back()->with('error', $message);
        }

        $rental->loadMissing('vehicle');

        $context = [
            'vehicle_info' => $rental->vehicle ? sprintf('%s (%s)', $rental->vehicle->name, $rental->vehicle->plate_number) : 'Kendaraan Rental',
            'start_odometer' => $rental->start_odometer,
            'start_fuel_level' => $rental->start_fuel_level,
        ];

        try {
            $result = $this->visionInspectionService->inspectHandover(
                checkoutPhotos: $rental->checkout_photos ?? [],
                returnPhotos: $rental->return_photos,
                context: $context,
            );

            $inspection = RentalAiInspection::query()->create([
                'rental_id' => $rental->id,
                'inspection_type' => RentalAiInspection::TYPE_HANDOVER_RETURN,
                'model_used' => $result->modelUsed,
                'extracted_odometer' => $result->extractedOdometer,
                'extracted_fuel_level' => $result->extractedFuelLevel,
                'condition_summary' => $result->conditionSummary,
                'overall_status' => $result->overallStatus,
                'detected_damages' => array_map(fn ($d) => $d->toArray(), $result->damages),
                'raw_response' => $result->rawResponse,
                'created_by_user_id' => $request->user()?->id,
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'inspection' => [
                        'id' => $inspection->id,
                        'extracted_odometer' => $inspection->extracted_odometer,
                        'extracted_fuel_level' => $inspection->extracted_fuel_level,
                        'condition_summary' => $inspection->condition_summary,
                        'overall_status' => $inspection->overall_status,
                        'detected_damages' => $inspection->detected_damages,
                        'created_at' => $inspection->created_at?->toIso8601String(),
                    ],
                    'message' => __('rental.ai.inspection_success'),
                ]);
            }

            return back()->with('success', __('rental.ai.inspection_success'));
        } catch (Throwable $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Convert an AI-detected damage item directly into a billable RentalDamage claim.
     */
    public function applyDamage(Request $request, Rental $rental): JsonResponse|RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED], true),
            422,
            __('rental.errors.damage_active_returned_only'),
        );

        $request->validate([
            'description' => ['required', 'string', 'max:500'],
            'amount' => ['required', 'numeric', 'min:0'],
            'photo_path' => ['nullable', 'string'],
        ]);

        /** @var RentalDamage $damage */
        $damage = $rental->damages()->create([
            'description' => $request->string('description')->toString(),
            'amount' => $request->input('amount'),
            'photo_path' => $request->input('photo_path'),
            'reported_at' => now(),
        ]);

        $rental->recalculateTotalAmount();
        $this->invoices->invoiceDamage($rental->fresh(), $damage);
        $this->accounting->issueDraftInvoices($rental->fresh());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'damage' => [
                    'id' => $damage->id,
                    'description' => $damage->description,
                    'amount' => $damage->amount,
                    'reported_at' => $damage->reported_at?->toDateTimeString(),
                ],
                'message' => __('rental.messages.damage_recorded'),
            ]);
        }

        return back()->with('success', __('rental.messages.damage_recorded'));
    }
}
