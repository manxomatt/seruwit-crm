<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table): void {
            $table->timestamp('activated_at')->nullable()->after('status')->comment('Waktu terakhir kendaraan diaktifkan/diperpanjang');
            $table->timestamp('active_until')->nullable()->after('activated_at')->comment('Batas waktu masa aktif penggunaan kendaraan');
            $table->boolean('auto_renew')->default(true)->after('active_until')->comment('Otomatis perpanjang jika saldo kredit mencukupi saat jatuh tempo');

            $table->index('active_until');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table): void {
            $table->dropIndex(['active_until']);
            $table->dropColumn(['activated_at', 'active_until', 'auto_renew']);
        });
    }
};
