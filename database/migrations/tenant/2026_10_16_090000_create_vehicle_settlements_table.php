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
        if (! Schema::hasTable('vehicles') || Schema::hasTable('vehicle_settlements')) {
            return;
        }

        Schema::create('vehicle_settlements', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->string('period_month', 7); // YYYY-MM
            $table->date('start_date');
            $table->date('end_date');

            $table->string('ownership_type', 30)->default('investor');
            $table->string('settlement_scheme', 30)->default('revenue_share');
            $table->decimal('revenue_share_owner_pct', 5, 2)->default(70);
            $table->decimal('revenue_share_tenant_pct', 5, 2)->default(30);
            $table->decimal('fixed_fee_amount', 15, 2)->default(0);
            $table->string('maintenance_payer', 30)->default('tenant');

            $table->integer('total_orders')->default(0);
            $table->integer('total_rental_days')->default(0);
            $table->decimal('total_revenue', 15, 2)->default(0);
            $table->decimal('owner_gross_share', 15, 2)->default(0);
            $table->decimal('tenant_gross_share', 15, 2)->default(0);
            $table->decimal('total_maintenance_cost', 15, 2)->default(0);
            $table->decimal('maintenance_deduction', 15, 2)->default(0);
            $table->decimal('other_adjustment', 15, 2)->default(0);
            $table->string('adjustment_notes', 255)->nullable();
            $table->decimal('net_payout', 15, 2)->default(0);

            $table->string('status', 20)->default('draft'); // draft, approved, paid, cancelled
            $table->string('payment_method', 40)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_number', 60)->nullable();
            $table->string('bank_account_holder', 120)->nullable();
            $table->string('payment_reference', 100)->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['vehicle_id', 'period_month']);
            $table->index(['period_month', 'status']);
            $table->index('partner_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_settlements');
    }
};
