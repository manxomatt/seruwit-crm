<?php

namespace Modules\Tracking\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Tracking\Exceptions\GpsProviderException;
use Modules\Tracking\Models\GpsSource;
use Modules\Tracking\Services\PositionIngestor;
use Throwable;

/**
 * Pulls the latest vehicle positions from each tenant's GPS sources.
 *
 * Runs per tenant and keeps going if one source fails, so a single expired
 * token or unreachable server cannot stall tracking for everybody else.
 */
class TrackingPoll extends Command
{
    protected $signature = 'tracking:poll
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Fetch the latest GPS positions from each tenant\'s tracking sources';

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

                    $sources = GpsSource::query()->pollable()->get();

                    if ($sources->isEmpty()) {
                        return null;
                    }

                    $storedForTenant = 0;
                    $attempted = false;
                    $sourceFailed = false;

                    foreach ($sources as $source) {
                        if (! $source->isConfigured()) {
                            continue;
                        }

                        $attempted = true;

                        try {
                            $storedForTenant += PositionIngestor::for($source)->ingest();
                        } catch (GpsProviderException $e) {
                            $source->forceFill([
                                'last_polled_at' => now(),
                                'last_poll_error' => $e->getMessage(),
                            ])->save();

                            $sourceFailed = true;
                            $this->error("  source #{$source->id} ({$source->name}): {$e->getMessage()}");
                        }
                    }

                    if (! $attempted) {
                        return null;
                    }

                    if ($sourceFailed) {
                        throw new GpsProviderException('One or more GPS sources failed to poll.');
                    }

                    return $storedForTenant;
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
