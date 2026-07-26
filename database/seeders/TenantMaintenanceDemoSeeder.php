<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderItem;

/**
 * Seeds Maintenance demo work orders + schedules (idempotent).
 *
 *   php artisan tenants:seed --class=TenantMaintenanceDemoSeeder --tenants={id}
 */
class TenantMaintenanceDemoSeeder extends Seeder
{
    public const TAG = '[MAINT-DEMO]';

    public function run(): void
    {
        if (! class_exists(WorkOrder::class) || ! Schema::hasTable('work_orders')) {
            $this->command?->warn('Maintenance tables missing. Install the maintenance module first.');

            return;
        }

        $userId = User::query()->value('id');

        if (! $userId) {
            $this->command?->warn('No users found in this tenant.');

            return;
        }

        $categories = MaintenanceCategory::query()->orderBy('sort_order')->get()->keyBy('key');

        if ($categories->isEmpty()) {
            $this->command?->warn('Maintenance categories not found. Run migrations first.');

            return;
        }

        $vehicles = $this->resolveVehicles();

        if (WorkOrder::query()->where('notes', 'like', '%'.self::TAG.'%')->exists()) {
            $this->command?->info('Maintenance demo data already present — skipping work orders.');
        } else {
            $this->command?->info('Seeding maintenance work orders...');

            foreach ($vehicles as $vehicle) {
                $this->seedVehicleWorkOrders($vehicle, $categories, (int) $userId);
            }
        }

        $this->command?->info('Seeding maintenance schedules...');
        $this->seedSchedules($vehicles, $categories);

        $this->command?->info(sprintf(
            'Done. %d work orders, %d schedules.',
            WorkOrder::query()->count(),
            MaintenanceSchedule::query()->count(),
        ));
    }

    /**
     * @return \Illuminate\Support\Collection<int, Vehicle>
     */
    protected function resolveVehicles()
    {
        $vehicles = Vehicle::query()->orderBy('id')->take(5)->get();

        if ($vehicles->isNotEmpty()) {
            return $vehicles;
        }

        $this->command?->info('No vehicles found — creating 5 demo vehicles for maintenance.');

        foreach (range(1, 5) as $i) {
            Vehicle::query()->create([
                'name' => "Demo Maint Truck #{$i}",
                'plate_number' => sprintf('BE MNT %02d', $i),
                'type' => 'truck',
                'brand' => 'Hino',
                'model_year' => 2020 + $i,
                'capacity_kg' => 5000,
                'fuel_type' => 'diesel',
                'status' => Vehicle::STATUS_ACTIVE,
                'odometer_km' => 40000 + ($i * 1500),
            ]);
        }

        return Vehicle::query()->orderBy('id')->take(5)->get();
    }

    /**
     * @param  \Illuminate\Support\Collection<string, MaintenanceCategory>  $categories
     */
    private function seedVehicleWorkOrders(Vehicle $vehicle, $categories, int $userId): void
    {
        $oil = $categories->get('oil_change');
        $tire = $categories->get('tire');
        $brake = $categories->get('brake');
        $engine = $categories->get('engine');
        $electrical = $categories->get('electrical');

        if ($oil) {
            $wo1 = WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $oil->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Ganti Oli Mesin Rutin',
                'description' => 'Penggantian oli mesin SAE 15W-40 dan filter oli.',
                'status' => WorkOrder::STATUS_COMPLETED,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_SCHEDULED,
                'odometer_at_service' => max(0, $vehicle->odometer_km - 500),
                'scheduled_date' => now()->subDays(35),
                'started_at' => now()->subDays(35),
                'completed_at' => now()->subDays(34),
                'vendor_name' => 'Bengkel Maju Jaya',
                'mechanic_name' => 'Budi Santoso',
                'invoice_number' => 'INV-DEMO-'.str_pad((string) $vehicle->id, 4, '0', STR_PAD_LEFT).'-001',
                'estimated_cost' => 350_000,
                'actual_labor_cost' => 150_000,
                'actual_parts_cost' => 220_000,
                'notes' => self::TAG.' Ganti juga filter udara karena sudah kotor.',
                'resolution_notes' => 'Selesai sesuai rencana. Kondisi mesin normal.',
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now()->subDays(36),
            ]);

            WorkOrderItem::query()->create(['work_order_id' => $wo1->id, 'item_type' => 'part', 'name' => 'Oli Mesin SAE 15W-40', 'quantity' => 6, 'unit' => 'liter', 'unit_price' => 35_000, 'total_price' => 210_000]);
            WorkOrderItem::query()->create(['work_order_id' => $wo1->id, 'item_type' => 'part', 'name' => 'Filter Oli', 'quantity' => 1, 'unit' => 'pcs', 'unit_price' => 10_000, 'total_price' => 10_000]);
            WorkOrderItem::query()->create(['work_order_id' => $wo1->id, 'item_type' => 'labor', 'name' => 'Jasa Ganti Oli', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 150_000, 'total_price' => 150_000]);
        }

        if ($tire) {
            $wo2 = WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $tire->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Rotasi dan Balancing Ban',
                'description' => 'Rotasi ban dan balancing keempat roda.',
                'status' => WorkOrder::STATUS_COMPLETED,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_PREVENTIVE,
                'odometer_at_service' => max(0, $vehicle->odometer_km - 200),
                'scheduled_date' => now()->subDays(14),
                'started_at' => now()->subDays(14),
                'completed_at' => now()->subDays(13),
                'vendor_name' => 'Auto Service Prima',
                'mechanic_name' => 'Hendra Wijaya',
                'invoice_number' => 'INV-DEMO-'.str_pad((string) $vehicle->id, 4, '0', STR_PAD_LEFT).'-002',
                'estimated_cost' => 200_000,
                'actual_labor_cost' => 200_000,
                'actual_parts_cost' => 0,
                'notes' => self::TAG,
                'resolution_notes' => 'Rotasi selesai. Disarankan cek kembali dalam 5.000 km.',
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now()->subDays(15),
            ]);

            WorkOrderItem::query()->create(['work_order_id' => $wo2->id, 'item_type' => 'labor', 'name' => 'Jasa Rotasi & Balancing 4 Roda', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 200_000, 'total_price' => 200_000]);
        }

        if ($brake) {
            $wo3 = WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $brake->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Penggantian Kampas Rem Depan',
                'description' => 'Pengemudi melaporkan suara gesekan saat pengereman.',
                'status' => WorkOrder::STATUS_IN_PROGRESS,
                'priority' => WorkOrder::PRIORITY_HIGH,
                'type' => WorkOrder::TYPE_CORRECTIVE,
                'odometer_at_service' => $vehicle->odometer_km,
                'scheduled_date' => now()->subDays(1),
                'started_at' => now()->subHours(3),
                'vendor_name' => 'Bengkel Karya Motor',
                'mechanic_name' => 'Slamet Riyadi',
                'estimated_cost' => 750_000,
                'notes' => self::TAG.' Bunyi saat rem di atas 40 km/jam.',
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now()->subDays(1),
            ]);

            WorkOrderItem::query()->create(['work_order_id' => $wo3->id, 'item_type' => 'part', 'name' => 'Kampas Rem Depan (set)', 'quantity' => 1, 'unit' => 'set', 'unit_price' => 350_000, 'total_price' => 350_000]);
            WorkOrderItem::query()->create(['work_order_id' => $wo3->id, 'item_type' => 'labor', 'name' => 'Jasa Ganti Kampas Rem', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 200_000, 'total_price' => 200_000]);
        }

        if ($engine) {
            WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $engine->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Tune-up Mesin & Ganti Busi',
                'description' => 'Servis berkala 40.000 km.',
                'status' => WorkOrder::STATUS_PENDING,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_SCHEDULED,
                'scheduled_date' => now()->addDays(7),
                'vendor_name' => 'PT. Astra Service',
                'estimated_cost' => 1_200_000,
                'notes' => self::TAG.' Paket servis berkala 40.000 km.',
                'created_by' => $userId,
            ]);
        }

        if ($electrical) {
            WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $electrical->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Penggantian Aki',
                'description' => 'Aki lemah, starter kadang tidak menyala di pagi hari.',
                'status' => WorkOrder::STATUS_DRAFT,
                'priority' => WorkOrder::PRIORITY_HIGH,
                'type' => WorkOrder::TYPE_CORRECTIVE,
                'scheduled_date' => now()->subDays(5),
                'estimated_cost' => 600_000,
                'notes' => self::TAG.' Laporan dari pengemudi.',
                'created_by' => $userId,
            ]);
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Vehicle>  $vehicles
     * @param  \Illuminate\Support\Collection<string, MaintenanceCategory>  $categories
     */
    private function seedSchedules($vehicles, $categories): void
    {
        foreach ($vehicles as $vehicle) {
            $oilCat = $categories->get('oil_change');
            if ($oilCat) {
                $lastOdometer = max(0, $vehicle->odometer_km - 500);
                MaintenanceSchedule::query()->firstOrCreate(
                    [
                        'vehicle_id' => $vehicle->id,
                        'name' => 'Ganti Oli Setiap 5.000 km',
                    ],
                    [
                        'category_id' => $oilCat->id,
                        'interval_type' => MaintenanceSchedule::INTERVAL_MILEAGE,
                        'interval_value' => 5_000,
                        'last_service_odometer' => $lastOdometer,
                        'last_service_date' => now()->subDays(35),
                        'next_service_odometer' => $lastOdometer + 5_000,
                        'next_service_date' => null,
                        'is_active' => true,
                    ],
                );
            }

            $generalCat = $categories->get('general_service');
            if ($generalCat) {
                MaintenanceSchedule::query()->firstOrCreate(
                    [
                        'vehicle_id' => $vehicle->id,
                        'name' => 'Servis Berkala 6 Bulan',
                    ],
                    [
                        'category_id' => $generalCat->id,
                        'interval_type' => MaintenanceSchedule::INTERVAL_CALENDAR,
                        'interval_value' => 180,
                        'last_service_odometer' => null,
                        'last_service_date' => now()->subMonths(3),
                        'next_service_odometer' => null,
                        'next_service_date' => now()->addMonths(3),
                        'is_active' => true,
                    ],
                );
            }

            $tireCat = $categories->get('tire');
            if ($tireCat) {
                $lastOdometer = max(0, $vehicle->odometer_km - 200);
                MaintenanceSchedule::query()->firstOrCreate(
                    [
                        'vehicle_id' => $vehicle->id,
                        'name' => 'Rotasi Ban Setiap 10.000 km',
                    ],
                    [
                        'category_id' => $tireCat->id,
                        'interval_type' => MaintenanceSchedule::INTERVAL_MILEAGE,
                        'interval_value' => 10_000,
                        'last_service_odometer' => $lastOdometer,
                        'last_service_date' => now()->subDays(14),
                        'next_service_odometer' => $lastOdometer + 10_000,
                        'next_service_date' => null,
                        'is_active' => true,
                    ],
                );
            }

            $brakeCat = $categories->get('brake');
            if ($brakeCat) {
                MaintenanceSchedule::query()->firstOrCreate(
                    [
                        'vehicle_id' => $vehicle->id,
                        'name' => 'Cek Rem Setiap 6 Bulan',
                    ],
                    [
                        'category_id' => $brakeCat->id,
                        'interval_type' => MaintenanceSchedule::INTERVAL_CALENDAR,
                        'interval_value' => 180,
                        'last_service_date' => now()->subMonths(5),
                        'next_service_date' => now()->addMonth(),
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
