<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When a tenant became attributed to its reseller, and when that attribution
 * stops earning commission. A null end date means the attribution is for life.
 *
 * Backfills existing reseller-owned tenants with their creation date so their
 * attribution window is measured from the same point a new one would be.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->timestamp('reseller_attributed_at')->nullable()->after('reseller_global_id');
            $table->timestamp('reseller_attribution_ends_at')->nullable()->after('reseller_attributed_at');
        });

        Schema::table('tenants', function (Blueprint $table): void {
            $table->index('reseller_global_id');
        });

        \Illuminate\Support\Facades\DB::table('tenants')
            ->whereNotNull('reseller_global_id')
            ->whereNull('reseller_attributed_at')
            ->update(['reseller_attributed_at' => \Illuminate\Support\Facades\DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropIndex(['reseller_global_id']);
            $table->dropColumn(['reseller_attributed_at', 'reseller_attribution_ends_at']);
        });
    }
};
