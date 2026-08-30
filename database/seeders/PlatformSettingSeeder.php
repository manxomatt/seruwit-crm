<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // ==========================================
            // GENERAL GROUP
            // ==========================================
            [
                'key' => 'general.system_mode',
                'group' => 'general',
                'value' => app()->environment('production') ? 'production' : 'development',
                'type' => 'select',
                'label' => 'Mode Sistem',
                'description' => 'Development menonaktifkan email keluar & menampilkan OTP di layar. Production mengaktifkan email nyata dan proteksi keamanan penuh.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'general.ai_features_enabled',
                'group' => 'general',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Fitur AI (Artificial Intelligence)',
                'description' => 'Master switch untuk mengaktifkan atau menonaktifkan seluruh fitur AI (Visual Handover, Smart KYC, Dynamic Pricing, Predictive Maintenance) di semua workspace tenant.',
                'is_public' => true,
                'sort_order' => 2,
            ],

            // ==========================================
            // CAPACITY & FLEET ACTIVATION POLICIES GROUP
            // ==========================================
            [
                'key' => PlatformSetting::KEY_CAPACITY_CREDITS_LIFETIME,
                'group' => 'capacity',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Saldo Kredit Lifetime',
                'description' => 'Saldo kredit kapasitas unit yang dimiliki tenant akan tersimpan selamanya sampai digunakan (tidak pernah kadaluarsa).',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => PlatformSetting::KEY_VEHICLE_ACTIVATION_DURATION_DAYS,
                'group' => 'capacity',
                'value' => '30',
                'type' => 'number',
                'label' => 'Durasi 1 Siklus Aktivasi (Hari)',
                'description' => 'Masa aktif yang didapat kendaraan saat mengkonsumsi 1 unit kapasitas kuota armada (default: 30 hari).',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => PlatformSetting::KEY_VEHICLE_GRACE_PERIOD_DAYS,
                'group' => 'capacity',
                'value' => '3',
                'type' => 'number',
                'label' => 'Masa Tenggang / Grace Period (Hari)',
                'description' => 'Toleransi hari setelah masa aktif habis sebelum unit dinonaktifkan dari jadwal operasional (default: 3 hari).',
                'is_public' => false,
                'sort_order' => 3,
            ],
            [
                'key' => PlatformSetting::KEY_PAUSE_DURING_MAINTENANCE,
                'group' => 'capacity',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Bekukan Masa Aktif Saat Masuk Bengkel',
                'description' => 'Jika diaktifkan, masa aktif kendaraan tidak berkurang saat kendaraan berstatus dalam perbaikan (maintenance).',
                'is_public' => false,
                'sort_order' => 4,
            ],
        ];

        foreach ($settings as $setting) {
            PlatformSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
