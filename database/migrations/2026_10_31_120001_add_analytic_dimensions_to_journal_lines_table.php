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
        if (Schema::hasTable('journal_lines')) {
            Schema::table('journal_lines', function (Blueprint $table): void {
                if (! Schema::hasColumn('journal_lines', 'vehicle_id')) {
                    $table->unsignedBigInteger('vehicle_id')->nullable()->after('warehouse_id')->index();
                }
                if (! Schema::hasColumn('journal_lines', 'fleet_base_id')) {
                    $table->unsignedBigInteger('fleet_base_id')->nullable()->after('vehicle_id')->index();
                }
                if (! Schema::hasColumn('journal_lines', 'cost_center_id')) {
                    $table->string('cost_center_id', 64)->nullable()->after('fleet_base_id')->index();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('journal_lines')) {
            Schema::table('journal_lines', function (Blueprint $table): void {
                if (Schema::hasColumn('journal_lines', 'cost_center_id')) {
                    $table->dropColumn('cost_center_id');
                }
                if (Schema::hasColumn('journal_lines', 'fleet_base_id')) {
                    $table->dropColumn('fleet_base_id');
                }
                if (Schema::hasColumn('journal_lines', 'vehicle_id')) {
                    $table->dropColumn('vehicle_id');
                }
            });
        }
    }
};
