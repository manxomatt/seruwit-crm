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
            $table->boolean('is_trial')->default(false)->after('auto_renew')->comment('Apakah kendaraan saat ini berstatus masa aktif uji coba gratis');
            $table->timestamp('trial_ends_at')->nullable()->after('is_trial')->comment('Batas waktu masa aktif uji coba gratis kendaraan');

            $table->index('is_trial');
        });

        Schema::create('vehicle_trial_fingerprints', function (Blueprint $table): void {
            $table->id();
            $table->string('plate_number_normalized')->index()->comment('Nomor pelat yang dihilangkan spasi dan tanda baca');
            $table->string('vin_number')->nullable()->index()->comment('Nomor rangka kendaraan jika tersedia');
            $table->timestamp('first_trial_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_trial_fingerprints');

        Schema::table('vehicles', function (Blueprint $table): void {
            $table->dropIndex(['is_trial']);
            $table->dropColumn(['is_trial', 'trial_ends_at']);
        });
    }
};
