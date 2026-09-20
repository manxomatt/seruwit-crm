<?php

namespace Modules\Rental\Support;

use DateTimeInterface;
use Illuminate\Support\Carbon;
use Modules\Rental\Models\Rental;

/**
 * One-line status context so Confirm (booking issued) is not mistaken for
 * Checkout (keys handed over). Display times are shown in WIB.
 */
class RentalStatusHint
{
    public const AUDIENCE_STAFF = 'staff';

    public const AUDIENCE_PASSENGER = 'passenger';

    private const DISPLAY_TIMEZONE = 'Asia/Jakarta';

    public function for(Rental $rental, string $audience = self::AUDIENCE_STAFF): ?string
    {
        $passenger = $audience === self::AUDIENCE_PASSENGER;

        return match ($rental->status) {
            Rental::STATUS_PENDING_RESERVED => $this->pendingReserved($rental),
            Rental::STATUS_CONFIRMED => $this->confirmed($rental, $passenger),
            Rental::STATUS_ACTIVE => $this->active($rental, $passenger),
            default => null,
        };
    }

    private function pendingReserved(Rental $rental): string
    {
        $until = $this->formatDateTime($rental->reserved_until);

        if ($until === null) {
            return __('rental.status_hint.pending_reserved_open');
        }

        return __('rental.status_hint.pending_reserved', ['until' => $until]);
    }

    private function confirmed(Rental $rental, bool $passenger): string
    {
        if ($rental->pickup_requested_at !== null) {
            return $passenger
                ? __('rental.status_hint.confirmed_awaiting_handover_passenger')
                : __('rental.status_hint.confirmed_awaiting_handover');
        }

        return __('rental.status_hint.confirmed');
    }

    private function active(Rental $rental, bool $passenger): string
    {
        $until = $this->formatDate($rental->end_date);

        if ($until === null) {
            return $passenger
                ? __('rental.status_hint.active_passenger_open')
                : __('rental.status_hint.active_open');
        }

        return $passenger
            ? __('rental.status_hint.active_passenger', ['until' => $until])
            : __('rental.status_hint.active', ['until' => $until]);
    }

    private function formatDateTime(?DateTimeInterface $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse($value)
            ->timezone(self::DISPLAY_TIMEZONE)
            ->format('d-m-Y H:i');
    }

    private function formatDate(?DateTimeInterface $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse($value->format('Y-m-d'))->format('d-m-Y');
    }
}
