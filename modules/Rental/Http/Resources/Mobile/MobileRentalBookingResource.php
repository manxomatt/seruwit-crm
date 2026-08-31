<?php

namespace Modules\Rental\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Rental\Models\Rental;

/**
 * @mixin Rental
 */
class MobileRentalBookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Rental $rental */
        $rental = $this->resource;
        $token = (string) $rental->public_token;

        return [
            'code' => $rental->code,
            'public_token' => $token,
            'status' => $rental->status,
            'channel' => $rental->channel,
            'booker_phone' => $rental->booker_phone,
            'start_date' => $rental->start_date?->toDateString(),
            'end_date' => $rental->end_date?->toDateString(),
            'period_type' => $rental->period_type,
            'total_periods' => (int) $rental->total_periods,
            'rate_per_period' => (float) $rental->rate_per_period,
            'base_amount' => (float) $rental->base_amount,
            'deposit_amount' => (float) $rental->deposit_amount,
            'deposit_received' => $rental->isDepositReceived(),
            'deposit_status' => $rental->deposit_status,
            'deposit_payment_method' => $rental->deposit_payment_method,
            'deposit_proof' => $rental->deposit_proof_path ? [
                'path' => $rental->deposit_proof_path,
                'url' => app(\Modules\Rental\Support\RentalPassengerDocMedia::class)->publicUrl($rental->deposit_proof_path),
                'status' => $rental->deposit_proof_status,
                'uploaded_at' => $rental->deposit_proof_uploaded_at?->toIso8601String(),
                'rejected_reason' => $rental->deposit_proof_rejected_reason,
                'company_bank_account_id' => $rental->deposit_company_bank_account_id,
            ] : null,
            'one_way_fee_amount' => $rental->one_way_fee_amount !== null ? (float) $rental->one_way_fee_amount : null,
            'total_amount' => (float) $rental->total_amount,
            'pickup_location' => $rental->pickup_location,
            'return_location' => $rental->return_location,
            'pickup_location_id' => $rental->pickup_location_id,
            'return_location_id' => $rental->return_location_id,
            'insurance_package' => $rental->insurancePackage ? [
                'id' => $rental->insurancePackage->id,
                'code' => $rental->insurancePackage->code,
                'name' => $rental->insurancePackage->name,
                'amount' => (float) $rental->insurancePackage->amount,
            ] : null,
            'vehicle' => $rental->vehicle ? (new MobileRentalVehicleResource($rental->vehicle))->resolve() : null,
            'cancelled_reason' => $rental->cancelled_reason,
            'confirmed_at' => $rental->confirmed_at?->toIso8601String(),
            'reserved_until' => $rental->reserved_until?->toIso8601String(),
            'pickup_request' => [
                'requested_at' => $rental->pickup_requested_at?->toIso8601String(),
                'status' => $rental->pickup_request_status,
                'customer_signature_url' => app(\Modules\Rental\Support\RentalPassengerDocMedia::class)->publicUrl($rental->pickup_customer_signature_path),
                'terms_agreed' => (bool) $rental->pickup_terms_agreed,
                'notes' => $rental->pickup_notes,
                'can_check_in' => $rental->status === Rental::STATUS_CONFIRMED && empty($rental->pickup_requested_at) && $this->isUpfrontPaid($rental),
            ],
            'pending_extension_request' => $this->pendingExtensionRequest($rental),
            'payment' => $this->paymentSummary($rental),
            'booking_path' => '/api/mobile/v1/rental/bookings/'.$token,
        ];
    }

    private function isUpfrontPaid(Rental $rental): bool
    {
        if ((float) $rental->deposit_amount > 0) {
            return $rental->isDepositReceived();
        }

        return $rental->deposit_proof_status === Rental::PROOF_APPROVED || $rental->status === Rental::STATUS_CONFIRMED;
    }

    /**
     * @return array{id: int, requested_end_date: string|null, estimated_periods: int, estimated_amount: float, status: string}|null
     */
    private function pendingExtensionRequest(Rental $rental): ?array
    {
        if (! class_exists(\Modules\Rental\Models\RentalExtensionRequest::class)) {
            return null;
        }

        $request = \Modules\Rental\Models\RentalExtensionRequest::query()
            ->where('rental_id', $rental->id)
            ->where('status', \Modules\Rental\Models\RentalExtensionRequest::STATUS_PENDING)
            ->latest('id')
            ->first();

        if ($request === null) {
            return null;
        }

        return [
            'id' => (int) $request->id,
            'requested_end_date' => $request->requested_end_date?->toDateString(),
            'estimated_periods' => (int) $request->estimated_periods,
            'estimated_amount' => (float) $request->estimated_amount,
            'status' => (string) $request->status,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentSummary(Rental $rental): array
    {
        if (! class_exists(\Modules\Rental\Support\RentalInvoiceService::class)) {
            return [
                'status' => 'unpaid',
                'total_invoiced' => 0.0,
                'total_paid' => 0.0,
                'balance_due' => (float) $rental->total_amount,
                'can_pay_balance' => false,
                'invoices' => [],
            ];
        }

        $summary = app(\Modules\Rental\Support\RentalInvoiceService::class)->paymentSummary($rental);
        $invoices = collect($summary['invoices'])
            ->map(fn (array $inv): array => [
                'id' => (int) $inv['id'],
                'code' => (string) $inv['code'],
                'status' => (string) $inv['status'],
                'total' => (float) $inv['total'],
                'balance' => (float) $inv['balance'],
            ])
            ->values()
            ->all();

        $payable = collect($invoices)->filter(fn (array $inv): bool => in_array($inv['status'], ['issued', 'partially_paid'], true) && $inv['balance'] > 0);

        return [
            'status' => (string) $summary['status'],
            'total_invoiced' => (float) $summary['total_invoiced'],
            'total_paid' => (float) $summary['total_paid'],
            'balance_due' => (float) $summary['balance_due'],
            'can_pay_balance' => $payable->isNotEmpty(),
            'invoices' => $invoices,
        ];
    }
}
