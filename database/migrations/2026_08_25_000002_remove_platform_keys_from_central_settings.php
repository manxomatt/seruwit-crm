<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * B3 of docs/central-tenant-separation-design.md: platform-global settings now
 * live in platform_settings (copied by the B1 migration) and are edited via the
 * dedicated central panel. Remove the shadow rows from the central `settings`
 * table so `settings` (App\Models\Setting) is tenant-scoped only.
 *
 * Runs on the central connection; the tenant `settings` tables never held these
 * keys, so this is a no-op there.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->whereIn('key', Setting::centralOnlyKeys())->delete();
    }

    public function down(): void
    {
        // Irreversible: the values live in platform_settings now. No-op.
    }
};
