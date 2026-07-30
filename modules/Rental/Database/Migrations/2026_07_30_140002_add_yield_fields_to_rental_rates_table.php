<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_rates', function (Blueprint $table) {
            $table->string('rental_class', 40)->nullable()->after('vehicle_type')->index();
            $table->date('valid_from')->nullable()->after('is_active');
            $table->date('valid_to')->nullable()->after('valid_from');
            $table->unsignedSmallInteger('min_periods')->nullable()->after('valid_to');
            $table->unsignedSmallInteger('priority')->default(0)->after('min_periods');
        });
    }

    public function down(): void
    {
        Schema::table('rental_rates', function (Blueprint $table) {
            $table->dropColumn(['rental_class', 'valid_from', 'valid_to', 'min_periods', 'priority']);
        });
    }
};
