<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
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
