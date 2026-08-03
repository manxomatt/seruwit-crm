<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceBay;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderChecklistItem;
use Modules\Maintenance\Models\WorkOrderItem;
use Modules\Partners\Models\Partner;

/**
 * Seeds Maintenance demo data aligned with workshop shop-floor features
 * (bays, mechanic/vendor links, checklist, hours, WIP statuses).
 *
 *   php artisan tenants:seed --class=TenantMaintenanceDemoSeeder --tenants={id}
 */
class TenantMaintenanceDemoSeeder extends Seeder
{
    public const TAG = '[MAINT-DEMO]';

    public const BAY_CODE_PREFIX = 'DM-';

    public function run(): void
    {
        if (! class_exists(WorkOrder::class) || ! Schema::hasTable('work_orders')) {
            $this->command?->warn('Maintenance tables missing. Install the maintenance module first.');

            return;
        }

        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles')) {
            throw new \RuntimeException('Install the [fleet] module before installing this demo data.');
        }

        $users = User::query()->orderBy('id')->get(['id', 'name']);

        if ($users->isEmpty()) {
            $this->command?->warn('No users found in this tenant.');

            return;
        }

        $categories = MaintenanceCategory::query()->orderBy('sort_order')->get()->keyBy('key');

        if ($categories->isEmpty()) {
            $this->command?->warn('Maintenance categories not found. Run migrations first.');

            return;
        }

        $vehicles = $this->resolveVehicles();
        $bays = $this->resolveBays();
        $vendor = $this->resolveVendorPartner();
        $mechanicIds = $users->pluck('id')->all();

        if (WorkOrder::query()->where('notes', 'like', '%'.self::TAG.'%')->exists()) {
            $this->command?->info('Maintenance demo data already present — skipping work orders.');
        } else {
            $this->command?->info('Seeding maintenance work orders (shop floor)...');

            foreach ($vehicles->values() as $index => $vehicle) {
                $this->seedVehicleWorkOrders(
                    $vehicle,
                    (int) $index,
                    $categories,
                    $bays,
                    $mechanicIds,
                    $vendor,
                    (int) $users->first()->id,
                );
            }
        }

        $this->command?->info('Seeding maintenance schedules...');
        $this->seedSchedules($vehicles, $categories);

        $this->command?->info(sprintf(
            'Done. %d demo work orders, %d demo schedules, %d demo bays.',
            WorkOrder::query()->where('notes', 'like', '%'.self::TAG.'%')->count(),
            MaintenanceSchedule::query()->where('notes', 'like', '%'.self::TAG.'%')->count(),
            MaintenanceBay::query()->where('code', 'like', self::BAY_CODE_PREFIX.'%')->count(),
        ));
    }

    public function isInstalled(): bool
    {
        if (! class_exists(WorkOrder::class) || ! Schema::hasTable('work_orders')) {
            return false;
        }

        return WorkOrder::query()->where('notes', 'like', '%'.self::TAG.'%')->exists();
    }

    public function uninstall(): void
    {
        $deletedOrders = 0;
        $deletedSchedules = 0;
        $deletedBays = 0;

        if (class_exists(WorkOrder::class) && Schema::hasTable('work_orders')) {
            $orderIds = WorkOrder::withTrashed()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->pluck('id');

            if ($orderIds->isNotEmpty() && class_exists(WorkOrderChecklistItem::class) && Schema::hasTable('work_order_checklist_items')) {
                WorkOrderChecklistItem::query()->whereIn('work_order_id', $orderIds)->delete();
            }

            if ($orderIds->isNotEmpty() && class_exists(WorkOrderItem::class) && Schema::hasTable('work_order_items')) {
                WorkOrderItem::query()->whereIn('work_order_id', $orderIds)->delete();
            }

            $deletedOrders = WorkOrder::withTrashed()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->forceDelete();
        }

        if (class_exists(MaintenanceSchedule::class) && Schema::hasTable('maintenance_schedules')) {
            $deletedSchedules = MaintenanceSchedule::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->delete();
        }

        if (class_exists(MaintenanceBay::class) && Schema::hasTable('maintenance_bays')) {
            $deletedBays = MaintenanceBay::query()
                ->where('code', 'like', self::BAY_CODE_PREFIX.'%')
                ->delete();
        }

        if (class_exists(Partner::class) && Schema::hasTable('partners')) {
            Partner::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->delete();
        }

        if (class_exists(Vehicle::class) && Schema::hasTable('vehicles')) {
            Vehicle::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->get()
                ->each(function (Vehicle $vehicle): void {
                    if ($vehicle->status === Vehicle::STATUS_MAINTENANCE) {
                        $vehicle->update(['status' => Vehicle::STATUS_ACTIVE]);
                    }
                });

            Vehicle::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->delete();
        }

        // Clear maintenance status left on shared fleet vehicles by demo WIP jobs.
        if (class_exists(Vehicle::class) && Schema::hasTable('vehicles') && Schema::hasTable('work_orders')) {
            $busyVehicleIds = WorkOrder::query()
                ->where('status', WorkOrder::STATUS_IN_PROGRESS)
                ->pluck('vehicle_id');

            Vehicle::query()
                ->where('status', Vehicle::STATUS_MAINTENANCE)
                ->when(
                    $busyVehicleIds->isNotEmpty(),
                    fn ($query) => $query->whereNotIn('id', $busyVehicleIds),
                )
                ->update(['status' => Vehicle::STATUS_ACTIVE]);
        }

        $this->command?->info(
            "Maintenance demo data removed ({$deletedOrders} work orders, {$deletedSchedules} schedules, {$deletedBays} bays).",
        );
    }

    /**
     * @return Collection<int, Vehicle>
     */
    protected function resolveVehicles(): Collection
    {
        $preferred = Vehicle::query()
            ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
            ->orderBy('plate_number')
            ->take(5)
            ->get();

        if ($preferred->count() >= 2) {
            return $preferred;
        }

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
                'notes' => self::TAG.' Demo vehicle for maintenance.',
            ]);
        }

        return Vehicle::query()->orderBy('id')->take(5)->get();
    }

    /**
     * @return Collection<int, MaintenanceBay>
     */
    protected function resolveBays(): Collection
    {
        if (! class_exists(MaintenanceBay::class) || ! Schema::hasTable('maintenance_bays')) {
            return collect();
        }

        $definitions = [
            ['code' => self::BAY_CODE_PREFIX.'B1', 'name' => 'Lift A', 'sort_order' => 1],
            ['code' => self::BAY_CODE_PREFIX.'B2', 'name' => 'Lift B', 'sort_order' => 2],
            ['code' => self::BAY_CODE_PREFIX.'QS', 'name' => 'Quick Service', 'sort_order' => 3],
        ];

        foreach ($definitions as $definition) {
            MaintenanceBay::query()->firstOrCreate(
                ['code' => $definition['code']],
                [
                    'name' => $definition['name'],
                    'is_active' => true,
                    'sort_order' => $definition['sort_order'],
                ],
            );
        }

        return MaintenanceBay::query()
            ->where('code', 'like', self::BAY_CODE_PREFIX.'%')
            ->ordered()
            ->get();
    }

    protected function resolveVendorPartner(): ?Partner
    {
        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            return null;
        }

        $existing = Partner::query()
            ->where('supplier_rank', '>', 0)
            ->where('status', 'active')
            ->orderBy('id')
            ->first();

        if ($existing) {
            return $existing;
        }

        return Partner::query()->create([
            'code' => 'DM-VENDOR-01',
            'name' => 'Bengkel Demo Maju Jaya',
            'status' => 'active',
            'account_type' => 'company',
            'customer_rank' => 0,
            'supplier_rank' => 1,
            'sub_type' => 'supplier',
            'notes' => self::TAG.' Demo workshop vendor.',
        ]);
    }

    /**
     * @param  Collection<string, MaintenanceCategory>  $categories
     * @param  Collection<int, MaintenanceBay>  $bays
     * @param  list<int>  $mechanicIds
     */
    private function seedVehicleWorkOrders(
        Vehicle $vehicle,
        int $index,
        Collection $categories,
        Collection $bays,
        array $mechanicIds,
        ?Partner $vendor,
        int $userId,
    ): void {
        $oil = $categories->get('oil_change');
        $tire = $categories->get('tire');
        $brake = $categories->get('brake');
        $engine = $categories->get('engine');
        $electrical = $categories->get('electrical');

        $bay1 = $bays->get(0);
        $bay2 = $bays->get(1);
        $mechanicA = $mechanicIds[0] ?? null;
        $mechanicB = $mechanicIds[1] ?? $mechanicA;
        $mechanicName = fn (?int $id): ?string => $id
            ? User::query()->whereKey($id)->value('name')
            : null;

        // Shared history: completed in-house job with checklist + hours.
        if ($oil) {
            $completedInHouse = WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $oil->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Ganti Oli Mesin Rutin',
                'description' => 'Penggantian oli mesin SAE 15W-40 dan filter oli.',
                'status' => WorkOrder::STATUS_COMPLETED,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_PREVENTIVE,
                'service_location' => WorkOrder::LOCATION_IN_HOUSE,
                'odometer_at_service' => max(0, $vehicle->odometer_km - 500),
                'scheduled_date' => now()->subDays(35),
                'started_at' => now()->subDays(35)->setTime(8, 0),
                'completed_at' => now()->subDays(35)->setTime(11, 30),
                'bay_id' => $bay1?->id,
                'mechanic_user_id' => $mechanicA,
                'mechanic_name' => $mechanicName($mechanicA) ?? 'Budi Santoso',
                'estimated_hours' => 3,
                'actual_hours' => 3.5,
                'waiting_parts' => false,
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

            $this->seedItems($completedInHouse, [
                ['item_type' => 'part', 'name' => 'Oli Mesin SAE 15W-40', 'quantity' => 6, 'unit' => 'liter', 'unit_price' => 35_000, 'total_price' => 210_000],
                ['item_type' => 'part', 'name' => 'Filter Oli', 'quantity' => 1, 'unit' => 'pcs', 'unit_price' => 10_000, 'total_price' => 10_000],
                ['item_type' => 'labor', 'name' => 'Jasa Ganti Oli', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 150_000, 'total_price' => 150_000],
            ]);

            $this->seedChecklist($completedInHouse, [
                ['label' => 'Drain oli lama', 'is_done' => true],
                ['label' => 'Pasang filter oli baru', 'is_done' => true],
                ['label' => 'Isi oli baru & cek level', 'is_done' => true],
                ['label' => 'Cek kebocoran setelah jalan singkat', 'is_done' => true],
            ]);
        }

        // Completed outsource job (vendor partner when available).
        if ($tire) {
            $completedOutsource = WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $tire->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Rotasi dan Balancing Ban',
                'description' => 'Rotasi ban dan balancing keempat roda (outsource).',
                'status' => WorkOrder::STATUS_COMPLETED,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_PREVENTIVE,
                'service_location' => WorkOrder::LOCATION_OUTSOURCE,
                'odometer_at_service' => max(0, $vehicle->odometer_km - 200),
                'scheduled_date' => now()->subDays(14),
                'started_at' => now()->subDays(14)->setTime(9, 0),
                'completed_at' => now()->subDays(14)->setTime(12, 0),
                'bay_id' => null,
                'vendor_partner_id' => $vendor?->id,
                'vendor_name' => $vendor?->name ?? 'Auto Service Prima',
                'estimated_hours' => 2,
                'actual_hours' => 2,
                'waiting_parts' => false,
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

            $this->seedItems($completedOutsource, [
                ['item_type' => 'labor', 'name' => 'Jasa Rotasi & Balancing 4 Roda', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 200_000, 'total_price' => 200_000],
            ]);
        }

        // Shop-floor live board: one active vehicle per bay.
        if ($index === 0 && $brake) {
            $inProgress = WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $brake->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Penggantian Kampas Rem Depan',
                'description' => 'Pengemudi melaporkan suara gesekan saat pengereman.',
                'status' => WorkOrder::STATUS_IN_PROGRESS,
                'priority' => WorkOrder::PRIORITY_HIGH,
                'type' => WorkOrder::TYPE_CORRECTIVE,
                'service_location' => WorkOrder::LOCATION_IN_HOUSE,
                'odometer_at_service' => $vehicle->odometer_km,
                'scheduled_date' => now()->toDateString(),
                'started_at' => now()->subHours(3),
                'bay_id' => $bay1?->id,
                'mechanic_user_id' => $mechanicA,
                'mechanic_name' => $mechanicName($mechanicA) ?? 'Slamet Riyadi',
                'estimated_hours' => 4,
                'waiting_parts' => false,
                'vehicle_status_before' => Vehicle::STATUS_ACTIVE,
                'estimated_cost' => 750_000,
                'notes' => self::TAG.' Bunyi saat rem di atas 40 km/jam.',
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now()->subDay(),
            ]);

            $this->seedItems($inProgress, [
                ['item_type' => 'part', 'name' => 'Kampas Rem Depan (set)', 'quantity' => 1, 'unit' => 'set', 'unit_price' => 350_000, 'total_price' => 350_000],
                ['item_type' => 'labor', 'name' => 'Jasa Ganti Kampas Rem', 'quantity' => 1, 'unit' => 'pekerjaan', 'unit_price' => 200_000, 'total_price' => 200_000],
            ]);

            $this->seedChecklist($inProgress, [
                ['label' => 'Lepas roda depan', 'is_done' => true],
                ['label' => 'Ganti kampas rem', 'is_done' => true],
                ['label' => 'Cek ketebalan disc', 'is_done' => false],
                ['label' => 'Test pengereman di area bengkel', 'is_done' => false],
            ]);

            $vehicle->update(['status' => Vehicle::STATUS_MAINTENANCE]);
        }

        if ($index === 1 && $electrical) {
            $waiting = WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $electrical->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Penggantian Aki',
                'description' => 'Aki lemah, starter kadang tidak menyala di pagi hari.',
                'status' => WorkOrder::STATUS_IN_PROGRESS,
                'priority' => WorkOrder::PRIORITY_HIGH,
                'type' => WorkOrder::TYPE_CORRECTIVE,
                'service_location' => WorkOrder::LOCATION_IN_HOUSE,
                'odometer_at_service' => $vehicle->odometer_km,
                'scheduled_date' => now()->toDateString(),
                'started_at' => now()->subHours(5),
                'bay_id' => $bay2?->id,
                'mechanic_user_id' => $mechanicB,
                'mechanic_name' => $mechanicName($mechanicB) ?? 'Hendra Wijaya',
                'estimated_hours' => 1.5,
                'waiting_parts' => true,
                'vehicle_status_before' => Vehicle::STATUS_ACTIVE,
                'estimated_cost' => 600_000,
                'notes' => self::TAG.' Menunggu aki 12V 100Ah.',
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now()->subDays(2),
            ]);

            $this->seedChecklist($waiting, [
                ['label' => 'Ukur tegangan aki', 'is_done' => true],
                ['label' => 'Pesan aki pengganti', 'is_done' => true],
                ['label' => 'Pasang aki baru', 'is_done' => false],
            ]);

            $vehicle->update(['status' => Vehicle::STATUS_MAINTENANCE]);
        }

        if ($index === 2 && $engine) {
            WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $engine->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Tune-up Mesin & Ganti Busi',
                'description' => 'Servis berkala 40.000 km.',
                'status' => WorkOrder::STATUS_APPROVED,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_SCHEDULED,
                'service_location' => WorkOrder::LOCATION_IN_HOUSE,
                'scheduled_date' => now()->addDay()->toDateString(),
                'bay_id' => $bays->get(2)?->id ?? $bay1?->id,
                'mechanic_user_id' => $mechanicA,
                'mechanic_name' => $mechanicName($mechanicA),
                'estimated_hours' => 5,
                'estimated_cost' => 1_200_000,
                'notes' => self::TAG.' Antrian WIP — siap mulai.',
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now()->subHours(6),
            ]);
        }

        if ($index >= 3 && $engine) {
            WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $engine->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Tune-up Mesin & Ganti Busi',
                'description' => 'Servis berkala 40.000 km.',
                'status' => WorkOrder::STATUS_PENDING,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_SCHEDULED,
                'service_location' => WorkOrder::LOCATION_IN_HOUSE,
                'scheduled_date' => now()->addDays(7)->toDateString(),
                'bay_id' => $bay1?->id,
                'estimated_hours' => 5,
                'estimated_cost' => 1_200_000,
                'notes' => self::TAG.' Menunggu approval.',
                'created_by' => $userId,
            ]);
        }

        if ($electrical && $index !== 1) {
            WorkOrder::query()->create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $electrical->id,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => 'Pemeriksaan Sistem Kelistrikan',
                'description' => 'Draft pemeriksaan kelistrikan kabin.',
                'status' => WorkOrder::STATUS_DRAFT,
                'priority' => WorkOrder::PRIORITY_LOW,
                'type' => WorkOrder::TYPE_CORRECTIVE,
                'service_location' => WorkOrder::LOCATION_IN_HOUSE,
                'scheduled_date' => now()->addDays(3)->toDateString(),
                'estimated_hours' => 2,
                'estimated_cost' => 250_000,
                'notes' => self::TAG.' Draft untuk perencanaan.',
                'created_by' => $userId,
            ]);
        }
    }

    /**
     * @param  list<array{item_type: string, name: string, quantity: float|int, unit: string, unit_price: float|int, total_price: float|int}>  $items
     */
    private function seedItems(WorkOrder $workOrder, array $items): void
    {
        foreach ($items as $item) {
            WorkOrderItem::query()->create([
                'work_order_id' => $workOrder->id,
                ...$item,
            ]);
        }
    }

    /**
     * @param  list<array{label: string, is_done: bool}>  $items
     */
    private function seedChecklist(WorkOrder $workOrder, array $items): void
    {
        if (! class_exists(WorkOrderChecklistItem::class) || ! Schema::hasTable('work_order_checklist_items')) {
            return;
        }

        foreach ($items as $index => $item) {
            WorkOrderChecklistItem::query()->create([
                'work_order_id' => $workOrder->id,
                'label' => $item['label'],
                'is_done' => $item['is_done'],
                'done_at' => $item['is_done'] ? now()->subHours(max(1, 4 - $index)) : null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * @param  Collection<int, Vehicle>  $vehicles
     * @param  Collection<string, MaintenanceCategory>  $categories
     */
    private function seedSchedules(Collection $vehicles, Collection $categories): void
    {
        foreach ($vehicles->values() as $index => $vehicle) {
            $oilCat = $categories->get('oil_change');
            if ($oilCat) {
                $lastOdometer = max(0, $vehicle->odometer_km - 500);
                // First vehicle: overdue mileage schedule for scan-due demos.
                $nextOdometer = $index === 0
                    ? max(1000, $vehicle->odometer_km - 200)
                    : $lastOdometer + 5_000;

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
                        'next_service_odometer' => $nextOdometer,
                        'next_service_date' => null,
                        'is_active' => true,
                        'notes' => self::TAG.($index === 0 ? ' Overdue for scan-due.' : ''),
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
                        'last_service_date' => now()->subMonths(5)->subDays(20),
                        // Due soon within default alert_days_before (14).
                        'next_service_odometer' => null,
                        'next_service_date' => now()->addDays($index === 1 ? 5 : 90),
                        'is_active' => true,
                        'notes' => self::TAG.($index === 1 ? ' Due soon for scan-due.' : ''),
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
                        'notes' => self::TAG,
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
                        'notes' => self::TAG,
                    ],
                );
            }
        }
    }
}
