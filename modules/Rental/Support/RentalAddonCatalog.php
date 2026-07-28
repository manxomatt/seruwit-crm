<?php

namespace Modules\Rental\Support;

class RentalAddonCatalog
{
    public const INSURANCE = 'insurance';

    public const BABY_SEAT = 'baby_seat';

    public const CHAUFFEUR = 'chauffeur';

    public const DELIVERY = 'delivery';

    public const FUEL = 'fuel';

    public const OTHER = 'other';

    /**
     * @return list<string>
     */
    public static function codes(): array
    {
        return [
            self::INSURANCE,
            self::BABY_SEAT,
            self::CHAUFFEUR,
            self::DELIVERY,
            self::FUEL,
            self::OTHER,
        ];
    }

    public static function label(string $code): string
    {
        return __('rental.addon.codes.'.$code);
    }

    public static function defaultDescription(string $code): string
    {
        return self::label($code);
    }
}
