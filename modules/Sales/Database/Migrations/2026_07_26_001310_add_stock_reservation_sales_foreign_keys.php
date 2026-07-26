<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When Inventory was installed before Sales, stock_reservations may lack SO FKs.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stock_reservations')) {
            return;
        }

        if (! Schema::hasTable('sales_orders') || ! Schema::hasTable('sales_order_items')) {
            return;
        }

        if (! Schema::hasColumn('stock_reservations', 'sales_order_id')) {
            return;
        }

        $needsOrderFk = ! $this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_id_foreign');
        $needsItemFk = ! $this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_item_id_foreign');

        if (! $needsOrderFk && ! $needsItemFk) {
            return;
        }

        Schema::table('stock_reservations', function (Blueprint $table) use ($needsOrderFk, $needsItemFk): void {
            if ($needsOrderFk) {
                $table->foreign('sales_order_id')
                    ->references('id')
                    ->on('sales_orders')
                    ->cascadeOnDelete();
            }

            if ($needsItemFk) {
                $table->foreign('sales_order_item_id')
                    ->references('id')
                    ->on('sales_order_items')
                    ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('stock_reservations')) {
            return;
        }

        $hasOrderFk = $this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_id_foreign');
        $hasItemFk = $this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_item_id_foreign');

        if (! $hasOrderFk && ! $hasItemFk) {
            return;
        }

        Schema::table('stock_reservations', function (Blueprint $table) use ($hasOrderFk, $hasItemFk): void {
            if ($hasOrderFk) {
                $table->dropForeign(['sales_order_id']);
            }

            if ($hasItemFk) {
                $table->dropForeign(['sales_order_item_id']);
            }
        });
    }

    private function hasForeignKey(string $table, string $name): bool
    {
        foreach (Schema::getForeignKeys($table) as $foreignKey) {
            if (($foreignKey['name'] ?? null) === $name) {
                return true;
            }
        }

        return false;
    }
};
