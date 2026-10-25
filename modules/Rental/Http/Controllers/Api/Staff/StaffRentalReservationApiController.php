<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\PaymentRecorder;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\Http\Requests\Staff\StaffCollectPaymentRequest;
use Modules\Rental\Http\Requests\Staff\StaffQuoteReservationRequest;
use Modules\Rental\Http\Requests\Staff\StaffStoreReservationRequest;
use Modules\Rental\Http\Requests\Staff\StaffStoreWalkInCustomerRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\MobileRentalBookingService;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalConfirmationService;
use Modules\Rental\Support\RentalLocationHydrator;
use Modules\Rental\Support\RentalPriceEngine;
use Modules\Rental\Support\RentalRateResolver;
use Modules\Rental\Support\WalkInCustomerCreator;
use Throwable;

class StaffRentalReservationApiController extends Controller
{
    /**
     * Get real-time fleet availability for a date range with suggested rental rates.
     */
    public function availableVehicles(
        Request $request,
        RentalRateResolver $rates,
        RentalPriceEngine $priceEngine
    ): JsonResponse {
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'string', 'in:daily,weekly,monthly'],
            'rental_class' => ['nullable', 'string'],
            'transmission' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $startDate = (string) $validated['start_date'];
        $endDate = (string) $validated['end_date'];
        $periodType = (string) $validated['period_type'];
        $periods = Rental::computePeriods($startDate, $endDate, $periodType);

        $query = AccessibleFleetBases::scopeVehicles(Vehicle::query(), $request->user())
            ->where('status', Vehicle::STATUS_ACTIVE);

        if (! empty($validated['rental_class'])) {
            $query->where('rental_class', $validated['rental_class']);
        }

        if (! empty($validated['transmission'])) {
            $query->where('transmission', $validated['transmission']);
        }

        if (! empty($validated['search'])) {
            $term = '%'.$validated['search'].'%';
            $query->where(function ($q) use ($term): void {
                $q->where('name', 'like', $term)
                    ->orWhere('plate_number', 'like', $term)
                    ->orWhere('brand', 'like', $term);
            });
        }

        $vehicles = $query->orderBy('name')->get();
        $availableList = [];

        foreach ($vehicles as $vehicle) {
            $reasons = Rental::vehicleAvailabilityReasons($vehicle, $startDate, $endDate);

            if (Modules::available('transportation')) {
                $curr = Carbon::parse($startDate);
                $end = Carbon::parse($endDate);
                while ($curr->lte($end)) {
                    $d = $curr->toDateString();
                    if (\Modules\TransportationManagement\Models\Trip::hasActiveTripOn('vehicle_id', $vehicle->id, $d)) {
                        $reasons[] = __('rental.validation.vehicle_trip_conflict', [
                            'name' => $vehicle->name,
                            'date' => $d,
                        ]);
                        break;
                    }
                    $curr->addDay();
                }
            }

            if ($reasons !== []) {
                continue;
            }

            /** @var RentalRate|null $suggestedRate */
            $suggestedRate = $rates->suggest($vehicle, $startDate, $endDate, $periodType);
            if ($suggestedRate === null) {
                continue;
            }

            if ($suggestedRate->min_periods !== null && $periods < (int) $suggestedRate->min_periods) {
                continue;
            }

            $pricing = null;
            try {
                $pricing = $priceEngine->calculate($vehicle, $startDate, $endDate, $periodType);
            } catch (Throwable) {
                $pricing = null;
            }

            $ratePerPeriod = $pricing !== null
                ? (float) $pricing['effective_rate_per_period']
                : (float) $suggestedRate->rate_per_period;

            $baseAmount = $pricing !== null
                ? (float) $pricing['base_amount']
                : round($ratePerPeriod * $periods, 2);

            $availableList[] = [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number ?? $vehicle->license_plate ?? '-',
                'rental_class' => $vehicle->rental_class,
                'type' => $vehicle->type,
                'brand' => $vehicle->brand,
                'model' => $vehicle->model,
                'year' => $vehicle->year,
                'color' => $vehicle->color,
                'seats' => $vehicle->seating_capacity ?? $vehicle->seats ?? 5,
                'transmission' => $vehicle->transmission ?? 'automatic',
                'fuel_type' => $vehicle->fuel_type ?? 'bensin',
                'photo_url' => $vehicle->photo_url,
                'suggested_rate' => [
                    'rate_id' => $suggestedRate->id,
                    'rate_name' => $suggestedRate->name,
                    'rate_per_period' => $ratePerPeriod,
                    'base_amount' => $baseAmount,
                    'deposit_amount' => (float) ($suggestedRate->deposit_amount ?? 0),
                    'km_limit_per_period' => $suggestedRate->km_limit_per_period,
                    'excess_km_rate' => (float) ($suggestedRate->excess_km_rate ?? 0),
                    'late_fee_per_day' => (float) ($suggestedRate->late_fee_per_day ?? 0),
                ],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $availableList,
            'meta' => [
                'total_available' => count($availableList),
                'periods' => $periods,
                'period_type' => $periodType,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Scan KTP or SIM document with AI OCR for field operators to auto-populate walk-in customer form.
     */
    public function scanDocument(Request $request, DocumentKycServiceInterface $kycService): JsonResponse
    {
        $request->validate([
            'image' => ['nullable'],
            'file' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
            'doc_type' => ['nullable', 'string', 'in:ktp,sim,auto'],
        ]);

        $imageSource = null;
        if ($request->hasFile('file')) {
            $imageSource = (string) $request->file('file')->getRealPath();
        } elseif ($request->hasFile('image')) {
            $imageSource = (string) $request->file('image')->getRealPath();
        } elseif ($request->filled('image')) {
            $imageSource = (string) $request->input('image');
        }

        if (! $imageSource) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NO_IMAGE_PROVIDED',
                    'message' => 'Silakan lampirkan file atau foto dokumen identitas.',
                ],
            ], 422);
        }

        $docType = (string) $request->input('doc_type', 'auto');

        try {
            $result = $kycService->scanSingleDocument($imageSource, $docType);

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil dipindai oleh AI.',
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'OCR_SCAN_FAILED',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }
    }

    /**
     * Create or reuse a walk-in customer for offline/field reservation.
     */
    public function storeWalkInCustomer(
        StaffStoreWalkInCustomerRequest $request,
        WalkInCustomerCreator $creator
    ): JsonResponse {
        $result = $creator->createOrReuse($request->validated());
        /** @var Partner $partner */
        $partner = $result['partner'];

        $updates = [];
        if ($request->filled('driver_license_number') && blank($partner->driver_license_number)) {
            $updates['driver_license_number'] = (string) $request->input('driver_license_number');
        }
        if ($request->filled('address') && blank($partner->address)) {
            $updates['address'] = (string) $request->input('address');
        }
        if ($updates !== []) {
            $partner->forceFill($updates)->save();
            $partner = $partner->fresh();
        }

        return response()->json([
            'success' => true,
            'message' => $result['created'] ? 'Pelanggan walk-in berhasil didaftarkan.' : 'Data pelanggan lama ditemukan dan digunakan kembali.',
            'data' => [
                'partner_id' => $partner->id,
                'code' => $partner->code,
                'name' => $partner->name,
                'phone' => $partner->phone ?? $partner->mobile,
                'email' => $partner->email,
                'id_number' => $partner->id_number,
                'driver_license_number' => $partner->driver_license_number,
                'address' => $partner->address,
                'is_new' => $result['created'],
            ],
        ]);
    }

    /**
     * Calculate rental quote and full cost breakdown.
     */
    public function quote(
        StaffQuoteReservationRequest $request,
        MobileRentalBookingService $bookingService
    ): JsonResponse {
        try {
            $quote = $bookingService->quote($request->validated());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'QUOTE_CALCULATION_FAILED',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }

        $discount = (float) ($request->input('discount_amount') ?: 0);
        $totalAmount = (float) ($quote['total_amount'] ?? 0);
        if ($discount > 0) {
            $totalAmount = max(0.0, round($totalAmount - $discount, 2));
        }

        return response()->json([
            'success' => true,
            'data' => [
                'available' => $quote['available'],
                'reasons' => $quote['reasons'],
                'total_periods' => $quote['total_periods'],
                'period_unit' => $request->input('period_type') === 'daily' ? 'Hari' : ($request->input('period_type') === 'weekly' ? 'Minggu' : 'Bulan'),
                'breakdown' => [
                    'rate_per_period' => (float) ($quote['rate_per_period'] ?? 0),
                    'base_rental_amount' => (float) ($quote['base_amount'] ?? 0),
                    'insurance_amount' => (float) ($quote['insurance_amount'] ?? 0),
                    'driver_fee' => (float) ($quote['driver_fee_amount'] ?? 0),
                    'delivery_fee' => (float) ($quote['delivery_fee'] ?? 0),
                    'return_delivery_fee' => (float) ($quote['return_delivery_fee'] ?? 0),
                    'one_way_fee' => (float) ($quote['one_way_fee_amount'] ?? 0),
                    'discount_amount' => $discount,
                    'deposit_amount' => (float) ($quote['deposit_amount'] ?? 0),
                    'total_amount' => $totalAmount,
                ],
            ],
        ]);
    }

    /**
     * Store new rental reservation directly from mobile staff / field operator.
     */
    public function store(
        StaffStoreReservationRequest $request,
        MobileRentalBookingService $bookingService,
        RentalLocationHydrator $hydrator,
        RentalConfirmationService $confirmation,
        RentalAccountingService $accounting
    ): JsonResponse {
        $validated = $request->validated();
        $vehicle = Vehicle::query()->findOrFail((int) $validated['vehicle_id']);
        $partner = Partner::query()->findOrFail((int) $validated['partner_id']);

        $startDate = (string) $validated['start_date'];
        $endDate = (string) $validated['end_date'];

        $availability = Rental::vehicleAvailabilityReasons($vehicle, $startDate, $endDate);
        if ($availability !== []) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'VEHICLE_NOT_AVAILABLE',
                    'message' => $availability[0],
                ],
            ], 422);
        }

        $quote = $bookingService->quote($validated);
        if (! $quote['available'] || $quote['rate'] === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'RATE_NOT_AVAILABLE',
                    'message' => $quote['reasons'][0] ?? 'Tarif sewa tidak ditemukan untuk kriteria ini.',
                ],
            ], 422);
        }

        /** @var RentalRate $rate */
        $rate = $quote['rate'];
        $periods = (int) $quote['total_periods'];
        $ratePerPeriod = isset($validated['custom_rate_per_period']) && (float) $validated['custom_rate_per_period'] > 0
            ? (float) $validated['custom_rate_per_period']
            : (float) $quote['rate_per_period'];

        $baseAmount = round($ratePerPeriod * $periods, 2);
        $discountAmount = (float) ($validated['discount_amount'] ?? 0);
        $totalAmount = max(0.0, round(($quote['total_amount'] ?? $baseAmount) - $discountAmount, 2));

        $hydrated = $hydrator->hydrate([
            'pickup_location_id' => $validated['pickup_location_id'] ?? null,
            'return_location_id' => $validated['return_location_id'] ?? null,
            'pickup_location' => $validated['pickup_location'] ?? null,
            'return_location' => $validated['return_location'] ?? null,
        ]);

        $initialStatus = $validated['status'] ?? Rental::STATUS_CONFIRMED;

        /** @var Rental $rental */
        $rental = DB::transaction(function () use (
            $validated,
            $vehicle,
            $partner,
            $rate,
            $periods,
            $ratePerPeriod,
            $baseAmount,
            $totalAmount,
            $discountAmount,
            $quote,
            $hydrated,
            $initialStatus,
            $request
        ): Rental {
            return Rental::query()->create([
                'code' => Rental::nextCode(),
                'channel' => Rental::CHANNEL_STAFF,
                'service_type' => $validated['service_type'] ?? Rental::SERVICE_SELF_DRIVE,
                'public_token' => Str::random(40),
                'booker_name' => $partner->name,
                'booker_phone' => $partner->phone ?? $partner->mobile,
                'booker_email' => $partner->email,
                'vehicle_id' => $vehicle->id,
                'partner_id' => $partner->id,
                'status' => $initialStatus,
                'confirmed_by' => $initialStatus === Rental::STATUS_CONFIRMED ? $request->user()?->id : null,
                'confirmed_at' => $initialStatus === Rental::STATUS_CONFIRMED ? now() : null,
                'start_date' => $validated['start_date'],
                'pickup_time' => $validated['pickup_time'] ?? '09:00',
                'end_date' => $validated['end_date'],
                'return_time' => $validated['return_time'] ?? '18:00',
                'period_type' => $validated['period_type'],
                'rate_per_period' => $ratePerPeriod,
                'km_limit_per_period' => $rate->km_limit_per_period,
                'excess_km_rate' => $rate->excess_km_rate,
                'late_fee_per_day' => $rate->late_fee_per_day,
                'deposit_amount' => (float) ($quote['deposit_amount'] ?? 0),
                'deposit_status' => (float) ($quote['deposit_amount'] ?? 0) > 0 ? Rental::DEPOSIT_HELD : null,
                'total_periods' => $periods,
                'base_amount' => $baseAmount,
                'total_amount' => $totalAmount,
                'tier_discount_amount' => $discountAmount,
                'pickup_location_id' => $hydrated['pickup_location_id'] ?? null,
                'return_location_id' => $hydrated['return_location_id'] ?? null,
                'pickup_location' => $hydrated['pickup_location'] ?? null,
                'return_location' => $hydrated['return_location'] ?? null,
                'delivery_type' => $validated['delivery_type'] ?? Rental::DELIVERY_DEPOT,
                'delivery_address' => $validated['delivery_address'] ?? null,
                'delivery_fee' => (float) ($quote['delivery_fee'] ?? 0),
                'return_delivery_type' => $validated['return_delivery_type'] ?? Rental::DELIVERY_DEPOT,
                'return_delivery_address' => $validated['return_delivery_address'] ?? null,
                'return_delivery_fee' => (float) ($quote['return_delivery_fee'] ?? 0),
                'one_way_fee_amount' => (float) ($hydrated['one_way_fee_amount'] ?? 0),
                'driver_fee_amount' => (float) ($quote['driver_fee_amount'] ?? 0),
                'insurance_package_id' => $validated['insurance_package_id'] ?? null,
                'fuel_policy_notes' => $validated['fuel_policy_notes'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        if ($initialStatus === Rental::STATUS_CONFIRMED) {
            $confirmation->confirm($rental->fresh(), [
                'confirmed_by' => $request->user()?->id,
            ]);
            $accounting->issueDraftInvoices($rental->fresh());
        }

        $freshRental = $rental->fresh(['vehicle', 'partner', 'insurancePackage']);

        return response()->json([
            'success' => true,
            'message' => 'Reservasi rental berhasil dibuat.',
            'data' => [
                'rental_id' => $freshRental->id,
                'booking_number' => $freshRental->code,
                'status' => $freshRental->status,
                'customer' => [
                    'id' => $partner->id,
                    'name' => $partner->name,
                    'phone' => $partner->phone ?? $partner->mobile,
                    'email' => $partner->email,
                ],
                'vehicle' => [
                    'id' => $vehicle->id,
                    'name' => $vehicle->name,
                    'plate_number' => $vehicle->plate_number ?? $vehicle->license_plate ?? '-',
                    'rental_class' => $vehicle->rental_class,
                ],
                'financials' => [
                    'total_amount' => (float) $freshRental->total_amount,
                    'deposit_required' => (float) $freshRental->deposit_amount,
                    'status' => $freshRental->status,
                ],
                'direct_handover_ready' => $freshRental->status === Rental::STATUS_CONFIRMED,
            ],
        ], 201);
    }

    /**
     * Collect payment on-spot by field operator (Cash, EDC, QRIS, Transfer).
     */
    public function collectPayment(
        StaffCollectPaymentRequest $request,
        Rental $rental,
        RentalAccountingService $accounting,
        RentalConfirmationService $confirmation
    ): JsonResponse {
        $validated = $request->validated();
        $amount = (float) $validated['amount'];
        $paymentType = (string) $validated['payment_type'];
        $method = (string) $validated['payment_method'];

        $rental->loadMissing(['partner', 'vehicle']);

        if ($rental->status === Rental::STATUS_CANCELLED) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'RENTAL_CANCELLED',
                    'message' => 'Tidak dapat menerima pembayaran untuk pesanan yang telah dibatalkan.',
                ],
            ], 422);
        }

        if ($paymentType === 'deposit') {
            $rental->update([
                'deposit_payment_method' => $method,
                'deposit_company_bank_account_id' => $validated['company_bank_account_id'] ?? null,
                'deposit_proof_status' => Rental::PROOF_APPROVED,
                'deposit_proof_approved_at' => now(),
                'deposit_proof_approved_by' => $request->user()?->id,
            ]);

            $accounting->receiveDeposit($rental->fresh(), [
                'payment_method' => $method,
                'company_bank_account_id' => $validated['company_bank_account_id'] ?? null,
            ]);

            if (in_array($rental->status, [Rental::STATUS_PENDING, Rental::STATUS_PENDING_RESERVED, Rental::STATUS_DRAFT], true)) {
                $confirmation->confirm($rental->fresh(), [
                    'confirmed_by' => $request->user()?->id,
                ]);
            }
        } else {
            // Full or installment payment
            $accounting->issueDraftInvoices($rental->fresh());

            if ((float) $rental->deposit_amount > 0 && $rental->deposit_received_at === null) {
                $accounting->receiveDeposit($rental->fresh(), [
                    'payment_method' => $method,
                    'company_bank_account_id' => $validated['company_bank_account_id'] ?? null,
                ]);
            }

            // Allocate against unpaid invoices
            $invoices = Invoice::query()
                ->where('partner_id', $rental->partner_id)
                ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
                ->whereHas('lines', function ($q) use ($rental): void {
                    $q->where('description', 'like', '%'.$rental->code.'%');
                })
                ->get();

            $remainingAmount = $amount;
            $allocations = [];

            foreach ($invoices as $inv) {
                if ($remainingAmount <= 0) {
                    break;
                }
                $invBalance = max(0.0, (float) $inv->total - (float) ($inv->amount_paid ?? 0));
                if ($invBalance <= 0) {
                    continue;
                }
                $allocate = min($remainingAmount, $invBalance);
                $allocations[] = [
                    'invoice_id' => $inv->id,
                    'amount' => $allocate,
                ];
                $remainingAmount -= $allocate;
            }

            if ($allocations !== [] && Schema::hasTable('payments') && class_exists(PaymentRecorder::class)) {
                try {
                    PaymentRecorder::record([
                        'partner_id' => $rental->partner_id,
                        'payment_date' => now()->toDateString(),
                        'amount' => $amount,
                        'type' => Payment::TYPE_SETTLEMENT,
                        'method' => $method,
                        'company_bank_account_id' => $validated['company_bank_account_id'] ?? null,
                        'reference_number' => $validated['reference_number'] ?? 'POS-'.strtoupper(Str::random(6)),
                        'notes' => $validated['notes'] ?? "Pembayaran kasir offline {$rental->code}",
                        'recorded_by' => $request->user()?->id,
                        'allocations' => $allocations,
                    ]);
                } catch (Throwable) {
                    // Fallback to updating invoices directly if allocation mismatch
                    foreach ($allocations as $alloc) {
                        $inv = Invoice::find($alloc['invoice_id']);
                        if ($inv) {
                            $newPaid = (float) ($inv->amount_paid ?? 0) + (float) $alloc['amount'];
                            $inv->update([
                                'amount_paid' => $newPaid,
                                'status' => $newPaid >= (float) $inv->total ? Invoice::STATUS_PAID : Invoice::STATUS_PARTIALLY_PAID,
                                'paid_at' => $newPaid >= (float) $inv->total ? now() : null,
                            ]);
                        }
                    }
                }
            }

            if (in_array($rental->status, [Rental::STATUS_PENDING, Rental::STATUS_PENDING_RESERVED, Rental::STATUS_DRAFT], true)) {
                $confirmation->confirm($rental->fresh(), [
                    'confirmed_by' => $request->user()?->id,
                ]);
            }
        }

        $freshRental = $rental->fresh();

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil dicatat.',
            'data' => [
                'rental_id' => $freshRental->id,
                'booking_number' => $freshRental->code,
                'status' => $freshRental->status,
                'collected_amount' => $amount,
                'payment_method' => $method,
                'payment_type' => $paymentType,
                'direct_handover_ready' => in_array($freshRental->status, [Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE], true),
            ],
        ]);
    }
}
