<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCity;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttlePassenger;
use Modules\Shuttle\Models\ShuttlePool;
use Modules\Shuttle\Models\ShuttleSchedule;
use Modules\Shuttle\Models\ShuttleSetting;
use Modules\Shuttle\Support\BookingConfirmationService;
use Modules\Shuttle\Support\ScheduleDepartureGenerator;

/**
 * Seeds Jakarta–Bandung shuttle demo data (pool + door products).
 *
 *   php artisan tenants:seed --class=TenantShuttleDemoSeeder --tenants={id}
 */
class TenantShuttleDemoSeeder extends Seeder
{
    public const TAG = '[SHUTTLE-DEMO]';

    public function run(): void
    {
        if (! Schema::hasTable('shuttle_corridors')) {
            $this->command?->warn('Shuttle tables missing. Install the shuttle module first.');

            return;
        }

        ShuttleSetting::putMany(ShuttleSetting::defaults());

        $jakarta = ShuttleCity::query()->updateOrCreate(
            ['code' => 'JKT'],
            ['name' => 'Jakarta', 'province' => 'DKI Jakarta', 'is_active' => true],
        );
        $bandung = ShuttleCity::query()->updateOrCreate(
            ['code' => 'BDG'],
            ['name' => 'Bandung', 'province' => 'Jawa Barat', 'is_active' => true],
        );

        $originLocation = Location::query()->firstOrCreate(
            ['code' => 'POOL-JKT'],
            [
                'name' => 'Pool Jakarta Gambir',
                'address' => 'Jl. Medan Merdeka Timur',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'latitude' => -6.1769,
                'longitude' => 106.8306,
                'is_active' => true,
            ],
        );

        $destinationLocation = Location::query()->firstOrCreate(
            ['code' => 'POOL-BDG'],
            [
                'name' => 'Pool Bandung Dipatiukur',
                'address' => 'Jl. Dipatiukur',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.8885,
                'longitude' => 107.6186,
                'is_active' => true,
            ],
        );

        $originPool = ShuttlePool::query()->updateOrCreate(
            ['location_id' => $originLocation->id],
            [
                'city_id' => $jakarta->id,
                'code' => 'POOL-JKT-GMB',
                'name' => 'Pool Jakarta Gambir',
                'is_origin' => true,
                'is_destination' => true,
                'is_active' => true,
            ],
        );

        $destinationPool = ShuttlePool::query()->updateOrCreate(
            ['location_id' => $destinationLocation->id],
            [
                'city_id' => $bandung->id,
                'code' => 'POOL-BDG-DPU',
                'name' => 'Pool Bandung Dipatiukur',
                'is_origin' => true,
                'is_destination' => true,
                'is_active' => true,
            ],
        );

        $poolCorridor = ShuttleCorridor::query()->updateOrCreate(
            ['code' => 'JKT-BDG-POOL'],
            [
                'name' => 'Jakarta – Bandung (Pool)',
                'origin_city' => $jakarta->name,
                'destination_city' => $bandung->name,
                'origin_city_id' => $jakarta->id,
                'destination_city_id' => $bandung->id,
                'service_type' => ShuttleCorridor::SERVICE_POOL,
                'origin_location_id' => $originLocation->id,
                'destination_location_id' => $destinationLocation->id,
                'origin_pool_id' => $originPool->id,
                'destination_pool_id' => $destinationPool->id,
                'base_fare' => 200000,
                'estimated_duration_minutes' => 180,
                'distance_km' => 150,
                'is_active' => true,
                'notes' => self::TAG.' Pool–pool product',
            ],
        );

        $doorCorridor = ShuttleCorridor::query()->updateOrCreate(
            ['code' => 'JKT-BDG-DOOR'],
            [
                'name' => 'Jakarta – Bandung (Door)',
                'origin_city' => $jakarta->name,
                'destination_city' => $bandung->name,
                'origin_city_id' => $jakarta->id,
                'destination_city_id' => $bandung->id,
                'service_type' => ShuttleCorridor::SERVICE_DOOR,
                'origin_location_id' => $originLocation->id,
                'destination_location_id' => $destinationLocation->id,
                'origin_pool_id' => $originPool->id,
                'destination_pool_id' => $destinationPool->id,
                'base_fare' => 250000,
                'estimated_duration_minutes' => 210,
                'distance_km' => 150,
                'is_active' => true,
                'notes' => self::TAG.' Door pickup/dropoff product',
            ],
        );

        ShuttleCorridor::query()->where('code', 'JKT-BDG')->update([
            'service_type' => ShuttleCorridor::SERVICE_POOL,
            'is_active' => false,
            'notes' => self::TAG.' Legacy — superseded by JKT-BDG-POOL',
        ]);

        $vehicle = Vehicle::query()->firstOrCreate(
            ['plate_number' => 'B 1234 SH'],
            [
                'name' => 'Shuttle HiAce Demo',
                'type' => 'van',
                'brand' => 'Toyota',
                'capacity' => '14 seats',
                'capacity_seats' => 14,
                'fuel_type' => 'diesel',
                'status' => Vehicle::STATUS_ACTIVE,
                'odometer_km' => 42000,
                'notes' => self::TAG,
            ],
        );

        $driver = Driver::query()->firstOrCreate(
            ['name' => 'Sopir Shuttle Demo'],
            [
                'phone' => '081234567890',
                'license_number' => 'SIM-SH-001',
                'status' => 'available',
                'notes' => self::TAG,
            ],
        );

        $poolSchedule = ShuttleSchedule::query()->updateOrCreate(
            ['code' => 'JKT-BDG-POOL-PAGI'],
            [
                'corridor_id' => $poolCorridor->id,
                'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
                'departure_time' => '07:00',
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driver->id,
                'seat_capacity' => ShuttleSetting::getInt(ShuttleSetting::KEY_DEFAULT_SEAT_CAPACITY, 14),
                'pickup_cutoff_minutes' => ShuttleSetting::getInt(ShuttleSetting::KEY_DEFAULT_PICKUP_CUTOFF, 90),
                'is_active' => true,
            ],
        );

        $doorSchedule = ShuttleSchedule::query()->updateOrCreate(
            ['code' => 'JKT-BDG-DOOR-PAGI'],
            [
                'corridor_id' => $doorCorridor->id,
                'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
                'departure_time' => '06:30',
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driver->id,
                'seat_capacity' => 14,
                'pickup_cutoff_minutes' => 120,
                'is_active' => true,
            ],
        );

        $from = Carbon::today();
        $to = Carbon::today()->addDays(7);
        $generator = app(ScheduleDepartureGenerator::class);
        $generator->generate($poolSchedule->load('vehicle', 'corridor'), $from, $to);
        $generator->generate($doorSchedule->load('vehicle', 'corridor'), $from, $to);

        $partner = Partner::query()->firstOrCreate(
            ['code' => 'CUST-SHUTTLE-01'],
            [
                'account_type' => 'individual',
                'sub_type' => 'customer',
                'name' => 'Penumpang Demo Travel',
                'phone' => '081298765432',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'status' => 'active',
                'notes' => self::TAG,
            ],
        );

        $doorDeparture = ShuttleDeparture::query()
            ->where('schedule_id', $doorSchedule->id)
            ->whereDate('depart_date', '>=', today())
            ->orderBy('depart_date')
            ->first();

        if ($doorDeparture) {
            $booking = ShuttleBooking::query()->firstOrCreate(
                ['booking_number' => 'BK-DEMO-00001'],
                [
                    'departure_id' => $doorDeparture->id,
                    'partner_id' => $partner->id,
                    'status' => ShuttleBooking::STATUS_DRAFT,
                    'passenger_count' => 2,
                    'unit_fare' => $doorCorridor->base_fare,
                    'total_fare' => ((float) $doorCorridor->base_fare) * 2,
                    'pickup_mode' => ShuttleBooking::MODE_DOOR,
                    'dropoff_mode' => ShuttleBooking::MODE_DOOR,
                    'pickup_address' => 'Jl. Kemang Raya No. 10, Jakarta',
                    'pickup_lat' => -6.2607,
                    'pickup_lng' => 106.8163,
                    'dropoff_address' => 'Jl. Dago No. 5, Bandung',
                    'dropoff_lat' => -6.9175,
                    'dropoff_lng' => 107.6191,
                    'notes' => self::TAG,
                ],
            );

            if ($booking->passengers()->count() === 0) {
                ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'Andi Demo', 'phone' => '081211111111']);
                ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'Budi Demo', 'phone' => '081222222222']);
            }

            if ($booking->status === ShuttleBooking::STATUS_DRAFT) {
                app(BookingConfirmationService::class)->confirm($booking);
            }
        }

        $this->command?->info('Shuttle demo seeded (cities, pools, pool + door products).');
    }

    /**
     * Remove tagged shuttle demo bookings/passengers. Cities, pools, and corridors
     * are shared catalog rows and are left in place for reinstall idempotency.
     */
    public function uninstall(): void
    {
        if (! Schema::hasTable('shuttle_bookings')) {
            return;
        }

        $bookingIds = ShuttleBooking::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->pluck('id');

        if ($bookingIds->isNotEmpty() && Schema::hasTable('shuttle_passengers')) {
            ShuttlePassenger::query()->whereIn('booking_id', $bookingIds)->delete();
        }

        ShuttleBooking::query()->whereIn('id', $bookingIds)->delete();

        if (Schema::hasTable('partners')) {
            Partner::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->where('code', 'CUST-SHUTTLE-01')
                ->delete();
        }

        $this->command?->info('Shuttle demo data removed.');
    }
}
