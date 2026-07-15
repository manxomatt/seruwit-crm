<?php

namespace App\Console\Commands;

use App\Models\InstalledModule;
use App\Models\Tenant;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use Illuminate\Console\Command;
use Throwable;

/**
 * Drops the tables of modules whose uninstall grace period has lapsed.
 *
 * This is the only destructive step in the module system, and it is irreversible.
 * It runs per tenant and keeps going if one fails, so a single bad schema cannot
 * stall the rest.
 */
class ModulesPurgeExpired extends Command
{
    protected $signature = 'modules:purge-expired
                            {--tenant= : Limit to a single tenant id}
                            {--pretend : List what would be purged without touching anything}';

    protected $description = 'Permanently delete data of modules uninstalled longer ago than the grace period';

    public function handle(ModuleInstaller $installer): int
    {
        $cutoff = now()->subDays(config('modules.purge_after_days'));

        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $purged = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            $expired = $tenant->run(fn (): array => InstalledModule::query()
                ->uninstalled()
                ->where('uninstalled_at', '<', $cutoff)
                ->pluck('key')
                ->all());

            foreach ($expired as $key) {
                $module = Modules::find($key);

                if (! $module) {
                    $this->warn("  {$tenant->id}: [{$key}] is no longer registered, skipping.");

                    continue;
                }

                if ($this->option('pretend')) {
                    $this->line("  {$tenant->id}: would purge [{$key}]");
                    $purged++;

                    continue;
                }

                try {
                    $tenant->run(fn () => $installer->purge($module));
                    $this->line("  {$tenant->id}: purged [{$key}]");
                    $purged++;
                } catch (Throwable $e) {
                    $this->error("  {$tenant->id}: purging [{$key}] failed — {$e->getMessage()}");
                    $failed++;
                }
            }
        }

        $verb = $this->option('pretend') ? 'Would purge' : 'Purged';
        $this->info("{$verb} {$purged} module(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
