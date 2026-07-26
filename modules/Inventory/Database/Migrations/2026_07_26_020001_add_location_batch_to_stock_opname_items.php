<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stock_opname_items')) {
            return;
        }

        Schema::table('stock_opname_items', function (Blueprint $table): void {
            $table->dropUnique(['opname_id', 'product_id']);
        });

        Schema::table('stock_opname_items', function (Blueprint $table): void {
            $table->foreignId('location_id')->nullable()->after('product_id')->constrained('warehouse_locations')->nullOnDelete();
            $table->string('batch_number')->default('')->after('location_id');
            $table->date('expiry_date')->nullable()->after('batch_number');
        });

        Schema::table('stock_opname_items', function (Blueprint $table): void {
            $table->unique(
                ['opname_id', 'product_id', 'location_id', 'batch_number'],
                'stock_opname_items_grain_unique'
            );
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('stock_opname_items')) {
            return;
        }

        Schema::table('stock_opname_items', function (Blueprint $table): void {
            $table->dropUnique('stock_opname_items_grain_unique');
        });

        Schema::table('stock_opname_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('location_id');
            $table->dropColumn(['batch_number', 'expiry_date']);
        });

        Schema::table('stock_opname_items', function (Blueprint $table): void {
            $table->unique(['opname_id', 'product_id']);
        });
    }
};
