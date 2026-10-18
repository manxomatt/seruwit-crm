<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function defaultAddons(): array
    {
        return [
            [
                'code' => 'baby_seat',
                'name' => 'Kursi Bayi / Child Safety Seat',
                'category' => 'accessory',
                'description' => 'Kursi pengaman anak/bayi ergonomis bersertifikasi keselamatan standar internasional.',
                'icon' => 'baby',
                'price_type' => 'daily',
                'price' => 50000.00,
                'max_quantity' => 2,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'roof_box',
                'name' => 'Roof Box & Rak Bagasi Atas',
                'category' => 'accessory',
                'description' => 'Bagasi ekstra kapasitas 400 Liter + crossbar kuat untuk kenyamanan perjalanan jauh.',
                'icon' => 'box',
                'price_type' => 'daily',
                'price' => 75000.00,
                'max_quantity' => 1,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'dashcam',
                'name' => 'Kamera Dashcam / Action Cam 4K',
                'category' => 'accessory',
                'description' => 'Kamera perekam jalan wide-angle resolusi 4K + MicroSD 64GB untuk proteksi dan dokumentasi.',
                'icon' => 'camera',
                'price_type' => 'daily',
                'price' => 50000.00,
                'max_quantity' => 1,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'etoll_card',
                'name' => 'Kartu E-Toll Card Siap Pakai',
                'category' => 'comfort',
                'description' => 'Kartu tol elektronik aktif siap digunakan saat melintasi ruas tol tanpa repot membeli kartu baru.',
                'icon' => 'card',
                'price_type' => 'flat',
                'price' => 25000.00,
                'max_quantity' => 2,
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'fuel',
                'name' => 'Paket BBM Awal (Prepaid Fuel Free Return)',
                'category' => 'fuel',
                'description' => 'Bebas kembalikan kendaraan dengan level bensin berapa pun tanpa denda pengisian BBM.',
                'icon' => 'fuel',
                'price_type' => 'flat',
                'price' => 250000.00,
                'max_quantity' => 1,
                'is_active' => true,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'chauffeur',
                'name' => 'Driver / Sopir Tambahan Profesional',
                'category' => 'service',
                'description' => 'Layanan pengemudi berpengalaman, ramah, dan menguasai rute perjalanan wisata & bisnis.',
                'icon' => 'user',
                'price_type' => 'daily',
                'price' => 150000.00,
                'max_quantity' => 1,
                'is_active' => true,
                'sort_order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'delivery',
                'name' => 'Layanan Antar/Jemput Khusus (Valet Delivery)',
                'category' => 'service',
                'description' => 'Pengantaran atau penjemputan unit ke lokasi khusus / stasiun / bandara pilihan Anda.',
                'icon' => 'car',
                'price_type' => 'flat',
                'price' => 50000.00,
                'max_quantity' => 1,
                'is_active' => true,
                'sort_order' => 7,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];
    }

    public function up(): void
    {
        if (! Schema::hasTable('rental_addons')) {
            Schema::create('rental_addons', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 64)->unique();
                $table->string('name');
                $table->string('category', 32)->default('accessory');
                $table->text('description')->nullable();
                $table->string('icon', 64)->default('box');
                $table->string('price_type', 16)->default('daily');
                $table->decimal('price', 14, 2)->default(0);
                $table->unsignedInteger('max_quantity')->default(1);
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        foreach ($this->defaultAddons() as $addon) {
            DB::table('rental_addons')->updateOrInsert(
                ['code' => $addon['code']],
                $addon
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_addons');
    }
};
