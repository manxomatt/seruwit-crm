<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\PartnerIndustry;

/**
 * Common ERP/CRM partner industries (id/en JSON) for the Industries vertical pack.
 *
 *   php artisan tenants:seed --class=TenantPartnerIndustriesSeeder --tenants={id}
 */
class TenantPartnerIndustriesSeeder extends Seeder
{
    public const TAG = '[INDUSTRIES-PACK]';

    /**
     * Stable industry codes shipped by this pack.
     *
     * @var list<string>
     */
    public const CODES = [
        'manufacturing',
        'wholesale_distribution',
        'retail',
        'logistics_transport',
        'construction',
        'agriculture',
        'mining_energy',
        'technology_it',
        'financial_services',
        'healthcare',
        'education',
        'hospitality_tourism',
        'food_beverage',
        'professional_services',
        'government_public',
        'telecommunications',
        'real_estate',
        'automotive',
    ];

    public function run(): void
    {
        if (! Schema::hasTable('partner_industries')) {
            $this->command?->warn('partner_industries table missing; skip industries pack seeder.');

            return;
        }

        foreach ($this->catalog() as $row) {
            PartnerIndustry::query()->updateOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'is_active' => true,
                ],
            );
        }

        $this->command?->info(sprintf(
            'Partner industries pack ready: %d industries.',
            PartnerIndustry::query()->whereIn('code', self::CODES)->count(),
        ));
    }

    /**
     * Remove pack industries that are not assigned to partners.
     * Industries still in use are deactivated instead of deleted.
     */
    public function uninstall(): void
    {
        if (! Schema::hasTable('partner_industries')) {
            return;
        }

        $industries = PartnerIndustry::query()
            ->withCount('partners')
            ->whereIn('code', self::CODES)
            ->get();

        foreach ($industries as $industry) {
            if ($industry->partners_count > 0) {
                $industry->update(['is_active' => false]);

                continue;
            }

            $industry->delete();
        }
    }

    /**
     * @return list<array{code: string, name: array{id: string, en: string}, description: array{id: string, en: string}}>
     */
    private function catalog(): array
    {
        return [
            [
                'code' => 'manufacturing',
                'name' => ['id' => 'Manufaktur', 'en' => 'Manufacturing'],
                'description' => [
                    'id' => 'Produksi barang dan pabrikasi. '.self::TAG,
                    'en' => 'Goods production and fabrication. '.self::TAG,
                ],
            ],
            [
                'code' => 'wholesale_distribution',
                'name' => ['id' => 'Distribusi & Grosir', 'en' => 'Wholesale & Distribution'],
                'description' => [
                    'id' => 'Perdagangan grosir dan distribusi. '.self::TAG,
                    'en' => 'Wholesale trade and distribution. '.self::TAG,
                ],
            ],
            [
                'code' => 'retail',
                'name' => ['id' => 'Ritel', 'en' => 'Retail'],
                'description' => [
                    'id' => 'Penjualan langsung ke konsumen akhir. '.self::TAG,
                    'en' => 'Direct sales to end consumers. '.self::TAG,
                ],
            ],
            [
                'code' => 'logistics_transport',
                'name' => ['id' => 'Logistik & Transportasi', 'en' => 'Logistics & Transportation'],
                'description' => [
                    'id' => 'Pengiriman, armada, dan pergudangan. '.self::TAG,
                    'en' => 'Freight, fleet, and warehousing. '.self::TAG,
                ],
            ],
            [
                'code' => 'construction',
                'name' => ['id' => 'Konstruksi', 'en' => 'Construction'],
                'description' => [
                    'id' => 'Bangunan, infrastruktur, dan kontraktor. '.self::TAG,
                    'en' => 'Building, infrastructure, and contractors. '.self::TAG,
                ],
            ],
            [
                'code' => 'agriculture',
                'name' => ['id' => 'Pertanian', 'en' => 'Agriculture'],
                'description' => [
                    'id' => 'Agribisnis, perkebunan, dan peternakan. '.self::TAG,
                    'en' => 'Agribusiness, plantations, and livestock. '.self::TAG,
                ],
            ],
            [
                'code' => 'mining_energy',
                'name' => ['id' => 'Pertambangan & Energi', 'en' => 'Mining & Energy'],
                'description' => [
                    'id' => 'Tambang, minyak, gas, dan energi. '.self::TAG,
                    'en' => 'Mining, oil, gas, and energy. '.self::TAG,
                ],
            ],
            [
                'code' => 'technology_it',
                'name' => ['id' => 'Teknologi & IT', 'en' => 'Technology & IT'],
                'description' => [
                    'id' => 'Perangkat lunak, hardware, dan layanan TI. '.self::TAG,
                    'en' => 'Software, hardware, and IT services. '.self::TAG,
                ],
            ],
            [
                'code' => 'financial_services',
                'name' => ['id' => 'Jasa Keuangan', 'en' => 'Financial Services'],
                'description' => [
                    'id' => 'Bank, asuransi, pembiayaan, dan fintech. '.self::TAG,
                    'en' => 'Banking, insurance, lending, and fintech. '.self::TAG,
                ],
            ],
            [
                'code' => 'healthcare',
                'name' => ['id' => 'Kesehatan', 'en' => 'Healthcare'],
                'description' => [
                    'id' => 'Rumah sakit, klinik, farmasi, dan medis. '.self::TAG,
                    'en' => 'Hospitals, clinics, pharma, and medical. '.self::TAG,
                ],
            ],
            [
                'code' => 'education',
                'name' => ['id' => 'Pendidikan', 'en' => 'Education'],
                'description' => [
                    'id' => 'Sekolah, kampus, dan pelatihan. '.self::TAG,
                    'en' => 'Schools, campuses, and training. '.self::TAG,
                ],
            ],
            [
                'code' => 'hospitality_tourism',
                'name' => ['id' => 'Hospitaliti & Pariwisata', 'en' => 'Hospitality & Tourism'],
                'description' => [
                    'id' => 'Hotel, F&B hospitality, dan wisata. '.self::TAG,
                    'en' => 'Hotels, hospitality F&B, and tourism. '.self::TAG,
                ],
            ],
            [
                'code' => 'food_beverage',
                'name' => ['id' => 'Makanan & Minuman', 'en' => 'Food & Beverage'],
                'description' => [
                    'id' => 'Produsen dan distributor F&B. '.self::TAG,
                    'en' => 'F&B producers and distributors. '.self::TAG,
                ],
            ],
            [
                'code' => 'professional_services',
                'name' => ['id' => 'Jasa Profesional', 'en' => 'Professional Services'],
                'description' => [
                    'id' => 'Konsultan, hukum, akuntansi, dan agen. '.self::TAG,
                    'en' => 'Consulting, legal, accounting, and agencies. '.self::TAG,
                ],
            ],
            [
                'code' => 'government_public',
                'name' => ['id' => 'Pemerintahan & Publik', 'en' => 'Government & Public Sector'],
                'description' => [
                    'id' => 'Instansi pemerintah dan BUMN/BUMD. '.self::TAG,
                    'en' => 'Government agencies and SOEs. '.self::TAG,
                ],
            ],
            [
                'code' => 'telecommunications',
                'name' => ['id' => 'Telekomunikasi', 'en' => 'Telecommunications'],
                'description' => [
                    'id' => 'Operator dan infrastruktur telekomunikasi. '.self::TAG,
                    'en' => 'Telecom operators and infrastructure. '.self::TAG,
                ],
            ],
            [
                'code' => 'real_estate',
                'name' => ['id' => 'Properti', 'en' => 'Real Estate'],
                'description' => [
                    'id' => 'Pengembang dan properti komersial. '.self::TAG,
                    'en' => 'Developers and commercial property. '.self::TAG,
                ],
            ],
            [
                'code' => 'automotive',
                'name' => ['id' => 'Otomotif', 'en' => 'Automotive'],
                'description' => [
                    'id' => 'Dealer, bengkel, dan suku cadang. '.self::TAG,
                    'en' => 'Dealers, workshops, and spare parts. '.self::TAG,
                ],
            ],
        ];
    }
}
