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
        Schema::create('proof_of_deliveries', function (Blueprint $table) {
            $table->id();
            // Same-module parent, one POD per order.
            $table->foreignId('delivery_order_id')->unique()->constrained()->cascadeOnDelete();
            // Cross-module reference into Transportation's trip_stops. Orders may
            // reference Transportation (it requires it), so an FK is fine here;
            // nullOnDelete keeps the POD if the stop is removed.
            $table->foreignId('trip_stop_id')->nullable()->constrained('trip_stops')->nullOnDelete();
            $table->string('recipient_name');
            $table->string('signature_path')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->dateTime('delivered_at');
            // The driver's login. nullOnDelete — keep the proof if the account
            // is later removed.
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proof_of_deliveries');
    }
};
