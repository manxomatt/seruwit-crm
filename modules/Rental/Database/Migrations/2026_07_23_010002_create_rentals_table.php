<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rentals', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('vehicle_id')->constrained('vehicles')->restrictOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('partner_id')->constrained('partners')->restrictOnDelete();
            $table->enum('status', ['draft', 'confirmed', 'active', 'returned', 'completed', 'cancelled'])
                ->default('draft');

            // Booking dates
            $table->date('start_date');
            $table->date('end_date');
            $table->date('actual_return_date')->nullable();

            // Pricing snapshot — copied at confirmation so invoice stays stable
            $table->enum('period_type', ['daily', 'weekly', 'monthly']);
            $table->decimal('rate_per_period', 14, 2);
            $table->integer('km_limit_per_period')->nullable();
            $table->decimal('excess_km_rate', 10, 2)->nullable();
            $table->decimal('deposit_amount', 14, 2)->default(0);
            $table->integer('total_periods');
            $table->decimal('base_amount', 14, 2);

            // Odometer — recorded at checkout and return
            $table->integer('start_odometer')->nullable();
            $table->integer('end_odometer')->nullable();
            $table->integer('excess_km')->nullable();
            $table->decimal('excess_amount', 14, 2)->default(0);
            $table->boolean('deposit_returned')->default(false);
            $table->decimal('total_amount', 14, 2);

            $table->text('notes')->nullable();
            $table->text('cancelled_reason')->nullable();

            // Lifecycle timestamps
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('checked_out_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(['vehicle_id', 'start_date', 'end_date']);
            $table->index(['partner_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rentals');
    }
};
