<?php

use App\Models\InstalledModule;
use App\Modules\Facades\Modules;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $hasFleet = InstalledModule::query()
            ->where('key', 'fleet')
            ->installed()
            ->exists();

        if (! $hasFleet) {
            return;
        }

        $now = now();
        foreach (['fleet-base', 'driver'] as $moduleKey) {
            if (! InstalledModule::query()->where('key', $moduleKey)->exists()) {
                InstalledModule::query()->create([
                    'key' => $moduleKey,
                    'installed_at' => $now,
                    'uninstalled_at' => null,
                ]);
            }
        }

        Modules::flushInstalledState();
    }

    public function down(): void
    {
        // Non-destructive: leave records intact
    }
};
