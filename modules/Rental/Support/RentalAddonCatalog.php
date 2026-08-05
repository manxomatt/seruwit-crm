<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Rental\Models\RentalInsurancePackage;

class RentalAddonCatalog
{
    public const INSURANCE = 'insurance';

    public const ONE_WAY = 'one_way';

    public const BABY_SEAT = 'baby_seat';

    public const CHAUFFEUR = 'chauffeur';

    public const DELIVERY = 'delivery';

    public const FUEL = 'fuel';

    public const OTHER = 'other';

    public const CANCELLATION_FEE = 'cancellation_fee';

    public const NO_SHOW_FEE = 'no_show_fee';

    /**
     * @return list<string>
     */
    public static function codes(): array
    {
        $codes = [
            self::INSURANCE,
            self::ONE_WAY,
            self::BABY_SEAT,
            self::CHAUFFEUR,
            self::DELIVERY,
            self::FUEL,
            self::OTHER,
            self::CANCELLATION_FEE,
            self::NO_SHOW_FEE,
        ];

        if (Schema::hasTable('rental_insurance_packages')) {
            $packageCodes = RentalInsurancePackage::query()
                ->orderBy('sort_order')
                ->pluck('code')
                ->map(fn (string $code): string => 'insurance_'.$code)
                ->all();

            $codes = array_values(array_unique([...$codes, ...$packageCodes]));
        }

        return $codes;
    }

    public static function label(string $code): string
    {
        if (str_starts_with($code, 'insurance_') && $code !== self::INSURANCE) {
            $packageCode = substr($code, strlen('insurance_'));
            $package = RentalInsurancePackage::query()->where('code', $packageCode)->first();

            if ($package) {
                return $package->name;
            }
        }

        return __('rental.addon.codes.'.$code);
    }

    public static function defaultDescription(string $code): string
    {
        return self::label($code);
    }
}
