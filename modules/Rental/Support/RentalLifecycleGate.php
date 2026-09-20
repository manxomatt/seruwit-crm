<?php

namespace Modules\Rental\Support;

use Illuminate\Validation\ValidationException;
use Modules\Rental\Models\Rental;

/**
 * Two-gate rental lifecycle.
 *
 * Issuing a booking (confirm) locks the calendar and invoices. Handing over
 * the vehicle (checkout) is a later physical step. No-show only exists in
 * between those gates.
 */
class RentalLifecycleGate
{
    public function assertCanIssueBooking(Rental $rental): void
    {
        if (! in_array($rental->status, Rental::confirmableStatuses(), true)) {
            throw ValidationException::withMessages([
                'status' => __('rental.errors.confirm_draft_only'),
            ]);
        }
    }

    public function assertCanHandOver(Rental $rental): void
    {
        if ($rental->status !== Rental::STATUS_CONFIRMED) {
            throw ValidationException::withMessages([
                'status' => __('rental.errors.checkout_confirmed_only'),
            ]);
        }
    }

    public function assertCanMarkNoShow(Rental $rental): void
    {
        if ($rental->status !== Rental::STATUS_CONFIRMED) {
            throw ValidationException::withMessages([
                'status' => __('rental.errors.no_show_confirmed_only'),
            ]);
        }
    }

    public function assertCanSignContract(Rental $rental): void
    {
        if ($rental->status !== Rental::STATUS_CONFIRMED) {
            throw ValidationException::withMessages([
                'status' => __('rental.public.pickup_confirmed_only'),
            ]);
        }
    }
}
