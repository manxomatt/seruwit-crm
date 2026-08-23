<?php

namespace Modules\Fleet\Support;

use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Str;

class VehicleRentalClass
{
    public const ECONOMY = 'economy';

    public const MPV = 'mpv';

    public const SUV = 'suv';

    public const VAN = 'van';

    public const PREMIUM = 'premium';

    public const TRUCK = 'truck';

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
            self::TRUCK,
            self::OTHER,
        ];
    }

    public static function label(string $value): string
    {
        $key = 'fleet.rental_class.'.$value;

        // rental_class is free text on legacy records (e.g. "truck"), so values
        // outside the defined set have no translation. Fall back to a humanized
        // label instead of leaking the raw translation key to the UI.
        return Lang::has($key) ? __($key) : Str::title($value);
    }
}
