<?php

namespace Modules\Rental\Support;

use Illuminate\Validation\ValidationException;
use Modules\Partners\Models\Partner;

/**
 * Gates whether a partner may confirm a rental booking.
 */
class RentalEligibility
{
    /**
     * @throws ValidationException
     */
    public function assertCanConfirm(?Partner $partner): void
    {
        if ($partner === null) {
            throw ValidationException::withMessages([
                'partner_id' => __('rental.errors.partner_missing'),
            ]);
        }

        if ($partner->status !== 'active') {
            throw ValidationException::withMessages([
                'partner_id' => __('rental.errors.partner_inactive'),
            ]);
        }

        if ($partner->is_blacklisted) {
            throw ValidationException::withMessages([
                'partner_id' => __('rental.errors.partner_blacklisted', [
                    'reason' => $partner->blacklist_reason ?: __('rental.errors.partner_blacklisted_default'),
                ]),
            ]);
        }

        if ($partner->license_expires_at !== null && $partner->license_expires_at->lt(now()->startOfDay())) {
            throw ValidationException::withMessages([
                'partner_id' => __('rental.errors.partner_license_expired', [
                    'date' => $partner->license_expires_at->toDateString(),
                ]),
            ]);
        }
    }
}
