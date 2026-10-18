<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function settings(): array
    {
        return [
            [
                'key' => 'payment.qris_is_enabled',
                'group' => 'payment',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Aktifkan QRIS Merchant',
                'description' => 'Aktifkan metode pembayaran QRIS merchant pada seluruh modul publik dan kasir.',
                'is_public' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.qris_image',
                'group' => 'payment',
                'value' => '',
                'type' => 'image',
                'label' => 'Gambar QR Code QRIS',
                'description' => 'Upload gambar QR Code QRIS dari m-banking atau aplikasi merchant Anda.',
                'is_public' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.qris_merchant_name',
                'group' => 'payment',
                'value' => '',
                'type' => 'text',
                'label' => 'Nama Merchant QRIS',
                'description' => 'Nama merchant resmi yang tertera saat pelanggan men-scan QRIS (contoh: CV Seruwit Rent Car).',
                'is_public' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.qris_nmid',
                'group' => 'payment',
                'value' => '',
                'type' => 'text',
                'label' => 'NMID (National Merchant ID)',
                'description' => 'Nomor identitas merchant QRIS standar Bank Indonesia (opsional).',
                'is_public' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.qris_bank_account_id',
                'group' => 'payment',
                'value' => '',
                'type' => 'select',
                'label' => 'Rekening Bank Penampung',
                'description' => 'Pilih rekening bank penampung dana QRIS untuk pencatatan otomatis di modul Akuntansi.',
                'is_public' => false,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payment.qris_instructions',
                'group' => 'payment',
                'value' => 'Buka aplikasi mobile banking atau e-wallet (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay). Scan QRIS di atas, masukkan nominal yang sesuai, dan upload bukti pembayaran.',
                'type' => 'textarea',
                'label' => 'Petunjuk Pembayaran QRIS',
                'description' => 'Instruksi pembayaran yang ditampilkan kepada pelanggan saat memilih metode QRIS.',
                'is_public' => true,
                'sort_order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];
    }

    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        foreach ($this->settings() as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        $keys = collect($this->settings())->pluck('key')->all();
        DB::table('settings')->whereIn('key', $keys)->delete();
    }
};
