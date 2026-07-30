<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shuttle_bookings', function (Blueprint $table) {
            $table->string('refund_status')->nullable()->after('cancelled_at');
            $table->string('cancel_reason')->nullable()->after('refund_status');
            $table->foreignId('credit_invoice_id')->nullable()->after('invoice_id')->constrained('invoices')->nullOnDelete();
        });

        Schema::table('shuttle_route_stops', function (Blueprint $table) {
            $table->unsignedInteger('duration_from_previous_seconds')->default(0)->after('distance_from_previous_km');
        });

        Schema::table('shuttle_departures', function (Blueprint $table) {
            $table->unsignedInteger('estimated_duration_minutes')->nullable()->after('optimized_at');
            $table->decimal('estimated_distance_km', 10, 2)->nullable()->after('estimated_duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('shuttle_departures', function (Blueprint $table) {
            $table->dropColumn(['estimated_duration_minutes', 'estimated_distance_km']);
        });

        Schema::table('shuttle_route_stops', function (Blueprint $table) {
            $table->dropColumn('duration_from_previous_seconds');
        });

        Schema::table('shuttle_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('credit_invoice_id');
            $table->dropColumn(['refund_status', 'cancel_reason']);
        });
    }
};
