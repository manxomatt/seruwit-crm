<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Rental\Models\RentalInsurancePackage;

class RentalAddonCatalog
{
    public const INSURANCE = 'insurance';

    public const ONE_WAY = 'one_way';

    public const BABY_SEAT = 'baby_seat';

    public const ROOF_BOX = 'roof_box';

    public const DASHCAM = 'dashcam';

    public const ETOLL_CARD = 'etoll_card';

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
            self::ROOF_BOX,
            self::DASHCAM,
            self::ETOLL_CARD,
            self::CHAUFFEUR,
            self::DELIVERY,
            self::FUEL,
            self::OTHER,
            self::CANCELLATION_FEE,
            self::NO_SHOW_FEE,
        ];

        if (Schema::hasTable('rental_addons')) {
            $addonCodes = \Modules\Rental\Models\RentalAddon::query()
                ->pluck('code')
                ->all();

            $codes = array_values(array_unique([...$codes, ...$addonCodes]));
        }

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

        if (Schema::hasTable('rental_addons')) {
            $addon = \Modules\Rental\Models\RentalAddon::query()->where('code', $code)->first();
            if ($addon) {
                return $addon->name;
            }
        }

        return match ($code) {
            self::ROOF_BOX => 'Roof Box & Rak Bagasi',
            self::DASHCAM => 'Kamera Dashcam / Action Cam',
            self::ETOLL_CARD => 'Kartu E-Toll Siap Pakai',
            default => __('rental.addon.codes.'.$code),
        };
    }

    public static function defaultDescription(string $code): string
    {
        return self::label($code);
    }

    /**
     * Build self-service add-ons catalog available for passenger post-booking order.
     *
     * @return list<array{
     *     code: string,
     *     name: string,
     *     category: string,
     *     description: string,
     *     icon: string,
     *     price_type: 'daily'|'flat',
     *     unit_price: float,
     *     calculated_total: float,
     *     max_quantity: int,
     *     is_already_added: bool
     * }>
     */
    public static function selfServiceCatalog(\Modules\Rental\Models\Rental $rental): array
    {
        $existingCodes = $rental->charges()
            ->where('kind', \Modules\Rental\Models\RentalCharge::KIND_ADDON)
            ->pluck('addon_code')
            ->filter()
            ->all();

        $periods = max(1, (int) $rental->total_periods);
        $settings = RentalGeneralSettings::all();
        $driverRate = (float) ($settings['default_driver_rate'] ?? 150000);
        $deliveryFee = (float) ($settings['default_airport_delivery_fee'] ?? 50000);

        $catalog = [];

        if (Schema::hasTable('rental_addons') && \Modules\Rental\Models\RentalAddon::query()->exists()) {
            $addons = \Modules\Rental\Models\RentalAddon::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            foreach ($addons as $addon) {
                if ($addon->code === self::CHAUFFEUR && ! $rental->isSelfDrive()) {
                    continue;
                }

                $price = (float) $addon->price;
                if ($price <= 0) {
                    if ($addon->code === self::CHAUFFEUR) {
                        $price = $driverRate > 0 ? $driverRate : 150000.0;
                    } elseif ($addon->code === self::DELIVERY) {
                        $price = $deliveryFee > 0 ? $deliveryFee : 50000.0;
                    }
                }

                $catalog[] = [
                    'code' => $addon->code,
                    'name' => $addon->name,
                    'category' => $addon->category,
                    'description' => (string) ($addon->description ?? ''),
                    'icon' => $addon->icon ?: 'box',
                    'price_type' => $addon->price_type === 'flat' ? 'flat' : 'daily',
                    'unit_price' => $price,
                    'max_quantity' => max(1, (int) $addon->max_quantity),
                ];
            }
        } else {
            $catalog = [
                [
                    'code' => self::BABY_SEAT,
                    'name' => 'Kursi Bayi / Child Safety Seat',
                    'category' => 'accessory',
                    'description' => 'Kursi pengaman anak/bayi ergonomis bersertifikasi keselamatan standar internasional.',
                    'icon' => 'baby',
                    'price_type' => 'daily',
                    'unit_price' => 50000.0,
                    'max_quantity' => 2,
                ],
                [
                    'code' => self::ROOF_BOX,
                    'name' => 'Roof Box & Rak Bagasi Atas',
                    'category' => 'accessory',
                    'description' => 'Bagasi ekstra kapasitas 400 Liter + crossbar kuat untuk kenyamanan perjalanan jauh.',
                    'icon' => 'box',
                    'price_type' => 'daily',
                    'unit_price' => 75000.0,
                    'max_quantity' => 1,
                ],
                [
                    'code' => self::DASHCAM,
                    'name' => 'Kamera Dashcam / Action Cam 4K',
                    'category' => 'accessory',
                    'description' => 'Kamera perekam jalan wide-angle resolusi 4K + MicroSD 64GB untuk proteksi dan dokumentasi.',
                    'icon' => 'camera',
                    'price_type' => 'daily',
                    'unit_price' => 50000.0,
                    'max_quantity' => 1,
                ],
                [
                    'code' => self::ETOLL_CARD,
                    'name' => 'Kartu E-Toll Card Siap Pakai',
                    'category' => 'comfort',
                    'description' => 'Kartu tol elektronik aktif siap digunakan saat melintasi ruas tol tanpa repot membeli kartu baru.',
                    'icon' => 'card',
                    'price_type' => 'flat',
                    'unit_price' => 25000.0,
                    'max_quantity' => 2,
                ],
                [
                    'code' => self::FUEL,
                    'name' => 'Paket BBM Awal (Prepaid Fuel Free Return)',
                    'category' => 'fuel',
                    'description' => 'Bebas kembalikan kendaraan dengan level bensin berapa pun tanpa denda pengisian BBM.',
                    'icon' => 'fuel',
                    'price_type' => 'flat',
                    'unit_price' => 250000.0,
                    'max_quantity' => 1,
                ],
            ];

            if ($rental->isSelfDrive()) {
                $catalog[] = [
                    'code' => self::CHAUFFEUR,
                    'name' => 'Driver / Sopir Tambahan Profesional',
                    'category' => 'service',
                    'description' => 'Layanan pengemudi berpengalaman, ramah, dan menguasai rute perjalanan wisata & bisnis.',
                    'icon' => 'user',
                    'price_type' => 'daily',
                    'unit_price' => $driverRate > 0 ? $driverRate : 150000.0,
                    'max_quantity' => 1,
                ];
            }

            $catalog[] = [
                'code' => self::DELIVERY,
                'name' => 'Layanan Antar/Jemput Khusus (Valet Delivery)',
                'category' => 'service',
                'description' => 'Pengantaran atau penjemputan unit ke lokasi khusus / stasiun / bandara pilihan Anda.',
                'icon' => 'car',
                'price_type' => 'flat',
                'unit_price' => $deliveryFee > 0 ? $deliveryFee : 50000.0,
                'max_quantity' => 1,
            ];
        }

        if (Schema::hasTable('rental_insurance_packages')) {
            $packages = RentalInsurancePackage::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();

            foreach ($packages as $pkg) {
                $pkgCode = $pkg->addonCode();
                $isCurrentPackage = (int) $rental->insurance_package_id === (int) $pkg->id;

                $catalog[] = [
                    'code' => $pkgCode,
                    'name' => 'Proteksi: '.$pkg->name,
                    'category' => 'protection',
                    'description' => $pkg->description ?: ('Perlindungan sewa dengan limit klaim hingga Rp '.number_format((float) $pkg->coverage_limit, 0, ',', '.')),
                    'icon' => 'shield',
                    'price_type' => $pkg->period_type === 'flat' ? 'flat' : 'daily',
                    'unit_price' => (float) $pkg->amount,
                    'max_quantity' => 1,
                    '_is_current_insurance' => $isCurrentPackage,
                ];
            }
        }

        return collect($catalog)->map(function (array $item) use ($existingCodes, $periods): array {
            $code = $item['code'];
            $isAlready = in_array($code, $existingCodes, true) || ! empty($item['_is_current_insurance']);
            unset($item['_is_current_insurance']);

            $calcTotal = $item['price_type'] === 'daily'
                ? ($item['unit_price'] * $periods)
                : $item['unit_price'];

            return [
                ...$item,
                'calculated_total' => (float) $calcTotal,
                'is_already_added' => $isAlready,
            ];
        })->values()->all();
    }

    /**
     * @return array{name: string, price_type: 'daily'|'flat', unit_price: float}|null
     */
    public static function resolveItemPricing(\Modules\Rental\Models\Rental $rental, string $code): ?array
    {
        $catalog = self::selfServiceCatalog($rental);
        foreach ($catalog as $item) {
            if ($item['code'] === $code) {
                return [
                    'name' => $item['name'],
                    'price_type' => $item['price_type'],
                    'unit_price' => (float) $item['unit_price'],
                ];
            }
        }

        return null;
    }
}
