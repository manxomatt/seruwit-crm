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
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttlePassenger;
use Modules\Shuttle\Models\ShuttlePool;
use Modules\Shuttle\Models\ShuttleSchedule;
use Modules\Shuttle\Support\BookingConfirmationService;
use Modules\Shuttle\Support\ScheduleDepartureGenerator;

/**
 * Seeds Jakarta–Bandung shuttle demo data.
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

        $originPool = Location::query()->firstOrCreate(
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

        $destinationPool = Location::query()->firstOrCreate(
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

        $corridor = ShuttleCorridor::query()->updateOrCreate(
            ['code' => 'JKT-BDG'],
            [
                'name' => 'Jakarta – Bandung',
                'origin_city' => 'Jakarta',
                'destination_city' => 'Bandung',
                'origin_location_id' => $originPool->id,
                'destination_location_id' => $destinationPool->id,
                'base_fare' => 200000,
                'estimated_duration_minutes' => 180,
                'distance_km' => 150,
                'is_active' => true,
                'notes' => self::TAG.' Fixed corridor fare',
            ],
        );

        ShuttlePool::query()->updateOrCreate(
            ['location_id' => $originPool->id],
            ['corridor_id' => $corridor->id, 'is_origin' => true, 'is_destination' => false, 'is_active' => true],
        );
        ShuttlePool::query()->updateOrCreate(
            ['location_id' => $destinationPool->id],
            ['corridor_id' => $corridor->id, 'is_origin' => false, 'is_destination' => true, 'is_active' => true],
        );

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

        $schedule = ShuttleSchedule::query()->updateOrCreate(
            ['code' => 'JKT-BDG-PAGI'],
            [
                'corridor_id' => $corridor->id,
                'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
                'departure_time' => '07:00',
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driver->id,
                'seat_capacity' => 14,
                'pickup_cutoff_minutes' => 90,
                'is_active' => true,
            ],
        );

        $from = Carbon::today();
        $to = Carbon::today()->addDays(7);
        app(ScheduleDepartureGenerator::class)->generate($schedule->load('vehicle', 'corridor'), $from, $to);

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

        $departure = ShuttleDeparture::query()
            ->where('schedule_id', $schedule->id)
            ->whereDate('depart_date', '>=', today())
            ->orderBy('depart_date')
            ->first();

        if ($departure) {
            $booking = ShuttleBooking::query()->firstOrCreate(
                ['booking_number' => 'BK-DEMO-00001'],
                [
                    'departure_id' => $departure->id,
                    'partner_id' => $partner->id,
                    'status' => ShuttleBooking::STATUS_DRAFT,
                    'passenger_count' => 2,
                    'unit_fare' => $corridor->base_fare,
                    'total_fare' => ((float) $corridor->base_fare) * 2,
                    'pickup_mode' => ShuttleBooking::MODE_DOOR,
                    'dropoff_mode' => ShuttleBooking::MODE_POOL,
                    'pickup_address' => 'Jl. Kemang Raya No. 10, Jakarta',
                    'pickup_lat' => -6.2607,
                    'pickup_lng' => 106.8163,
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

        $this->command?->info('Shuttle demo seeded (JKT–BDG).');
    }
}
