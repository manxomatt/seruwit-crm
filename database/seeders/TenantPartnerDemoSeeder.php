<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Modules\Partners\Models\PartnerTag;

/**
 * Seeds 20 demo partners: customers, suppliers, and dual-role partners.
 *
 *   php artisan tenants:seed --class=TenantPartnerDemoSeeder --tenants={id}
 */
class TenantPartnerDemoSeeder extends Seeder
{
    public const TAG = '[PARTNERS-DEMO]';

    public function run(): void
    {
        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            $this->command?->warn('partners table missing. Install the partners module first.');

            return;
        }

        $industries = $this->seedIndustries();
        $tags = $this->seedTags();

        $partners = [
            // Customers (8)
            [
                'code' => 'PART-C-000001',
                'name' => 'PT Maju Jaya Retailindo',
                'email' => 'purchasing@majujaya.co.id',
                'phone' => '0217890123',
                'mobile' => '081234567801',
                'website' => 'https://majujaya.co.id',
                'tax_id' => '01.234.567.8-901.000',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 150000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['VIP', 'Retail'],
                'address' => [
                    'street' => 'Jl. Gatot Subroto Kav. 12',
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'zip' => '12930',
                ],
            ],
            [
                'code' => 'PART-C-000002',
                'name' => 'CV Berkah Abadi Mart',
                'email' => 'order@berkahabadi.id',
                'phone' => '0227654321',
                'mobile' => '081234567802',
                'tax_id' => '02.345.678.9-012.000',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 50000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Retail'],
                'address' => [
                    'street' => 'Jl. Asia Afrika No. 88',
                    'city' => 'Bandung',
                    'province' => 'Jawa Barat',
                    'zip' => '40111',
                ],
            ],
            [
                'code' => 'PART-C-000003',
                'name' => 'Toko Sinar Makmur',
                'email' => 'sinarmakmur@gmail.com',
                'phone' => '0318765432',
                'mobile' => '081234567803',
                'account_type' => 'individual',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 15000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Retail', 'Lokal'],
                'address' => [
                    'street' => 'Jl. Raya Darmo No. 45',
                    'city' => 'Surabaya',
                    'province' => 'Jawa Timur',
                    'zip' => '60241',
                ],
            ],
            [
                'code' => 'PART-C-000004',
                'name' => 'PT Nusantara Foodservice',
                'email' => 'procurement@nusantarafood.co.id',
                'phone' => '0214567890',
                'mobile' => '081234567804',
                'website' => 'https://nusantarafood.co.id',
                'tax_id' => '03.456.789.0-123.000',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 200000000,
                'industry' => 'F&B / Hospitality',
                'tags' => ['VIP', 'F&B'],
                'address' => [
                    'street' => 'Jl. Thamrin No. 28',
                    'city' => 'Jakarta Pusat',
                    'province' => 'DKI Jakarta',
                    'zip' => '10230',
                ],
            ],
            [
                'code' => 'PART-C-000005',
                'name' => 'Hotel Grand Lampung',
                'email' => 'purchasing@grandlampung.com',
                'phone' => '0721789012',
                'mobile' => '081234567805',
                'website' => 'https://grandlampung.com',
                'tax_id' => '04.567.890.1-234.000',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 75000000,
                'industry' => 'F&B / Hospitality',
                'tags' => ['F&B', 'Lokal'],
                'address' => [
                    'street' => 'Jl. Wolter Monginsidi No. 70',
                    'city' => 'Bandar Lampung',
                    'province' => 'Lampung',
                    'zip' => '35214',
                ],
            ],
            [
                'code' => 'PART-C-000006',
                'name' => 'PT Indo Prima Logistics',
                'email' => 'ops@indoprimalogistics.co.id',
                'phone' => '0213344556',
                'mobile' => '081234567806',
                'tax_id' => '05.678.901.2-345.000',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 100000000,
                'industry' => 'Logistik & Transportasi',
                'tags' => ['VIP'],
                'address' => [
                    'street' => 'Kawasan Industri MM2100 Blok G-5',
                    'city' => 'Cikarang',
                    'province' => 'Jawa Barat',
                    'zip' => '17550',
                ],
            ],
            [
                'code' => 'PART-C-000007',
                'name' => 'Apotek Sehat Sentosa',
                'email' => 'admin@apoteksehat.id',
                'phone' => '0274456789',
                'mobile' => '081234567807',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 25000000,
                'industry' => 'Kesehatan',
                'tags' => ['Lokal'],
                'address' => [
                    'street' => 'Jl. Slamet Riyadi No. 112',
                    'city' => 'Surakarta',
                    'province' => 'Jawa Tengah',
                    'zip' => '57141',
                ],
            ],
            [
                'code' => 'PART-C-000008',
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@email.com',
                'phone' => '081298765432',
                'mobile' => '081298765432',
                'account_type' => 'individual',
                'job_title' => 'Pemilik Toko',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 10000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Lokal'],
                'address' => [
                    'street' => 'Jl. Ahmad Yani No. 15',
                    'city' => 'Metro',
                    'province' => 'Lampung',
                    'zip' => '34111',
                ],
            ],

            // Suppliers (7)
            [
                'code' => 'PART-S-000001',
                'name' => 'PT Sumber Makmur Supply',
                'email' => 'sales@sumbermakmur.co.id',
                'phone' => '0216677889',
                'mobile' => '081345678901',
                'website' => 'https://sumbermakmur.co.id',
                'tax_id' => '10.111.222.3-444.000',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Manufaktur FMCG',
                'tags' => ['Supplier Utama'],
                'address' => [
                    'street' => 'Jl. Industri Raya No. 9',
                    'city' => 'Tangerang',
                    'province' => 'Banten',
                    'zip' => '15111',
                    'type' => 'warehouse',
                    'label' => 'Gudang Utama',
                ],
            ],
            [
                'code' => 'PART-S-000002',
                'name' => 'CV Mitra Sejati Trading',
                'email' => 'order@mitrasejati.id',
                'phone' => '0248765432',
                'mobile' => '081345678902',
                'tax_id' => '11.222.333.4-555.000',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Manufaktur FMCG',
                'tags' => ['Supplier Utama'],
                'address' => [
                    'street' => 'Jl. Pemuda No. 200',
                    'city' => 'Semarang',
                    'province' => 'Jawa Tengah',
                    'zip' => '50132',
                ],
            ],
            [
                'code' => 'PART-S-000003',
                'name' => 'PT Global Supply Indonesia',
                'email' => 'csr@globalsupply.co.id',
                'phone' => '0219988776',
                'mobile' => '081345678903',
                'website' => 'https://globalsupply.co.id',
                'tax_id' => '12.333.444.5-666.000',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Import & Perdagangan',
                'tags' => ['Import'],
                'address' => [
                    'street' => 'Jl. Pluit Selatan Raya No. 1',
                    'city' => 'Jakarta Utara',
                    'province' => 'DKI Jakarta',
                    'zip' => '14440',
                ],
            ],
            [
                'code' => 'PART-S-000004',
                'name' => 'UD Aneka Rempah Nusantara',
                'email' => 'aneka.rempah@yahoo.com',
                'phone' => '0274455123',
                'mobile' => '081345678904',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Agribisnis',
                'tags' => ['Lokal'],
                'address' => [
                    'street' => 'Jl. Gatot Subroto No. 55',
                    'city' => 'Surakarta',
                    'province' => 'Jawa Tengah',
                    'zip' => '57154',
                ],
            ],
            [
                'code' => 'PART-S-000005',
                'name' => 'PT Prima Kemasan Plastik',
                'email' => 'sales@primakemasan.co.id',
                'phone' => '0215544332',
                'mobile' => '081345678905',
                'tax_id' => '13.444.555.6-777.000',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Manufaktur FMCG',
                'tags' => ['Supplier Utama'],
                'address' => [
                    'street' => 'Kawasan Industri Jababeka Blok F-12',
                    'city' => 'Cikarang',
                    'province' => 'Jawa Barat',
                    'zip' => '17530',
                    'type' => 'warehouse',
                    'label' => 'Pabrik & Gudang',
                ],
            ],
            [
                'code' => 'PART-S-000006',
                'name' => 'CV Bahari Laut Sejahtera',
                'email' => 'sales@baharilaut.id',
                'phone' => '0617890123',
                'mobile' => '081345678906',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Agribisnis',
                'tags' => ['Lokal'],
                'address' => [
                    'street' => 'Jl. Pelabuhan Belawan No. 8',
                    'city' => 'Medan',
                    'province' => 'Sumatera Utara',
                    'zip' => '20212',
                ],
            ],
            [
                'code' => 'PART-S-000007',
                'name' => 'PT Teknik Mandiri Sparepart',
                'email' => 'part@teknikmandiri.co.id',
                'phone' => '0315566778',
                'mobile' => '081345678907',
                'tax_id' => '14.555.666.7-888.000',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Otomotif & Sparepart',
                'tags' => ['Sparepart'],
                'address' => [
                    'street' => 'Jl. Rungkut Industri III No. 17',
                    'city' => 'Surabaya',
                    'province' => 'Jawa Timur',
                    'zip' => '60293',
                ],
            ],

            // Customer + Supplier (5)
            [
                'code' => 'PART-B-000001',
                'name' => 'PT Mitra Dagang Sejahtera',
                'email' => 'info@mitradagang.co.id',
                'phone' => '0214455667',
                'mobile' => '081456789001',
                'website' => 'https://mitradagang.co.id',
                'tax_id' => '20.100.200.3-400.000',
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 120000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['VIP', 'Dual Role'],
                'address' => [
                    'street' => 'Jl. Rasuna Said Blok X-5',
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'zip' => '12950',
                ],
            ],
            [
                'code' => 'PART-B-000002',
                'name' => 'CV Cahaya Baru Distribusi',
                'email' => 'admin@cahayabaru.id',
                'phone' => '0721987654',
                'mobile' => '081456789002',
                'tax_id' => '21.200.300.4-500.000',
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 60000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Dual Role', 'Lokal'],
                'address' => [
                    'street' => 'Jl. Teuku Umar No. 45',
                    'city' => 'Bandar Lampung',
                    'province' => 'Lampung',
                    'zip' => '35141',
                ],
            ],
            [
                'code' => 'PART-B-000003',
                'name' => 'PT Agro Nusantara Trading',
                'email' => 'trading@agronusantara.co.id',
                'phone' => '0251765432',
                'mobile' => '081456789003',
                'website' => 'https://agronusantara.co.id',
                'tax_id' => '22.300.400.5-600.000',
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 90000000,
                'industry' => 'Agribisnis',
                'tags' => ['Dual Role'],
                'address' => [
                    'street' => 'Jl. Raya Bogor Km. 35',
                    'city' => 'Bogor',
                    'province' => 'Jawa Barat',
                    'zip' => '16969',
                ],
            ],
            [
                'code' => 'PART-B-000004',
                'name' => 'PT Samudra Trans Logistik',
                'email' => 'cs@samudratrans.co.id',
                'phone' => '0217788990',
                'mobile' => '081456789004',
                'tax_id' => '23.400.500.6-700.000',
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 80000000,
                'industry' => 'Logistik & Transportasi',
                'tags' => ['Dual Role', 'VIP'],
                'address' => [
                    'street' => 'Jl. Yos Sudarso Kav. 89',
                    'city' => 'Jakarta Utara',
                    'province' => 'DKI Jakarta',
                    'zip' => '14350',
                ],
            ],
            [
                'code' => 'PART-B-000005',
                'name' => 'UD Sumber Rezeki Multi Usaha',
                'email' => 'sumberrezeki@gmail.com',
                'phone' => '0721556677',
                'mobile' => '081456789005',
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 30000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Dual Role', 'Lokal'],
                'address' => [
                    'street' => 'Jl. Kartini No. 22',
                    'city' => 'Bandar Lampung',
                    'province' => 'Lampung',
                    'zip' => '35118',
                ],
            ],
        ];

        $created = 0;

        foreach ($partners as $data) {
            $industryName = $data['industry'] ?? null;
            $tagNames = $data['tags'] ?? [];
            $address = $data['address'] ?? null;

            unset($data['industry'], $data['tags'], $data['address']);

            $data['account_type'] ??= 'company';
            $data['sub_type'] = match (true) {
                ($data['customer_rank'] > 0) && ($data['supplier_rank'] > 0) => 'customer',
                ($data['supplier_rank'] > 0) => 'supplier',
                default => 'customer',
            };
            $data['status'] = 'active';
            $data['industry_id'] = $industryName ? ($industries[$industryName]?->id) : null;
            $data['notes'] = trim(($data['notes'] ?? '').' '.self::TAG.' Demo partner.');

            // Soft-deleted demo rows still occupy partners_code_unique; restore them.
            $partner = Partner::withTrashed()->updateOrCreate(
                ['code' => $data['code']],
                $data
            );

            if ($partner->trashed()) {
                $partner->restore();
            }

            if ($tagNames !== [] && Schema::hasTable('partner_partner_tag')) {
                $tagIds = collect($tagNames)
                    ->map(fn (string $name) => $tags[$name]?->id)
                    ->filter()
                    ->values()
                    ->all();

                $partner->tags()->sync($tagIds);
            }

            if ($address !== null && Schema::hasTable('partner_addresses') && $partner->addresses()->doesntExist()) {
                $partner->addresses()->create([
                    'type' => $address['type'] ?? 'shipping',
                    'label' => $address['label'] ?? 'Kantor Pusat',
                    'street' => $address['street'],
                    'city' => $address['city'],
                    'province' => $address['province'],
                    'zip' => $address['zip'],
                    'country' => 'Indonesia',
                    'is_default' => true,
                ]);
            }

            $created++;
        }

        $customers = Partner::query()->where('customer_rank', '>', 0)->where('supplier_rank', 0)->count();
        $suppliers = Partner::query()->where('supplier_rank', '>', 0)->where('customer_rank', 0)->count();
        $both = Partner::query()->where('customer_rank', '>', 0)->where('supplier_rank', '>', 0)->count();

        $this->command?->info("Seeded {$created} partners ({$customers} customer, {$suppliers} supplier, {$both} both).");
    }

    public function isInstalled(): bool
    {
        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            return false;
        }

        return Partner::query()->where('notes', 'like', '%'.self::TAG.'%')->exists();
    }

    /**
     * Remove tagged demo partners (and their addresses / tag pivots).
     * Shared industries and tags are left intact.
     */
    public function uninstall(): void
    {
        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            return;
        }

        $partners = Partner::withTrashed()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->get();

        foreach ($partners as $partner) {
            if (Schema::hasTable('partner_partner_tag')) {
                $partner->tags()->detach();
            }

            if (Schema::hasTable('partner_addresses')) {
                $partner->addresses()->delete();
            }

            if (Schema::hasTable('partner_bank_accounts')) {
                $partner->bankAccounts()->delete();
            }

            $partner->forceDelete();
        }

        $this->command?->info('Partners demo data removed.');
    }

    /**
     * Resolve demo industry labels to PartnerIndustry rows.
     *
     * Prefer pack industries (by code) when the i18n migration is present, then
     * localized JSON name match. Fall back to plain-string name for older schemas
     * still used by some RefreshDatabase tests.
     *
     * @return array<string, PartnerIndustry>
     */
    private function seedIndustries(): array
    {
        if (! Schema::hasTable('partner_industries')) {
            return [];
        }

        /** @var array<string, string> label => industry code */
        $map = [
            'Retail & Distribusi' => 'retail',
            'F&B / Hospitality' => 'hospitality_tourism',
            'Logistik & Transportasi' => 'logistics_transport',
            'Kesehatan' => 'healthcare',
            'Manufaktur FMCG' => 'manufacturing',
            'Import & Perdagangan' => 'wholesale_distribution',
            'Agribisnis' => 'agriculture',
            'Otomotif & Sparepart' => 'automotive',
        ];

        $hasCode = Schema::hasColumn('partner_industries', 'code');
        $nameIsJson = $this->partnerIndustryNameIsJson();
        $industries = [];

        foreach ($map as $label => $code) {
            $industry = null;

            if ($hasCode) {
                $industry = PartnerIndustry::query()->where('code', $code)->first();
            }

            if ($industry === null && $nameIsJson) {
                $industry = PartnerIndustry::findByLocalizedName($label);
            }

            if ($industry === null && ! $nameIsJson) {
                $industry = PartnerIndustry::query()->where('name', $label)->first();
            }

            if ($industry === null) {
                $payload = [
                    'is_active' => true,
                    'name' => $nameIsJson
                        ? PartnerIndustry::normalizeTranslations($label)
                        : $label,
                    'description' => $nameIsJson
                        ? PartnerIndustry::normalizeTranslations("Industri {$label}")
                        : "Industri {$label}",
                ];

                if ($hasCode) {
                    $payload['code'] = $code;
                }

                $industry = PartnerIndustry::query()->create($payload);
            }

            $industries[$label] = $industry;
        }

        return $industries;
    }

    private function partnerIndustryNameIsJson(): bool
    {
        $connection = Schema::getConnection();

        if ($connection->getDriverName() !== 'pgsql') {
            // Same migration adds both code and JSON name columns.
            return Schema::hasColumn('partner_industries', 'code');
        }

        $row = $connection->selectOne(
            'select data_type from information_schema.columns where table_schema = current_schema() and table_name = ? and column_name = ?',
            ['partner_industries', 'name']
        );

        return in_array($row->data_type ?? null, ['json', 'jsonb'], true);
    }

    /** @return array<string, PartnerTag> */
    private function seedTags(): array
    {
        if (! Schema::hasTable('partner_tags')) {
            return [];
        }

        $definitions = [
            'VIP' => 'red',
            'Retail' => 'blue',
            'Lokal' => 'green',
            'F&B' => 'orange',
            'Supplier Utama' => 'purple',
            'Import' => 'indigo',
            'Sparepart' => 'gray',
            'Dual Role' => 'teal',
        ];

        $tags = [];

        foreach ($definitions as $name => $color) {
            $tags[$name] = PartnerTag::query()->firstOrCreate(
                ['name' => $name],
                ['color' => $color]
            );
        }

        return $tags;
    }
}
