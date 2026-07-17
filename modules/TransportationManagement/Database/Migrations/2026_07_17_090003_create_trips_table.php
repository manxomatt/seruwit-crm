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
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            // No cascadeOnDelete: Vehicle/Driver belong to the separate Fleet
            // module, which must stay free of any knowledge of Trip. Deleting a
            // vehicle or driver still tied to a trip is refused at the database
            // level instead (restrict is the default), and Fleet's controllers
            // turn that into a friendly error.
            $table->foreignId('vehicle_id')->constrained();
            $table->foreignId('driver_id')->constrained();
            $table->string('origin');
            $table->string('destination');
            $table->text('cargo_notes')->nullable();
            $table->dateTime('scheduled_at');
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->string('status')->default('scheduled');
            $table->string('cancelled_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
