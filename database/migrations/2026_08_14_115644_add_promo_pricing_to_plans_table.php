<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Harga sebelum promo (ditampilkan dicoret di UI)
            $table->decimal('original_price', 12, 2)->nullable()->after('price');
            // Harga total untuk berlangganan 1 tahun
            $table->decimal('annual_price', 12, 2)->nullable()->after('original_price');
            // Harga asli tahunan sebelum diskon (dicoret)
            $table->decimal('annual_original_price', 12, 2)->nullable()->after('annual_price');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'annual_price', 'annual_original_price']);
        });
    }
};
