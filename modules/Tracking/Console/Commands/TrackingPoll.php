<?php

namespace Modules\Tracking\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Tracking\Exceptions\TraccarException;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Services\PositionIngestor;
use Throwable;

/**
 * Pulls the latest vehicle positions from each tenant's Traccar server.
 *
 * Runs per tenant and keeps going if one fails, so a single expired token or
 * unreachable server cannot stall tracking for everybody else — the same shape
 * as modules:purge-expired. A Traccar failure is recorded on the tenant's own
 * config so it surfaces on their settings page rather than only in the log.
 */
class TrackingPoll extends Command
{
    protected $signature = 'tracking:poll
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Fetch the latest GPS positions from each tenant\'s Traccar server';

    public function handle(): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $polled = 0;
        $stored = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $count = $tenant->run(function (): ?int {
                    if (! Modules::available('tracking')) {
                        return null;
                    }

                    $config = TrackingConfig::current();

                    if (! $config->poll_enabled || ! $config->isConfigured()) {
                        return null;
                    }

                    try {
                        return PositionIngestor::for($config)->ingest($config);
                    } catch (TraccarException $e) {
                        $config->forceFill([
                            'last_polled_at' => now(),
                            'last_poll_error' => $e->getMessage(),
                        ])->save();

                        throw $e;
                    }
                });

                if ($count === null) {
                    continue;
                }

                $polled++;
                $stored += $count;
            } catch (Throwable $e) {
                $this->error("  {$tenant->id}: polling failed — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Stored {$stored} position(s) across {$polled} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
