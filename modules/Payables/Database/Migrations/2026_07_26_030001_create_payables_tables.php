<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_bills', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('partner_id')->constrained('partners');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->foreignId('good_receipt_note_id')->nullable()->constrained('good_receipt_notes')->nullOnDelete();
            $table->string('status')->default('draft')->index();
            $table->date('bill_date');
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_bill_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_bill_id')->constrained('supplier_bills')->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->nullableMorphs('source');
            $table->timestamps();
        });

        Schema::create('bill_payments', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('partner_id')->constrained('partners');
            $table->date('payment_date');
            $table->decimal('amount', 15, 2);
            $table->string('method')->default('transfer');
            $table->string('reference_number')->nullable();
            $table->string('status')->default('posted')->index();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();
        });

        Schema::create('bill_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_payment_id')->constrained('bill_payments')->cascadeOnDelete();
            $table->foreignId('supplier_bill_id')->constrained('supplier_bills')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->timestamps();

            $table->unique(['bill_payment_id', 'supplier_bill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_payment_allocations');
        Schema::dropIfExists('bill_payments');
        Schema::dropIfExists('supplier_bill_lines');
        Schema::dropIfExists('supplier_bills');
    }
};
