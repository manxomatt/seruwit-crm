<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('maintenance_categories')->restrictOnDelete();

            // Human-readable reference, e.g. WO-2026-0001
            $table->string('reference_number', 30)->unique();
            $table->string('title');
            $table->text('description')->nullable();

            // draft → pending → approved → in_progress → completed | cancelled
            $table->string('status', 20)->default('draft');

            // low | normal | high | urgent
            $table->string('priority', 20)->default('normal');

            // scheduled | corrective | preventive | emergency
            $table->string('type', 20)->default('corrective');

            $table->unsignedInteger('odometer_at_service')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->string('vendor_name')->nullable();
            $table->string('mechanic_name')->nullable();
            $table->string('invoice_number', 100)->nullable();

            $table->decimal('estimated_cost', 15, 2)->nullable();
            $table->decimal('actual_labor_cost', 15, 2)->nullable();
            $table->decimal('actual_parts_cost', 15, 2)->nullable();

            $table->text('notes')->nullable();
            $table->text('resolution_notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['vehicle_id', 'status']);
            $table->index(['status', 'scheduled_date']);
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_orders');
    }
};
