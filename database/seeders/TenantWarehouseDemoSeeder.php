<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;

/**
 * Seeds 5 demo warehouses with default + rack locations.
 *
 *   php artisan tenants:seed --class=TenantWarehouseDemoSeeder --tenants={id}
 */
class TenantWarehouseDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! class_exists(Warehouse::class) || ! \Schema::hasTable('warehouses')) {
            $this->command?->warn('Inventory warehouses table missing. Install the inventory module first.');

            return;
        }

        $warehouses = [
            [
                'name' => 'Gudang Pusat Bandar Lampung',
                'location' => 'Jl. Soekarno-Hatta No. 88, Kemiling, Bandar Lampung',
                'status' => 'active',
                'racks' => [
                    ['name' => 'Zona Fast Moving', 'code' => 'ZONE-A', 'type' => 'internal'],
                    ['name' => 'Rak Merchandise A1', 'code' => 'RAK-A1', 'type' => 'internal'],
                    ['name' => 'Rak Sparepart B1', 'code' => 'RAK-B1', 'type' => 'internal'],
                ],
            ],
            [
                'name' => 'Gudang Cabang Metro',
                'location' => 'Jl. Ahmad Yani Km. 3, Metro Pusat, Metro',
                'status' => 'active',
                'racks' => [
                    ['name' => 'Zona Distribusi', 'code' => 'ZONE-D', 'type' => 'internal'],
                    ['name' => 'Rak Umum C1', 'code' => 'RAK-C1', 'type' => 'internal'],
                ],
            ],
            [
                'name' => 'Gudang Cold Storage',
                'location' => 'Kawasan Industri Way Halim Blok C-12, Bandar Lampung',
                'status' => 'active',
                'racks' => [
                    ['name' => 'Cold Room 1', 'code' => 'COLD-01', 'type' => 'internal'],
                    ['name' => 'Cold Room 2', 'code' => 'COLD-02', 'type' => 'internal'],
                    ['name' => 'Staging Chiller', 'code' => 'STAGE-CH', 'type' => 'internal'],
                ],
            ],
            [
                'name' => 'Gudang Transit Bakauheni',
                'location' => 'Pelabuhan Bakauheni, Kecamatan Bakauheni, Lampung Selatan',
                'status' => 'active',
                'racks' => [
                    ['name' => 'Dock In', 'code' => 'DOCK-IN', 'type' => 'input'],
                    ['name' => 'Dock Out', 'code' => 'DOCK-OUT', 'type' => 'output'],
                    ['name' => 'Staging Transit', 'code' => 'STAGE-TR', 'type' => 'internal'],
                ],
            ],
            [
                'name' => 'Gudang Sparepart Pringsewu',
                'location' => 'Jl. Raya Pringsewu–Gading Rejo No. 45, Pringsewu',
                'status' => 'active',
                'racks' => [
                    ['name' => 'Rak Sparepart S1', 'code' => 'SP-S1', 'type' => 'internal'],
                    ['name' => 'Rak Sparepart S2', 'code' => 'SP-S2', 'type' => 'internal'],
                    ['name' => 'Quarantine', 'code' => 'QA-HOLD', 'type' => 'internal'],
                ],
            ],
        ];

        $created = 0;

        foreach ($warehouses as $data) {
            $racks = $data['racks'];
            unset($data['racks']);

            $warehouse = Warehouse::query()->firstOrCreate(
                ['name' => $data['name']],
                $data,
            );

            if ($warehouse->wasRecentlyCreated) {
                $created++;
            }

            $warehouse->createDefaultLocations();

            $stock = $warehouse->locations()->where('code', 'STOCK')->first();
            $sortOrder = 10;

            foreach ($racks as $rack) {
                WarehouseLocation::query()->firstOrCreate(
                    [
                        'warehouse_id' => $warehouse->id,
                        'code' => $rack['code'],
                    ],
                    [
                        'parent_id' => $stock?->id,
                        'name' => $rack['name'],
                        'type' => $rack['type'],
                        'is_default' => false,
                        'sort_order' => $sortOrder++,
                    ],
                );
            }

            $this->command?->info(sprintf(
                'Warehouse: %s (%d locations)',
                $warehouse->name,
                $warehouse->locations()->count(),
            ));
        }

        $this->command?->info("Done. {$created} new warehouses seeded (5 total targeted).");
    }
}
