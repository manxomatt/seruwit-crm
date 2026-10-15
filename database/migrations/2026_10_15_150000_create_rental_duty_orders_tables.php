<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('rental_duty_orders')) {
            Schema::create('rental_duty_orders', function (Blueprint $table): void {
                $table->id();
                $table->string('duty_order_number', 50)->unique();
                $table->foreignId('rental_id')->nullable()->constrained('rentals')->nullOnDelete();
                $table->foreignId('driver_id')->constrained('drivers')->cascadeOnDelete();
                $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
                $table->string('origin', 255)->default('Pool Kantor');
                $table->string('destination', 255);
                $table->date('departure_date');
                $table->date('return_date');
                $table->string('departure_time', 10)->default('08:00');
                $table->string('return_time', 10)->default('20:00');
                $table->dateTime('actual_departure_at')->nullable();
                $table->dateTime('actual_return_at')->nullable();
                $table->string('passenger_name', 255)->nullable();
                $table->string('passenger_phone', 50)->nullable();
                $table->string('status', 30)->default('draft'); // draft, dispatched, completed, settled, cancelled
                $table->text('notes')->nullable();

                // Cash Advance (Uang Jalan)
                $table->decimal('cash_advance_amount', 15, 2)->default(0);
                $table->text('cash_advance_notes')->nullable();
                $table->dateTime('cash_advance_paid_at')->nullable();
                $table->foreignId('cash_advance_paid_by')->nullable()->constrained('users')->nullOnDelete();
                $table->decimal('actual_expense_total', 15, 2)->default(0);
                $table->decimal('net_balance', 15, 2)->default(0); // cash_advance_amount - actual_expense_total
                $table->string('settlement_status', 30)->default('pending'); // pending, submitted, settled
                $table->dateTime('settled_at')->nullable();
                $table->foreignId('settled_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('settlement_notes')->nullable();

                // Overtime (Lembur)
                $table->integer('standard_hours_per_day')->default(12);
                $table->decimal('actual_hours_worked', 6, 2)->nullable();
                $table->decimal('overtime_hours', 6, 2)->default(0);
                $table->decimal('driver_overtime_rate_per_hour', 15, 2)->default(0);
                $table->decimal('total_driver_overtime_pay', 15, 2)->default(0);
                $table->decimal('customer_overtime_rate_per_hour', 15, 2)->default(0);
                $table->decimal('total_customer_overtime_charge', 15, 2)->default(0);
                $table->boolean('is_overtime_billed_to_customer')->default(false);

                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['driver_id', 'status']);
                $table->index(['departure_date', 'return_date']);
                $table->index('settlement_status');
            });
        }

        if (! Schema::hasTable('rental_duty_order_expenses')) {
            Schema::create('rental_duty_order_expenses', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('duty_order_id')->constrained('rental_duty_orders')->cascadeOnDelete();
                $table->string('category', 50); // fuel, toll, parking, meal, lodging, repair, other
                $table->decimal('amount', 15, 2);
                $table->date('date');
                $table->string('receipt_number', 100)->nullable();
                $table->string('receipt_url', 255)->nullable();
                $table->string('description', 255)->nullable();
                $table->timestamps();

                $table->index(['duty_order_id', 'category']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_duty_order_expenses');
        Schema::dropIfExists('rental_duty_orders');
    }
};
