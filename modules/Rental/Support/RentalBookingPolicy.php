<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use Carbon\Carbon;
use Modules\Rental\Models\Rental;

/**
 * HQ-style booking policy knobs (TTL + cancel/no-show fees) from Settings UI.
 */
class RentalBookingPolicy
{
    public const SETTING_PENDING_RESERVED_TTL = 'rental.pending_reserved_ttl_minutes';

    public const SETTING_CANCELLATION_FEE_TYPE = 'rental.cancellation_fee_type';

    public const SETTING_CANCELLATION_FEE_AMOUNT = 'rental.cancellation_fee_amount';

    public const SETTING_NO_SHOW_FEE_TYPE = 'rental.no_show_fee_type';

    public const SETTING_NO_SHOW_FEE_AMOUNT = 'rental.no_show_fee_amount';

    public const SETTING_PASSENGER_FREE_CANCEL_HOURS = 'rental.passenger_free_cancel_hours';

    public const FEE_TYPE_FIXED = 'fixed';

    public const FEE_TYPE_PERCENT = 'percent';

    public function pendingReservedTtlMinutes(): int
    {
        return max(1, (int) Setting::getValue(self::SETTING_PENDING_RESERVED_TTL, '120'));
    }

    public function reservedUntilTimestamp(): \Carbon\CarbonInterface
    {
        return now()->addMinutes($this->pendingReservedTtlMinutes());
    }

    /**
     * Hours before rental start_date (start of day) when passenger cancel stays free.
     * After this cutoff, passenger cancel may charge the configured cancellation fee.
     */
    public function passengerFreeCancelHours(): int
    {
        return max(0, (int) Setting::getValue(self::SETTING_PASSENGER_FREE_CANCEL_HOURS, '24'));
    }

    public function cancellationFeeFor(Rental $rental): float
    {
        return $this->resolveFee(
            (string) Setting::getValue(self::SETTING_CANCELLATION_FEE_TYPE, self::FEE_TYPE_FIXED),
            (float) Setting::getValue(self::SETTING_CANCELLATION_FEE_AMOUNT, '0'),
            $rental,
        );
    }

    public function noShowFeeFor(Rental $rental): float
    {
        return $this->resolveFee(
            (string) Setting::getValue(self::SETTING_NO_SHOW_FEE_TYPE, self::FEE_TYPE_FIXED),
            (float) Setting::getValue(self::SETTING_NO_SHOW_FEE_AMOUNT, '0'),
            $rental,
        );
    }

    /**
     * Passenger self-serve cancel rules for web/mobile.
     *
     * @return array{
     *     can_cancel: bool,
     *     charge_fee: bool,
     *     fee_amount: float,
     *     free_until: string|null,
     *     reason: string|null
     * }
     */
    public function passengerCancelAssessment(Rental $rental): array
    {
        if (! in_array($rental->status, Rental::cancellableStatuses(), true)) {
            return [
                'can_cancel' => false,
                'charge_fee' => false,
                'fee_amount' => 0.0,
                'free_until' => null,
                'reason' => __('rental.public.cancel_not_allowed'),
            ];
        }

        // Unpaid holds: always free to release the unit.
        if (in_array($rental->status, [
            Rental::STATUS_DRAFT,
            Rental::STATUS_PENDING,
            Rental::STATUS_PENDING_RESERVED,
        ], true)) {
            return [
                'can_cancel' => true,
                'charge_fee' => false,
                'fee_amount' => 0.0,
                'free_until' => null,
                'reason' => null,
            ];
        }

        $freeUntil = $this->passengerFreeCancelUntil($rental);
        $fee = $this->cancellationFeeFor($rental);
        $withinPaidWindow = $freeUntil !== null && now()->greaterThanOrEqualTo($freeUntil);
        $chargeFee = $withinPaidWindow && $fee >= 0.01;

        return [
            'can_cancel' => true,
            'charge_fee' => $chargeFee,
            'fee_amount' => $chargeFee ? $fee : 0.0,
            'free_until' => $freeUntil?->toIso8601String(),
            'reason' => $chargeFee
                ? __('rental.public.cancel_fee_applies', [
                    'amount' => number_format($fee, 0, ',', '.'),
                ])
                : null,
        ];
    }

    public function passengerFreeCancelUntil(Rental $rental): ?Carbon
    {
        if ($rental->start_date === null) {
            return null;
        }

        $hours = $this->passengerFreeCancelHours();

        return $rental->start_date->copy()->startOfDay()->subHours($hours);
    }

    private function resolveFee(string $type, float $amount, Rental $rental): float
    {
        if ($amount <= 0) {
            return 0.0;
        }

        if ($type === self::FEE_TYPE_PERCENT) {
            return round(((float) $rental->base_amount) * ($amount / 100), 2);
        }

        return round($amount, 2);
    }
}
