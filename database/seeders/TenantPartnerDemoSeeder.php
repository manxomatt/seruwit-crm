<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBlacklist;
use Modules\Partners\Models\PartnerIndustry;
use Modules\Partners\Models\PartnerTag;
use Modules\Partners\Models\PartnerTitle;
use Modules\Partners\Models\PartnerType;

/**
 * Seeds 20 demo partners: customers, suppliers, and dual-role partners.
 * Enriched with bank accounts, KYC verification statuses, anti-fraud blacklists,
 * contact types, and master locations to reflect the latest Contacts module.
 *
 *   php artisan tenants:seed --class=TenantPartnerDemoSeeder --tenants={id}
 */
class TenantPartnerDemoSeeder extends Seeder
{
    public const TAG = '[PARTNERS-DEMO]';

    public const DEMO_LOCATION_CODES = [
        'LOC-0001',
        'LOC-0002',
        'LOC-0003',
        'LOC-0004',
        'LOC-0005',
    ];

    public function run(): void
    {
        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            $this->command?->warn('partners table missing. Install the partners module first.');

            return;
        }

        $industries = $this->seedIndustries();
        $tags = $this->seedTags();
        $titles = $this->seedTitles();
        $typeIdsByCode = $this->ensurePartnerTypeDefaults();
        $this->seedLocations();

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
                'company_registry' => '0123456789012',
                'payment_term_days' => 30,
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 150000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['VIP', 'Retail'],
                'types' => ['customer', 'shipper'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subDays(12),
                'kyc_extracted_name' => 'PT Maju Jaya Retailindo',
                'address' => [
                    'street' => 'Jl. Gatot Subroto Kav. 12',
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'zip' => '12930',
                    'latitude' => -6.2297280,
                    'longitude' => 106.8294720,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '0352991823',
                        'account_holder_name' => 'PT Maju Jaya Retailindo',
                    ],
                ],
            ],
            [
                'code' => 'PART-C-000002',
                'name' => 'CV Berkah Abadi Mart',
                'email' => 'order@berkahabadi.id',
                'phone' => '0227654321',
                'mobile' => '081234567802',
                'tax_id' => '02.345.678.9-012.000',
                'company_registry' => '0234567890123',
                'payment_term_days' => 14,
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 50000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Retail'],
                'types' => ['customer', 'consignee'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subDays(20),
                'kyc_extracted_name' => 'CV Berkah Abadi Mart',
                'address' => [
                    'street' => 'Jl. Asia Afrika No. 88',
                    'city' => 'Bandung',
                    'province' => 'Jawa Barat',
                    'zip' => '40111',
                    'latitude' => -6.9214770,
                    'longitude' => 107.6074210,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'Bank Mandiri',
                        'account_number' => '1310029384751',
                        'account_holder_name' => 'CV Berkah Abadi Mart',
                    ],
                ],
            ],
            [
                'code' => 'PART-C-000003',
                'name' => 'Toko Sinar Makmur',
                'email' => 'sinarmakmur@gmail.com',
                'phone' => '0318765432',
                'mobile' => '081234567803',
                'account_type' => 'individual',
                'title' => 'Pak',
                'job_title' => 'Pemilik Toko',
                'id_number' => '3578011508820003',
                'license_number' => '820814230003',
                'license_expires_at' => '2028-08-15',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 15000000,
                'payment_term_days' => 7,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Retail', 'Lokal'],
                'types' => ['customer'],
                'kyc_status' => Partner::KYC_STATUS_PENDING,
                'kyc_submitted_at' => now()->subHours(4),
                'kyc_extracted_name' => 'Bambang Hermanto',
                'emergency_contact_name' => 'Siti Rahayu',
                'emergency_contact_phone' => '081299881122',
                'emergency_contact_relationship' => 'Suami/Istri',
                'address' => [
                    'street' => 'Jl. Raya Darmo No. 45',
                    'city' => 'Surabaya',
                    'province' => 'Jawa Timur',
                    'zip' => '60241',
                    'latitude' => -7.2891660,
                    'longitude' => 112.7380560,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BRI',
                        'account_number' => '001901029384501',
                        'account_holder_name' => 'Bambang Hermanto',
                    ],
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
                'company_registry' => '0345678901234',
                'payment_term_days' => 45,
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 200000000,
                'industry' => 'F&B / Hospitality',
                'tags' => ['VIP', 'F&B'],
                'types' => ['customer', 'consignee'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(1),
                'kyc_extracted_name' => 'PT Nusantara Foodservice',
                'address' => [
                    'street' => 'Jl. Thamrin No. 28',
                    'city' => 'Jakarta Pusat',
                    'province' => 'DKI Jakarta',
                    'zip' => '10230',
                    'latitude' => -6.1938890,
                    'longitude' => 106.8236110,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '5410982312',
                        'account_holder_name' => 'PT Nusantara Foodservice',
                    ],
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
                'company_registry' => '0456789012345',
                'payment_term_days' => 30,
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 75000000,
                'industry' => 'F&B / Hospitality',
                'tags' => ['F&B', 'Lokal'],
                'types' => ['customer', 'travel_agent'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subDays(18),
                'kyc_extracted_name' => 'Hotel Grand Lampung',
                'address' => [
                    'street' => 'Jl. Wolter Monginsidi No. 70',
                    'city' => 'Bandar Lampung',
                    'province' => 'Lampung',
                    'zip' => '35214',
                    'latitude' => -5.4297220,
                    'longitude' => 105.2575000,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'Bank Mandiri',
                        'account_number' => '1140023948123',
                        'account_holder_name' => 'Hotel Grand Lampung',
                    ],
                ],
            ],
            [
                'code' => 'PART-C-000006',
                'name' => 'PT Indo Prima Logistics',
                'email' => 'ops@indoprimalogistics.co.id',
                'phone' => '0213344556',
                'mobile' => '081234567806',
                'tax_id' => '05.678.901.2-345.000',
                'company_registry' => '0567890123456',
                'payment_term_days' => 30,
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 100000000,
                'industry' => 'Logistik & Transportasi',
                'tags' => ['VIP'],
                'types' => ['customer', 'shipper'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(2),
                'kyc_extracted_name' => 'PT Indo Prima Logistics',
                'address' => [
                    'street' => 'Kawasan Industri MM2100 Blok G-5',
                    'city' => 'Cikarang',
                    'province' => 'Jawa Barat',
                    'zip' => '17550',
                    'latitude' => -6.3114000,
                    'longitude' => 107.1126000,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BNI',
                        'account_number' => '0839201948',
                        'account_holder_name' => 'PT Indo Prima Logistics',
                    ],
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
                'payment_term_days' => 14,
                'industry' => 'Kesehatan',
                'tags' => ['Lokal'],
                'types' => ['customer'],
                'kyc_status' => Partner::KYC_STATUS_REJECTED,
                'kyc_rejected_reason' => 'Dokumen terindikasi fiktif dan memiliki rekam jejak gagal bayar.',
                'is_blacklisted' => true,
                'blacklist_reason' => 'Kasus penipuan dan tunggakan pembayaran sewa armada (bad debt) 90+ hari.',
                'blacklisted_at' => now()->subDays(25),
                'blacklist' => [
                    'category' => PartnerBlacklist::CATEGORY_BAD_DEBT,
                    'severity' => PartnerBlacklist::SEVERITY_WARNING,
                    'incident_date' => now()->subDays(30)->toDateString(),
                    'incident_details' => 'Penyewa menolak melunasi sisa tagihan sewa bulanan dan nomor kontak tidak dapat dihubungi.',
                    'police_report_number' => 'STPL/412/IX/2026/POLRESTA',
                    'is_shared_with_community' => false,
                ],
                'address' => [
                    'street' => 'Jl. Slamet Riyadi No. 112',
                    'city' => 'Surakarta',
                    'province' => 'Jawa Tengah',
                    'zip' => '57141',
                    'latitude' => -7.5688890,
                    'longitude' => 110.8247220,
                ],
            ],
            [
                'code' => 'PART-C-000008',
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@email.com',
                'phone' => '0721550011',
                'mobile' => '081298765432',
                'account_type' => 'individual',
                'title' => 'Pak',
                'job_title' => 'Pemilik Toko',
                'id_number' => '1871021406900008',
                'license_number' => '900615340008',
                'license_expires_at' => '2027-06-14',
                'customer_rank' => 1,
                'supplier_rank' => 0,
                'credit_limit' => 10000000,
                'payment_term_days' => 0,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Lokal'],
                'types' => ['customer', 'prospect'],
                'kyc_status' => Partner::KYC_STATUS_PENDING,
                'kyc_submitted_at' => now()->subHours(1),
                'kyc_extracted_name' => 'Budi Santoso',
                'emergency_contact_name' => 'Dewi Lestari',
                'emergency_contact_phone' => '081377889900',
                'emergency_contact_relationship' => 'Keluarga',
                'address' => [
                    'street' => 'Jl. Ahmad Yani No. 15',
                    'city' => 'Metro',
                    'province' => 'Lampung',
                    'zip' => '34111',
                    'latitude' => -5.1130560,
                    'longitude' => 105.3069440,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '0284910293',
                        'account_holder_name' => 'Budi Santoso',
                    ],
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
                'company_registry' => '1011122233445',
                'payment_term_days' => 30,
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Manufaktur FMCG',
                'tags' => ['Supplier Utama'],
                'types' => ['supplier', 'warehouse'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(3),
                'address' => [
                    'street' => 'Jl. Industri Raya No. 9',
                    'city' => 'Tangerang',
                    'province' => 'Banten',
                    'zip' => '15111',
                    'type' => 'warehouse',
                    'label' => 'Gudang Utama',
                    'latitude' => -6.1783330,
                    'longitude' => 106.6319440,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '2190384721',
                        'account_holder_name' => 'PT Sumber Makmur Supply',
                    ],
                ],
            ],
            [
                'code' => 'PART-S-000002',
                'name' => 'CV Mitra Sejati Trading',
                'email' => 'order@mitrasejati.id',
                'phone' => '0248765432',
                'mobile' => '081345678902',
                'tax_id' => '11.222.333.4-555.000',
                'company_registry' => '1122233344556',
                'payment_term_days' => 30,
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Manufaktur FMCG',
                'tags' => ['Supplier Utama'],
                'types' => ['supplier', 'broker'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(2),
                'address' => [
                    'street' => 'Jl. Pemuda No. 200',
                    'city' => 'Semarang',
                    'province' => 'Jawa Tengah',
                    'zip' => '50132',
                    'latitude' => -6.9744440,
                    'longitude' => 110.4202780,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'Bank Mandiri',
                        'account_number' => '1360098234123',
                        'account_holder_name' => 'CV Mitra Sejati Trading',
                    ],
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
                'company_registry' => '1233344455667',
                'payment_term_days' => 45,
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Import & Perdagangan',
                'tags' => ['Import'],
                'types' => ['supplier', 'broker'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(1),
                'address' => [
                    'street' => 'Jl. Pluit Selatan Raya No. 1',
                    'city' => 'Jakarta Utara',
                    'province' => 'DKI Jakarta',
                    'zip' => '14440',
                    'latitude' => -6.1266670,
                    'longitude' => 106.7905560,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '4120938471',
                        'account_holder_name' => 'PT Global Supply Indonesia',
                    ],
                ],
            ],
            [
                'code' => 'PART-S-000004',
                'name' => 'UD Aneka Rempah Nusantara',
                'email' => 'aneka.rempah@yahoo.com',
                'phone' => '0274455123',
                'mobile' => '081345678904',
                'account_type' => 'individual',
                'title' => 'Pak',
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'payment_term_days' => 14,
                'industry' => 'Agribisnis',
                'tags' => ['Lokal'],
                'types' => ['supplier'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subDays(40),
                'address' => [
                    'street' => 'Jl. Gatot Subroto No. 55',
                    'city' => 'Surakarta',
                    'province' => 'Jawa Tengah',
                    'zip' => '57154',
                    'latitude' => -7.5750000,
                    'longitude' => 110.8222220,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BRI',
                        'account_number' => '010201928475501',
                        'account_holder_name' => 'Joko Prasetyo',
                    ],
                ],
            ],
            [
                'code' => 'PART-S-000005',
                'name' => 'PT Prima Kemasan Plastik',
                'email' => 'sales@primakemasan.co.id',
                'phone' => '0215544332',
                'mobile' => '081345678905',
                'tax_id' => '13.444.555.6-777.000',
                'company_registry' => '1344455566778',
                'payment_term_days' => 30,
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Manufaktur FMCG',
                'tags' => ['Supplier Utama'],
                'types' => ['supplier', 'fleet_owner'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(4),
                'address' => [
                    'street' => 'Kawasan Industri Jababeka Blok F-12',
                    'city' => 'Cikarang',
                    'province' => 'Jawa Barat',
                    'zip' => '17530',
                    'type' => 'warehouse',
                    'label' => 'Pabrik & Gudang',
                    'latitude' => -6.2975000,
                    'longitude' => 107.1627780,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'Bank Mandiri',
                        'account_number' => '1560029384712',
                        'account_holder_name' => 'PT Prima Kemasan Plastik',
                    ],
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
                'payment_term_days' => 14,
                'industry' => 'Agribisnis',
                'tags' => ['Lokal'],
                'types' => ['supplier'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subDays(60),
                'address' => [
                    'street' => 'Jl. Pelabuhan Belawan No. 8',
                    'city' => 'Medan',
                    'province' => 'Sumatera Utara',
                    'zip' => '20212',
                    'latitude' => 3.7844440,
                    'longitude' => 98.6850000,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BNI',
                        'account_number' => '0394857261',
                        'account_holder_name' => 'CV Bahari Laut Sejahtera',
                    ],
                ],
            ],
            [
                'code' => 'PART-S-000007',
                'name' => 'PT Teknik Mandiri Sparepart',
                'email' => 'part@teknikmandiri.co.id',
                'phone' => '0315566778',
                'mobile' => '081345678907',
                'tax_id' => '14.555.666.7-888.000',
                'company_registry' => '1455566677889',
                'payment_term_days' => 30,
                'customer_rank' => 0,
                'supplier_rank' => 1,
                'industry' => 'Otomotif & Sparepart',
                'tags' => ['Sparepart'],
                'types' => ['supplier', 'carrier'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(1),
                'address' => [
                    'street' => 'Jl. Rungkut Industri III No. 17',
                    'city' => 'Surabaya',
                    'province' => 'Jawa Timur',
                    'zip' => '60293',
                    'latitude' => -7.3328000,
                    'longitude' => 112.7689000,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '0882940192',
                        'account_holder_name' => 'PT Teknik Mandiri Sparepart',
                    ],
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
                'company_registry' => '2010020030400',
                'payment_term_days' => 30,
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 120000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['VIP', 'Dual Role'],
                'types' => ['customer', 'supplier', 'shipper'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(2),
                'address' => [
                    'street' => 'Jl. Rasuna Said Blok X-5',
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'zip' => '12950',
                    'latitude' => -6.2241670,
                    'longitude' => 106.8319440,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '0182948291',
                        'account_holder_name' => 'PT Mitra Dagang Sejahtera',
                    ],
                ],
            ],
            [
                'code' => 'PART-B-000002',
                'name' => 'CV Cahaya Baru Distribusi',
                'email' => 'admin@cahayabaru.id',
                'phone' => '0721987654',
                'mobile' => '081456789002',
                'tax_id' => '21.200.300.4-500.000',
                'company_registry' => '2120030040500',
                'payment_term_days' => 14,
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 60000000,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Dual Role', 'Lokal'],
                'types' => ['customer', 'supplier'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subDays(30),
                'address' => [
                    'street' => 'Jl. Teuku Umar No. 45',
                    'city' => 'Bandar Lampung',
                    'province' => 'Lampung',
                    'zip' => '35141',
                    'latitude' => -5.3975000,
                    'longitude' => 105.2586110,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'Bank Mandiri',
                        'account_number' => '1140093847261',
                        'account_holder_name' => 'CV Cahaya Baru Distribusi',
                    ],
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
                'company_registry' => '2230040050600',
                'payment_term_days' => 30,
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 90000000,
                'industry' => 'Agribisnis',
                'tags' => ['Dual Role'],
                'types' => ['customer', 'supplier', 'consignee'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(1),
                'address' => [
                    'street' => 'Jl. Raya Bogor Km. 35',
                    'city' => 'Bogor',
                    'province' => 'Jawa Barat',
                    'zip' => '16969',
                    'latitude' => -6.5950000,
                    'longitude' => 106.8166670,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BNI',
                        'account_number' => '0495827361',
                        'account_holder_name' => 'PT Agro Nusantara Trading',
                    ],
                ],
            ],
            [
                'code' => 'PART-B-000004',
                'name' => 'PT Samudra Trans Logistik',
                'email' => 'cs@samudratrans.co.id',
                'phone' => '0217788990',
                'mobile' => '081456789004',
                'tax_id' => '23.400.500.6-700.000',
                'company_registry' => '2340050060700',
                'payment_term_days' => 30,
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 80000000,
                'industry' => 'Logistik & Transportasi',
                'tags' => ['Dual Role', 'VIP'],
                'types' => ['customer', 'supplier', 'carrier', 'fleet_owner'],
                'kyc_status' => Partner::KYC_STATUS_VERIFIED,
                'kyc_verified_at' => now()->subMonths(3),
                'address' => [
                    'street' => 'Jl. Yos Sudarso Kav. 89',
                    'city' => 'Jakarta Utara',
                    'province' => 'DKI Jakarta',
                    'zip' => '14350',
                    'latitude' => -6.1363890,
                    'longitude' => 106.8916670,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BCA',
                        'account_number' => '3340192847',
                        'account_holder_name' => 'PT Samudra Trans Logistik',
                    ],
                ],
            ],
            [
                'code' => 'PART-B-000005',
                'name' => 'UD Sumber Rezeki Multi Usaha',
                'email' => null,
                'phone' => null,
                'mobile' => null,
                'account_type' => 'individual',
                'title' => 'Pak',
                'customer_rank' => 1,
                'supplier_rank' => 1,
                'credit_limit' => 30000000,
                'payment_term_days' => 14,
                'industry' => 'Retail & Distribusi',
                'tags' => ['Dual Role', 'Lokal'],
                'types' => ['customer', 'supplier'],
                'kyc_status' => Partner::KYC_STATUS_UNVERIFIED,
                'address' => [
                    'street' => 'Jl. Kartini No. 22',
                    'city' => 'Bandar Lampung',
                    'province' => 'Lampung',
                    'zip' => '35118',
                    'latitude' => -5.4180560,
                    'longitude' => 105.2536110,
                ],
                'bank_accounts' => [
                    [
                        'bank_name' => 'BRI',
                        'account_number' => '019201928374501',
                        'account_holder_name' => 'H. Ahmad Fauzi',
                    ],
                ],
            ],
        ];

        $created = 0;

        foreach ($partners as $data) {
            $industryName = $data['industry'] ?? null;
            $tagNames = $data['tags'] ?? [];
            $typeCodes = $data['types'] ?? [];
            $address = $data['address'] ?? null;
            $titleName = $data['title'] ?? null;
            $bankAccounts = $data['bank_accounts'] ?? [];
            $blacklistData = $data['blacklist'] ?? null;

            unset(
                $data['industry'],
                $data['tags'],
                $data['types'],
                $data['address'],
                $data['title'],
                $data['bank_accounts'],
                $data['blacklist']
            );

            $data['account_type'] ??= 'company';
            $data['sub_type'] = match (true) {
                ($data['customer_rank'] > 0) && ($data['supplier_rank'] > 0) => 'customer',
                ($data['supplier_rank'] > 0) => 'supplier',
                default => 'customer',
            };
            $data['status'] = 'active';
            $data['industry_id'] = $industryName ? ($industries[$industryName]?->id) : null;
            $data['title_id'] = $titleName ? ($titles[$titleName]?->id) : null;
            $data['notes'] = trim(
                (string) ($data['notes'] ?? '')
                    .' '
                    .self::TAG
                    .' Demo partner.'
            ) ?: null;

            $partner = Partner::withTrashed()->updateOrCreate(
                ['code' => $data['code']],
                $data
            );

            if ($partner->trashed()) {
                $partner->restore();
            }

            if (Schema::hasTable('partner_partner_type') && $typeIdsByCode !== []) {
                $typeAttach = collect($typeCodes)
                    ->map(fn (string $code) => $typeIdsByCode[$code] ?? null)
                    ->filter()
                    ->values()
                    ->all();

                if ($typeAttach === []) {
                    if ($partner->customer_rank > 0 && isset($typeIdsByCode['customer'])) {
                        $typeAttach[] = $typeIdsByCode['customer'];
                    }
                    if ($partner->supplier_rank > 0 && isset($typeIdsByCode['supplier'])) {
                        $typeAttach[] = $typeIdsByCode['supplier'];
                    }
                }

                if ($typeAttach !== []) {
                    $partner->types()->sync($typeAttach);
                }
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
                    'latitude' => $address['latitude'] ?? null,
                    'longitude' => $address['longitude'] ?? null,
                    'is_default' => true,
                ]);
            }

            if ($bankAccounts !== [] && Schema::hasTable('partner_bank_accounts') && $partner->bankAccounts()->doesntExist()) {
                foreach ($bankAccounts as $bankAccount) {
                    $partner->bankAccounts()->create([
                        'bank_name' => $bankAccount['bank_name'],
                        'account_number' => $bankAccount['account_number'],
                        'account_holder_name' => $bankAccount['account_holder_name'] ?? $partner->name,
                        'is_active' => true,
                        'can_send_money' => true,
                    ]);
                }
            }

            if ($blacklistData !== null && Schema::hasTable('partner_blacklists')) {
                PartnerBlacklist::query()->updateOrCreate(
                    [
                        'partner_id' => $partner->id,
                        'category' => $blacklistData['category'],
                    ],
                    [
                        'id_number' => $partner->id_number ?: '3372010405850007',
                        'phone' => $partner->phone ?: $partner->mobile ?: '0274456789',
                        'name' => $partner->name,
                        'license_number' => $partner->license_number,
                        'severity' => $blacklistData['severity'] ?? PartnerBlacklist::SEVERITY_WARNING,
                        'incident_date' => $blacklistData['incident_date'] ?? now()->subDays(20)->toDateString(),
                        'incident_details' => $blacklistData['incident_details'].' '.self::TAG,
                        'police_report_number' => $blacklistData['police_report_number'] ?? null,
                        'is_active' => true,
                        'is_shared_with_community' => $blacklistData['is_shared_with_community'] ?? false,
                        'share_anonymously' => false,
                    ]
                );
            }

            $created++;
        }

        $this->seedDemoBlacklists();

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
     * Remove tagged demo partners (and their addresses / tag pivots / bank accounts / blacklists / locations).
     * Shared industries and types are left intact.
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

            if (Schema::hasTable('partner_partner_type')) {
                $partner->types()->detach();
            }

            if (Schema::hasTable('partner_addresses')) {
                $partner->addresses()->delete();
            }

            if (Schema::hasTable('partner_bank_accounts')) {
                $partner->bankAccounts()->delete();
            }

            if (Schema::hasTable('partner_blacklists')) {
                $partner->blacklists()->delete();
            }

            $partner->forceDelete();
        }

        if (class_exists(PartnerBlacklist::class) && Schema::hasTable('partner_blacklists')) {
            PartnerBlacklist::query()
                ->where('incident_details', 'like', '%'.self::TAG.'%')
                ->delete();
        }

        if (class_exists(Location::class) && Schema::hasTable('locations')) {
            Location::query()
                ->whereIn('code', self::DEMO_LOCATION_CODES)
                ->delete();
        }

        $this->command?->info('Partners demo data removed.');
    }

    /**
     * Seeds 5 master business locations so the Locations tab and Setup checklist are complete.
     */
    private function seedLocations(): void
    {
        if (! class_exists(Location::class) || ! Schema::hasTable('locations')) {
            return;
        }

        $locations = [
            [
                'code' => 'LOC-0001',
                'name' => 'Pool Utama & Kantor Pusat Jakarta',
                'address' => 'Jl. Gatot Subroto Kav. 12',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'zip' => '12930',
                'latitude' => -6.2297280,
                'longitude' => 106.8294720,
                'is_active' => true,
            ],
            [
                'code' => 'LOC-0002',
                'name' => 'Hub Logistik Cikarang Dry Port',
                'address' => 'Kawasan Industri MM2100 Blok G-5',
                'city' => 'Cikarang',
                'province' => 'Jawa Barat',
                'zip' => '17550',
                'latitude' => -6.3114000,
                'longitude' => 107.1126000,
                'is_active' => true,
            ],
            [
                'code' => 'LOC-0003',
                'name' => 'Pool Bandara Soekarno-Hatta (CGK)',
                'address' => 'Perimeter Selatan Bandara Soetta',
                'city' => 'Tangerang',
                'province' => 'Banten',
                'zip' => '15126',
                'latitude' => -6.1255560,
                'longitude' => 106.6558330,
                'is_active' => true,
            ],
            [
                'code' => 'LOC-0004',
                'name' => 'Depot & Pool Cabang Bandung',
                'address' => 'Jl. Soekarno-Hatta No. 590',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'zip' => '40286',
                'latitude' => -6.9452000,
                'longitude' => 107.6521000,
                'is_active' => true,
            ],
            [
                'code' => 'LOC-0005',
                'name' => 'Pool Surabaya Rungkut',
                'address' => 'Jl. Rungkut Industri III No. 17',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
                'zip' => '60293',
                'latitude' => -7.3328000,
                'longitude' => 112.7689000,
                'is_active' => true,
            ],
        ];

        foreach ($locations as $loc) {
            Location::query()->updateOrCreate(
                ['code' => $loc['code']],
                $loc
            );
        }
    }

    /**
     * Seeds sample anti-fraud cases to populate the Blacklist & Anti-Fraud dashboard.
     */
    private function seedDemoBlacklists(): void
    {
        if (! class_exists(PartnerBlacklist::class) || ! Schema::hasTable('partner_blacklists')) {
            return;
        }

        PartnerBlacklist::query()->updateOrCreate(
            ['police_report_number' => 'LP/B/2890/VII/2026/SPKT/POLDA METRO'],
            [
                'name' => 'Rendra Pratama',
                'id_number' => '3275012304910002',
                'phone' => '081399887766',
                'license_number' => '910418290002',
                'category' => PartnerBlacklist::CATEGORY_CAR_THEFT,
                'severity' => PartnerBlacklist::SEVERITY_CRITICAL,
                'incident_date' => now()->subDays(45)->toDateString(),
                'incident_details' => 'Membawa kabur unit rental Toyota Avanza menggunakan identitas palsu. Kasus telah dilaporkan ke Polda Metro Jaya. '.self::TAG,
                'is_active' => true,
                'is_shared_with_community' => true,
                'share_anonymously' => false,
            ]
        );
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

    /** @return array<string, PartnerTitle> */
    private function seedTitles(): array
    {
        if (! Schema::hasTable('partner_titles')) {
            return [];
        }

        $definitions = [
            'Pak' => ['name' => 'Bapak', 'short_name' => 'Pak'],
            'Bu' => ['name' => 'Ibu',   'short_name' => 'Bu'],
            'Drs' => ['name' => 'Doktorandus', 'short_name' => 'Drs'],
            'Dr' => ['name' => 'Dokter', 'short_name' => 'Dr'],
            'Ir' => ['name' => 'Insinyur', 'short_name' => 'Ir'],
            'Hj' => ['name' => 'Hajjah', 'short_name' => 'Hj'],
            'H' => ['name' => 'Haji',  'short_name' => 'H'],
            'Sdt' => ['name' => 'Saudara', 'short_name' => 'Sdt'],
        ];

        $titles = [];

        foreach ($definitions as $shortKey => $row) {
            $titles[$shortKey] = PartnerTitle::query()->firstOrCreate(
                ['short_name' => $row['short_name']],
                ['name' => $row['name']]
            );
        }

        return $titles;
    }

    /**
     * Ensure the default partner type rows and pack types exist.
     *
     * @return array<string, int> map of code => type id
     */
    private function ensurePartnerTypeDefaults(): array
    {
        if (! Schema::hasTable('partner_types')) {
            return [];
        }

        if (class_exists(TenantPartnerTypesSeeder::class)) {
            app(TenantPartnerTypesSeeder::class)->run();
        }

        $nameIsJson = Schema::hasColumn('partner_types', 'code');

        $catalog = [
            'customer' => [
                'name' => ['id' => 'Customer', 'en' => 'Customer'],
                'description' => [
                    'id' => 'Pihak yang membeli atau menyewa dari kita.',
                    'en' => 'Party that buys or rents from us.',
                ],
                'affects_customer_rank' => true,
                'affects_supplier_rank' => false,
            ],
            'supplier' => [
                'name' => ['id' => 'Supplier', 'en' => 'Supplier'],
                'description' => [
                    'id' => 'Pihak yang memasok atau menjual kepada kita.',
                    'en' => 'Party that supplies or sells to us.',
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => true,
            ],
            'other' => [
                'name' => ['id' => 'Lainnya', 'en' => 'Other'],
                'description' => [
                    'id' => 'Pihak ketiga lainnya (bukan customer / supplier).',
                    'en' => 'Other third party (neither customer nor supplier).',
                ],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
        ];

        foreach ($catalog as $code => $row) {
            $payload = [
                'name' => $nameIsJson ? $row['name'] : ($row['name']['id'] ?? $code),
                'description' => $nameIsJson
                    ? $row['description']
                    : ($row['description']['id'] ?? null),
                'affects_customer_rank' => $row['affects_customer_rank'],
                'affects_supplier_rank' => $row['affects_supplier_rank'],
                'is_active' => true,
            ];

            if ($nameIsJson) {
                $payload['code'] = $code;
            }

            PartnerType::query()->firstOrCreate(
                $nameIsJson ? ['code' => $code] : ['name' => $payload['name']],
                $payload
            );
        }

        return PartnerType::query()
            ->pluck('id', 'code')
            ->all();
    }
}
