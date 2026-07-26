<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1.1: allow stock reservations for sales orders as well as delivery orders.
 * DO columns become nullable; SO columns are added (FKs attached when Sales tables exist).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stock_reservations')) {
            return;
        }

        Schema::table('stock_reservations', function (Blueprint $table): void {
            if ($this->hasForeignKey('stock_reservations', 'stock_reservations_delivery_order_id_foreign')) {
                $table->dropForeign(['delivery_order_id']);
            }

            if ($this->hasForeignKey('stock_reservations', 'stock_reservations_delivery_order_item_id_foreign')) {
                $table->dropForeign(['delivery_order_item_id']);
            }
        });

        Schema::table('stock_reservations', function (Blueprint $table): void {
            $table->unsignedBigInteger('delivery_order_id')->nullable()->change();
            $table->unsignedBigInteger('delivery_order_item_id')->nullable()->change();

            if (! Schema::hasColumn('stock_reservations', 'sales_order_id')) {
                $table->unsignedBigInteger('sales_order_id')->nullable()->after('delivery_order_item_id');
            }

            if (! Schema::hasColumn('stock_reservations', 'sales_order_item_id')) {
                $table->unsignedBigInteger('sales_order_item_id')->nullable()->after('sales_order_id');
            }
        });

        Schema::table('stock_reservations', function (Blueprint $table): void {
            if (! $this->hasIndexNamed('stock_reservations', 'stock_reservations_sales_order_id_status_index')) {
                $table->index(['sales_order_id', 'status']);
            }

            if (! $this->hasIndexNamed('stock_reservations', 'stock_reservations_sales_order_item_id_status_index')) {
                $table->index(['sales_order_item_id', 'status']);
            }
        });

        if (Schema::hasTable('delivery_orders') && Schema::hasTable('delivery_order_items')) {
            Schema::table('stock_reservations', function (Blueprint $table): void {
                if (! $this->hasForeignKey('stock_reservations', 'stock_reservations_delivery_order_id_foreign')) {
                    $table->foreign('delivery_order_id')
                        ->references('id')
                        ->on('delivery_orders')
                        ->cascadeOnDelete();
                }

                if (! $this->hasForeignKey('stock_reservations', 'stock_reservations_delivery_order_item_id_foreign')) {
                    $table->foreign('delivery_order_item_id')
                        ->references('id')
                        ->on('delivery_order_items')
                        ->cascadeOnDelete();
                }
            });
        }

        if (Schema::hasTable('sales_orders') && Schema::hasTable('sales_order_items')) {
            Schema::table('stock_reservations', function (Blueprint $table): void {
                if (! $this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_id_foreign')) {
                    $table->foreign('sales_order_id')
                        ->references('id')
                        ->on('sales_orders')
                        ->cascadeOnDelete();
                }

                if (! $this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_item_id_foreign')) {
                    $table->foreign('sales_order_item_id')
                        ->references('id')
                        ->on('sales_order_items')
                        ->cascadeOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('stock_reservations')) {
            return;
        }

        Schema::table('stock_reservations', function (Blueprint $table): void {
            if ($this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_id_foreign')) {
                $table->dropForeign(['sales_order_id']);
            }

            if ($this->hasForeignKey('stock_reservations', 'stock_reservations_sales_order_item_id_foreign')) {
                $table->dropForeign(['sales_order_item_id']);
            }
        });

        Schema::table('stock_reservations', function (Blueprint $table): void {
            if (Schema::hasColumn('stock_reservations', 'sales_order_id')) {
                $table->dropIndex(['sales_order_id', 'status']);
                $table->dropColumn(['sales_order_id', 'sales_order_item_id']);
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

    private function hasIndexNamed(string $table, string $name): bool
    {
        foreach (Schema::getIndexes($table) as $index) {
            if (($index['name'] ?? null) === $name) {
                return true;
            }
        }

        return false;
    }
};
