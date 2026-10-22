<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('rental_maintenance_blackouts')) {
            Schema::table('rental_maintenance_blackouts', function (Blueprint $table) {
                if (! Schema::hasColumn('rental_maintenance_blackouts', 'type')) {
                    $table->string('type', 40)->default('preventive_service')->after('code');
                }
                if (! Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
                    $table->boolean('prevent_rentals')->default(true)->after('status');
                }
                if (! Schema::hasColumn('rental_maintenance_blackouts', 'completed_at')) {
                    $table->timestamp('completed_at')->nullable()->after('created_by');
                }
            });

            return;
        }

        Schema::create('rental_maintenance_blackouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignId('work_order_id')->nullable()->constrained('work_orders')->nullOnDelete();
            $table->string('code', 40)->unique();
            $table->string('type', 40)->default('preventive_service'); // preventive_service, mileage_interval, corrective_repair, body_paint, compliance_inspection, other
            $table->string('reason', 191);
            $table->date('start_date');
            $table->date('end_date');
            $table->string('vendor_workshop_name', 150)->nullable();
            $table->foreignId('vendor_partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->decimal('estimated_cost', 15, 2)->default(0);
            $table->decimal('actual_cost', 15, 2)->default(0);
            $table->string('status', 30)->default('scheduled')->index(); // scheduled, in_progress, completed, cancelled
            $table->boolean('prevent_rentals')->default(true);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['vehicle_id', 'start_date', 'end_date']);
            $table->index(['status', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_maintenance_blackouts');
    }
};
