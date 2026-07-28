<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->string('start_fuel_level', 16)->nullable()->after('start_odometer');
            $table->string('end_fuel_level', 16)->nullable()->after('end_odometer');
            $table->json('checkout_checklist')->nullable()->after('start_fuel_level');
            $table->json('return_checklist')->nullable()->after('end_fuel_level');
            $table->text('checkout_notes')->nullable()->after('checkout_checklist');
            $table->text('return_notes')->nullable()->after('return_checklist');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropColumn([
                'start_fuel_level',
                'end_fuel_level',
                'checkout_checklist',
                'return_checklist',
                'checkout_notes',
                'return_notes',
            ]);
        });
    }
};
