<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('opened_by')->constrained('users');
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('open')->index();
            $table->decimal('opening_float', 15, 2)->default(0);
            $table->decimal('closing_cash_counted', 15, 2)->nullable();
            $table->decimal('expected_cash', 15, 2)->nullable();
            $table->decimal('cash_variance', 15, 2)->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['warehouse_id', 'status']);
        });

        Schema::create('pos_sales', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('pos_shift_id')->constrained('pos_shifts')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('cashier_id')->constrained('users');
            // Soft dependency on partners — no FK so POS can install without that module.
            $table->unsignedBigInteger('partner_id')->nullable()->index();
            $table->string('status')->default('completed')->index();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('amount_tendered', 15, 2)->nullable();
            $table->decimal('change_due', 15, 2)->nullable();
            $table->timestamp('sold_at');
            $table->timestamp('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('void_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['warehouse_id', 'sold_at']);
            $table->index(['pos_shift_id', 'status']);
        });

        Schema::create('pos_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pos_sale_id')->constrained('pos_sales')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('product_packaging_id')->nullable()->constrained('product_packagings')->nullOnDelete();
            $table->decimal('quantity', 12, 3);
            $table->decimal('qty_base', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('line_discount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2);
            $table->string('unit')->nullable();
            $table->timestamps();
        });

        Schema::create('pos_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pos_sale_id')->constrained('pos_sales')->cascadeOnDelete();
            $table->string('method');
            $table->decimal('amount', 15, 2);
            $table->string('reference')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_payments');
        Schema::dropIfExists('pos_sale_items');
        Schema::dropIfExists('pos_sales');
        Schema::dropIfExists('pos_shifts');
    }
};
