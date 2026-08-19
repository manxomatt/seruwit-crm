<?php

namespace Modules\Fleet\Support;

class VehicleRentalClass
{
    public const ECONOMY = 'economy';

    public const MPV = 'mpv';

    public const SUV = 'suv';

    public const VAN = 'van';

    public const PREMIUM = 'premium';

    public const OTHER = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return [
            self::ECONOMY,
            self::MPV,
            self::SUV,
            self::VAN,
            self::PREMIUM,
            self::OTHER,
        ];
    }

    public static function label(string $value): string
    {
        return __('fleet.rental_class.'.$value);
    }
}
