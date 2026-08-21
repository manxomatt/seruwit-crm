<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * The plans the platform ships with.
 *
 * Re-runnable, and it only fills in what is missing: plan contents are edited
 * from the super admin UI, so re-seeding must never overwrite a live definition.
 * Basic is the default because it is what tenants had before plans existed —
 * defaulting to anything narrower would quietly take modules away from them.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            [
                'name' => 'Tier 1-10 Kendaraan',
                'min_vehicles' => 1,
                'max_vehicles' => 10,
                'price_per_vehicle' => 20000,
            ],
            [
                'name' => 'Tier 11-50 Kendaraan',
                'min_vehicles' => 11,
                'max_vehicles' => 50,
                'price_per_vehicle' => 15000,
            ],
            [
                'name' => 'Tier 51+ Kendaraan',
                'min_vehicles' => 51,
                'max_vehicles' => 999999,
                'price_per_vehicle' => 10000,
            ],
        ];

        foreach ($tiers as $tier) {
            \App\Models\SubscriptionTier::query()->updateOrCreate(
                ['min_vehicles' => $tier['min_vehicles']],
                $tier
            );
        }

        $plans = [
            [
                'key' => Plan::KEY_TRIAL,
                'name' => 'Trial',
                'description' => 'Self-serve onboarding trial: content CMS plus rental/travel packs (accounting & partners are core).',
                // Union of onboarding defaults (pages + accounting) and both
                // vertical packs — entitlement only; install still chooses packs.
                'badge' => 'Trial 30 Hari',
                'is_popular' => false,
                'modules' => Plan::trialModuleKeys(),
                'limits' => [
                    'max_vehicles' => 50,
                    'max_users' => 10,
                    'max_branches' => 3,
                ],
                'features_list' => [
                    'Akses Penuh Seluruh Modul Rental & CMS',
                    'Kapasitas Hingga 50 Armada Mobil',
                    'Hingga 10 Akun Staf / Operator',
                    'Gratis Masa Percobaan 30 Hari',
                ],
                'sort_order' => 0,
                'is_default' => false,
                'price' => 0,
                'original_price' => null,
                'annual_price' => 0,
                'annual_original_price' => null,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 30,
                'is_trial' => true,
            ],
            [
                'key' => 'free',
                'name' => 'Free Lifetime',
                'description' => 'Gratis selamanya untuk rental mobil pemula dengan armada hingga 2 unit.',
                'badge' => 'Gratis Selamanya',
                'is_popular' => false,
                'modules' => ['carousels', 'pages', 'posts', 'fleet', 'rental', 'invoicing', 'receivables', 'document'],
                'limits' => [
                    'max_vehicles' => 2,
                    'max_users' => 1,
                    'max_branches' => 1,
                ],
                'features_list' => [
                    'Gratis Selamanya (Maks. 2 Armada Kendaraan)',
                    '1 Akun Pengguna (Owner)',
                    'Manajemen Sewa & Kalender Booking',
                    'Cetak Kwitansi & Invoicing Otomatis',
                ],
                'sort_order' => 1,
                'is_default' => false,
                'price' => 0,
                'original_price' => null,
                'annual_price' => 0,
                'annual_original_price' => null,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 0,
                'is_trial' => false,
            ],
            [
                'key' => 'basic',
                'name' => 'Starter Rental',
                'description' => 'Solusi ideal untuk bisnis rental mobil rintisan dengan armada hingga 5 unit.',
                'badge' => 'Paling Hemat',
                'is_popular' => false,
                'modules' => ['carousels', 'pages', 'posts', 'fleet', 'rental', 'invoicing', 'receivables', 'document'],
                'limits' => [
                    'max_vehicles' => 5,
                    'max_users' => 2,
                    'max_branches' => 1,
                ],
                'features_list' => [
                    'Maksimal 5 Unit Kendaraan',
                    '2 Akun Pengguna (Admin & Operator)',
                    'Manajemen Sewa & Kalender Booking Lengkap',
                    'Cetak Kontrak PDF & Invoicing Bebas Watermark',
                    'Landing Page & Katalog Mobil Publik',
                ],
                'sort_order' => 2,
                'is_default' => true,
                'price' => 99000,
                'original_price' => 150000,
                'annual_price' => 990000,
                'annual_original_price' => 1500000,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 0,
                'is_trial' => false,
            ],
            [
                'key' => 'pro',
                'name' => 'Pro Rental',
                'description' => 'Paket terlengkap untuk rental berkembang: servis armada, reminder pajak, dan pelacakan GPS.',
                'badge' => 'Paling Populer',
                'is_popular' => true,
                'modules' => [
                    'approvals',
                    'billing',
                    'bi',
                    'canvassing',
                    'carousels',
                    'document',
                    'fleet',
                    'inventory',
                    'invoicing',
                    'maintenance',
                    'orders',
                    'outbound',
                    'pages',
                    'payables',
                    'pos',
                    'posts',
                    'products',
                    'promotions',
                    'purchasing',
                    'receivables',
                    'rental',
                    'routing',
                    'sales',
                    'scoring',
                    'shuttle',
                    'tracking',
                    'transportation',
                ],
                'limits' => [
                    'max_vehicles' => 20,
                    'max_users' => 5,
                    'max_branches' => 3,
                ],
                'features_list' => [
                    'Maksimal 20 Unit Kendaraan',
                    '5 Akun Pengguna',
                    'Manajemen Servis & Perawatan Armada',
                    'Pelacakan GPS & Reminder Pajak STNK/KIR',
                    'Manajemen Piutang & Keuangan Lengkap',
                    'Executive Dashboard & Analitik',
                ],
                'sort_order' => 3,
                'is_default' => false,
                'price' => 299000,
                'original_price' => 450000,
                'annual_price' => 2990000,
                'annual_original_price' => 4500000,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 0,
                'is_trial' => false,
            ],
            [
                'key' => 'pay_as_you_go',
                'name' => 'Pay As You Go',
                'description' => 'Bayar hanya untuk jumlah armada kendaraan yang Anda daftarkan. Fleksibel dan hemat untuk skala bisnis apa pun.',
                'badge' => 'Rekomendasi',
                'is_popular' => true,
                'modules' => [
                    'approvals',
                    'billing',
                    'bi',
                    'canvassing',
                    'carousels',
                    'document',
                    'fleet',
                    'inventory',
                    'invoicing',
                    'maintenance',
                    'orders',
                    'outbound',
                    'pages',
                    'payables',
                    'pos',
                    'posts',
                    'products',
                    'promotions',
                    'purchasing',
                    'receivables',
                    'rental',
                    'routing',
                    'sales',
                    'scoring',
                    'shuttle',
                    'tracking',
                    'transportation',
                ],
                'limits' => [
                    'max_users' => 10,
                    'max_branches' => 5,
                ],
                'features_list' => [
                    'Bayar Sesuai Jumlah Armada Terdaftar',
                    'Akses Penuh Seluruh Modul Pro',
                    'Hingga 10 Akun Staf / Operator',
                    'Hingga 5 Lokasi Cabang / Base',
                    'Upgrade / Downgrade Kuota Kapan Saja',
                ],
                'sort_order' => 4,
                'is_default' => false,
                'price' => 0,
                'original_price' => null,
                'annual_price' => 0,
                'annual_original_price' => null,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 0,
                'is_trial' => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['key' => $plan['key']], $plan);
        }
    }
}
