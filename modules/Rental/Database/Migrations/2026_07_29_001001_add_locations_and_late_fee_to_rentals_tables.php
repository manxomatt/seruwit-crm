<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->string('pickup_location', 255)->nullable()->after('notes');
            $table->string('return_location', 255)->nullable()->after('pickup_location');
            $table->text('fuel_policy_notes')->nullable()->after('return_location');
            $table->decimal('late_fee_per_day', 14, 2)->nullable()->after('excess_km_rate');
            $table->unsignedInteger('overdue_days')->nullable()->after('excess_amount');
            $table->decimal('late_fee_amount', 14, 2)->default(0)->after('overdue_days');
        });

        Schema::table('rental_rates', function (Blueprint $table): void {
            $table->decimal('late_fee_per_day', 14, 2)->nullable()->after('excess_km_rate');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropColumn([
                'pickup_location',
                'return_location',
                'fuel_policy_notes',
                'late_fee_per_day',
                'overdue_days',
                'late_fee_amount',
            ]);
        });

        Schema::table('rental_rates', function (Blueprint $table): void {
            $table->dropColumn('late_fee_per_day');
        });
    }
};
