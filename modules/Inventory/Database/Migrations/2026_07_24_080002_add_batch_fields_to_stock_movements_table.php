<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Batch fields belong with Inventory — StockMovementRecorder and the stock UI
 * already depend on them. Purchasing also ships a guarded copy for tenants that
 * installed Purchasing before this Inventory migration existed.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stock_movements')) {
            return;
        }

        if (! Schema::hasColumn('stock_movements', 'batch_number')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->string('batch_number')->nullable()->after('reference_code');
            });
        }

        if (! Schema::hasColumn('stock_movements', 'expiry_date')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->date('expiry_date')->nullable()->after('batch_number');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('stock_movements')) {
            return;
        }

        $columns = array_values(array_filter([
            Schema::hasColumn('stock_movements', 'batch_number') ? 'batch_number' : null,
            Schema::hasColumn('stock_movements', 'expiry_date') ? 'expiry_date' : null,
        ]));

        if ($columns !== []) {
            Schema::table('stock_movements', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
