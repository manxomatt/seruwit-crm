<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalInvoiceService;

/**
 * Seeds 30 demo rentals (+ rates/vehicles/partners as needed) for the Rental module.
 *
 *   php artisan tenants:seed --class=TenantRentalDemoSeeder --tenants={id}
 */
class TenantRentalDemoSeeder extends Seeder
{
    public const TAG = '[RENTAL-DEMO]';

    public const RENTAL_COUNT = 30;

    public function run(): void
    {
        if (! class_exists(Rental::class) || ! Schema::hasTable('rentals')) {
            $this->command?->warn('Rental tables missing. Install the rental module first.');

            return;
        }

        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles')) {
            $this->command?->warn('Fleet tables missing. Install the fleet module first.');

            return;
        }

        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            $this->command?->warn('Partners table missing.');

            return;
        }

        $vehicles = $this->ensureVehicles();
        $drivers = $this->ensureDrivers();
        $partners = $this->ensurePartners();
        $this->ensureRates();

        if ($this->demoRentalsExist()) {
            $this->command?->info('Rental demo data already present — skipping create.');
        } else {
            $this->seedRentals($vehicles, $drivers, $partners);
        }

        $rentalCount = Rental::query()->where('notes', 'like', '%'.self::TAG.'%')->count();
        $rateCount = RentalRate::query()->where('notes', 'like', '%'.self::TAG.'%')->count();

        $this->command?->info(sprintf(
            'Rental demo ready: %d rentals, %d rates.',
            $rentalCount,
            $rateCount,
        ));
        $this->command?->info('Open /module/rental/list and /module/rental/rates');
    }

    /**
     * @return \Illuminate\Support\Collection<int, Vehicle>
     */
    protected function ensureVehicles()
    {
        $vehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->orderBy('id')
            ->limit(10)
            ->get();

        $plates = [
            'B 1001 RNT',
            'B 1002 RNT',
            'B 1003 RNT',
            'B 1004 RNT',
            'B 1005 RNT',
            'B 1006 RNT',
        ];
        $names = [
            'Avanza Demo Rental',
            'Innova Demo Rental',
            'Hiace Demo Rental',
            'Fortuner Demo Rental',
            'Xenia Demo Rental',
            'Colt Diesel Demo',
        ];

        while ($vehicles->count() < 6) {
            $index = $vehicles->count();
            $classes = ['mpv', 'mpv', 'other', 'suv', 'economy', 'other'];
            $vehicle = Vehicle::query()->firstOrCreate(
                ['plate_number' => $plates[$index]],
                [
                    'name' => $names[$index],
                    'type' => 'car',
                    'rental_class' => $classes[$index] ?? 'other',
                    'brand' => 'Toyota',
                    'fuel_type' => 'petrol',
                    'status' => Vehicle::STATUS_ACTIVE,
                    'notes' => self::TAG.' Demo vehicle.',
                ],
            );

            if (Schema::hasColumn('vehicles', 'rental_class') && blank($vehicle->rental_class)) {
                $vehicle->update(['rental_class' => $classes[$index] ?? 'other']);
            }

            $vehicles->push($vehicle);
        }

        return $vehicles->values();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Driver>
     */
    protected function ensureDrivers()
    {
        if (! Schema::hasTable('drivers')) {
            return collect();
        }

        $drivers = Driver::query()
            ->where('status', Driver::STATUS_AVAILABLE)
            ->orderBy('id')
            ->limit(8)
            ->get();

        $names = [
            'Andi Rental Demo',
            'Budi Rental Demo',
            'Cahyo Rental Demo',
            'Dedi Rental Demo',
        ];

        while ($drivers->count() < 4) {
            $index = $drivers->count();
            $license = sprintf('SIM-RNT-%02d', $index + 1);
            $driver = Driver::query()->firstOrCreate(
                ['license_number' => $license],
                [
                    'name' => $names[$index],
                    'license_type' => 'B1',
                    'phone' => '0812'.str_pad((string) (1000000 + $index), 7, '0', STR_PAD_LEFT),
                    'status' => Driver::STATUS_AVAILABLE,
                    'notes' => self::TAG.' Demo driver.',
                ],
            );
            $drivers->push($driver);
        }

        return $drivers->values();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Partner>
     */
    protected function ensurePartners()
    {
        $partners = Partner::query()
            ->where('customer_rank', '>', 0)
            ->orderBy('id')
            ->limit(10)
            ->get();

        $names = [
            'PT Rental Demo Nusantara',
            'CV Rental Demo Makmur',
            'UD Rental Demo Sejahtera',
            'Toko Rental Demo Prima',
            'PT Rental Demo Global',
        ];

        while ($partners->count() < 5) {
            $index = $partners->count();
            $code = sprintf('CUS-RNT-%02d', $index + 1);
            $partner = Partner::query()->firstOrCreate(
                ['code' => $code],
                [
                    'account_type' => 'company',
                    'sub_type' => 'customer',
                    'name' => $names[$index] ?? fake()->company(),
                    'customer_rank' => 1,
                    'supplier_rank' => 0,
                    'status' => 'active',
                    'notes' => self::TAG.' Demo customer.',
                ],
            );
            $partners->push($partner);
        }

        return $partners->values();
    }

    protected function ensureRates(): void
    {
        if (RentalRate::query()->where('notes', 'like', '%'.self::TAG.'%')->exists()) {
            return;
        }

        $templates = [
            ['name' => 'Harian Standar', 'period_type' => 'daily', 'rate_per_period' => 450000, 'deposit_amount' => 1000000, 'km_limit_per_period' => 200, 'excess_km_rate' => 3500, 'rental_class' => null, 'min_periods' => null, 'priority' => 0],
            ['name' => 'Mingguan Hemat', 'period_type' => 'weekly', 'rate_per_period' => 2800000, 'deposit_amount' => 2000000, 'km_limit_per_period' => 1000, 'excess_km_rate' => 3000, 'rental_class' => null, 'min_periods' => 1, 'priority' => 0],
            ['name' => 'Bulanan Korporat', 'period_type' => 'monthly', 'rate_per_period' => 9500000, 'deposit_amount' => 5000000, 'km_limit_per_period' => 4000, 'excess_km_rate' => 2500, 'rental_class' => null, 'min_periods' => 1, 'priority' => 0],
            ['name' => 'Harian SUV', 'period_type' => 'daily', 'rate_per_period' => 750000, 'deposit_amount' => 2000000, 'km_limit_per_period' => 250, 'excess_km_rate' => 5000, 'rental_class' => 'suv', 'min_periods' => 2, 'priority' => 10],
            ['name' => 'Mingguan MPV', 'period_type' => 'weekly', 'rate_per_period' => 3200000, 'deposit_amount' => 2500000, 'km_limit_per_period' => 1200, 'excess_km_rate' => 3500, 'rental_class' => 'mpv', 'min_periods' => 1, 'priority' => 10],
        ];

        foreach ($templates as $template) {
            RentalRate::query()->create([
                ...$template,
                'vehicle_id' => null,
                'vehicle_type' => null,
                'is_active' => true,
                'notes' => self::TAG.' Demo rate template.',
            ]);
        }
    }

    protected function demoRentalsExist(): bool
    {
        return Rental::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->count() >= self::RENTAL_COUNT;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Vehicle>  $vehicles
     * @param  \Illuminate\Support\Collection<int, Driver>  $drivers
     * @param  \Illuminate\Support\Collection<int, Partner>  $partners
     */
    protected function seedRentals($vehicles, $drivers, $partners): void
    {
        $statuses = [
            Rental::STATUS_DRAFT,
            Rental::STATUS_CONFIRMED,
            Rental::STATUS_ACTIVE,
            Rental::STATUS_RETURNED,
            Rental::STATUS_COMPLETED,
            Rental::STATUS_CANCELLED,
        ];
        $periodTypes = ['daily', 'weekly', 'monthly'];

        foreach (range(1, self::RENTAL_COUNT) as $i) {
            $vehicle = $vehicles[($i - 1) % $vehicles->count()];
            $partner = $partners[($i - 1) % $partners->count()];
            $driver = $drivers->isNotEmpty() && $i % 3 !== 0
                ? $drivers[($i - 1) % $drivers->count()]
                : null;

            $periodType = $periodTypes[($i - 1) % count($periodTypes)];
            $status = $statuses[($i - 1) % count($statuses)];
            $days = match ($periodType) {
                'weekly' => 7,
                'monthly' => 30,
                default => max(1, ($i % 5) + 1),
            };

            // Stagger windows so the same vehicle rarely overlaps.
            $start = now()->subMonths(4)->addDays(($i - 1) * 8)->startOfDay();
            $end = (clone $start)->addDays($days - 1);
            $rate = match ($periodType) {
                'weekly' => 2_800_000 + ($i * 10_000),
                'monthly' => 9_500_000 + ($i * 50_000),
                default => 450_000 + ($i * 5_000),
            };
            $totalPeriods = Rental::computePeriods($start->toDateString(), $end->toDateString(), $periodType);
            $baseAmount = $rate * $totalPeriods;

            $payload = [
                'code' => sprintf('RENT-DEMO-%03d', $i),
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driver?->id,
                'partner_id' => $partner->id,
                'status' => $status,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'period_type' => $periodType,
                'rate_per_period' => $rate,
                'km_limit_per_period' => 200,
                'excess_km_rate' => 3500,
                'deposit_amount' => max(500_000, (int) round($rate * 0.5)),
                'total_periods' => $totalPeriods,
                'base_amount' => $baseAmount,
                'excess_amount' => 0,
                'deposit_returned' => in_array($status, [Rental::STATUS_COMPLETED, Rental::STATUS_CANCELLED], true),
                'total_amount' => $baseAmount,
                'notes' => self::TAG.' Seeded for UI pagination demo #'.$i,
            ];

            if (in_array($status, [Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)) {
                $payload['confirmed_at'] = $start->copy()->subDay();
            }

            if (in_array($status, [Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)) {
                $payload['checked_out_at'] = $start->copy()->addHours(8);
                $payload['start_odometer'] = 40_000 + ($i * 100);
            }

            if (in_array($status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true)) {
                $payload['returned_at'] = $end->copy()->addHours(10);
                $payload['actual_return_date'] = $end->toDateString();
                $payload['end_odometer'] = ($payload['start_odometer'] ?? 40000) + 150 + $i;
                $payload['excess_km'] = 0;
            }

            if ($status === Rental::STATUS_COMPLETED) {
                $payload['completed_at'] = $end->copy()->addDay();
            }

            if ($status === Rental::STATUS_CANCELLED) {
                $payload['cancelled_reason'] = 'Demo cancel — customer changed plan.';
            }

            Rental::query()->create($payload);
        }

        $this->backfillInvoicesForPastConfirm();
    }

    /**
     * Demo rows skip the confirm action, so create base invoices (and issue when
     * the seeded status is returned/completed) so Accounting has revenue to post.
     */
    protected function backfillInvoicesForPastConfirm(): void
    {
        if (! class_exists(RentalInvoiceService::class)) {
            return;
        }

        $invoices = app(RentalInvoiceService::class);

        if (! $invoices->isAvailable()) {
            return;
        }

        $accounting = class_exists(RentalAccountingService::class)
            ? app(RentalAccountingService::class)
            : null;

        Rental::query()
            ->where('notes', 'like', self::TAG.'%')
            ->whereIn('status', [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ])
            ->orderBy('id')
            ->each(function (Rental $rental) use ($invoices, $accounting): void {
                if ($rental->charges()->exists()) {
                    return;
                }

                $invoices->invoiceBase($rental);

                if ($accounting !== null && in_array($rental->status, [
                    Rental::STATUS_RETURNED,
                    Rental::STATUS_COMPLETED,
                ], true)) {
                    $accounting->issueDraftInvoices($rental->fresh());
                }
            });
    }
}
