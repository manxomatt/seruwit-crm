<?php

namespace Modules\Rental\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Rental\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobileRentalApi;
use Modules\Rental\Http\Requests\Mobile\CancelMobileRentalBookingRequest;
use Modules\Rental\Http\Requests\Mobile\RentalCheckInRequest;
use Modules\Rental\Http\Requests\Mobile\RequestRentalExtensionRequest;
use Modules\Rental\Http\Requests\Mobile\StoreMobileRentalBookingRequest;
use Modules\Rental\Http\Requests\Mobile\UploadDepositProofRequest;
use Modules\Rental\Http\Resources\Mobile\MobileRentalBookingResource;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\MobilePassengerPartnerResolver;
use Modules\Rental\Support\MobileRentalBookingService;
use Modules\Rental\Support\RentalDepositProofNotifier;
use Modules\Rental\Support\RentalExtensionService;
use Modules\Rental\Support\RentalHandoverMedia;
use Modules\Rental\Support\RentalPassengerDocMedia;
use Modules\Shuttle\Support\MobileApiIdempotency;
use Throwable;

class BookingController extends Controller
{
    use InteractsWithMobileRentalApi;

    public function index(Request $request, MobilePassengerPartnerResolver $partners): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $phone = $this->requirePassengerPhone($request);
        $partner = $partners->findByPhone($phone);

        $status = $request->string('status')->toString();

        $query = Rental::query()
            ->where('channel', Rental::CHANNEL_MOBILE)
            ->where(function ($q) use ($phone, $partner): void {
                $q->where('booker_phone', $phone);
                if ($partner !== null) {
                    $q->orWhere('partner_id', $partner->id);
                }
            })
            ->with(['vehicle', 'partner', 'insurancePackage'])
            ->latest();

        if ($status !== '') {
            $query->where('status', $status);
        }

        $rentals = $query->limit(50)->get();

        return response()->json([
            'data' => MobileRentalBookingResource::collection($rentals)->resolve(),
            'meta' => ['count' => $rentals->count()],
        ]);
    }

    public function store(
        StoreMobileRentalBookingRequest $request,
        MobileRentalBookingService $bookings,
        MobileApiIdempotency $idempotency,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        if ($replay = $idempotency->recall($request, 'rental-booking')) {
            return $replay;
        }

        $phone = $this->requirePassengerPhone($request);

        try {
            $rental = $bookings->create($phone, $request->validated());
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        $response = response()->json([
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
            'gateway_available' => $this->gatewayAvailable(),
        ], 201);

        $idempotency->store($request, 'rental-booking', $response);

        return $response;
    }

    public function show(Request $request, string $token): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOptionalOwnership($request, $rental);

        return response()->json([
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function cancel(
        CancelMobileRentalBookingRequest $request,
        string $token,
        MobileRentalBookingService $bookings,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        try {
            $rental = $bookings->cancel($rental, $request->validated('cancelled_reason'));
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        return response()->json([
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
        ]);
    }

    public function payDeposit(
        Request $request,
        string $token,
        MobileApiIdempotency $idempotency,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        if ($replay = $idempotency->recall($request, 'rental-pay:'.$token)) {
            return $replay;
        }

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        if ($rental->isDepositReceived()) {
            return response()->json([
                'message' => __('rental.public.deposit_already_received'),
                'code' => 'deposit_already_received',
            ], 400);
        }

        if (! in_array($rental->status, [
            Rental::STATUS_DRAFT,
            Rental::STATUS_PENDING,
            Rental::STATUS_PENDING_RESERVED,
            Rental::STATUS_CONFIRMED,
        ], true)) {
            return response()->json([
                'message' => __('rental.public.pay_status_invalid'),
                'code' => 'pay_status_invalid',
            ], 400);
        }

        if (! class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            || ! $this->gatewayAvailable()) {
            return response()->json([
                'message' => __('rental.public.gateway_unavailable'),
                'code' => 'gateway_unavailable',
            ], 503);
        }

        try {
            $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
                ->createRentalDepositCharge($rental->loadMissing('partner'));
            $rental->refresh()->load(['vehicle', 'partner', 'insurancePackage']);
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        $response = response()->json([
            'payment' => [
                'mode' => 'midtrans_snap',
                'redirect_url' => $charge->redirect_url,
                'snap_token' => $charge->snap_token ?? null,
                'expires_at' => null,
            ],
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
        ]);

        $idempotency->store($request, 'rental-pay:'.$token, $response);

        return $response;
    }

    public function paymentMethods(): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $bankAccounts = [];
        if (class_exists(CompanyBankAccount::class)) {
            $bankAccounts = CompanyBankAccount::query()
                ->where('is_active', true)
                ->where('kind', CompanyBankAccount::KIND_BANK)
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'name', 'bank_name', 'account_number', 'account_holder', 'is_default'])
                ->map(fn ($acc): array => [
                    'id' => (int) $acc->id,
                    'name' => (string) $acc->name,
                    'bank_name' => $acc->bank_name,
                    'account_number' => $acc->account_number,
                    'account_holder' => $acc->account_holder,
                    'is_default' => (bool) $acc->is_default,
                ])
                ->values()
                ->all();
        }

        return response()->json([
            'bank_accounts' => $bankAccounts,
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function uploadDepositProof(
        UploadDepositProofRequest $request,
        string $token,
        RentalPassengerDocMedia $docMedia,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        $isAlreadyPaid = (float) $rental->deposit_amount > 0 ? $rental->isDepositReceived() : $rental->status === Rental::STATUS_CONFIRMED;
        if ($isAlreadyPaid) {
            return response()->json([
                'message' => __('rental.public.deposit_already_received', ['default' => 'Deposit has already been paid or received.']),
                'code' => 'deposit_already_received',
            ], 400);
        }

        $proofPath = $docMedia->storeDepositProof($request->file('deposit_proof'), $rental->id);
        $bankAccountId = $request->filled('company_bank_account_id') ? (int) $request->input('company_bank_account_id') : null;

        $rental->update([
            'deposit_payment_method' => 'transfer',
            'deposit_company_bank_account_id' => $bankAccountId,
            'deposit_proof_path' => $proofPath,
            'deposit_proof_uploaded_at' => now(),
            'deposit_proof_status' => Rental::PROOF_PENDING,
            'deposit_proof_rejected_reason' => null,
        ]);

        RentalDepositProofNotifier::notifyPendingReview($rental);

        return response()->json([
            'message' => __('rental.public.deposit_proof_uploaded', ['default' => 'Deposit payment proof uploaded successfully.']),
            'booking' => (new MobileRentalBookingResource($rental->fresh(['vehicle', 'partner', 'insurancePackage'])))->resolve(),
        ]);
    }

    public function payBalance(
        Request $request,
        string $token,
        MobileApiIdempotency $idempotency,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        if ($replay = $idempotency->recall($request, 'rental-pay-balance:'.$token)) {
            return $replay;
        }

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        if (! class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            || ! $this->gatewayAvailable()) {
            return response()->json([
                'message' => __('rental.public.gateway_unavailable', ['default' => 'Payment gateway is not available.']),
                'code' => 'gateway_unavailable',
            ], 503);
        }

        if (! class_exists(\Modules\Rental\Support\RentalInvoiceService::class)) {
            return response()->json([
                'message' => __('rental.public.invoice_service_unavailable', ['default' => 'Invoicing service is not available.']),
                'code' => 'invoicing_unavailable',
            ], 503);
        }

        $invoiceService = app(\Modules\Rental\Support\RentalInvoiceService::class);
        $invoices = $invoiceService->invoicesFor($rental);

        $invoiceId = $request->input('invoice_id');
        $invoice = null;

        if ($invoiceId !== null) {
            $invoice = $invoices->firstWhere('id', (int) $invoiceId);
            if ($invoice === null) {
                return response()->json([
                    'message' => __('rental.public.invoice_not_found', ['default' => 'Invoice not found for this rental.']),
                    'code' => 'invoice_not_found',
                ], 404);
            }
        } else {
            // Find first open payable invoice
            $invoice = $invoices->first(
                fn ($inv): bool => in_array($inv->status, [
                    \Modules\Invoicing\Models\Invoice::STATUS_ISSUED,
                    \Modules\Invoicing\Models\Invoice::STATUS_PARTIALLY_PAID,
                ], true) && $inv->balanceDue() > 0
            );

            // If no invoice exists yet, create base invoice if rental has base amount
            if ($invoice === null && (float) $rental->base_amount > 0) {
                $invoice = $invoiceService->invoiceBase($rental);
                if ($invoice !== null && $invoice->status === \Modules\Invoicing\Models\Invoice::STATUS_DRAFT) {
                    $invoice->update(['status' => \Modules\Invoicing\Models\Invoice::STATUS_ISSUED]);
                }
            }
        }

        if ($invoice === null || $invoice->balanceDue() <= 0) {
            return response()->json([
                'message' => __('rental.public.no_outstanding_balance', ['default' => 'No outstanding balance due for payment.']),
                'code' => 'no_balance_due',
            ], 400);
        }

        try {
            $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
                ->createInvoiceCharge($invoice, '/book/rental/booking/'.$rental->public_token.'/finish/invoice');
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        $response = response()->json([
            'payment' => [
                'mode' => 'midtrans_snap',
                'redirect_url' => $charge->redirect_url,
                'snap_token' => $charge->snap_token ?? null,
                'amount' => (float) $invoice->balanceDue(),
                'expires_at' => null,
            ],
            'invoice' => [
                'id' => $invoice->id,
                'code' => $invoice->code,
                'status' => $invoice->status,
                'total' => (float) $invoice->total,
                'balance' => (float) $invoice->balanceDue(),
            ],
            'booking' => (new MobileRentalBookingResource($rental->fresh(['vehicle', 'partner', 'insurancePackage'])))->resolve(),
        ]);

        $idempotency->store($request, 'rental-pay-balance:'.$token, $response);

        return $response;
    }

    public function extend(
        RequestRentalExtensionRequest $request,
        string $token,
        RentalExtensionService $extensions,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        try {
            $extensionRequest = $extensions->requestFromPassenger(
                $rental,
                $request->validated('new_end_date'),
                'mobile',
                $request->validated('notes'),
            );
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        return response()->json([
            'message' => __('rental.public.extend_requested', ['default' => 'Rental extension request submitted successfully.']),
            'extension_request' => [
                'id' => $extensionRequest->id,
                'requested_end_date' => $extensionRequest->requested_end_date?->toDateString(),
                'estimated_periods' => (int) $extensionRequest->estimated_periods,
                'estimated_amount' => (float) $extensionRequest->estimated_amount,
                'status' => $extensionRequest->status,
                'notes' => $extensionRequest->notes,
                'created_at' => $extensionRequest->created_at?->toIso8601String(),
            ],
            'booking' => (new MobileRentalBookingResource($rental->fresh(['vehicle', 'partner', 'insurancePackage'])))->resolve(),
        ], 201);
    }

    public function extensions(Request $request, string $token): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        $requests = $rental->extensionRequests()
            ->latest('id')
            ->get()
            ->map(fn ($r): array => [
                'id' => $r->id,
                'requested_end_date' => $r->requested_end_date?->toDateString(),
                'estimated_periods' => (int) $r->estimated_periods,
                'estimated_amount' => (float) $r->estimated_amount,
                'status' => $r->status,
                'notes' => $r->notes,
                'staff_notes' => $r->staff_notes,
                'reviewed_at' => $r->reviewed_at?->toIso8601String(),
                'created_at' => $r->created_at?->toIso8601String(),
            ]);

        $approvedExtensions = $rental->extensions()
            ->orderBy('id')
            ->get()
            ->map(fn ($ext): array => [
                'id' => $ext->id,
                'original_end_date' => $ext->original_end_date?->toDateString(),
                'new_end_date' => $ext->new_end_date?->toDateString(),
                'extended_periods' => (int) $ext->extended_periods,
                'additional_amount' => (float) $ext->additional_amount,
                'notes' => $ext->notes,
                'created_at' => $ext->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'requests' => $requests,
            'extensions' => $approvedExtensions,
        ]);
    }

    public function checkIn(
        RentalCheckInRequest $request,
        string $token,
        RentalHandoverMedia $handoverMedia,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        if ($rental->status !== Rental::STATUS_CONFIRMED) {
            return response()->json([
                'message' => __('rental.public.pickup_confirmed_only', ['default' => 'Digital check-in is only available for confirmed rentals.']),
                'code' => 'booking_not_confirmed',
            ], 422);
        }

        if ((float) $rental->deposit_amount > 0 && ! $rental->isDepositReceived()) {
            return response()->json([
                'message' => __('rental.public.pickup_deposit_unsettled', ['default' => 'Deposit must be paid before check-in.']),
                'code' => 'deposit_unsettled',
            ], 400);
        }

        $signaturePath = $handoverMedia->storeSignature($request->validated('customer_signature'), 'rental/pickup-signatures');

        $rental->update([
            'pickup_requested_at' => now(),
            'pickup_request_status' => 'pending',
            'pickup_customer_signature_path' => $signaturePath,
            'pickup_terms_agreed' => true,
            'pickup_notes' => $request->input('pickup_notes'),
        ]);

        return response()->json([
            'message' => __('rental.public.pickup_requested', ['default' => 'Check-in request submitted successfully.']),
            'booking' => (new MobileRentalBookingResource($rental->fresh(['vehicle', 'partner', 'insurancePackage'])))->resolve(),
        ]);
    }

    private function assertOptionalOwnership(Request $request, Rental $rental): void
    {
        $phone = $request->attributes->get('mobile_passenger_phone');

        if (! is_string($phone) || $phone === '') {
            $plain = (string) $request->bearerToken();
            if ($plain === '') {
                return;
            }

            $row = app(\Modules\Shuttle\Support\MobilePassengerTokenService::class)->findValid($plain);
            if ($row === null) {
                abort(response()->json([
                    'message' => 'Unauthenticated.',
                    'code' => 'unauthenticated',
                ], 401));
            }
            $phone = $row->phone;
        }

        if ($rental->booker_phone !== null && $rental->booker_phone !== $phone) {
            abort(response()->json([
                'message' => 'Forbidden.',
                'code' => 'forbidden',
            ], 403));
        }
    }
}
