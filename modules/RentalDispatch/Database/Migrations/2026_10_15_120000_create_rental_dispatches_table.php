<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_dispatches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            $table->string('type', 20); // delivery, pickup
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('scheduled'); // scheduled, assigned, en_route, arrived, completed, cancelled
            $table->dateTime('scheduled_at');
            $table->string('location_name');
            $table->text('location_address')->nullable();
            $table->string('contact_name', 100)->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->decimal('fee', 12, 2)->default(0);
            $table->string('fee_payer', 20)->default('customer'); // customer, free, included
            $table->dateTime('dispatched_at')->nullable();
            $table->dateTime('arrived_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->integer('start_odometer')->nullable();
            $table->string('start_fuel_level', 20)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['rental_id', 'type']);
            $table->index(['status', 'scheduled_at']);
            $table->index('driver_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_dispatches');
    }
};
