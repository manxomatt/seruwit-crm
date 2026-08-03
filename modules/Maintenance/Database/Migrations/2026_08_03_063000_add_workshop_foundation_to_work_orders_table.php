<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            $table->string('service_location', 20)->default('in_house')->after('type');
            $table->foreignId('vendor_partner_id')->nullable()->after('vendor_name')->constrained('partners')->nullOnDelete();
            $table->foreignId('mechanic_user_id')->nullable()->after('mechanic_name')->constrained('users')->nullOnDelete();
            $table->string('vehicle_status_before', 30)->nullable()->after('mechanic_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_partner_id');
            $table->dropConstrainedForeignId('mechanic_user_id');
            $table->dropColumn(['service_location', 'vehicle_status_before']);
        });
    }
};
