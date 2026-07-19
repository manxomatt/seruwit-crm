<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderItem;

/**
 * Seeds Maintenance demo data using entities that already exist in the current
 * tenant schema. Run in a specific tenant via:
 *
 *   php artisan tenants:seed --class=TenantMaintenanceDemoSeeder --tenants={id}
 */
class TenantMaintenanceDemoSeeder extends Seeder
{
    public function run(): void
    {
        $userId = User::query()->value('id');

        if (! $userId) {
            $this->command->warn('No users found in this tenant.');

            return;
        }

        $vehicles = Vehicle::query()->take(5)->get();

        if ($vehicles->isEmpty()) {
            $this->command->warn('No vehicles found. Seed Fleet data first.');

            return;
        }

        $categories = MaintenanceCategory::query()->get()->keyBy('key');

        if ($categories->isEmpty()) {
            $this->command->warn('Maintenance categories not found. Run migrations first.');

            return;
        }

        $this->command->info('Seeding maintenance work orders...');

        foreach ($vehicles as $vehicle) {
            $this->seedVehicle($vehicle, $categories, $userId);
        }

        $this->command->info('Seeding maintenance schedules...');
        $this->seedSchedules($vehicles, $categories);

        $count = WorkOrder::query()->count();
        $this->command->info("Done. {$count} work orders created.");
    }

    /**
     * @param  \Illuminate\Support\Collection<int, MaintenanceCategory>  $categories
     */
    private function seedVehicle(Vehicle $vehicle, $categories, int $userId): void
    {
        // 1. Completed work order (oil change, last month)
        $wo1 = WorkOrder::create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $categories->get('oil_change')->id,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => 'Ganti Oli Mesin Rutin',
            'description' => 'Penggantian oli mesin SAE 15W-40 dan filter oli. Odometer masuk bengkel sesuai jadwal.',
            'status' => WorkOrder::STATUS_COMPLETED,
            'priority' => WorkOrder::PRIORITY_NORMAL,
            'type' => WorkOrder::TYPE_SCHEDULED,
            'odometer_at_service' => $vehicle->odometer_km - 500,
            'scheduled_date' => now()->subDays(35),
            'started_at' => now()->subDays(35),
            'completed_at' => now()->subDays(34),
            'vendor_name' => 'Bengkel Maju Jaya',
            'mechanic_name' => 'Budi Santoso',
            'invoice_number' => 'INV-'.str_pad((string) $vehicle->id, 4, '0', STR_PAD_LEFT).'-001',
            'estimated_cost' => 350_000,
            'actual_labor_cost' => 150_000,
            'actual_parts_cost' => 220_000,
            'notes' => 'Ganti juga filter udara karena sudah kotor.',
            'resolution_notes' => 'Selesai sesuai rencana. Kondisi mesin normal.',
            'created_by' => $userId,
            'approved_by' => $userId,
            'approved_at' => now()->subDays(36),
        ]);

        WorkOrderItem::create(['work_order_id' => $wo1->id, 'item_type' => 'part', 'name' => 'Oli Mesin SAE 15W-40', 'quantity' => 6, 'unit' => 'liter', 'unit_price' => 35_000, 'total_price' => 210_000]);
        WorkOrderItem::create(['work_order_id' => $wo1->id, 'item_type' => 'part', 'name' => 'Filter Oli', 'quantity' => 1, 'unit' => 'pcs', 'unit_price' => 10_000, 'total_price' => 10_000]);
        WorkOrderItem::create(['work_order_id' => $wo1->id, 'item_type' => 'labor', 'name' => 'Jasa Ganti Oli', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 150_000, 'total_price' => 150_000]);

        // 2. Completed work order (tire rotation, 2 weeks ago)
        $wo2 = WorkOrder::create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $categories->get('tire')->id,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => 'Rotasi dan Balancing Ban',
            'description' => 'Rotasi ban dan balancing keempat roda. Ban belakang kanan menunjukkan keausan tidak merata.',
            'status' => WorkOrder::STATUS_COMPLETED,
            'priority' => WorkOrder::PRIORITY_NORMAL,
            'type' => WorkOrder::TYPE_PREVENTIVE,
            'odometer_at_service' => $vehicle->odometer_km - 200,
            'scheduled_date' => now()->subDays(14),
            'started_at' => now()->subDays(14),
            'completed_at' => now()->subDays(13),
            'vendor_name' => 'Auto Service Prima',
            'mechanic_name' => 'Hendra Wijaya',
            'invoice_number' => 'INV-'.str_pad((string) $vehicle->id, 4, '0', STR_PAD_LEFT).'-002',
            'estimated_cost' => 200_000,
            'actual_labor_cost' => 200_000,
            'actual_parts_cost' => 0,
            'notes' => null,
            'resolution_notes' => 'Rotasi selesai. Disarankan cek kembali dalam 5.000 km.',
            'created_by' => $userId,
            'approved_by' => $userId,
            'approved_at' => now()->subDays(15),
        ]);

        WorkOrderItem::create(['work_order_id' => $wo2->id, 'item_type' => 'labor', 'name' => 'Jasa Rotasi & Balancing 4 Roda', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 200_000, 'total_price' => 200_000]);

        // 3. In-progress work order (brake)
        $wo3 = WorkOrder::create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $categories->get('brake')->id,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => 'Penggantian Kampas Rem Depan',
            'description' => 'Pengemudi melaporkan suara gesekan saat pengereman. Perlu pengecekan dan penggantian kampas rem.',
            'status' => WorkOrder::STATUS_IN_PROGRESS,
            'priority' => WorkOrder::PRIORITY_HIGH,
            'type' => WorkOrder::TYPE_CORRECTIVE,
            'odometer_at_service' => $vehicle->odometer_km,
            'scheduled_date' => now()->subDays(1),
            'started_at' => now()->subHours(3),
            'completed_at' => null,
            'vendor_name' => 'Bengkel Karya Motor',
            'mechanic_name' => 'Slamet Riyadi',
            'invoice_number' => null,
            'estimated_cost' => 750_000,
            'actual_labor_cost' => null,
            'actual_parts_cost' => null,
            'notes' => 'Pengemudi: Agus melaporkan bunyi saat rem di atas 40 km/jam.',
            'resolution_notes' => null,
            'created_by' => $userId,
            'approved_by' => $userId,
            'approved_at' => now()->subDays(1),
        ]);

        WorkOrderItem::create(['work_order_id' => $wo3->id, 'item_type' => 'part', 'name' => 'Kampas Rem Depan (set)', 'quantity' => 1, 'unit' => 'set', 'unit_price' => 350_000, 'total_price' => 350_000]);
        WorkOrderItem::create(['work_order_id' => $wo3->id, 'item_type' => 'labor', 'name' => 'Jasa Ganti Kampas Rem', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 200_000, 'total_price' => 200_000]);

        // 4. Pending approval work order (engine tune-up)
        WorkOrder::create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $categories->get('engine')->id,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => 'Tune-up Mesin & Ganti Busi',
            'description' => 'Servis berkala 40.000 km. Meliputi tune-up, ganti busi, ganti filter bahan bakar, dan cek sistem injeksi.',
            'status' => WorkOrder::STATUS_PENDING,
            'priority' => WorkOrder::PRIORITY_NORMAL,
            'type' => WorkOrder::TYPE_SCHEDULED,
            'odometer_at_service' => null,
            'scheduled_date' => now()->addDays(7),
            'started_at' => null,
            'completed_at' => null,
            'vendor_name' => 'PT. Astra Service',
            'mechanic_name' => null,
            'invoice_number' => null,
            'estimated_cost' => 1_200_000,
            'actual_labor_cost' => null,
            'actual_parts_cost' => null,
            'notes' => 'Dijadwalkan sesuai paket servis berkala 40.000 km.',
            'resolution_notes' => null,
            'created_by' => $userId,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        // 5. Overdue draft (electrical)
        WorkOrder::create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $categories->get('electrical')->id,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => 'Penggantian Aki',
            'description' => 'Aki lemah, starter kadang tidak menyala di pagi hari. Segera diganti sebelum mogok di jalan.',
            'status' => WorkOrder::STATUS_DRAFT,
            'priority' => WorkOrder::PRIORITY_HIGH,
            'type' => WorkOrder::TYPE_CORRECTIVE,
            'odometer_at_service' => null,
            'scheduled_date' => now()->subDays(5),
            'started_at' => null,
            'completed_at' => null,
            'vendor_name' => null,
            'mechanic_name' => null,
            'invoice_number' => null,
            'estimated_cost' => 600_000,
            'actual_labor_cost' => null,
            'actual_parts_cost' => null,
            'notes' => 'Laporan dari pengemudi.',
            'resolution_notes' => null,
            'created_by' => $userId,
            'approved_by' => null,
            'approved_at' => null,
        ]);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, Vehicle>  $vehicles
     * @param  \Illuminate\Support\Collection<int, MaintenanceCategory>  $categories
     */
    private function seedSchedules($vehicles, $categories): void
    {
        foreach ($vehicles as $vehicle) {
            // Oil change every 5,000 km
            $oilCat = $categories->get('oil_change');
            if ($oilCat) {
                $lastOdometer = max(0, $vehicle->odometer_km - 500);
                MaintenanceSchedule::create([
                    'vehicle_id' => $vehicle->id,
                    'category_id' => $oilCat->id,
                    'name' => 'Ganti Oli Setiap 5.000 km',
                    'interval_type' => MaintenanceSchedule::INTERVAL_MILEAGE,
                    'interval_value' => 5_000,
                    'last_service_odometer' => $lastOdometer,
                    'last_service_date' => now()->subDays(35),
                    'next_service_odometer' => $lastOdometer + 5_000,
                    'next_service_date' => null,
                    'is_active' => true,
                ]);
            }

            // General service every 6 months
            $generalCat = $categories->get('general_service');
            if ($generalCat) {
                MaintenanceSchedule::create([
                    'vehicle_id' => $vehicle->id,
                    'category_id' => $generalCat->id,
                    'name' => 'Servis Berkala 6 Bulan',
                    'interval_type' => MaintenanceSchedule::INTERVAL_CALENDAR,
                    'interval_value' => 180,
                    'last_service_odometer' => null,
                    'last_service_date' => now()->subMonths(3),
                    'next_service_odometer' => null,
                    'next_service_date' => now()->addMonths(3),
                    'is_active' => true,
                ]);
            }

            // Tire rotation every 10,000 km
            $tireCat = $categories->get('tire');
            if ($tireCat) {
                $lastOdometer = max(0, $vehicle->odometer_km - 200);
                MaintenanceSchedule::create([
                    'vehicle_id' => $vehicle->id,
                    'category_id' => $tireCat->id,
                    'name' => 'Rotasi Ban Setiap 10.000 km',
                    'interval_type' => MaintenanceSchedule::INTERVAL_MILEAGE,
                    'interval_value' => 10_000,
                    'last_service_odometer' => $lastOdometer,
                    'last_service_date' => now()->subDays(14),
                    'next_service_odometer' => $lastOdometer + 10_000,
                    'next_service_date' => null,
                    'is_active' => true,
                ]);
            }
        }
    }
}
