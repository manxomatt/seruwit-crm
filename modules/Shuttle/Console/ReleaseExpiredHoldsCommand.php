<?php

namespace Modules\Shuttle\Console;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Shuttle\Support\PassengerBookingService;
use Throwable;

class ReleaseExpiredHoldsCommand extends Command
{
    protected $signature = 'shuttle:release-expired-holds
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Release expired passenger booking seat holds across tenants';

    public function handle(PassengerBookingService $service): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $released = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $released += $tenant->run(function () use ($service): int {
                    if (! Modules::available('shuttle')) {
                        return 0;
                    }

                    return $service->releaseExpiredHolds();
                });
            } catch (Throwable $e) {
                $this->error("  {$tenant->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Released {$released} expired hold(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
