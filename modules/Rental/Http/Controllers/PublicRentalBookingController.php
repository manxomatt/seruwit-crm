<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Modules\Facades\Modules;
use App\Support\CentralAiSettings;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\AI\Contracts\VisionInspectionServiceInterface;
use Modules\Rental\Http\Requests\Public\CancelPublicRentalBookingRequest;
use Modules\Rental\Http\Requests\Public\StorePublicRentalBookingRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalAiInspection;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Rental\Models\RentalInsurancePackage;
use Modules\Rental\Support\MobileRentalBookingService;
use Modules\Rental\Support\PublicRentalCatalog;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalAddonCatalog;
use Modules\Rental\Support\RentalBookingPolicy;
use Modules\Rental\Support\RentalDepositProofNotifier;
use Modules\Rental\Support\RentalExtensionService;
use Modules\Rental\Support\RentalGeneralSettings;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalHandoverMedia;
use Modules\Rental\Support\RentalInvoiceService;
use Modules\Rental\Support\RentalLifecycleGate;
use Modules\Rental\Support\RentalLocationHydrator;
use Modules\Rental\Support\RentalPassengerDocMedia;
use Modules\Rental\Support\RentalRateResolver;
use Modules\Rental\Support\RentalStatusHint;
use Modules\Rental\Support\RentalWhatsAppNotifier;
use Modules\Rental\Support\RentalWhatsAppSettings;
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
            'service_type' => ['nullable', 'string', 'in:self_drive,with_driver'],
            'delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address'],
            'pickup_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'rental_class' => ['nullable', 'string', 'in:'.implode(',', VehicleRentalClass::values())],
        ]);

        $start = $validated['start_date'] ?? now()->toDateString();
        $end = $validated['end_date'] ?? now()->addDays(2)->toDateString();
        $periodType = $validated['period_type'] ?? 'daily';
        $serviceType = $validated['service_type'] ?? Rental::SERVICE_SELF_DRIVE;
        $deliveryType = $validated['delivery_type'] ?? Rental::DELIVERY_DEPOT;
        $locations = app(RentalLocationHydrator::class)->depotOptions();
        $needsDepot = $locations !== [] && empty($validated['pickup_location_id']);
        $searched = ! $needsDepot;

        $vehicles = $needsDepot
            ? []
            : PublicRentalCatalog::groupCards(
                Vehicle::query()
                    ->where('status', Vehicle::STATUS_ACTIVE)
                    ->when($validated['rental_class'] ?? null, fn ($q, $class) => $q->where('rental_class', $class))
                    ->orderBy('name')
                    ->get()
                    ->filter(function (Vehicle $vehicle) use ($start, $end, $periodType, $rates): bool {
                        if (Rental::vehicleAvailabilityReasons($vehicle, $start, $end) !== []) {
                            return false;
                        }

                        return $rates->suggest($vehicle, $start, $end, $periodType) !== null;
                    })
                    ->values()
                    ->map(fn (Vehicle $vehicle): array => $this->vehicleCard($vehicle, $rates, $start, $end, $periodType))
            );

        return Inertia::render('Modules/Rental/Public/Search', [
            'brand' => $this->brand(),
            'filters' => [
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => $periodType,
                'service_type' => $serviceType,
                'delivery_type' => $deliveryType,
                'pickup_location_id' => $validated['pickup_location_id'] ?? null,
                'return_location_id' => $validated['return_location_id'] ?? ($validated['pickup_location_id'] ?? null),
                'rental_class' => $validated['rental_class'] ?? null,
                'total_periods' => Rental::computePeriods($start, $end, $periodType),
            ],
            'classes' => collect(VehicleRentalClass::values())
                ->map(fn (string $value): array => [
                    'value' => $value,
                    'label' => VehicleRentalClass::label($value) ?: ucfirst($value),
                ])
                ->values()
                ->all(),
            'locations' => $locations,
            'vehicles' => $vehicles,
            'searched' => $searched,
            'needs_depot' => $needsDepot,
            'hold_ttl_minutes' => app(RentalBookingPolicy::class)->pendingReservedTtlMinutes(),
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function showVehicle(Request $request, Vehicle $vehicle, MobileRentalBookingService $bookings, RentalRateResolver $rates): Response
    {
        $this->ensureAvailable();
        abort_unless($vehicle->status === Vehicle::STATUS_ACTIVE, 404);

        $validated = $request->validate([
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['nullable', 'string', 'in:daily,weekly,monthly'],
            'service_type' => ['nullable', 'string', 'in:self_drive,with_driver'],
            'pickup_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address'],
            'return_delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address'],
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
        ]);

        $periodType = $validated['period_type'] ?? 'daily';
        $serviceType = $validated['service_type'] ?? Rental::SERVICE_SELF_DRIVE;
        $deliveryType = $validated['delivery_type'] ?? Rental::DELIVERY_DEPOT;
        $returnDeliveryType = $validated['return_delivery_type'] ?? $deliveryType;

        $insurancePackagesEnabled = (bool) RentalGeneralSettings::all()['insurance_packages_enabled'];
        $insurancePackageId = ($insurancePackagesEnabled && ! empty($validated['insurance_package_id']))
            ? (int) $validated['insurance_package_id']
            : null;

        $quote = $bookings->quote([
            'vehicle_id' => $vehicle->id,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'period_type' => $periodType,
            'service_type' => $serviceType,
            'pickup_location_id' => $validated['pickup_location_id'] ?? null,
            'return_location_id' => $validated['return_location_id'] ?? null,
            'delivery_type' => $deliveryType,
            'return_delivery_type' => $returnDeliveryType,
            'insurance_package_id' => $insurancePackageId,
        ]);

        return Inertia::render('Modules/Rental/Public/VehicleShow', [
            'brand' => $this->brand(),
            'vehicle' => $this->vehicleDetail($vehicle, $validated['start_date'], $validated['end_date'], $periodType, $rates),
            'seo' => $this->vehicleSeo($request, $vehicle, $quote),
            'filters' => [
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'period_type' => $periodType,
                'service_type' => $serviceType,
                'pickup_location_id' => $validated['pickup_location_id'] ?? null,
                'return_location_id' => $validated['return_location_id'] ?? ($validated['pickup_location_id'] ?? null),
                'delivery_type' => $deliveryType,
                'return_delivery_type' => $returnDeliveryType,
                'insurance_package_id' => $insurancePackageId,
            ],
            'quote' => $this->quotePayload($quote),
            'locations' => app(RentalLocationHydrator::class)->depotOptions(),
            'insurance_packages_enabled' => $insurancePackagesEnabled,
            'insurance_packages' => $insurancePackagesEnabled
                ? RentalInsurancePackage::query()
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
                    ->all()
                : [],
            'hold_ttl_minutes' => app(RentalBookingPolicy::class)->pendingReservedTtlMinutes(),
            'gateway_available' => $this->gatewayAvailable(),
            'is_dev_mode' => \App\Support\SystemMode::shouldExposeDebugOtp(),
            'require_otp' => RentalWhatsAppSettings::isOtpRequired(),
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
            'service_type' => ['nullable', 'string', 'in:self_drive,with_driver'],
            'pickup_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(RentalLocationHydrator::class)->depotIdRules(),
            'delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'return_delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address'],
            'return_delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
        ]);

        if (! RentalGeneralSettings::all()['insurance_packages_enabled']) {
            $data['insurance_package_id'] = null;
        }

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

        if (! RentalGeneralSettings::all()['insurance_packages_enabled']) {
            $data['insurance_package_id'] = null;
        }

        if (RentalWhatsAppSettings::isOtpRequired()) {
            if (! $this->assertOtp($otp, $data['booker_phone'], $data['otp_code'] ?? null)) {
                return back()->withErrors(['otp_code' => __('rental.public.otp_invalid')])->withInput();
            }
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

        $message = (float) $rental->deposit_amount > 0
            ? __('rental.public.booking_created')
            : __('rental.public.booking_created_pay_rent');

        return redirect()
            ->route('book.rental.booking.show', $rental->public_token)
            ->with('success', $message);
    }

    public function sendOtp(Request $request, PassengerOtpService $otp): JsonResponse|RedirectResponse
    {
        $this->ensureAvailable();

        if (! RentalWhatsAppSettings::isOtpRequired()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Verifikasi WhatsApp OTP saat ini dinonaktifkan.',
                ], 422);
            }

            return back()->with('error', 'Verifikasi WhatsApp OTP saat ini dinonaktifkan.');
        }

        $data = $request->validate([
            'booker_phone' => ['required', 'string', 'max:32'],
        ]);

        $phone = $otp->normalize($data['booker_phone']);
        $isCustomerMatched = auth('customer')->check() && $otp->normalize((string) auth('customer')->user()->phone) === $phone;
        $alreadyVerified = $otp->isVerified($phone) || $isCustomerMatched;

        if ($alreadyVerified) {
            \Illuminate\Support\Facades\Cache::put('shuttle_otp_ok:'.$phone, true, 1800);

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
            $isDev = \App\Support\SystemMode::shouldExposeDebugOtp();
            $payload = [
                'ok' => true,
                'is_development' => $isDev,
                'message' => $isDev
                    ? 'Mode Development: Kode OTP adalah '.$code.' (tidak dikirim ke nomor HP).'
                    : __('rental.public.otp_sent'),
            ];
            if ($isDev) {
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
            'qris_merchant' => \App\Support\GlobalPaymentSettings::getQrisPayload(),
            'require_otp' => RentalWhatsAppSettings::isOtpRequired(),
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

        if ($rental->isExpired() || $rental->isCancelled() || ! in_array($rental->status, [
            Rental::STATUS_DRAFT,
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
                ->createRentalFullPaymentCharge(
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

        if ($rental->isExpired() || $rental->isCancelled() || ! in_array($rental->status, [
            Rental::STATUS_DRAFT,
            Rental::STATUS_PENDING_RESERVED,
            Rental::STATUS_CONFIRMED,
            Rental::STATUS_ACTIVE,
        ], true)) {
            return back()->with('error', 'Pemesanan ini telah kedaluwarsa atau dibatalkan dan tidak dapat menerima pembayaran.');
        }

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

        $paymentSummary = app(RentalInvoiceService::class)->paymentSummary($rental);
        $hasUnpaidBalance = ((float) $paymentSummary['balance_due']) > 0;
        $isDepositSettled = (float) $rental->deposit_amount > 0 ? $rental->isDepositReceived() : $rental->status === Rental::STATUS_CONFIRMED;

        if ($isDepositSettled && ! $hasUnpaidBalance) {
            return back()->with('error', __('rental.public.deposit_already_received'));
        }

        $proofPath = $docMedia->storeDepositProof($request->file('deposit_proof'), $rental->id);

        $paymentMethod = $request->input('payment_method') === 'qris' ? 'qris' : 'transfer';

        $bankAccountId = ! empty($data['company_bank_account_id']) ? (int) $data['company_bank_account_id'] : null;
        if ($paymentMethod === 'qris' && empty($bankAccountId)) {
            $qrisBankId = Setting::getValue(\App\Support\GlobalPaymentSettings::KEY_QRIS_BANK_ACCOUNT_ID);
            if (! empty($qrisBankId)) {
                $bankAccountId = (int) $qrisBankId;
            }
        }

        $rental->update([
            'deposit_payment_method' => $paymentMethod,
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
            $extRequest = $extensions->requestFromPassenger(
                $rental,
                $data['new_end_date'],
                Rental::CHANNEL_WEB,
                $data['notes'] ?? null,
            );

            app(RentalWhatsAppNotifier::class)->sendExtensionRequested($rental->fresh(), $extRequest);
        } catch (Throwable $e) {
            $message = $e instanceof \Illuminate\Validation\ValidationException
                ? collect($e->errors())->flatten()->first()
                : $e->getMessage();

            return back()->with('error', $message);
        }

        $message = $extRequest->has_conflict
            ? __('rental.public.extend_requested_with_conflict')
            : __('rental.public.extend_requested');

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', $message);
    }

    public function quoteExtend(
        Request $request,
        string $token,
    ): JsonResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        if ($rental->status !== Rental::STATUS_ACTIVE) {
            return response()->json([
                'success' => false,
                'message' => __('rental.public.extend_active_only'),
            ], 422);
        }

        $validated = $request->validate([
            'new_end_date' => ['required', 'date', 'after:'.$rental->end_date?->toDateString()],
        ]);

        $newEndDate = $validated['new_end_date'];
        $currentEndDate = $rental->end_date?->toDateString();

        $extendedPeriods = Rental::computePeriods(
            $rental->end_date->copy()->addDay()->toDateString(),
            $newEndDate,
            $rental->period_type,
        );

        $ratePerPeriod = (float) $rental->rate_per_period;
        $additionalAmount = round($extendedPeriods * $ratePerPeriod, 2);
        $estimatedNewTotal = (float) $rental->total_amount + $additionalAmount;

        $conflicts = Rental::findConflictingRentals(
            (int) $rental->vehicle_id,
            $rental->end_date->copy()->addDay()->toDateString(),
            $newEndDate,
            $rental->id,
        );

        $hasConflict = $conflicts->isNotEmpty();

        return response()->json([
            'success' => true,
            'current_end_date' => $currentEndDate,
            'new_end_date' => $newEndDate,
            'extended_periods' => $extendedPeriods,
            'period_type' => $rental->period_type,
            'rate_per_period' => $ratePerPeriod,
            'additional_amount' => $additionalAmount,
            'estimated_new_total' => $estimatedNewTotal,
            'has_conflict' => $hasConflict,
            'conflict_message' => $hasConflict
                ? 'Tanggal ini beririsan dengan jadwal pemesanan pelanggan lain. Pengajuan Anda tetap dapat dikirim dan akan ditinjau tim operasional untuk alokasi unit pengganti.'
                : 'Unit kendaraan tersedia bebas bentrok untuk perpanjangan ini.',
        ]);
    }

    public function cancelExtendRequest(
        Request $request,
        string $token,
        PassengerOtpService $otp,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        $pending = RentalExtensionRequest::query()
            ->where('rental_id', $rental->id)
            ->where('status', RentalExtensionRequest::STATUS_PENDING)
            ->latest('id')
            ->first();

        if (! $pending) {
            return back()->with('error', 'Tidak ada pengajuan perpanjangan aktif yang dapat dibatalkan.');
        }

        $pending->update([
            'status' => RentalExtensionRequest::STATUS_CANCELLED,
            'staff_notes' => 'Dibatalkan oleh pelanggan melalui portal mandiri.',
        ]);

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', 'Pengajuan perpanjangan sewa telah berhasil dibatalkan.');
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
            'guarantor_doc' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'guarantor_doc_type' => ['nullable', 'string', 'max:64'],
            'id_number' => ['nullable', 'string', 'max:50'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'license_expires_at' => ['nullable', 'date'],
            'birth_date' => ['nullable', 'date'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        if (! $request->hasFile('ktp') && ! $request->hasFile('sim') && ! $request->hasFile('guarantor_doc')) {
            return back()->withErrors(['ktp' => __('rental.public.documents_required')]);
        }

        $updates = [];
        if ($request->hasFile('ktp')) {
            $updates['passenger_ktp_path'] = $docs->storeUpload($request->file('ktp'), $rental->id, 'ktp');
        }
        if ($request->hasFile('sim')) {
            $updates['passenger_sim_path'] = $docs->storeUpload($request->file('sim'), $rental->id, 'sim');
        }
        if ($request->hasFile('guarantor_doc')) {
            $updates['passenger_guarantor_doc_path'] = $docs->storeUpload($request->file('guarantor_doc'), $rental->id, 'guarantor');
            if (! empty($data['guarantor_doc_type'])) {
                $updates['passenger_guarantor_doc_type'] = $data['guarantor_doc_type'];
            }
        }

        $rental->update($updates);

        if ($rental->partner) {
            $partnerUpdates = [];
            if (! empty($data['id_number'])) {
                $cleanNik = preg_replace('/[^0-9]/', '', (string) $data['id_number']);
                $partnerUpdates['id_number'] = $cleanNik ?: $data['id_number'];
            }
            if (! empty($data['license_number'])) {
                $partnerUpdates['license_number'] = $data['license_number'];
            }
            if (! empty($data['license_expires_at'])) {
                $partnerUpdates['license_expires_at'] = $data['license_expires_at'];
            }
            if (! empty($updates['passenger_ktp_path']) && blank($rental->partner->id_card_photo_path)) {
                $partnerUpdates['id_card_photo_path'] = $updates['passenger_ktp_path'];
            }
            if (! empty($updates['passenger_sim_path']) && blank($rental->partner->driver_license_photo_path)) {
                $partnerUpdates['driver_license_photo_path'] = $updates['passenger_sim_path'];
            }
            if (($rental->partner->kyc_status ?? 'unverified') === 'unverified') {
                $partnerUpdates['kyc_status'] = 'pending';
                $partnerUpdates['kyc_submitted_at'] = now();
            }
            if ($partnerUpdates !== []) {
                $rental->partner->forceFill($partnerUpdates)->save();
            }
        }

        if (CentralAiSettings::isOcrEnabled() && (bool) (RentalGeneralSettings::all()['ai_kyc_enabled'] ?? false)) {
            try {
                $kycResult = app(DocumentKycServiceInterface::class)->analyzeRentalKyc($rental);
                $extractedName = trim((string) ($kycResult->ktp['name'] ?? $kycResult->sim['name'] ?? ''));
                if ($rental->partner !== null && $extractedName !== '') {
                    $rental->partner->update(['kyc_extracted_name' => $extractedName]);
                }
            } catch (Throwable $e) {
                Log::warning('[PublicRental AI KYC] '.$e->getMessage(), ['rental_id' => $rental->id]);
            }
        }

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', __('rental.public.documents_uploaded'));
    }

    public function scanDocument(
        Request $request,
        string $token,
        DocumentKycServiceInterface $kycService,
    ): JsonResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        if (! CentralAiSettings::isOcrEnabled() || ! (bool) (RentalGeneralSettings::all()['ai_kyc_enabled'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => __('rental.ai.feature_disabled', ['feature' => 'AI OCR Dokumen']),
            ], 403);
        }

        $request->validate([
            'image' => ['nullable'],
            'file' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
            'doc_type' => ['nullable', 'string', 'in:ktp,sim,auto'],
        ]);

        $imageSource = null;
        if ($request->hasFile('file')) {
            $imageSource = $request->file('file')->getRealPath();
        } elseif ($request->hasFile('image')) {
            $imageSource = $request->file('image')->getRealPath();
        } elseif ($request->filled('image')) {
            $imageSource = (string) $request->input('image');
        }

        if (blank($imageSource)) {
            return response()->json([
                'success' => false,
                'message' => __('rental.ai.no_documents_uploaded'),
            ], 422);
        }

        try {
            $docType = (string) $request->input('doc_type', 'auto');
            $extracted = $kycService->scanSingleDocument(
                imageSource: $imageSource,
                docType: $docType,
            );

            $data = (array) ($extracted['data'] ?? []);
            $extractedDocType = (string) ($extracted['doc_type'] ?? $docType);

            $extractedName = trim((string) ($data['name'] ?? ''));
            if ($rental->partner !== null && $extractedName !== '') {
                if ($extractedDocType === 'ktp' || blank($rental->partner->kyc_extracted_name)) {
                    $rental->partner->update(['kyc_extracted_name' => $extractedName]);
                }
            }

            $validation = [
                'is_valid' => true,
                'warnings' => [],
                'checks' => [],
            ];

            // 1. KTP Checks (16-digit NIK & Name Match)
            if ($extractedDocType === 'ktp' || ! empty($data['nik'])) {
                $rawNik = (string) ($data['nik'] ?? '');
                $cleanNik = preg_replace('/[^0-9]/', '', $rawNik);
                $isValidNik = strlen($cleanNik) === 16;

                $validation['checks']['nik_16_digits'] = [
                    'passed' => $isValidNik,
                    'value' => $cleanNik,
                    'label' => $isValidNik ? 'Format NIK 16 Digit Valid' : 'Format NIK belum 16 digit angka',
                ];

                if (! $isValidNik) {
                    $validation['warnings'][] = 'Format NIK terdeteksi tidak 16 digit ('.($cleanNik ?: '-').'). Harap periksa kembali foto KTP.';
                }

                $bookerName = trim((string) ($rental->partner?->name ?: ''));
                $docName = trim((string) ($data['name'] ?? ''));

                if ($bookerName !== '' && $docName !== '') {
                    similar_text(strtoupper($bookerName), strtoupper($docName), $percent);
                    $nameMatchScore = round($percent, 1);
                    $isMatched = $nameMatchScore >= 50.0;

                    $validation['checks']['name_match'] = [
                        'passed' => $isMatched,
                        'score' => $nameMatchScore,
                        'booker_name' => $bookerName,
                        'doc_name' => $docName,
                        'label' => $isMatched
                            ? "Nama sesuai ({$nameMatchScore}% kesamaan)"
                            : "Nama di KTP ({$docName}) berbeda dengan nama pemesan ({$bookerName})",
                    ];

                    if (! $isMatched) {
                        $validation['warnings'][] = "Nama pada KTP ({$docName}) berbeda dengan nama pemesan ({$bookerName}).";
                    }
                }
            }

            // 2. SIM Checks (Expiry Date vs Rental End Date)
            if ($extractedDocType === 'sim' || ! empty($data['license_number']) || ! empty($data['expires_at'])) {
                $expiresAt = $data['expires_at'] ?? null;
                if ($expiresAt) {
                    try {
                        $expDate = Carbon::parse($expiresAt);
                        $isExpired = $expDate->isPast();
                        $rentalEndDate = $rental->end_date;
                        $validForRental = $rentalEndDate ? $expDate->greaterThanOrEqualTo($rentalEndDate) : ! $isExpired;

                        $validation['checks']['sim_expiry'] = [
                            'passed' => $validForRental,
                            'is_expired' => $isExpired,
                            'expires_at' => $expDate->format('Y-m-d'),
                            'label' => $validForRental
                                ? "SIM aktif hingga {$expDate->format('d/m/Y')}"
                                : ($isExpired ? 'SIM sudah kedaluwarsa' : "SIM akan kedaluwarsa sebelum sewa berakhir ({$expDate->format('d/m/Y')})"),
                        ];

                        if (! $validForRental) {
                            $validation['warnings'][] = $isExpired
                                ? 'Masa berlaku SIM telah kedaluwarsa.'
                                : "SIM akan kedaluwarsa sebelum periode sewa selesai ({$expDate->format('d/m/Y')}).";
                        }
                    } catch (Throwable) {
                        // Ignore date parse issues
                    }
                }
            }

            $validation['is_valid'] = empty($validation['warnings']);

            return response()->json([
                'success' => true,
                'result' => $extracted,
                'validation' => $validation,
                'message' => __('rental.ai.ocr_success'),
            ]);
        } catch (Throwable $e) {
            Log::error('[PublicRental OCR] '.$e->getMessage(), ['exception' => $e]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function requestPickup(
        Request $request,
        string $token,
        PassengerOtpService $otp,
        RentalHandoverMedia $handoverMedia,
        RentalLifecycleGate $lifecycle,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        abort_if(
            $rental->status !== Rental::STATUS_CONFIRMED,
            422,
            __('rental.public.pickup_confirmed_only'),
        );

        $lifecycle->assertCanSignContract($rental);

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
            'contract_signature_path' => $rental->contract_signature_path ?: $signaturePath,
            'contract_signed_at' => $rental->contract_signed_at ?: now(),
        ]);

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', __('rental.public.pickup_requested'));
    }

    public function inspectReturn(
        Request $request,
        string $token,
        VisionInspectionServiceInterface $visionInspectionService,
    ): JsonResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        abort_if(
            $rental->status !== Rental::STATUS_ACTIVE,
            422,
            __('rental.errors.return_active_only'),
        );

        if (! CentralAiSettings::isEnabled() || ! (bool) (RentalGeneralSettings::all()['ai_inspection_enabled'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => __('rental.ai.feature_disabled', ['feature' => 'AI Visual Inspection']),
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
            $result = $visionInspectionService->inspectHandover(
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
                'created_by_user_id' => null,
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
            Log::error('[PublicRental AI Return Inspection] '.$e->getMessage(), ['rental_id' => $rental->id]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function submitReturn(
        Request $request,
        string $token,
        PassengerOtpService $otp,
        RentalHandoverMedia $handoverMedia,
        RentalInvoiceService $invoices,
        RentalAccountingService $accounting,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        abort_if(
            $rental->status !== Rental::STATUS_ACTIVE,
            422,
            __('rental.errors.return_active_only'),
        );

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'end_odometer' => ['nullable', 'integer', 'min:0'],
            'end_fuel_level' => ['nullable', 'string', Rule::in(RentalHandoverChecklist::fuelLevels())],
            'return_checklist' => ['nullable', 'array'],
            'return_checklist.*' => ['boolean'],
            'return_notes' => ['nullable', 'string', 'max:1000'],
            'return_photos' => ['required', 'array', 'min:1', 'max:5'],
            'return_photos.*' => ['string', 'starts_with:data:image/'],
            'customer_signature' => ['required', 'string', 'starts_with:data:image/'],
        ], [
            'return_photos.required' => __('rental.errors.handover_photo_required'),
            'return_photos.min' => __('rental.errors.handover_photo_required'),
            'return_photos.max' => __('rental.errors.handover_photo_max', ['max' => 5]),
            'customer_signature.required' => __('rental.errors.handover_signature_required'),
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        $photos = $handoverMedia->storePhotos($data['return_photos'], 'rental/handover-photos');
        $signaturePath = $handoverMedia->storeSignature($data['customer_signature'], 'rental/return-signatures');

        $actualReturnDate = now()->toDateString();
        $endOdometer = ! empty($data['end_odometer']) ? (int) $data['end_odometer'] : null;

        $excessKm = null;
        $excessAmount = 0.0;
        if ($endOdometer && $rental->start_odometer && $rental->km_limit_per_period) {
            $totalKmDriven = $endOdometer - $rental->start_odometer;
            $allowedKm = $rental->km_limit_per_period * $rental->total_periods;
            $excessKm = max(0, $totalKmDriven - $allowedKm);
            $excessAmount = (float) ($excessKm * (float) ($rental->excess_km_rate ?? 0));
        }

        $overdueDays = Rental::computeOverdueDays(
            $rental->end_date->toDateString(),
            $actualReturnDate,
        );
        $lateFeeAmount = (float) ($overdueDays * $rental->resolveLateFeePerDay());

        $rental->update([
            'status' => Rental::STATUS_RETURNED,
            'actual_return_date' => $actualReturnDate,
            'returned_at' => now(),
            'end_odometer' => $endOdometer,
            'end_fuel_level' => $data['end_fuel_level'] ?? null,
            'return_checklist' => RentalHandoverChecklist::normalize($data['return_checklist'] ?? []),
            'return_notes' => $data['return_notes'] ?? null,
            'return_photos' => $photos,
            'return_signature_path' => $signaturePath,
            'return_signed_at' => now(),
            'excess_km' => $excessKm,
            'excess_amount' => $excessAmount,
            'overdue_days' => $overdueDays,
            'late_fee_amount' => $lateFeeAmount,
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

        try {
            app(RentalWhatsAppNotifier::class)
                ->sendReturnReceipt($rental->fresh(['vehicle', 'partner']));
        } catch (Throwable $e) {
            Log::warning('[PublicRental Return WhatsApp] '.$e->getMessage(), ['rental_id' => $rental->id]);
        }

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', __('rental.messages.returned'));
    }

    public function submitRefundAccount(
        Request $request,
        string $token,
        PassengerOtpService $otp,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        abort_if(! $rental->canSubmitRefundAccount(), 422, 'Pengajuan rekening pengembalian deposit tidak diizinkan untuk status booking ini.');

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_name' => ['required', 'string', 'max:150'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        $newRefundStatus = in_array($rental->status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
            ? ($rental->deposit_status === Rental::DEPOSIT_SETTLED ? Rental::REFUND_STATUS_APPROVED : Rental::REFUND_STATUS_IN_REVIEW)
            : Rental::REFUND_STATUS_BANK_SUBMITTED;

        $rental->update([
            'deposit_refund_bank_name' => trim($data['bank_name']),
            'deposit_refund_account_number' => preg_replace('/[^0-9A-Za-z\-]/', '', trim($data['account_number'])),
            'deposit_refund_account_name' => strtoupper(trim($data['account_name'])),
            'deposit_refund_bank_submitted_at' => now(),
            'deposit_refund_status' => $newRefundStatus,
        ]);

        try {
            app(RentalWhatsAppNotifier::class)
                ->sendDepositRefundBankSubmitted($rental->fresh(['vehicle', 'partner']));
        } catch (Throwable $e) {
            Log::warning('[PublicRental Refund Bank WhatsApp] '.$e->getMessage(), ['rental_id' => $rental->id]);
        }

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', 'Data rekening pengembalian deposit berhasil disimpan.');
    }

    public function orderAddons(
        Request $request,
        string $token,
        PassengerOtpService $otp,
        RentalInvoiceService $invoices,
        RentalAccountingService $accounting,
    ): RedirectResponse {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        $settings = RentalGeneralSettings::all();
        abort_if(
            empty($settings['addons_enabled']),
            422,
            'Layanan pemesanan add-on dan aksesoris tambahan saat ini tidak diaktifkan.'
        );

        abort_if(
            $rental->isExpired() || $rental->isCancelled() || ! in_array($rental->status, [
                Rental::STATUS_PENDING_RESERVED,
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
            ], true),
            422,
            'Pemesanan add-on tidak dapat dilakukan pada status sewa saat ini.'
        );

        $phone = $request->input('booker_phone') ?: $rental->booker_phone;
        $isVerified = $phone !== null && $otp->isVerified($phone);

        $data = $request->validate([
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.code' => ['required', 'string', Rule::in(RentalAddonCatalog::codes())],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:5'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        if ($error = $this->guardBooker($otp, $rental, $data['booker_phone'] ?? null, $data['otp_code'] ?? null)) {
            return $error;
        }

        $periods = max(1, (int) $rental->total_periods);
        $createdCharges = [];

        foreach ($data['items'] as $item) {
            $code = (string) $item['code'];
            $qty = (int) $item['quantity'];
            $notes = isset($item['notes']) ? trim((string) $item['notes']) : '';

            $pricing = RentalAddonCatalog::resolveItemPricing($rental, $code);
            if (! $pricing) {
                continue;
            }

            $rate = (float) $pricing['unit_price'];
            $isDaily = $pricing['price_type'] === 'daily';
            $chargeAmount = $isDaily
                ? round($rate * $periods * $qty, 2)
                : round($rate * $qty, 2);

            if ($chargeAmount <= 0) {
                continue;
            }

            $desc = $pricing['name'];
            if ($qty > 1 && $isDaily) {
                $desc .= " ({$qty} unit x {$periods} hari)";
            } elseif ($qty > 1) {
                $desc .= " ({$qty} unit)";
            } elseif ($isDaily) {
                $desc .= " ({$periods} hari)";
            }

            if ($notes !== '') {
                $desc .= " - {$notes}";
            }

            $charge = RentalCharge::query()->create([
                'rental_id' => $rental->id,
                'kind' => RentalCharge::KIND_ADDON,
                'addon_code' => $code,
                'amount' => $chargeAmount,
                'description' => $desc,
            ]);

            $createdCharges[] = $charge;
        }

        if (empty($createdCharges)) {
            return back()->with('error', 'Tidak ada add-on valid yang dapat ditambahkan.');
        }

        $rental->recalculateTotalAmount();
        $freshRental = $rental->fresh();

        foreach ($createdCharges as $charge) {
            $invoices->invoiceAddon($freshRental, $charge);
        }

        $accounting->issueDraftInvoices($freshRental);

        try {
            app(RentalWhatsAppNotifier::class)
                ->sendAddonPurchased($freshRental->fresh(['vehicle', 'partner']), $createdCharges);
        } catch (Throwable $e) {
            Log::warning('[PublicRental Addons WhatsApp] '.$e->getMessage(), ['rental_id' => $rental->id]);
        }

        return redirect()
            ->route('book.rental.booking.show', $token)
            ->with('success', 'Layanan & aksesoris tambahan berhasil ditambahkan ke pesanan Anda.');
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

    public function trackLookup(): Response
    {
        $this->ensureAvailable();

        return Inertia::render('Modules/Rental/Public/TrackLookup', [
            'brand' => $this->brand(),
        ]);
    }

    public function trackFind(Request $request, PassengerOtpService $otp): RedirectResponse
    {
        $this->ensureAvailable();

        $data = $request->validate([
            'booking_code' => ['required', 'string', 'max:64'],
            'phone' => ['required', 'string', 'max:32'],
        ]);

        $code = strtoupper(trim($data['booking_code']));
        $rawDigits = preg_replace('/\D/', '', $data['phone']);
        $normalizedPhone = $otp->normalize($data['phone']);
        $phoneCandidates = array_values(array_unique(array_filter([
            $data['phone'],
            $rawDigits,
            $normalizedPhone,
            str_starts_with($rawDigits, '62') ? '0'.substr($rawDigits, 2) : null,
            str_starts_with($rawDigits, '0') ? '62'.substr($rawDigits, 1) : null,
        ])));

        $rental = Rental::query()
            ->whereIn('channel', Rental::passengerChannels())
            ->whereRaw('UPPER(code) = ?', [$code])
            ->where(function ($query) use ($phoneCandidates): void {
                $query->whereIn('booker_phone', $phoneCandidates)
                    ->orWhereHas('partner', fn ($q) => $q->whereIn('phone', $phoneCandidates));
            })
            ->first();

        if (! $rental) {
            return back()
                ->withInput()
                ->with('error', 'Reservasi tidak ditemukan. Pastikan Kode Booking dan Nomor WhatsApp sesuai.');
        }

        return redirect()->route('book.rental.booking.show', $rental->public_token);
    }

    public function downloadContractPdf(string $token, RentalPdfController $pdfController): \Illuminate\Http\Response|RedirectResponse
    {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        if (in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CANCELLED], true)) {
            return back()->with('error', __('rental.errors.pdf_contract_confirmed_only'));
        }

        return $pdfController->generateContractPdf($rental);
    }

    public function downloadHandoverPdf(string $token, RentalPdfController $pdfController): \Illuminate\Http\Response|RedirectResponse
    {
        $this->ensureAvailable();

        $rental = $this->findPassengerBooking($token);

        if (! in_array($rental->status, [
            Rental::STATUS_ACTIVE,
            Rental::STATUS_RETURNED,
            Rental::STATUS_COMPLETED,
        ], true)) {
            return back()->with('error', __('rental.errors.pdf_handover_checked_out_only'));
        }

        return $pdfController->generateHandoverPdf($rental);
    }

    private function ensureAvailable(): void
    {
        $this->preferIndonesianForFirstVisit();

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
            'terms_url' => $this->publishedPageUrl(['syarat-ketentuan', 'syarat', 'terms']),
            'privacy_url' => $this->publishedPageUrl(['kebijakan-privasi', 'privasi', 'privacy']),
            'help_locations' => collect(app(RentalLocationHydrator::class)->depotOptions())
                ->take(4)
                ->map(fn (array $location): array => [
                    'name' => $location['name'],
                    'address' => $location['address'] ?? null,
                    'city' => $location['city'] ?? null,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  list<string>  $slugs
     */
    private function publishedPageUrl(array $slugs): ?string
    {
        if (! class_exists(\Modules\Pages\Models\Page::class) || ! Schema::hasTable('pages')) {
            return null;
        }

        $published = \Modules\Pages\Models\Page::query()
            ->where('is_published', true)
            ->whereIn('slug', $slugs)
            ->pluck('slug');

        foreach ($slugs as $candidate) {
            if ($published->contains($candidate)) {
                return route('pages.render', $candidate);
            }
        }

        return null;
    }

    private function preferIndonesianForFirstVisit(): void
    {
        $request = request();
        $key = (string) config('localization.session_key', 'locale');

        if ($request->hasSession() && ! $request->session()->has($key)) {
            app(\App\Support\LocaleResolver::class)->persist($request, 'id');
        }
    }

    private function gatewayAvailable(): bool
    {
        return class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable();
    }

    private function assertOtp(PassengerOtpService $otp, string $phone, ?string $code): bool
    {
        if (! RentalWhatsAppSettings::isOtpRequired()) {
            return true;
        }

        if (auth('customer')->check()) {
            return true;
        }

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
        if (! RentalWhatsAppSettings::isOtpRequired()) {
            return null;
        }

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
        $rental = Rental::query()
            ->where('public_token', $token)
            ->whereIn('channel', Rental::passengerChannels())
            ->with(['vehicle', 'partner', 'insurancePackage', 'pickupLocation', 'returnLocation', 'driver', 'dutyOrders.driver'])
            ->firstOrFail();

        if ($rental->status === Rental::STATUS_PENDING_RESERVED && $rental->reserved_until !== null && $rental->reserved_until->isPast()) {
            $rental->update([
                'status' => Rental::STATUS_PENDING,
                'reserved_until' => null,
            ]);
        }

        return $rental;
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

        $periods = Rental::computePeriods($start, $end, $periodType);

        return [
            'id' => $vehicle->id,
            'name' => $vehicle->name,
            'rental_class' => $vehicle->rental_class,
            'rental_class_label' => $vehicle->rental_class
                ? VehicleRentalClass::label((string) $vehicle->rental_class)
                : null,
            'capacity_seats' => $vehicle->capacity_seats,
            'fuel_label' => PublicRentalCatalog::fuelLabel($vehicle->fuel_type),
            'model_year' => $vehicle->model_year,
            'photo_url' => $vehicle->photo_url,
            'from_price' => $rate ? (float) $rate->rate_per_period : null,
            'total_periods' => $periods,
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

        $description = 'Sewa '.PublicRentalCatalog::displayName((string) $vehicle->name).' di '.$brand['name'].'. '
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
            'title' => PublicRentalCatalog::displayName((string) $vehicle->name).' — Sewa di '.$brand['name'],
            'description' => $description,
            'image' => $vehicle->photo_url,
            'url' => $request->fullUrl(),
            'json_ld' => $jsonLd,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function vehicleDetail(Vehicle $vehicle, string $start, string $end, string $periodType, RentalRateResolver $rates): array
    {
        return [
            'id' => $vehicle->id,
            'name' => PublicRentalCatalog::displayName((string) $vehicle->name),
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
            'fuel_label' => PublicRentalCatalog::fuelLabel($vehicle->fuel_type),
            'photo_url' => $vehicle->photo_url,
            'similar_available' => PublicRentalCatalog::similarAvailableCount($vehicle, $start, $end, $periodType, $rates),
        ];
    }

    private function clock(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $text = $value instanceof \DateTimeInterface ? $value->format('H:i:s') : (string) $value;

        return strlen($text) >= 5 ? substr($text, 0, 5) : $text;
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
            'service_type' => $quote['service_type'] ?? Rental::SERVICE_SELF_DRIVE,
            'driver_fee_amount' => (float) ($quote['driver_fee_amount'] ?? 0),
            'delivery_type' => $quote['delivery_type'] ?? Rental::DELIVERY_DEPOT,
            'delivery_fee' => (float) ($quote['delivery_fee'] ?? 0),
            'return_delivery_type' => $quote['return_delivery_type'] ?? Rental::DELIVERY_DEPOT,
            'return_delivery_fee' => (float) ($quote['return_delivery_fee'] ?? 0),
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
        $isExpired = $rental->isExpired();
        $isCancelled = $rental->isCancelled();
        $upfrontPaid = (float) $rental->deposit_amount > 0
            ? $rental->isDepositReceived()
            : ($rental->deposit_proof_status === Rental::PROOF_APPROVED || ($paymentPayload['balance_due'] <= 0 && ! in_array($paymentPayload['status'], ['unpaid', 'partial', 'draft'], true)));

        $phoneVerified = false;
        if ($rental->booker_phone !== null) {
            $normalizedBooker = app(PassengerOtpService::class)->normalize($rental->booker_phone);
            $phoneVerified = app(PassengerOtpService::class)->isVerified($rental->booker_phone)
                || (auth('customer')->check() && app(PassengerOtpService::class)->normalize((string) auth('customer')->user()->phone) === $normalizedBooker);
        }

        $assignedDriver = $rental->driver;
        if (! $assignedDriver && $rental->dutyOrders && $rental->dutyOrders->isNotEmpty()) {
            $assignedDriver = $rental->dutyOrders->sortByDesc('id')->first()?->driver;
        }

        return [
            'code' => $rental->code,
            'public_token' => $rental->public_token,
            'status' => $rental->status,
            'is_expired' => $isExpired,
            'is_cancelled' => $isCancelled,
            'channel' => $rental->channel,
            'service_type' => $rental->service_type ?? Rental::SERVICE_SELF_DRIVE,
            'booker_phone' => $rental->booker_phone,
            'booker_phone_verified' => $phoneVerified,
            'start_date' => $rental->start_date?->toDateString(),
            'end_date' => $rental->end_date?->toDateString(),
            'pickup_time' => $this->clock($rental->pickup_time),
            'return_time' => $this->clock($rental->return_time),
            'period_type' => $rental->period_type,
            'total_periods' => (int) $rental->total_periods,
            'rate_per_period' => (float) $rental->rate_per_period,
            'base_amount' => (float) $rental->base_amount,
            'deposit_amount' => (float) $rental->deposit_amount,
            'deposit_received' => $rental->isDepositReceived(),
            'driver_fee_amount' => (float) $rental->driver_fee_amount,
            'delivery_type' => $rental->delivery_type ?? Rental::DELIVERY_DEPOT,
            'delivery_address' => $rental->delivery_address,
            'delivery_landmark' => $rental->delivery_landmark,
            'delivery_fee' => (float) $rental->delivery_fee,
            'return_delivery_type' => $rental->return_delivery_type ?? Rental::DELIVERY_DEPOT,
            'return_delivery_address' => $rental->return_delivery_address,
            'return_delivery_fee' => (float) $rental->return_delivery_fee,
            'total_amount' => (float) $rental->total_amount,
            'pickup_location' => $rental->pickup_location ?? $rental->pickupLocation?->name,
            'return_location' => $rental->return_location ?? $rental->returnLocation?->name,
            'reserved_until' => $rental->reserved_until?->toIso8601String(),
            'status_hint' => app(RentalStatusHint::class)->for($rental, RentalStatusHint::AUDIENCE_PASSENGER),
            'cancelled_reason' => $rental->cancelled_reason,
            'emergency_contact' => [
                'name' => $rental->emergency_contact_name,
                'phone' => $rental->emergency_contact_phone,
                'relation' => $rental->emergency_contact_relation,
            ],
            'social_media_account' => $rental->social_media_account,
            'contract' => [
                'signed' => filled($rental->contract_signed_at),
                'signed_at' => $rental->contract_signed_at?->toIso8601String(),
                'signature_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->contract_signature_path),
            ],
            'driver' => $assignedDriver ? [
                'id' => $assignedDriver->id,
                'name' => $assignedDriver->name,
                'phone' => $assignedDriver->phone,
                'photo_url' => $assignedDriver->photo_url,
            ] : null,
            'pdf_urls' => [
                'contract' => in_array($rental->status, [Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                    ? route('book.rental.booking.contract_pdf', $rental->public_token)
                    : null,
                'handover' => in_array($rental->status, [Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                    ? route('book.rental.booking.handover_pdf', $rental->public_token)
                    : null,
            ],
            'tracking_timeline' => [
                [
                    'key' => 'booking_created',
                    'title' => 'Reservasi Diterima',
                    'description' => 'Pemesanan telah masuk ke sistem operasional',
                    'status' => 'completed',
                    'timestamp' => $rental->created_at?->format('d M Y, H:i').' WIB',
                ],
                [
                    'key' => 'kyc_verified',
                    'title' => 'Verifikasi Identitas & Dokumen',
                    'description' => filled($rental->passenger_ktp_path)
                        ? 'Dokumen persyaratan (KTP/SIM) telah diunggah'
                        : 'Menunggu kelengkapan dokumen identitas',
                    'status' => filled($rental->passenger_ktp_path) ? 'completed' : 'pending',
                    'timestamp' => null,
                ],
                [
                    'key' => 'payment_deposit',
                    'title' => 'Pembayaran & Deposit',
                    'description' => $upfrontPaid
                        ? 'Pembayaran / Deposit telah terverifikasi'
                        : 'Menunggu konfirmasi pembayaran deposit',
                    'status' => $upfrontPaid ? 'completed' : ($rental->status === Rental::STATUS_PENDING_RESERVED ? 'current' : 'pending'),
                    'timestamp' => null,
                ],
                [
                    'key' => 'confirmation_unit',
                    'title' => 'Persetujuan & Penyiapan Unit',
                    'description' => in_array($rental->status, [Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                        ? ($assignedDriver ? 'Unit & Driver siap ('.$assignedDriver->name.')' : 'Unit telah disiapkan di lokasi serah terima')
                        : 'Menunggu verifikasi dan alokasi unit',
                    'status' => in_array($rental->status, [Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                        ? 'completed'
                        : ($rental->status === Rental::STATUS_PENDING ? 'current' : 'pending'),
                    'timestamp' => null,
                ],
                [
                    'key' => 'handover_active',
                    'title' => 'Serah Terima Unit (BAST)',
                    'description' => in_array($rental->status, [Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                        ? 'Unit telah diserahkan dan masa sewa sedang aktif berjalan'
                        : 'Serah terima kendaraan di titik antar/depot',
                    'status' => in_array($rental->status, [Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                        ? 'completed'
                        : ($rental->status === Rental::STATUS_CONFIRMED ? 'current' : 'pending'),
                    'timestamp' => $rental->checked_out_at ? $rental->checked_out_at->format('d M Y, H:i').' WIB' : null,
                ],
                [
                    'key' => 'return_completed',
                    'title' => 'Pengembalian Unit',
                    'description' => in_array($rental->status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                        ? 'Kendaraan telah dikembalikan dalam kondisi baik'
                        : 'Pengembalian unit di akhir masa sewa',
                    'status' => in_array($rental->status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)
                        ? 'completed'
                        : 'pending',
                    'timestamp' => $rental->returned_at ? $rental->returned_at->format('d M Y, H:i').' WIB' : null,
                ],
                [
                    'key' => 'deposit_refund_settled',
                    'title' => 'Penyelesaian & Refund Deposit',
                    'description' => ((float) $rental->deposit_amount <= 0)
                        ? 'Sewa tidak menggunakan jaminan deposit'
                        : ($rental->resolveDepositRefundStatus() === Rental::REFUND_STATUS_REFUNDED
                            ? 'Deposit telah berhasil dikembalikan ke rekening'
                            : ($rental->resolveDepositRefundStatus() === Rental::REFUND_STATUS_APPROVED
                                ? 'Pencairan deposit disetujui, siap ditransfer'
                                : ($rental->resolveDepositRefundStatus() === Rental::REFUND_STATUS_FORFEITED
                                    ? 'Deposit dipotong penuh untuk pelunasan sewa'
                                    : 'Pemeriksaan denda/tilang dan pengembalian dana deposit'))),
                    'status' => ((float) $rental->deposit_amount <= 0 || in_array($rental->resolveDepositRefundStatus(), [Rental::REFUND_STATUS_REFUNDED, Rental::REFUND_STATUS_FORFEITED], true))
                        ? (in_array($rental->status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true) ? 'completed' : 'pending')
                        : (in_array($rental->status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true) ? 'current' : 'pending'),
                    'timestamp' => $rental->deposit_refunded_at ? $rental->deposit_refunded_at->format('d M Y, H:i').' WIB' : null,
                ],
            ],
            'vehicle' => $rental->vehicle ? [
                'id' => $rental->vehicle->id,
                'name' => PublicRentalCatalog::displayName((string) $rental->vehicle->name),
                'plate_number' => (string) $rental->vehicle->plate_number,
                'photo_url' => $rental->vehicle->photo_url,
            ] : null,
            'insurance_package' => $rental->insurancePackage ? [
                'id' => $rental->insurancePackage->id,
                'name' => $rental->insurancePackage->name,
                'amount' => (float) $rental->insurancePackage->amount,
            ] : null,
            'can_pay_deposit' => ! $isExpired && ! $isCancelled
                && ((float) $rental->deposit_amount > 0 ? ! $rental->isDepositReceived() : $rental->status !== Rental::STATUS_CONFIRMED)
                && in_array($rental->status, [
                    Rental::STATUS_DRAFT,
                    Rental::STATUS_PENDING_RESERVED,
                    Rental::STATUS_CONFIRMED,
                ], true),
            'cancel' => app(RentalBookingPolicy::class)->passengerCancelAssessment($rental),
            'payment' => $paymentPayload,
            'can_request_extend' => $rental->status === Rental::STATUS_ACTIVE && ! RentalExtensionRequest::query()
                ->where('rental_id', $rental->id)
                ->where('status', RentalExtensionRequest::STATUS_PENDING)
                ->exists(),
            'extend_request' => $this->latestExtendRequestPayload($rental),
            'has_pending_extend' => RentalExtensionRequest::query()
                ->where('rental_id', $rental->id)
                ->where('status', RentalExtensionRequest::STATUS_PENDING)
                ->exists(),
            'extensions_history' => $rental->extensions()
                ->latest('id')
                ->get()
                ->map(fn ($ext): array => [
                    'id' => $ext->id,
                    'original_end_date' => $ext->original_end_date?->toDateString(),
                    'new_end_date' => $ext->new_end_date?->toDateString(),
                    'extended_periods' => (int) $ext->extended_periods,
                    'additional_amount' => (float) $ext->additional_amount,
                    'notes' => $ext->notes,
                    'created_at' => $ext->created_at?->format('d M Y, H:i').' WIB',
                ])
                ->values()
                ->all(),
            'documents' => [
                'ktp_uploaded' => filled($rental->passenger_ktp_path),
                'sim_uploaded' => filled($rental->passenger_sim_path),
                'guarantor_uploaded' => filled($rental->passenger_guarantor_doc_path),
                'guarantor_doc_type' => $rental->passenger_guarantor_doc_type,
                'ktp_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->passenger_ktp_path),
                'sim_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->passenger_sim_path),
                'guarantor_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->passenger_guarantor_doc_path),
                'ai_ocr_enabled' => CentralAiSettings::isOcrEnabled() && (bool) (RentalGeneralSettings::all()['ai_kyc_enabled'] ?? false),
                'ai_kyc_assessment' => $rental->ai_kyc_assessment,
                'partner_identity' => [
                    'id_number' => $rental->partner?->id_number,
                    'license_number' => $rental->partner?->license_number,
                    'license_expires_at' => $rental->partner?->license_expires_at?->format('Y-m-d'),
                ],
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
            'can_self_return' => $rental->status === Rental::STATUS_ACTIVE,
            'ai_inspection_enabled' => CentralAiSettings::isEnabled() && (bool) (RentalGeneralSettings::all()['ai_inspection_enabled'] ?? false),
            'handover_checklist_keys' => RentalHandoverChecklist::itemKeys(),
            'fuel_levels' => RentalHandoverChecklist::fuelLevels(),
            'checkout_details' => [
                'start_odometer' => $rental->start_odometer,
                'start_fuel_level' => $rental->start_fuel_level,
                'checkout_photos' => app(RentalHandoverMedia::class)->publicUrls($rental->checkout_photos),
                'checkout_signed_at' => $rental->checkout_signed_at?->format('d M Y, H:i').' WIB',
            ],
            'return_details' => [
                'returned_at' => $rental->returned_at?->format('d M Y, H:i').' WIB',
                'actual_return_date' => $rental->actual_return_date?->toDateString(),
                'end_odometer' => $rental->end_odometer,
                'end_fuel_level' => $rental->end_fuel_level,
                'excess_km' => $rental->excess_km,
                'excess_amount' => (float) $rental->excess_amount,
                'overdue_days' => $rental->overdue_days,
                'late_fee_amount' => (float) $rental->late_fee_amount,
                'return_notes' => $rental->return_notes,
                'return_checklist' => $rental->return_checklist,
                'return_photos' => app(RentalHandoverMedia::class)->publicUrls($rental->return_photos),
                'return_signature_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->return_signature_path),
            ],
            'deposit_refund' => [
                'has_deposit' => (float) $rental->deposit_amount > 0,
                'deposit_amount' => (float) $rental->deposit_amount,
                'deposit_received' => $rental->isDepositReceived(),
                'deposit_status' => $rental->deposit_status,
                'deposit_applied_amount' => (float) $rental->deposit_applied_amount,
                'deposit_refunded_amount' => (float) $rental->deposit_refunded_amount,
                'deposit_settled_at' => $rental->deposit_settled_at?->format('d M Y, H:i').' WIB',
                'refund_status' => $rental->resolveDepositRefundStatus(),
                'bank_name' => $rental->deposit_refund_bank_name,
                'account_number' => $rental->deposit_refund_account_number,
                'account_name' => $rental->deposit_refund_account_name,
                'bank_submitted_at' => $rental->deposit_refund_bank_submitted_at?->format('d M Y, H:i').' WIB',
                'refund_proof_url' => app(RentalPassengerDocMedia::class)->publicUrl($rental->deposit_refund_proof_path),
                'refund_notes' => $rental->deposit_refund_notes,
                'refunded_at' => $rental->deposit_refunded_at?->format('d M Y, H:i').' WIB',
                'can_submit_bank' => $rental->canSubmitRefundAccount(),
            ],
            'addons_enabled' => ! empty(RentalGeneralSettings::all()['addons_enabled']),
            'can_order_addons' => ! $isExpired && ! $isCancelled
                && ! empty(RentalGeneralSettings::all()['addons_enabled']) && in_array($rental->status, [
                    Rental::STATUS_PENDING_RESERVED,
                    Rental::STATUS_CONFIRMED,
                    Rental::STATUS_ACTIVE,
                ], true),
            'available_addons' => ! empty(RentalGeneralSettings::all()['addons_enabled']) ? RentalAddonCatalog::selfServiceCatalog($rental) : [],
            'ordered_addons' => $rental->charges()
                ->where('kind', RentalCharge::KIND_ADDON)
                ->orderBy('id')
                ->get()
                ->map(fn ($charge): array => [
                    'id' => $charge->id,
                    'addon_code' => $charge->addon_code,
                    'description' => $charge->description,
                    'amount' => (float) $charge->amount,
                    'is_invoiced' => $charge->isInvoiced(),
                    'created_at' => $charge->created_at?->format('d M Y, H:i').' WIB',
                ])
                ->values()
                ->all(),
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
        $isInactive = $rental->isExpired() || $rental->isCancelled();
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
            'can_pay_balance' => ! $isInactive && (float) $summary['balance_due'] > 0,
            'invoices' => $payable,
        ];
    }

    /**
     * @return array{id: int, requested_end_date: string|null, estimated_periods: int, estimated_amount: float, status: string, has_conflict: bool, notes: string|null, staff_notes: string|null, reviewed_at: string|null, created_at: string|null}|null
     */
    private function latestExtendRequestPayload(Rental $rental): ?array
    {
        $request = RentalExtensionRequest::query()
            ->where('rental_id', $rental->id)
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
            'has_conflict' => (bool) $request->has_conflict,
            'notes' => $request->notes,
            'staff_notes' => $request->staff_notes,
            'reviewed_at' => $request->reviewed_at?->format('d M Y, H:i').' WIB',
            'created_at' => $request->created_at?->format('d M Y, H:i').' WIB',
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
