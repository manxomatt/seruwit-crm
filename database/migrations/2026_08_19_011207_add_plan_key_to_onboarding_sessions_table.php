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
        Schema::table('onboarding_sessions', function (Blueprint $table): void {
            $table->string('plan_key', 50)->nullable()->after('verticals');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboarding_sessions', function (Blueprint $table): void {
            $table->dropColumn('plan_key');
        });
    }
};
