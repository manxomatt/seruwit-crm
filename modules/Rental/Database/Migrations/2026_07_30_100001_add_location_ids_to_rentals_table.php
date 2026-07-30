<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->foreignId('pickup_location_id')
                ->nullable()
                ->after('pickup_location')
                ->constrained('locations')
                ->nullOnDelete();
            $table->foreignId('return_location_id')
                ->nullable()
                ->after('return_location')
                ->constrained('locations')
                ->nullOnDelete();
            $table->decimal('one_way_fee_amount', 15, 2)->nullable()->after('return_location_id');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pickup_location_id');
            $table->dropConstrainedForeignId('return_location_id');
            $table->dropColumn('one_way_fee_amount');
        });
    }
};
