<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fleet_bases', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name', 120);
            $table->string('kind', 32)->default('depot')->index();
            $table->string('status', 20)->default('active')->index();

            $table->string('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('zip', 20)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('phone', 30)->nullable();
            $table->string('email', 120)->nullable();
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->string('timezone', 64)->default('Asia/Jakarta');
            $table->unsignedSmallInteger('vehicle_capacity')->nullable();
            $table->boolean('allows_overnight')->default(true);
            $table->decimal('service_radius_km', 8, 2)->nullable();

            $table->foreignId('manager_id')->constrained('users')->restrictOnDelete();

            if (Schema::hasTable('locations')) {
                $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            } else {
                $table->unsignedBigInteger('location_id')->nullable();
            }

            if (Schema::hasTable('warehouses')) {
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            } else {
                $table->unsignedBigInteger('warehouse_id')->nullable();
            }

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['city', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fleet_bases');
    }
};
