<?php

namespace Modules\Tracking\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\VehiclePosition;
use Throwable;

/**
 * Trims raw position history back to each tenant's retention window.
 *
 * vehicle_positions grows by a row per vehicle per minute, which makes it the
 * largest table in the system by two orders of magnitude. Deletes run in
 * bounded chunks rather than one statement so this never holds a long
 * transaction against a table that is being written to every minute.
 *
 * The durable record of a trip is its throttled checkpoint trail, not this —
 * pruning here loses no trip history.
 */
class TrackingPrune extends Command
{
    protected $signature = 'tracking:prune
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Delete GPS positions older than each tenant\'s retention window';

    public function handle(): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $chunk = (int) config('tracking.prune_chunk', 5000);
        $deleted = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $deleted += $tenant->run(function () use ($chunk): int {
                    if (! Modules::available('tracking')) {
                        return 0;
                    }

                    $cutoff = now()->subDays(TrackingConfig::current()->retention_days);
                    $removed = 0;

                    do {
                        $batch = VehiclePosition::query()
                            ->where('recorded_at', '<', $cutoff)
                            ->limit($chunk)
                            ->delete();

                        $removed += $batch;
                    } while ($batch > 0);

                    return $removed;
                });
            } catch (Throwable $e) {
                $this->error("  {$tenant->id}: pruning failed — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Deleted {$deleted} position(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
