<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_categories', function (Blueprint $table) {
            $table->id();
            // Stable machine key: 'oil_change', 'brake', 'tire', etc.
            $table->string('key', 50)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            // Hex color for UI badges, e.g. '#3B82F6'
            $table->string('color', 20)->default('#6B7280');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $this->seedDefaults();
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_categories');
    }

    private function seedDefaults(): void
    {
        $now = now();

        DB::table('maintenance_categories')->insertOrIgnore([
            ['key' => 'oil_change', 'name' => 'Ganti Oli', 'description' => 'Penggantian oli mesin dan filter oli', 'color' => '#F59E0B', 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'tire', 'name' => 'Perawatan Ban', 'description' => 'Rotasi, penggantian, balancing, dan spooring ban', 'color' => '#10B981', 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'brake', 'name' => 'Rem & Kopling', 'description' => 'Pemeriksaan dan perbaikan sistem rem dan kopling', 'color' => '#EF4444', 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'engine', 'name' => 'Mesin', 'description' => 'Tune-up, perbaikan, dan overhaul mesin', 'color' => '#8B5CF6', 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'electrical', 'name' => 'Kelistrikan', 'description' => 'Aki, alternator, sistem kelistrikan, dan AC', 'color' => '#3B82F6', 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'body', 'name' => 'Bodi & Cat', 'description' => 'Perbaikan bodi, pengecatan, dan interior', 'color' => '#EC4899', 'sort_order' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'suspension', 'name' => 'Suspensi & Kemudi', 'description' => 'Shockbreaker, ball joint, tie rod, dan sistem kemudi', 'color' => '#14B8A6', 'sort_order' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'transmission', 'name' => 'Transmisi', 'description' => 'Gearbox, gardan, dan sistem transmisi', 'color' => '#F97316', 'sort_order' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'cooling', 'name' => 'Pendingin', 'description' => 'Radiator, thermostat, dan sistem pendingin mesin', 'color' => '#06B6D4', 'sort_order' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'general_service', 'name' => 'Servis Berkala', 'description' => 'Servis rutin berkala sesuai jadwal pabrikan', 'color' => '#64748B', 'sort_order' => 10, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
};
