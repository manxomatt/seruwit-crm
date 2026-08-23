<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;

/**
 * Shared confirm / fee / pending-reserved promotion logic for staff + mobile + gateway.
 */
class RentalConfirmationService
{
    public function __construct(
        private readonly RentalInvoiceService $invoices,
        private readonly RentalAccountingService $accounting,
        private readonly RentalBookingExtrasService $bookingExtras,
        private readonly RentalEligibility $eligibility,
        private readonly RentalMailer $mailer,
        private readonly RentalBookingPolicy $policy,
    ) {}

    /**
     * Confirm a draft / pending / pending_reserved rental into Open (confirmed).
     *
     * @param  array{payment_method?: string|null, company_bank_account_id?: int|null, deposit_collected?: bool, confirmed_by?: int|null}  $options
     */
    public function confirm(Rental $rental, array $options = []): Rental
    {
        if (! in_array($rental->status, Rental::confirmableStatuses(), true)) {
            throw ValidationException::withMessages([
                'status' => __('rental.errors.confirm_draft_only'),
            ]);
        }

        $rental->loadMissing(['partner', 'vehicle']);
        $this->eligibility->assertCanConfirm($rental->partner);

        $availability = Rental::vehicleAvailabilityReasons(
            $rental->vehicle,
            $rental->start_date->toDateString(),
            $rental->end_date->toDateString(),
            $rental->id,
        );

        if ($availability !== []) {
            throw ValidationException::withMessages([
                'vehicle_id' => $availability[0],
            ]);
        }

        return DB::transaction(function () use ($rental, $options): Rental {
            $rental->update([
                'status' => Rental::STATUS_CONFIRMED,
                'confirmed_by' => $options['confirmed_by'] ?? null,
                'confirmed_at' => now(),
                'reserved_until' => null,
            ]);

            if ((float) $rental->deposit_amount <= 0) {
                $rental->settleDeposit([
                    'deposit_applied_amount' => 0,
                    'deposit_refunded_amount' => 0,
                ]);
            } elseif ($rental->deposit_received_at !== null) {
                // Already collected (e.g. Midtrans before confirm).
            } elseif (! empty($options['deposit_collected'])) {
                $this->accounting->receiveDeposit($rental->fresh(), [
                    'payment_method' => $options['payment_method'] ?? 'cash',
                    'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                ]);
            }

            $this->bookingExtras->applyOnConfirm($rental->fresh(['insurancePackage']));
            $this->invoices->invoiceBase($rental->fresh());
            $this->accounting->issueDraftInvoices($rental->fresh());

            $this->mailer->notify(
                $rental->fresh(['vehicle', 'partner']),
                RentalLifecycleMailNotification::EVENT_CONFIRMED,
            );

            return $rental->fresh(['vehicle', 'partner', 'insurancePackage', 'pickupLocation', 'returnLocation']);
        });
    }

    /**
     * After online deposit payment, promote pending holds to Open.
     */
    public function confirmAfterPaymentIfPending(Rental $rental): Rental
    {
        if (! in_array($rental->status, [Rental::STATUS_PENDING, Rental::STATUS_PENDING_RESERVED], true)) {
            return $rental;
        }

        return $this->confirm($rental, [
            'confirmed_by' => null,
            'deposit_collected' => false,
        ]);
    }

    /**
     * After an online invoice payment settles in full, promote the linked pending
     * rental to confirmed. Used for zero-deposit online orders that gate confirmation
     * behind full upfront payment. No-op unless the invoice belongs to a rental,
     * is fully paid, and the rental is still pending.
     */
    public function confirmPendingForPaidInvoice(Invoice $invoice): void
    {
        if ((float) $invoice->balanceDue() > 0.0) {
            return;
        }

        $morph = (new RentalCharge)->getMorphClass();
        $chargeId = $invoice->lines()
            ->where('source_type', $morph)
            ->value('source_id');

        if ($chargeId === null) {
            return;
        }

        $rentalId = RentalCharge::query()->whereKey($chargeId)->value('rental_id');

        if ($rentalId === null) {
            return;
        }

        $rental = Rental::query()->find($rentalId);

        if ($rental !== null) {
            $this->confirmAfterPaymentIfPending($rental);
        }
    }

    /**
     * Cancel with optional cancellation fee → cancelled or cancelled_paid.
     */
    public function cancel(Rental $rental, string $reason, bool $chargeFee = false): Rental
    {
        if (! in_array($rental->status, Rental::cancellableStatuses(), true)) {
            throw ValidationException::withMessages([
                'status' => __('rental.errors.cancel_draft_confirmed_only'),
            ]);
        }

        return DB::transaction(function () use ($rental, $reason, $chargeFee): Rental {
            $this->accounting->refundDepositOnCancel($rental->fresh());
            $this->accounting->settleInvoicesOnCancel($rental->fresh());

            $status = Rental::STATUS_CANCELLED;

            if ($chargeFee) {
                $fee = $this->policy->cancellationFeeFor($rental);
                if ($fee >= 0.01) {
                    $this->invoiceFee($rental, RentalAddonCatalog::CANCELLATION_FEE, $fee, __('rental.addon.codes.cancellation_fee'));
                    $status = Rental::STATUS_CANCELLED_PAID;
                }
            }

            $rental->update([
                'status' => $status,
                'cancelled_reason' => $reason,
                'cancelled_at' => now(),
                'reserved_until' => null,
            ]);

            return $rental->fresh();
        });
    }

    /**
     * Mark no-show (optionally charge fee) from confirmed Open bookings.
     */
    public function markNoShow(Rental $rental, bool $chargeFee = false, ?string $reason = null): Rental
    {
        if ($rental->status !== Rental::STATUS_CONFIRMED) {
            throw ValidationException::withMessages([
                'status' => __('rental.errors.no_show_confirmed_only'),
            ]);
        }

        return DB::transaction(function () use ($rental, $chargeFee, $reason): Rental {
            $this->accounting->refundDepositOnCancel($rental->fresh());
            $this->accounting->settleInvoicesOnCancel($rental->fresh());

            $status = Rental::STATUS_NO_SHOW;

            if ($chargeFee) {
                $fee = $this->policy->noShowFeeFor($rental);
                if ($fee >= 0.01) {
                    $this->invoiceFee($rental, RentalAddonCatalog::NO_SHOW_FEE, $fee, __('rental.addon.codes.no_show_fee'));
                    $status = Rental::STATUS_NO_SHOW_PAID;
                }
            }

            $rental->update([
                'status' => $status,
                'no_show_at' => now(),
                'cancelled_reason' => $reason,
                'reserved_until' => null,
            ]);

            return $rental->fresh();
        });
    }

    /**
     * Charge fee later: cancelled → cancelled_paid, no_show → no_show_paid.
     */
    public function markFeePaid(Rental $rental): Rental
    {
        return DB::transaction(function () use ($rental): Rental {
            if ($rental->status === Rental::STATUS_CANCELLED) {
                $fee = $this->policy->cancellationFeeFor($rental);
                if ($fee < 0.01) {
                    throw ValidationException::withMessages([
                        'fee' => __('rental.errors.fee_amount_zero'),
                    ]);
                }
                $this->invoiceFee($rental, RentalAddonCatalog::CANCELLATION_FEE, $fee, __('rental.addon.codes.cancellation_fee'));
                $rental->update(['status' => Rental::STATUS_CANCELLED_PAID]);

                return $rental->fresh();
            }

            if ($rental->status === Rental::STATUS_NO_SHOW) {
                $fee = $this->policy->noShowFeeFor($rental);
                if ($fee < 0.01) {
                    throw ValidationException::withMessages([
                        'fee' => __('rental.errors.fee_amount_zero'),
                    ]);
                }
                $this->invoiceFee($rental, RentalAddonCatalog::NO_SHOW_FEE, $fee, __('rental.addon.codes.no_show_fee'));
                $rental->update(['status' => Rental::STATUS_NO_SHOW_PAID]);

                return $rental->fresh();
            }

            throw ValidationException::withMessages([
                'status' => __('rental.errors.mark_fee_paid_status_only'),
            ]);
        });
    }

    private function invoiceFee(Rental $rental, string $addonCode, float $amount, string $description): void
    {
        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_ADDON,
            'addon_code' => $addonCode,
            'amount' => $amount,
            'description' => $description,
        ]);

        $rental->recalculateTotalAmount();
        $this->invoices->invoiceAddon($rental->fresh(), $charge);
        $this->accounting->issueDraftInvoices($rental->fresh());
    }
}
