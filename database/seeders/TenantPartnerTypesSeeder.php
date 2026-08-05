<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\PartnerType;

/**
 * Rental, logistics, and CRM contact-type masters (id/en JSON) for the Contact Types vertical pack.
 *
 *   php artisan db:seed --class=TenantPartnerTypesSeeder
 *   php artisan tenants:seed --class=TenantPartnerTypesSeeder --tenants={id}
 */
class TenantPartnerTypesSeeder extends Seeder
{
    public const TAG = '[TYPES-PACK]';

    /**
     * Stable type codes shipped by this pack (excludes core migration defaults).
     *
     * @var list<string>
     */
    public const CODES = [
        'prospect',
        'government',
        'travel_agent',
        'fleet_owner',
        'external_driver',
        'shipper',
        'consignee',
        'carrier',
        'broker',
        'warehouse',
    ];

    public function run(): void
    {
        if (! Schema::hasTable('partner_types')) {
            $this->command?->warn('partner_types table missing; skip contact types pack seeder.');

            return;
        }

        foreach ($this->catalog() as $row) {
            PartnerType::query()->updateOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'affects_customer_rank' => $row['affects_customer_rank'],
                    'affects_supplier_rank' => $row['affects_supplier_rank'],
                    'is_active' => true,
                ],
            );
        }

        $this->command?->info(sprintf(
            'Contact types pack ready: %d pack types (%d total active types).',
            PartnerType::query()->whereIn('code', self::CODES)->count(),
            PartnerType::query()->where('is_active', true)->count(),
        ));
    }

    public function isInstalled(): bool
    {
        if (! Schema::hasTable('partner_types')) {
            return false;
        }

        return PartnerType::query()->whereIn('code', self::CODES)->exists();
    }

    /**
     * Remove pack types that are not assigned to contacts.
     * Types still in use are deactivated instead of deleted.
     */
    public function uninstall(): void
    {
        if (! Schema::hasTable('partner_types')) {
            return;
        }

        $types = PartnerType::query()
            ->withCount('partners')
            ->whereIn('code', self::CODES)
            ->get();

        foreach ($types as $type) {
            if ($type->partners_count > 0) {
                $type->update(['is_active' => false]);

                continue;
            }

            $type->delete();
        }
    }

    /**
     * @return list<array{
     *     code: string,
     *     name: array{id: string, en: string},
     *     description: array{id: string, en: string},
     *     affects_customer_rank: bool,
     *     affects_supplier_rank: bool
     * }>
     */
    private function catalog(): array
    {
        return [
            [
                'code' => 'prospect',
                'name' => ['id' => 'Prospek', 'en' => 'Prospect'],
                'description' => [
                    'id' => 'Lead atau prospek yang belum menjadi customer. '.self::TAG,
                    'en' => 'Lead or prospect not yet a customer. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'government',
                'name' => ['id' => 'Pemerintah', 'en' => 'Government'],
                'description' => [
                    'id' => 'Instansi pemerintah atau BUMN/BUMD. '.self::TAG,
                    'en' => 'Government agency or state-owned enterprise. '.self::TAG,
                ],
                'affects_customer_rank' => true,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'travel_agent',
                'name' => ['id' => 'Agen Travel', 'en' => 'Travel Agent'],
                'description' => [
                    'id' => 'Agen travel atau tour yang mengarahkan penyewa. '.self::TAG,
                    'en' => 'Travel or tour agent referring renters. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'fleet_owner',
                'name' => ['id' => 'Pemilik Armada', 'en' => 'Fleet Owner'],
                'description' => [
                    'id' => 'Pemilik kendaraan untuk sewa atau subkontrak armada. '.self::TAG,
                    'en' => 'Vehicle owner for rental or fleet subcontracting. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => true,
            ],
            [
                'code' => 'external_driver',
                'name' => ['id' => 'Sopir Eksternal', 'en' => 'External Driver'],
                'description' => [
                    'id' => 'Sopir pihak luar, bukan driver internal fleet. '.self::TAG,
                    'en' => 'External driver, not an internal fleet driver. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'shipper',
                'name' => ['id' => 'Shipper', 'en' => 'Shipper'],
                'description' => [
                    'id' => 'Pengirim barang pada order logistik. '.self::TAG,
                    'en' => 'Shipper on logistics orders. '.self::TAG,
                ],
                'affects_customer_rank' => true,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'consignee',
                'name' => ['id' => 'Consignee', 'en' => 'Consignee'],
                'description' => [
                    'id' => 'Penerima barang pada order logistik. '.self::TAG,
                    'en' => 'Consignee on logistics orders. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'carrier',
                'name' => ['id' => 'Carrier', 'en' => 'Carrier'],
                'description' => [
                    'id' => 'Perusahaan angkutan pihak ketiga. '.self::TAG,
                    'en' => 'Third-party carrier company. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => true,
            ],
            [
                'code' => 'broker',
                'name' => ['id' => 'Broker', 'en' => 'Broker'],
                'description' => [
                    'id' => 'Broker asuransi atau kredit. '.self::TAG,
                    'en' => 'Insurance or credit broker. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'warehouse',
                'name' => ['id' => 'Gudang Eksternal', 'en' => 'External Warehouse'],
                'description' => [
                    'id' => 'Gudang atau titik transit pihak ketiga. '.self::TAG,
                    'en' => 'Third-party warehouse or transit point. '.self::TAG,
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => true,
            ],
        ];
    }
}
