<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Http\Requests\Public\CancelPublicRentalBookingRequest;
use Modules\Rental\Http\Requests\Public\StorePublicRentalBookingRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Rental\Models\RentalInsurancePackage;
use Modules\Rental\Support\MobileRentalBookingService;
use Modules\Rental\Support\RentalBookingPolicy;
use Modules\Rental\Support\RentalDepositProofNotifier;
use Modules\Rental\Support\RentalExtensionService;
use Modules\Rental\Support\RentalHandoverMedia;
use Modules\Rental\Support\RentalInvoiceService;
use Modules\Rental\Support\RentalLocationHydrator;
use Modules\Rental\Support\RentalPassengerDocMedia;
use Modules\Rental\Support\RentalPlateMasker;
use Modules\Rental\Support\RentalRateResolver;
use Modules\Shuttle\Support\PassengerOtpService;
use Throwable;

/**
 * Public customer self-booking for rental (PWA). Tenant resolved by domain; no staff auth.
 */
class PublicRentalBookingController extends Controller
{
    public function search(Request $request, RentalRateResolver $rates): Response
    {
        $this->ensureAvailable();

        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'period_type' => ['nullable', 'string', 'in:daily,weekly,monthly'],
            'pickup_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'rental_class' => ['nullable', 'string', 'in:'.implode(',', VehicleRentalClass::values())],
        ]);

        $start = $validated['start_date'] ?? now()->toDateString();
        $end = $validated['end_date'] ?? now()->addDays(2)->toDateString();
        $periodType = $validated['period_type'] ?? 'daily';
        $searched = true;

        $vehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->when($validated['rental_class'] ?? null, fn ($q, $class) => $q->where('rental_class', $class))
            ->orderBy('name')
            ->get()
            ->filter(function (Vehicle $vehicle) use ($start, $end, $periodType, $rates): bool {
                if (Rental::vehicleAvailabilityReasons($vehicle, $start, $end) !== []) {
                    return false;
                }

                // Only list units that can actually be quoted/booked for this period.
                return $rates->suggest($vehicle, $start, $end, $periodType) !== null;
            })
            ->values()
            ->map(fn (Vehicle $vehicle): array => $this->vehicleCard($vehicle, $rates, $start, $end, $periodType));

        return Inertia::render('Modules/Rental/Public/Search', [
            'brand' => $this->brand(),
            'filters' => [
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => $periodType,
                'pickup_location_id' => $validated['pickup_location_id'] ?? null,
                'return_location_id' => $validated['return_location_id'] ?? ($validated['pickup_location_id'] ?? null),
                'rental_class' => $validated['rental_class'] ?? null,
            ],
            'classes' => collect(VehicleRentalClass::values())
                ->map(fn (string $value): array => [
                    'value' => $value,
                    'label' => match ($value) {
                        VehicleRentalClass::ECONOMY => 'Economy',
                        VehicleRentalClass::MPV => 'MPV',
                        VehicleRentalClass::SUV => 'SUV',
                        VehicleRentalClass::PREMIUM => 'Premium',
                        VehicleRentalClass::OTHER => 'Lainnya',
                        default => VehicleRentalClass::label($value) ?: ucfirst($value),
                    },
                ])
                ->values()
                ->all(),
            'locations' => app(RentalLocationHydrator::class)->depotOptions(),
            'vehicles' => $vehicles,
            'searched' => $searched,
            'hold_ttl_minutes' => app(RentalBookingPolicy::class)->pendingReservedTtlMinutes(),
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function showVehicle(Request $request, Vehicle $vehicle, MobileRentalBookingService $bookings): Response
    {
        $this->ensureAvailable();
        abort_unless($vehicle->status === Vehicle::STATUS_ACTIVE, 404);

        $validated = $request->validate([
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['nullable', 'string', 'in:daily,weekly,monthly'],
            'pickup_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
        ]);

        $periodType = $validated['period_type'] ?? 'daily';
        $quote = $bookings->quote([
            'vehicle_id' => $vehicle->id,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'period_type' => $periodType,
            'pickup_location_id' => $validated['pickup_location_id'] ?? null,
            'return_location_id' => $validated['return_location_id'] ?? null,
            'insurance_package_id' => $validated['insurance_package_id'] ?? null,
        ]);

        return Inertia::render('Modules/Rental/Public/VehicleShow', [
            'brand' => $this->brand(),
            'vehicle' => $this->vehicleDetail($vehicle),
            'seo' => $this->vehicleSeo($request, $vehicle, $quote),
            'filters' => [
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'period_type' => $periodType,
                'pickup_location_id' => $validated['pickup_location_id'] ?? null,
                'return_location_id' => $validated['return_location_id'] ?? ($validated['pickup_location_id'] ?? null),
                'insurance_package_id' => $validated['insurance_package_id'] ?? null,
            ],
            'quote' => $this->quotePayload($quote),
            'locations' => app(RentalLocationHydrator::class)->depotOptions(),
            'insurance_packages' => RentalInsurancePackage::query()
                ->where('is_active', true)
                ->where('period_type', $periodType)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(['id', 'code', 'name', 'amount', 'description'])
                ->map(fn (RentalInsurancePackage $package): array => [
                    'id' => $package->id,
                    'code' => $package->code,
                    'name' => $package->name,
                    'amount' => (float) $package->amount,
                    'description' => $package->description,
                ])
                ->all(),
            'hold_ttl_minutes' => app(RentalBookingPolicy::class)->pendingReservedTtlMinutes(),
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function quote(Request $request, MobileRentalBookingService $bookings): JsonResponse
    {
        $this->ensureAvailable();

        $data = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'string', 'in:daily,weekly,monthly'],
            'pickup_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
        ]);

        return response()->json([
            'quote' => $this->quotePayload($bookings->quote($data)),
        ]);
    }

    public function store(
        StorePublicRentalBookingRequest $request,
        MobileRentalBookingService $bookings,
        PassengerOtpService $otp,
    ): RedirectResponse {
        $this->ensureAvailable();

        $data = $request->validated();

        if (! $this->assertOtp($otp, $data['booker_phone'], $data['otp_code'])) {
            return back()->withErrors(['otp_code' => __('rental.public.otp_invalid')])->withInput();
        }

        $phone = $otp->normalize($data['booker_phone']);

        try {
            $rental = $bookings->create($phone, $data, Rental::CHANNEL_WEB);
        } catch (Throwable $e) {
            $message = $e instanceof \Illuminate\Validation\ValidationException
                ? collect($e->errors())->flatten()->first()
                : $e->getMessage();

            return back()->with('error', $message ?: __('rental.public.quote_unavailable'))->withInput();
        }

        return redirect()
            ->route('book.rental.booking.show', $rental->public_token)
            ->with('success', __('rental.public.booking_created'));
    }

    public function sendOtp(Request $request, PassengerOtpService $otp): JsonResponse|RedirectResponse
    {
        $this->ensureAvailable();

        $data = $request->validate([
            'booker_phone' => ['required', 'string', 'max:32'],
        ]);

        $phone = $otp->normalize($data['booker_phone']);
        $alreadyVerified = $otp->isVerified($phone);

        if ($alreadyVerified) {
            if ($request->wantsJson()) {
                return response()->json([
                    'ok' => true,
                    'already_verified' => true,
                    'message' => __('rental.public.whatsapp_verified'),
                ]);
            }

            return back()->with('success', __('rental.public.whatsapp_verified'))->with('already_verified', true);
        }

        $code = $otp->send($data['booker_phone']);

        if ($request->wantsJson()) {
            $payload = ['ok' => true, 'message' => __('rental.public.otp_sent')];
            if (\App\Support\SystemMode::shouldExposeDebugOtp()) {
                $payload['debug_code'] = $code;
            }

            return response()->json($payload);
        }

        $redirect = back()->with('success', __('rental.public.otp_sent'));

        if (\App\Support\SystemMode::shouldExposeDebugOtp()) {
            $redirect->with('debug_otp', $code);
        }

        return $redirect;
    }

    public function show(string $token): Response
    {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        return Inertia::render('Modules/Rental/Public/Booking', [
            'brand' => $this->brand(),
            'booking' => $this->bookingPayload($rental),
            'gateway_available' => $this->gatewayAvailable(),
            'company_bank_accounts' => $this->companyBankAccounts(),
        ]);
    }

    /**
     * Landing page after returning from the payment gateway (Midtrans "finish"
     * redirect). Display-only: the authoritative status change happens via the
     * webhook, so the query-string hint here only shapes the message. Server
     * state (deposit received) wins when it already confirms success.
     */
    public function paymentResult(Request $request, string $token, string $intent = 'deposit'): Response
    {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);
        $intent = in_array($intent, ['deposit', 'invoice'], true) ? $intent : 'deposit';
        $txn = (string) $request->query('transaction_status', '');

        $status = match (true) {
            in_array($txn, ['settlement', 'capture'], true) => 'success',
            $intent === 'deposit' && $rental->isDepositReceived() => 'success',
            $txn === 'pending' => 'pending',
            in_array($txn, ['deny', 'cancel', 'expire', 'failure'], true) => 'failed',
            default => 'pending',
        };

        return Inertia::render('Modules/Rental/Public/PaymentResult', [
            'brand' => $this->brand(),
            'status' => $status,
            'intent' => $intent,
            'booking' => [
                'code' => $rental->code,
                'public_token' => $rental->public_token,
            ],
            'booking_url' => route('book.rental.booking.show', $rental->public_token),
        ]);
    }

    public function verifyOtp(Request $request, string $token, PassengerOtpService $otp): JsonResponse
    {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $data = $request->validate([
            'booker_phone' => ['required', 'string', 'max:32'],
            'otp_code' => ['required', 'string', 'size:6'],
        ]);

        if (! $otp->verify($data['booker_phone'], $data['otp_code'])) {
            return response()->json([
                'ok' => false,
                'message' => __('rental.public.otp_invalid'),
            ], 422);
        }

        $normalized = $otp->normalize($data['booker_phone']);
        if ($rental->booker_phone !== null && $rental->booker_phone !== $normalized) {
            return response()->json([
                'ok' => false,
                'message' => __('rental.public.forbidden'),
            ], 403);
        }

        return response()->json([
            'ok' => true,
            'message' => __('rental.public.whatsapp_verify_success'),
        ]);
    }

    public function payDeposit(Request $request, string $token, PassengerOtpService $otp): RedirectResponse
    {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
        ]);

        $bookerPhone = $data['booker_phone'] ?? $phone;
        $otpCode = $data['otp_code'] ?? '';

        if (! $this->assertOtp($otp, $bookerPhone, $otpCode)) {
            return back()->withErrors(['otp_code' => __('rental.public.otp_invalid')]);
        }

        $normalized = $otp->normalize($bookerPhone);
        if ($rental->booker_phone !== null && $rental->booker_phone !== $normalized) {
            return back()->with('error', __('rental.public.forbidden'));
        }

        if ($rental->isDepositReceived()) {
            return back()->with('error', __('rental.public.deposit_already_received'));
        }

        if (! in_array($rental->status, [
            Rental::STATUS_DRAFT,
            Rental::STATUS_PENDING,
            Rental::STATUS_PENDING_RESERVED,
            Rental::STATUS_CONFIRMED,
        ], true)) {
            return back()->with('error', __('rental.public.pay_status_invalid'));
        }

        if (! $this->gatewayAvailable()) {
            return back()->with('error', __('rental.public.gateway_unavailable'));
        }

        try {
            $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
                ->createRentalDepositCharge(
                    $rental->loadMissing('partner'),
                    '/book/rental/booking/'.$rental->public_token.'/finish/deposit',
                );

            return redirect()->away($charge->redirect_url);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function uploadDepositProof(
        Request $request,
        string $token,
        PassengerOtpService $otp,
        RentalPassengerDocMedia $docMedia,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'company_bank_account_id' => ['nullable'],
            'deposit_proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        if ($guardResponse = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $guardResponse;
        }

        $isAlreadyPaid = (float) $rental->deposit_amount > 0 ? $rental->isDepositReceived() : $rental->status === Rental::STATUS_CONFIRMED;
        if ($isAlreadyPaid) {
            return back()->with('error', __('rental.public.deposit_already_received'));
        }

        $proofPath = $docMedia->storeDepositProof($request->file('deposit_proof'), $rental->id);

        $bankAccountId = ! empty($data['company_bank_account_id']) ? (int) $data['company_bank_account_id'] : null;

        $rental->update([
            'deposit_payment_method' => 'transfer',
            'deposit_company_bank_account_id' => $bankAccountId,
            'deposit_proof_path' => $proofPath,
            'deposit_proof_uploaded_at' => now(),
            'deposit_proof_status' => Rental::PROOF_PENDING,
            'deposit_proof_rejected_reason' => null,
        ]);

        RentalDepositProofNotifier::notifyPendingReview($rental);

        return back()->with('success', __('rental.public.deposit_proof_uploaded'));
    }

    public function cancel(
        CancelPublicRentalBookingRequest $request,
        string $token,
        MobileRentalBookingService $bookings,
        PassengerOtpService $otp,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);
        $data = $request->validated();

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        try {
            $bookings->cancel($rental, $data['cancelled_reason']);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', __('rental.public.booking_cancelled'));
    }

    public function payInvoice(Request $request, string $token, PassengerOtpService $otp): RedirectResponse
    {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'invoice_id' => ['required', 'integer'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        if (! $this->gatewayAvailable()) {
            return back()->with('error', __('rental.public.gateway_unavailable'));
        }

        $invoice = app(RentalInvoiceService::class)
            ->invoicesFor($rental)
            ->firstWhere('id', (int) $data['invoice_id']);

        if ($invoice === null) {
            return back()->with('error', __('rental.public.invoice_not_found'));
        }

        try {
            $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
                ->createInvoiceCharge($invoice, '/book/rental/booking/'.$rental->public_token.'/finish/invoice');

            return redirect()->away($charge->redirect_url);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function requestExtend(
        Request $request,
        string $token,
        PassengerOtpService $otp,
        RentalExtensionService $extensions,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'new_end_date' => ['required', 'date', 'after:'.$rental->end_date?->toDateString()],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        try {
            $extensions->requestFromPassenger(
                $rental,
                $data['new_end_date'],
                Rental::CHANNEL_WEB,
                $data['notes'] ?? null,
            );
        } catch (Throwable $e) {
            $message = $e instanceof \Illuminate\Validation\ValidationException
                ? collect($e->errors())->flatten()->first()
                : $e->getMessage();

            return back()->with('error', $message);
        }

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', __('rental.public.extend_requested'));
    }

    public function uploadDocuments(
        Request $request,
        string $token,
        PassengerOtpService $otp,
        RentalPassengerDocMedia $docs,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'ktp' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'sim' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        if (! $request->hasFile('ktp') && ! $request->hasFile('sim')) {
            return back()->withErrors(['ktp' => __('rental.public.documents_required')]);
        }

        $updates = [];
        if ($request->hasFile('ktp')) {
            $updates['passenger_ktp_path'] = $docs->storeUpload($request->file('ktp'), $rental->id, 'ktp');
        }
        if ($request->hasFile('sim')) {
            $updates['passenger_sim_path'] = $docs->storeUpload($request->file('sim'), $rental->id, 'sim');
        }

        $rental->update($updates);

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', __('rental.public.documents_uploaded'));
    }

    public function requestPickup(
        Request $request,
        string $token,
        PassengerOtpService $otp,
        RentalHandoverMedia $handoverMedia,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        abort_if(
            $rental->status !== Rental::STATUS_CONFIRMED,
            422,
            __('rental.public.pickup_confirmed_only'),
        );

        if ((float) $rental->deposit_amount > 0 && ! $rental->isDepositReceived()) {
            return back()->with('error', __('rental.public.pickup_deposit_unsettled'));
        }

        if ((float) $rental->deposit_amount <= 0) {
            $paymentSummary = app(RentalInvoiceService::class)->paymentSummary($rental);
            if ($paymentSummary['balance_due'] > 0 || in_array($paymentSummary['status'], ['unpaid', 'partial', 'draft'], true)) {
                return back()->with('error', __('rental.public.pickup_prepayment_required'));
            }
        }

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'terms_agreed' => ['required', 'boolean', 'accepted'],
            'customer_signature' => ['required', 'string', 'starts_with:data:image/'],
            'pickup_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        $signaturePath = $handoverMedia->storeSignature($data['customer_signature'], 'rental/pickup-signatures');

        $rental->update([
            'pickup_requested_at' => now(),
            'pickup_request_status' => 'pending',
            'pickup_customer_signature_path' => $signaturePath,
            'pickup_terms_agreed' => true,
            'pickup_notes' => $data['pickup_notes'] ?? null,
        ]);

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', __('rental.public.pickup_requested'));
    }

    public function history(Request $request, PassengerOtpService $otp): Response
    {
        $this->ensureAvailable();

        $phone = $request->string('phone')->toString();
        $otpCode = $request->string('otp_code')->toString();
        $bookings = [];

        if ($phone !== '' && $otpCode !== '' && $this->assertOtp($otp, $phone, $otpCode)) {
            $normalized = $otp->normalize($phone);
            $bookings = Rental::query()
                ->whereIn('channel', Rental::passengerChannels())
                ->where('booker_phone', $normalized)
                ->with(['vehicle', 'insurancePackage', 'pickupLocation', 'returnLocation'])
                ->latest()
                ->limit(20)
                ->get()
                ->map(fn (Rental $rental): array => $this->bookingPayload($rental))
                ->all();
        }

        return Inertia::render('Modules/Rental/Public/History', [
            'brand' => $this->brand(),
            'phone' => $phone,
            'bookings' => $bookings,
        ]);
    }

    private function ensureAvailable(): void
    {
        if (! tenancy()->initialized && ! app()->runningUnitTests()) {
            abort(404);
        }

        if (! Modules::available('rental') || ! Schema::hasTable('rentals')) {
            abort(404);
        }

        if (Setting::getValue('rental.passenger_booking_enabled', '0') !== '1') {
            abort(404, __('rental.public.disabled'));
        }
    }

    /**
     * @return array{
     *     name: string,
     *     color: string,
     *     secondary_color: string,
     *     support_phone: string|null,
     *     logo_url: string|null,
     *     hero_title: string|null,
     *     hero_subtitle: string|null,
     *     hero_image_url: string|null,
     *     social: array{instagram: string|null, facebook: string|null, tiktok: string|null},
     *     business_hours: string|null
     * }
     */
    private function brand(): array
    {
        $storefront = \Modules\Rental\Support\RentalStorefrontSettings::all();

        $nullable = static fn (string $value): ?string => $value !== '' ? $value : null;

        return [
            'name' => $storefront['brand_name'] !== ''
                ? $storefront['brand_name']
                : (string) \App\Models\Setting::getValue('general.site_name', config('app.name', 'Rental')),
            'color' => $storefront['primary_color'],
            'secondary_color' => $storefront['secondary_color'],
            'support_phone' => $nullable($storefront['support_phone']),
            'logo_url' => $nullable($storefront['logo_url']),
            'hero_title' => $nullable($storefront['hero_title']),
            'hero_subtitle' => $nullable($storefront['hero_subtitle']),
            'hero_image_url' => $nullable($storefront['hero_image_url']),
            'social' => [
                'instagram' => $nullable($storefront['social_instagram']),
                'facebook' => $nullable($storefront['social_facebook']),
                'tiktok' => $nullable($storefront['social_tiktok']),
            ],
            'business_hours' => $nullable($storefront['business_hours']),
        ];
    }

    private function gatewayAvailable(): bool
    {
        return class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable();
    }

    private function assertOtp(PassengerOtpService $otp, string $phone, ?string $code): bool
    {
        if ($otp->isVerified($phone)) {
            return true;
        }

        if ($code === null || $code === '') {
            return false;
        }

        return $otp->verify($phone, $code);
    }

    private function guardBooker(
        PassengerOtpService $otp,
        Rental $rental,
        ?string $phone,
        ?string $code,
    ): ?RedirectResponse {
        $effectivePhone = $phone ?: $rental->booker_phone;
        if ($effectivePhone === null) {
            return back()->with('error', __('rental.public.forbidden'));
        }

        if (! $this->assertOtp($otp, $effectivePhone, $code)) {
            return back()->withErrors(['otp_code' => __('rental.public.otp_invalid')]);
        }

        $normalized = $otp->normalize($effectivePhone);
        if ($rental->booker_phone !== null && $rental->booker_phone !== $normalized) {
            return back()->with('error', __('rental.public.forbidden'));
        }

        return null;
    }

    private function findPassengerBooking(string $token): Rental
    {
        return Rental::query()
            ->where('public_token', $token)
            ->whereIn('channel', Rental::passengerChannels())
            ->with(['vehicle', 'partner', 'insurancePackage', 'pickupLocation', 'returnLocation'])
            ->firstOrFail();
    }

    /**
     * @return list<array{id: int, name: string, address: string|null, city: string|null}>
     */
    private function locationOptions(): array
    {
        return app(RentalLocationHydrator::class)->depotOptions();
    }

    /**
     * @return array<string, mixed>
     */
    private function vehicleCard(
        Vehicle $vehicle,
        RentalRateResolver $rates,
        string $start,
        string $end,
        string $periodType,
    ): array {
        $rate = $rates->suggest($vehicle, $start, $end, $periodType);

        return [
            'id' => $vehicle->id,
            'name' => $vehicle->name,
            'plate_number' => RentalPlateMasker::mask((string) $vehicle->plate_number),
            'rental_class' => $vehicle->rental_class,
            'rental_class_label' => $vehicle->rental_class
                ? VehicleRentalClass::label((string) $vehicle->rental_class)
                : null,
            'capacity_seats' => $vehicle->capacity_seats,
            'color' => $vehicle->color,
            'model_year' => $vehicle->model_year,
            'photo_url' => $vehicle->photo_url,
            'from_price' => $rate ? (float) $rate->rate_per_period : null,
            'deposit_amount' => $rate && $rate->deposit_amount !== null ? (float) $rate->deposit_amount : null,
        ];
    }

    /**
     * Per-vehicle SEO payload (meta + Open Graph + JSON-LD) for the public
     * detail page, so listings are indexable and share previews render.
     *
     * @param  array<string, mixed>  $quote
     * @return array<string, mixed>
     */
    private function vehicleSeo(Request $request, Vehicle $vehicle, array $quote): array
    {
        $brand = $this->brand();
        $price = $quote['rate_per_period'] ?? null;
        $classLabel = $vehicle->rental_class
            ? VehicleRentalClass::label((string) $vehicle->rental_class)
            : null;

        $facts = array_filter([
            $classLabel,
            $vehicle->capacity_seats ? $vehicle->capacity_seats.' kursi' : null,
            $vehicle->fuel_type,
            $price !== null ? 'mulai Rp '.number_format((float) $price, 0, ',', '.').'/hari' : null,
        ]);

        $description = 'Sewa '.$vehicle->name.' di '.$brand['name'].'. '
            .implode(' · ', $facts)
            .'. Booking online cepat dengan verifikasi WhatsApp.';

        $jsonLd = array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Car',
            'name' => $vehicle->name,
            'image' => $vehicle->photo_url ? [$vehicle->photo_url] : null,
            'description' => $description,
            'vehicleSeatingCapacity' => $vehicle->capacity_seats,
            'modelDate' => $vehicle->model_year,
            'brand' => $vehicle->brand ? ['@type' => 'Brand', 'name' => $vehicle->brand] : null,
            'offers' => $price !== null ? [
                '@type' => 'Offer',
                'price' => (string) (int) $price,
                'priceCurrency' => 'IDR',
                'availability' => 'https://schema.org/InStock',
                'url' => $request->fullUrl(),
            ] : null,
        ], fn ($value): bool => $value !== null);

        return [
            'title' => $vehicle->name.' — Sewa di '.$brand['name'],
            'description' => $description,
            'image' => $vehicle->photo_url,
            'url' => $request->fullUrl(),
            'json_ld' => $jsonLd,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function vehicleDetail(Vehicle $vehicle): array
    {
        return [
            'id' => $vehicle->id,
            'name' => $vehicle->name,
            'plate_number' => RentalPlateMasker::mask((string) $vehicle->plate_number),
            'type' => $vehicle->type,
            'rental_class' => $vehicle->rental_class,
            'rental_class_label' => $vehicle->rental_class
                ? VehicleRentalClass::label((string) $vehicle->rental_class)
                : null,
            'brand' => $vehicle->brand,
            'model_year' => $vehicle->model_year,
            'color' => $vehicle->color,
            'capacity_seats' => $vehicle->capacity_seats,
            'fuel_type' => $vehicle->fuel_type,
            'photo_url' => $vehicle->photo_url,
        ];
    }

    /**
     * @param  array{
     *     available: bool,
     *     reasons: list<string>,
     *     total_periods: int,
     *     rate_per_period: float|null,
     *     deposit_amount: float|null,
     *     base_amount: float|null,
     *     one_way_fee_amount: float|null,
     *     insurance_amount: float|null,
     *     total_amount: float|null,
     *     min_periods: int|null
     * }  $quote
     * @return array<string, mixed>
     */
    private function quotePayload(array $quote): array
    {
        return [
            'available' => $quote['available'],
            'reasons' => $quote['reasons'],
            'total_periods' => $quote['total_periods'],
            'rate_per_period' => $quote['rate_per_period'],
            'deposit_amount' => $quote['deposit_amount'],
            'base_amount' => $quote['base_amount'],
            'one_way_fee_amount' => $quote['one_way_fee_amount'],
            'insurance_amount' => $quote['insurance_amount'],
            'total_amount' => $quote['total_amount'],
            'min_periods' => $quote['min_periods'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function bookingPayload(Rental $rental): array
    {
        $paymentPayload = $this->paymentPayload($rental);
        $upfrontPaid = (float) $rental->deposit_amount > 0
            ? $rental->isDepositReceived()
            : ($rental->deposit_proof_status === Rental::PROOF_APPROVED || ($paymentPayload['balance_due'] <= 0 && ! in_array($paymentPayload['status'], ['unpaid', 'partial', 'draft'], true)));

        $phoneVerified = false;
        if ($rental->booker_phone !== null) {
            $phoneVerified = app(PassengerOtpService::class)->isVerified($rental->booker_phone);
        }

        return [
            'code' => $rental->code,
            'public_token' => $rental->public_token,
            'status' => $rental->status,
            'channel' => $rental->channel,
            'booker_phone' => $rental->booker_phone,
            'booker_phone_verified' => $phoneVerified,
            'start_date' => $rental->start_date?->toDateString(),
            'end_date' => $rental->end_date?->toDateString(),
            'period_type' => $rental->period_type,
            'total_periods' => (int) $rental->total_periods,
            'rate_per_period' => (float) $rental->rate_per_period,
            'base_amount' => (float) $rental->base_amount,
            'deposit_amount' => (float) $rental->deposit_amount,
            'deposit_received' => $rental->isDepositReceived(),
            'total_amount' => (float) $rental->total_amount,
            'pickup_location' => $rental->pickup_location ?? $rental->pickupLocation?->name,
            'return_location' => $rental->return_location ?? $rental->returnLocation?->name,
            'reserved_until' => $rental->reserved_until?->toIso8601String(),
            'cancelled_reason' => $rental->cancelled_reason,
            'vehicle' => $rental->vehicle ? [
                'id' => $rental->vehicle->id,
                'name' => $rental->vehicle->name,
                'plate_number' => (string) $rental->vehicle->plate_number,
                'photo_url' => $rental->vehicle->photo_url,
            ] : null,
            'insurance_package' => $rental->insurancePackage ? [
                'id' => $rental->insurancePackage->id,
                'name' => $rental->insurancePackage->name,
                'amount' => (float) $rental->insurancePackage->amount,
            ] : null,
            'can_pay_deposit' => ((float) $rental->deposit_amount > 0 ? ! $rental->isDepositReceived() : $rental->status !== Rental::STATUS_CONFIRMED)
                && in_array($rental->status, [
                    Rental::STATUS_DRAFT,
                    Rental::STATUS_PENDING,
                    Rental::STATUS_PENDING_RESERVED,
                    Rental::STATUS_CONFIRMED,
                ], true),
            'cancel' => app(RentalBookingPolicy::class)->passengerCancelAssessment($rental),
            'payment' => $paymentPayload,
            'can_request_extend' => $rental->status === Rental::STATUS_ACTIVE,
            'extend_request' => $this->pendingExtendRequestPayload($rental),
            'documents' => [
                'ktp_uploaded' => filled($rental->passenger_ktp_path),
                'sim_uploaded' => filled($rental->passenger_sim_path),
                'ktp_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->passenger_ktp_path),
                'sim_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->passenger_sim_path),
            ],
            'deposit_proof' => [
                'path' => $rental->deposit_proof_path,
                'url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->deposit_proof_path),
                'status' => $rental->deposit_proof_status,
                'uploaded_at' => $rental->deposit_proof_uploaded_at?->toIso8601String(),
                'rejected_reason' => $rental->deposit_proof_rejected_reason,
                'bank_account_id' => $rental->deposit_company_bank_account_id,
            ],
            'pickup_request' => [
                'requested_at' => $rental->pickup_requested_at?->toIso8601String(),
                'status' => $rental->pickup_request_status,
                'customer_signature_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->pickup_customer_signature_path),
                'terms_agreed' => (bool) $rental->pickup_terms_agreed,
                'notes' => $rental->pickup_notes,
                'can_request' => $rental->status === Rental::STATUS_CONFIRMED && empty($rental->pickup_requested_at) && $upfrontPaid,
            ],
        ];
    }

    /**
     * @return array{
     *     status: string,
     *     balance_due: float,
     *     can_pay_balance: bool,
     *     invoices: list<array{id: int, code: string, status: string, balance: float, total: float}>
     * }
     */
    private function paymentPayload(Rental $rental): array
    {
        $summary = app(RentalInvoiceService::class)->paymentSummary($rental);
        $payable = collect($summary['invoices'])
            ->filter(fn (array $invoice): bool => in_array($invoice['status'], [
                Invoice::STATUS_ISSUED,
                Invoice::STATUS_PARTIALLY_PAID,
            ], true) && $invoice['balance'] > 0)
            ->map(fn (array $invoice): array => [
                'id' => $invoice['id'],
                'code' => $invoice['code'],
                'status' => $invoice['status'],
                'balance' => $invoice['balance'],
                'total' => $invoice['total'],
            ])
            ->values()
            ->all();

        return [
            'status' => $summary['status'],
            'balance_due' => (float) $summary['balance_due'],
            'can_pay_balance' => $payable !== [] && $this->gatewayAvailable(),
            'invoices' => $payable,
        ];
    }

    /**
     * @return array{id: int, requested_end_date: string, estimated_periods: int, estimated_amount: float, status: string}|null
     */
    private function pendingExtendRequestPayload(Rental $rental): ?array
    {
        $request = RentalExtensionRequest::query()
            ->where('rental_id', $rental->id)
            ->where('status', RentalExtensionRequest::STATUS_PENDING)
            ->latest('id')
            ->first();

        if ($request === null) {
            return null;
        }

        return [
            'id' => $request->id,
            'requested_end_date' => $request->requested_end_date?->toDateString(),
            'estimated_periods' => (int) $request->estimated_periods,
            'estimated_amount' => (float) $request->estimated_amount,
            'status' => $request->status,
        ];
    }

    /**
     * @return list<array{id: int, name: string, bank_name: string|null, account_number: string|null, account_holder: string|null}>
     */
    private function companyBankAccounts(): array
    {
        if (! class_exists(\Modules\Accounting\Models\CompanyBankAccount::class)) {
            return [];
        }

        return \Modules\Accounting\Models\CompanyBankAccount::query()
            ->where('is_active', true)
            ->where('kind', \Modules\Accounting\Models\CompanyBankAccount::KIND_BANK)
            ->orderBy('name')
            ->get(['id', 'name', 'bank_name', 'account_number', 'account_holder'])
            ->map(fn ($acc): array => [
                'id' => (int) $acc->id,
                'name' => (string) $acc->name,
                'bank_name' => $acc->bank_name,
                'account_number' => $acc->account_number,
                'account_holder' => $acc->account_holder,
            ])
            ->values()
            ->all();
    }
}
