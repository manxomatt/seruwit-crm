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
        Schema::table('payment_orders', function (Blueprint $table) {
            $table->string('tenant_id')->nullable()->change();
            $table->foreignId('onboarding_session_id')->nullable()->after('tenant_id')->constrained('onboarding_sessions')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_orders', function (Blueprint $table) {
            $table->dropForeign(['onboarding_session_id']);
            $table->dropColumn('onboarding_session_id');
            $table->string('tenant_id')->nullable(false)->change();
        });
    }
};
