<?php

namespace Modules\Rental\Support;

use Illuminate\Validation\ValidationException;
use Modules\Rental\Models\Rental;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;

/**
 * Physical handover gate. Never issues a booking — that is
 * {@see RentalConfirmationService::confirm()}.
 */
class RentalHandoverService
{
    public function __construct(
        private readonly RentalLifecycleGate $gate,
        private readonly RentalInvoiceService $invoices,
        private readonly RentalMailer $mailer,
    ) {}

    public function assertPaymentAllowsHandover(Rental $rental): void
    {
        if ((float) $rental->deposit_amount > 0 && ! $rental->isDepositReceived()) {
            throw ValidationException::withMessages([
                'deposit' => __('rental.errors.checkout_deposit_required'),
            ]);
        }

        if ((float) $rental->deposit_amount <= 0 && $rental->deposit_proof_status !== Rental::PROOF_APPROVED) {
            $paymentSummary = $this->invoices->paymentSummary($rental);
            if ($paymentSummary['balance_due'] > 0 || in_array($paymentSummary['status'], ['unpaid', 'partial', 'draft'], true)) {
                throw ValidationException::withMessages([
                    'payment' => __('rental.errors.checkout_prepayment_required'),
                ]);
            }
        }
    }

    /**
     * Hand the vehicle to the customer. Requires an already-issued booking.
     *
     * @param  array{
     *     start_odometer?: int|null,
     *     start_fuel_level?: string|null,
     *     checkout_checklist?: array<string, bool>|null,
     *     checkout_notes?: string|null,
     *     checkout_photos: list<string>,
     *     checkout_signature_path?: string|null,
     *     checkout_staff_signature_path?: string|null
     * }  $handover
     */
    public function handOver(Rental $rental, array $handover): Rental
    {
        $this->gate->assertCanHandOver($rental);
        $this->assertPaymentAllowsHandover($rental);

        $rental->update([
            'status' => Rental::STATUS_ACTIVE,
            'checked_out_at' => now(),
            'start_odometer' => $handover['start_odometer'] ?? null,
            'start_fuel_level' => $handover['start_fuel_level'] ?? null,
            'checkout_checklist' => RentalHandoverChecklist::normalize($handover['checkout_checklist'] ?? null),
            'checkout_notes' => $handover['checkout_notes'] ?? null,
            'checkout_photos' => $handover['checkout_photos'],
            'checkout_signature_path' => $handover['checkout_signature_path']
                ?? $rental->pickup_customer_signature_path
                ?? $rental->checkout_signature_path,
            'checkout_staff_signature_path' => $handover['checkout_staff_signature_path'] ?? null,
            'checkout_signed_at' => now(),
        ]);

        $this->mailer->notify(
            $rental->fresh(['vehicle', 'partner']),
            RentalLifecycleMailNotification::EVENT_CHECKED_OUT,
        );

        return $rental->fresh();
    }
}
