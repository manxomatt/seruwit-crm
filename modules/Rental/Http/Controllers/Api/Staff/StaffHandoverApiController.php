<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Modules\Rental\AI\Contracts\VisionInspectionServiceInterface;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalAiInspection;
use Modules\Rental\Models\RentalDamage;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalHandoverMedia;
use Modules\Rental\Support\RentalHandoverService;
use Modules\Rental\Support\RentalInvoiceService;
use Throwable;

class StaffHandoverApiController extends Controller
{
    /**
     * Get list of scheduled handovers (pickup & return) for today or a specific date.
     */
    public function today(Request $request): JsonResponse
    {
        $date = (string) ($request->input('date') ?: Carbon::today()->toDateString());
        $type = (string) $request->input('type', 'all'); // 'all', 'pickup', 'return'

        $pickups = collect();
        if ($type === 'all' || $type === 'pickup') {
            $pickups = Rental::query()
                ->whereDate('start_date', $date)
                ->whereIn('status', [
                    Rental::STATUS_CONFIRMED,
                    Rental::STATUS_PENDING,
                    Rental::STATUS_PENDING_RESERVED,
                    Rental::STATUS_ACTIVE,
                ])
                ->with(['partner', 'vehicle'])
                ->get()
                ->map(fn (Rental $r): array => [
                    'rental_id' => $r->id,
                    'booking_number' => $r->booking_number,
                    'type' => 'pickup',
                    'status' => $r->status,
                    'is_completed' => $r->checked_out_at !== null,
                    'scheduled_at' => $r->start_date?->toDateString().' 09:00',
                    'customer' => [
                        'name' => $r->partner?->name ?? $r->booker_name ?? '-',
                        'phone' => $r->partner?->phone ?? $r->booker_phone ?? '-',
                    ],
                    'vehicle' => [
                        'id' => $r->vehicle?->id,
                        'name' => $r->vehicle?->name ?? '-',
                        'license_plate' => $r->vehicle?->plate_number ?? '-',
                        'color' => $r->vehicle?->color ?? '-',
                    ],
                ]);
        }

        $returns = collect();
        if ($type === 'all' || $type === 'return') {
            $returns = Rental::query()
                ->whereDate('end_date', $date)
                ->whereIn('status', [
                    Rental::STATUS_ACTIVE,
                    Rental::STATUS_RETURNED,
                    Rental::STATUS_COMPLETED,
                ])
                ->with(['partner', 'vehicle'])
                ->get()
                ->map(fn (Rental $r): array => [
                    'rental_id' => $r->id,
                    'booking_number' => $r->booking_number,
                    'type' => 'return',
                    'status' => $r->status,
                    'is_completed' => $r->returned_at !== null || in_array($r->status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true),
                    'scheduled_at' => $r->end_date?->toDateString().' 18:00',
                    'customer' => [
                        'name' => $r->partner?->name ?? $r->booker_name ?? '-',
                        'phone' => $r->partner?->phone ?? $r->booker_phone ?? '-',
                    ],
                    'vehicle' => [
                        'id' => $r->vehicle?->id,
                        'name' => $r->vehicle?->name ?? '-',
                        'license_plate' => $r->vehicle?->plate_number ?? '-',
                        'color' => $r->vehicle?->color ?? '-',
                    ],
                ]);
        }

        $allHandovers = $pickups->concat($returns)->values()->all();

        return response()->json([
            'success' => true,
            'data' => $allHandovers,
            'meta' => [
                'date' => $date,
                'count' => count($allHandovers),
            ],
        ]);
    }

    /**
     * Execute Handover Out (check out vehicle to customer).
     */
    public function handoverOut(
        Request $request,
        Rental $rental,
        RentalHandoverService $handoverService,
        RentalHandoverMedia $handoverMedia
    ): JsonResponse {
        $validated = $request->validate([
            'start_odometer' => ['required', 'integer', 'min:0'],
            'start_fuel_level' => ['required', 'string'],
            'checkout_notes' => ['nullable', 'string', 'max:1000'],
            'checkout_checklist' => ['nullable', 'array'],
            'customer_signature' => ['nullable', 'string'],
            'staff_signature' => ['nullable', 'string'],
        ]);

        $photos = $this->resolvePhotos($request, $handoverMedia, 'photos', 'rental/handover-photos');
        $customerSignature = $this->resolveSignature($request, $handoverMedia, 'customer_signature');
        $staffSignature = $this->resolveSignature($request, $handoverMedia, 'staff_signature');

        try {
            $updated = $handoverService->handOver($rental, [
                'start_odometer' => (int) $validated['start_odometer'],
                'start_fuel_level' => $validated['start_fuel_level'],
                'checkout_checklist' => $validated['checkout_checklist'] ?? null,
                'checkout_notes' => $validated['checkout_notes'] ?? null,
                'checkout_photos' => $photos,
                'checkout_signature_path' => $customerSignature,
                'checkout_staff_signature_path' => $staffSignature,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Handover out berhasil dilakukan. Kendaraan sekarang berstatus aktif.',
                'data' => [
                    'rental_id' => $updated->id,
                    'booking_number' => $updated->booking_number,
                    'status' => $updated->status,
                    'checked_out_at' => $updated->checked_out_at?->toIso8601String(),
                    'start_odometer' => $updated->start_odometer,
                    'start_fuel_level' => $updated->start_fuel_level,
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'HANDOVER_OUT_FAILED',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }
    }

    /**
     * Execute Handover In (check in returning vehicle from customer).
     */
    public function handoverIn(
        Request $request,
        Rental $rental,
        RentalHandoverMedia $handoverMedia,
        RentalInvoiceService $invoices,
        RentalAccountingService $accounting
    ): JsonResponse {
        $validated = $request->validate([
            'end_odometer' => ['required', 'integer', 'min:0'],
            'end_fuel_level' => ['required', 'string'],
            'actual_return_date' => ['nullable', 'date'],
            'return_notes' => ['nullable', 'string', 'max:1000'],
            'return_checklist' => ['nullable', 'array'],
            'customer_signature' => ['nullable', 'string'],
            'damages' => ['nullable', 'array'],
            'damages.*.description' => ['required_with:damages', 'string', 'max:255'],
            'damages.*.amount' => ['required_with:damages', 'numeric', 'min:0'],
        ]);

        $photos = $this->resolvePhotos($request, $handoverMedia, 'photos', 'rental/return-photos');
        $customerSignature = $this->resolveSignature($request, $handoverMedia, 'customer_signature');

        $actualReturnDate = $validated['actual_return_date'] ?? now()->toDateString();
        $endOdometer = (int) $validated['end_odometer'];

        $excessKm = null;
        $excessAmount = 0.0;
        if ($rental->start_odometer && $rental->km_limit_per_period) {
            $totalKmDriven = $endOdometer - $rental->start_odometer;
            $allowedKm = (int) ($rental->km_limit_per_period * ($rental->total_periods ?: 1));
            $excessKm = max(0, $totalKmDriven - $allowedKm);
            $excessAmount = (float) ($excessKm * (float) ($rental->excess_km_rate ?? 0));
        }

        $overdueDays = Rental::computeOverdueDays(
            $rental->end_date?->toDateString() ?? $actualReturnDate,
            $actualReturnDate,
        );
        $lateFeeAmount = (float) ($overdueDays * $rental->resolveLateFeePerDay());

        $rental->update([
            'status' => Rental::STATUS_RETURNED,
            'actual_return_date' => $actualReturnDate,
            'end_odometer' => $endOdometer,
            'end_fuel_level' => $validated['end_fuel_level'],
            'return_checklist' => RentalHandoverChecklist::normalize($validated['return_checklist'] ?? null),
            'return_notes' => $validated['return_notes'] ?? null,
            'return_photos' => $photos,
            'return_signature_path' => $customerSignature,
            'return_signed_at' => now(),
            'excess_km' => $excessKm,
            'excess_amount' => $excessAmount,
            'overdue_days' => $overdueDays,
            'late_fee_amount' => $lateFeeAmount,
            'returned_at' => now(),
        ]);

        $rental->recalculateTotalAmount();
        $rental->refresh();

        $invoices->invoiceExcessKm($rental);
        $invoices->invoiceLateFee($rental);
        $accounting->issueDraftInvoices($rental->fresh());

        if ((float) $rental->deposit_amount <= 0) {
            $rental->settleDeposit([
                'deposit_applied_amount' => 0,
                'deposit_refunded_amount' => 0,
            ]);
        }

        // Process any damage records
        if (! empty($validated['damages'])) {
            foreach ($validated['damages'] as $damage) {
                RentalDamage::query()->create([
                    'rental_id' => $rental->id,
                    'description' => $damage['description'],
                    'amount' => (float) $damage['amount'],
                    'reported_at' => now(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengembalian kendaraan berhasil diproses.',
            'data' => [
                'rental_id' => $rental->id,
                'booking_number' => $rental->booking_number,
                'status' => $rental->fresh()->status,
                'returned_at' => $rental->fresh()->returned_at?->toIso8601String(),
                'overdue_days' => $rental->fresh()->overdue_days,
                'late_fee_amount' => (float) $rental->fresh()->late_fee_amount,
                'excess_km' => $rental->fresh()->excess_km,
                'excess_amount' => (float) $rental->fresh()->excess_amount,
                'total_amount' => (float) $rental->fresh()->total_amount,
            ],
        ]);
    }

    /**
     * Run Gemini Vision AI inspection on uploaded vehicle photos.
     */
    public function aiInspect(
        Request $request,
        Rental $rental,
        VisionInspectionServiceInterface $visionInspectionService
    ): JsonResponse {
        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:5'],
        ]);

        $rental->loadMissing('vehicle');

        $context = [
            'vehicle_info' => $rental->vehicle ? sprintf('%s (%s)', $rental->vehicle->name, $rental->vehicle->plate_number ?? '-') : 'Kendaraan Rental',
            'start_odometer' => $rental->start_odometer,
            'start_fuel_level' => $rental->start_fuel_level,
        ];

        try {
            $result = $visionInspectionService->inspectHandover(
                checkoutPhotos: $rental->checkout_photos ?? [],
                returnPhotos: $request->input('photos', []),
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
                'data' => [
                    'inspection_id' => $inspection->id,
                    'overall_status' => $inspection->overall_status,
                    'condition_summary' => $inspection->condition_summary,
                    'extracted_odometer' => $inspection->extracted_odometer,
                    'extracted_fuel_level' => $inspection->extracted_fuel_level,
                    'detected_damages' => $inspection->detected_damages,
                    'created_at' => $inspection->created_at?->toIso8601String(),
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AI_INSPECTION_FAILED',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }
    }

    /**
     * @return list<string>
     */
    private function resolvePhotos(Request $request, RentalHandoverMedia $handoverMedia, string $key, string $directory): array
    {
        $input = $request->input($key, []);
        $files = $request->file($key, []);

        $paths = [];

        // Handle uploaded binary files
        if (is_array($files)) {
            foreach ($files as $file) {
                if ($file instanceof UploadedFile) {
                    $paths[] = (string) $file->store($directory, 'public');
                }
            }
        }

        // Handle data URLs
        if (is_array($input)) {
            $dataUrls = array_filter($input, fn ($item) => is_string($item) && str_starts_with($item, 'data:image/'));
            if (! empty($dataUrls)) {
                $paths = array_merge($paths, $handoverMedia->storePhotos(array_values($dataUrls), $directory));
            }
        }

        return $paths;
    }

    private function resolveSignature(Request $request, RentalHandoverMedia $handoverMedia, string $key): ?string
    {
        $file = $request->file($key);
        if ($file instanceof UploadedFile) {
            return (string) $file->store('rental/signatures', 'public');
        }

        $dataUrl = $request->input($key);
        if (is_string($dataUrl) && str_starts_with($dataUrl, 'data:image/')) {
            return $handoverMedia->storeSignature($dataUrl);
        }

        return null;
    }
}
