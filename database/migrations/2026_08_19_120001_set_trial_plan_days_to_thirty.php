<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Widens the self-serve Trial plan from 7 to 30 days.
 *
 * PlanSeeder's own `trial_days` value now matches, so a fresh install picks
 * this up automatically — this migration exists only to carry the change into
 * databases that were seeded before today with the old value. Trial is the one
 * plan PlanSeeder always overwrites on reseed (see its own docblock), so this
 * is a data fix, not a permanent override of anything an admin has set.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('plans')) {
            return;
        }

        DB::table('plans')
            ->where('key', Plan::KEY_TRIAL)
            ->where('trial_days', 7)
            ->update(['trial_days' => 30]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('plans')) {
            return;
        }

        DB::table('plans')
            ->where('key', Plan::KEY_TRIAL)
            ->where('trial_days', 30)
            ->update(['trial_days' => 7]);
    }
};
