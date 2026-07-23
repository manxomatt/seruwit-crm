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
        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('partner_id')->constrained('partners');
            // The trips table is guaranteed to exist here because Orders
            // requires Transportation. nullOnDelete is a safety net only:
            // TripObserver releases attached orders before a trip is deleted.
            $table->foreignId('trip_id')->nullable()->constrained('trips')->nullOnDelete();
            $table->string('status')->default('draft')->index();
            $table->date('order_date');
            $table->string('pickup_address');
            $table->string('delivery_address');
            $table->text('notes')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->string('cancelled_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_orders');
    }
};
