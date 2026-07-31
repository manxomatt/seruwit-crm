<?php

namespace Modules\Receivables\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Invoicing\Models\Invoice;
use Modules\Receivables\Models\GatewayCharge;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Models\PaymentGatewayConfig;

class GatewayCheckoutService
{
    public function config(): PaymentGatewayConfig
    {
        return PaymentGatewayConfig::current();
    }

    public function isAvailable(): bool
    {
        if (! Modules::available('receivables')) {
            return false;
        }

        if (! Schema::hasTable('payment_gateway_configs')) {
            return false;
        }

        return $this->config()->isConfigured();
    }

    /**
     * @param  object{id: int, code: string, partner_id: int, deposit_amount: mixed, deposit_received_at: mixed, status: string, partner?: object|null}  $rental
     */
    public function createRentalDepositCharge(object $rental): GatewayCharge
    {
        $amount = round((float) $rental->deposit_amount, 2);

        if ($amount < 0.01) {
            throw ValidationException::withMessages([
                'deposit' => __('receivables.gateway.deposit_none'),
            ]);
        }

        if ($rental->deposit_received_at !== null) {
            throw ValidationException::withMessages([
                'deposit' => __('receivables.gateway.deposit_already_received'),
            ]);
        }

        if (! in_array($rental->status, ['draft', 'confirmed', 'active'], true)) {
            throw ValidationException::withMessages([
                'deposit' => __('receivables.gateway.deposit_status_invalid'),
            ]);
        }

        $partner = $rental->partner ?? null;

        return $this->createCharge([
            'purpose' => GatewayCharge::PURPOSE_RENTAL_DEPOSIT,
            'rental_id' => $rental->id,
            'partner_id' => $rental->partner_id,
            'amount' => $amount,
            'item_name' => __('receivables.gateway.item_deposit', ['code' => $rental->code]),
            'customer_name' => $partner->name ?? null,
            'customer_email' => $partner->email ?? null,
            'customer_phone' => $partner->phone ?? $partner->mobile ?? null,
            'finish_path' => '/module/rental/'.$rental->id,
        ]);
    }

    public function createInvoiceCharge(Invoice $invoice): GatewayCharge
    {
        $balance = round((float) $invoice->balanceDue(), 2);

        if ($balance < 0.01) {
            throw ValidationException::withMessages([
                'invoice' => __('receivables.gateway.invoice_nothing_due'),
            ]);
        }

        if (! in_array($invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID], true)) {
            throw ValidationException::withMessages([
                'invoice' => __('receivables.gateway.invoice_not_open'),
            ]);
        }

        $invoice->loadMissing('partner');

        return $this->createCharge([
            'purpose' => GatewayCharge::PURPOSE_INVOICE,
            'invoice_id' => $invoice->id,
            'partner_id' => $invoice->partner_id,
            'amount' => $balance,
            'item_name' => __('receivables.gateway.item_invoice', ['code' => $invoice->code]),
            'customer_name' => $invoice->partner?->name,
            'customer_email' => $invoice->partner?->email,
            'customer_phone' => $invoice->partner?->phone ?? $invoice->partner?->mobile,
            'finish_path' => '/module/invoicing/invoices/'.$invoice->id,
        ]);
    }

    /**
     * @param  object{id: int, booking_number: string, total_fare: mixed, status: string, public_token: string|null, booker_phone?: string|null, hold_expires_at?: mixed, seats_held?: bool}  $booking
     */
    public function createShuttleBookingCharge(object $booking): GatewayCharge
    {
        $fare = round((float) $booking->total_fare, 2);
        $amount = $fare;

        if (class_exists(\Modules\Shuttle\Support\ShuttleAccountingService::class)) {
            $split = app(\Modules\Shuttle\Support\ShuttleAccountingService::class)->splitFare($fare);
            $amount = round((float) $split['paid'], 2);
        }

        if ($amount < 0.01) {
            throw ValidationException::withMessages([
                'booking' => __('receivables.gateway.shuttle_nothing_due'),
            ]);
        }

        if ($booking->status !== 'draft') {
            throw ValidationException::withMessages([
                'booking' => __('receivables.gateway.shuttle_not_open'),
            ]);
        }

        return $this->createCharge([
            'purpose' => GatewayCharge::PURPOSE_SHUTTLE_BOOKING,
            'shuttle_booking_id' => $booking->id,
            'partner_id' => null,
            'amount' => $amount,
            'item_name' => __('receivables.gateway.item_shuttle', ['code' => $booking->booking_number]),
            'customer_name' => 'Passenger',
            'customer_email' => null,
            'customer_phone' => $booking->booker_phone ?? null,
            'finish_path' => '/book/shuttle/ticket/'.($booking->public_token ?? ''),
        ]);
    }

    /**
     * @param  array{
     *     purpose: string,
     *     rental_id?: int|null,
     *     invoice_id?: int|null,
     *     shuttle_booking_id?: int|null,
     *     partner_id?: int|null,
     *     amount: float,
     *     item_name: string,
     *     customer_name?: string|null,
     *     customer_email?: string|null,
     *     customer_phone?: string|null,
     *     finish_path: string
     * }  $input
     */
    public function createCharge(array $input): GatewayCharge
    {
        $config = $this->config();

        if (! $config->isConfigured()) {
            throw ValidationException::withMessages([
                'gateway' => __('receivables.gateway.not_configured'),
            ]);
        }

        $orderId = $this->nextOrderId($input['purpose']);
        $finishUrl = url($input['finish_path']);

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) round($input['amount']),
            ],
            'item_details' => [[
                'id' => $input['purpose'],
                'price' => (int) round($input['amount']),
                'quantity' => 1,
                'name' => Str::limit($input['item_name'], 50, ''),
            ]],
            'customer_details' => array_filter([
                'first_name' => Str::limit((string) ($input['customer_name'] ?: 'Customer'), 50, ''),
                'email' => $input['customer_email'] ?: null,
                'phone' => $input['customer_phone'] ?: null,
            ]),
            'callbacks' => [
                'finish' => $finishUrl,
            ],
        ];

        $client = new MidtransClient($config);
        $snap = $client->createSnapTransaction($payload);

        return GatewayCharge::query()->create([
            'purpose' => $input['purpose'],
            'rental_id' => $input['rental_id'] ?? null,
            'invoice_id' => $input['invoice_id'] ?? null,
            'shuttle_booking_id' => $input['shuttle_booking_id'] ?? null,
            'partner_id' => $input['partner_id'] ?? null,
            'order_id' => $orderId,
            'amount' => $input['amount'],
            'currency' => 'IDR',
            'status' => GatewayCharge::STATUS_PENDING,
            'snap_token' => $snap['token'],
            'redirect_url' => $snap['redirect_url'],
            'raw_request' => $payload,
            'created_by' => Auth::id(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $notification
     */
    public function handleNotification(array $notification): GatewayCharge
    {
        $config = $this->config();
        $client = new MidtransClient($config);

        if (! $client->signatureIsValid($notification)) {
            throw ValidationException::withMessages([
                'signature_key' => __('receivables.gateway.invalid_signature'),
            ]);
        }

        $orderId = (string) ($notification['order_id'] ?? '');

        return DB::transaction(function () use ($orderId, $notification): GatewayCharge {
            /** @var GatewayCharge $charge */
            $charge = GatewayCharge::query()
                ->where('order_id', $orderId)
                ->lockForUpdate()
                ->firstOrFail();

            $charge->update([
                'raw_notification' => $notification,
                'payment_type' => $notification['payment_type'] ?? $charge->payment_type,
                'external_transaction_id' => $notification['transaction_id'] ?? $charge->external_transaction_id,
                'fraud_status' => $notification['fraud_status'] ?? $charge->fraud_status,
            ]);

            $transactionStatus = (string) ($notification['transaction_status'] ?? '');
            $fraudStatus = (string) ($notification['fraud_status'] ?? '');

            if (in_array($transactionStatus, ['deny', 'cancel', 'failure'], true)) {
                $charge->update(['status' => GatewayCharge::STATUS_FAILED]);

                return $charge->fresh();
            }

            if ($transactionStatus === 'expire') {
                $charge->update(['status' => GatewayCharge::STATUS_EXPIRED]);

                return $charge->fresh();
            }

            $isPaid = $transactionStatus === 'settlement'
                || ($transactionStatus === 'capture' && ($fraudStatus === '' || $fraudStatus === 'accept'));

            if (! $isPaid) {
                return $charge->fresh();
            }

            if ($charge->isPaid()) {
                return $charge->fresh();
            }

            $this->fulfillPaidCharge($charge, $notification);

            $charge->update([
                'status' => GatewayCharge::STATUS_PAID,
                'paid_at' => now(),
            ]);

            return $charge->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $notification
     */
    private function fulfillPaidCharge(GatewayCharge $charge, array $notification): void
    {
        $method = $this->mapPaymentType((string) ($notification['payment_type'] ?? ''));
        $reference = (string) ($notification['transaction_id'] ?? $charge->order_id);

        if ($charge->purpose === GatewayCharge::PURPOSE_RENTAL_DEPOSIT) {
            if (! class_exists(\Modules\Rental\Models\Rental::class)
                || ! class_exists(\Modules\Rental\Support\RentalAccountingService::class)) {
                return;
            }

            $rental = \Modules\Rental\Models\Rental::query()->lockForUpdate()->findOrFail($charge->rental_id);

            if ($rental->status === \Modules\Rental\Models\Rental::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'rental' => __('receivables.gateway.rental_cancelled'),
                ]);
            }

            app(\Modules\Rental\Support\RentalAccountingService::class)->receiveDeposit($rental, [
                'payment_method' => $method,
            ]);

            return;
        }

        if ($charge->purpose === GatewayCharge::PURPOSE_INVOICE) {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($charge->invoice_id);
            $amount = round(min((float) $charge->amount, $invoice->balanceDue()), 2);

            if ($amount < 0.01) {
                return;
            }

            PaymentRecorder::record([
                'partner_id' => $invoice->partner_id,
                'payment_date' => now()->toDateString(),
                'amount' => $amount,
                'type' => Payment::TYPE_SETTLEMENT,
                'method' => $method,
                'reference_number' => $reference,
                'notes' => __('receivables.gateway.payment_note', ['order' => $charge->order_id]),
                'allocations' => [[
                    'invoice_id' => $invoice->id,
                    'amount' => $amount,
                ]],
            ]);
        }

        if ($charge->purpose === GatewayCharge::PURPOSE_SHUTTLE_BOOKING) {
            if (! class_exists(\Modules\Shuttle\Models\ShuttleBooking::class)
                || ! class_exists(\Modules\Shuttle\Support\PassengerBookingService::class)) {
                return;
            }

            $booking = \Modules\Shuttle\Models\ShuttleBooking::query()
                ->lockForUpdate()
                ->findOrFail($charge->shuttle_booking_id);

            app(\Modules\Shuttle\Support\PassengerBookingService::class)->fulfillGatewayPayment($booking, [
                'payment_method' => $method,
            ]);
        }
    }

    private function mapPaymentType(string $paymentType): string
    {
        return match ($paymentType) {
            'credit_card' => Payment::METHOD_CARD,
            'bank_transfer', 'echannel', 'permata', 'bca_va', 'bni_va', 'bri_va', 'cimb_va', 'other_va' => Payment::METHOD_TRANSFER,
            'qris', 'gopay', 'shopeepay', 'other_qris' => Payment::METHOD_QRIS,
            default => Payment::METHOD_OTHER,
        };
    }

    private function nextOrderId(string $purpose): string
    {
        $prefix = match ($purpose) {
            GatewayCharge::PURPOSE_RENTAL_DEPOSIT => 'RDEP',
            GatewayCharge::PURPOSE_SHUTTLE_BOOKING => 'SBOOK',
            default => 'RINV',
        };

        return sprintf('%s-%s-%s', $prefix, now()->format('ymdHis'), Str::upper(Str::random(4)));
    }
}
