<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Carries the referral attribution from the sign-up request into the queued
 * provisioning job, which runs with no cookie of its own.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('onboarding_sessions', function (Blueprint $table): void {
            $table->uuid('reseller_global_id')->nullable()->after('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('onboarding_sessions', function (Blueprint $table): void {
            $table->dropColumn('reseller_global_id');
        });
    }
};
