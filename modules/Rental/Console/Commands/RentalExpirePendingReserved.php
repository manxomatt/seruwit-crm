<?php

namespace Modules\Rental\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Rental\Support\RentalPendingReservedExpirer;
use Throwable;

class RentalExpirePendingReserved extends Command
{
    protected $signature = 'rental:expire-pending-reserved
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Move expired Pending Reserved rentals to Pending (release vehicle hold)';

    public function handle(RentalPendingReservedExpirer $expirer): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $expired = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $expired += $tenant->run(function () use ($expirer): int {
                    if (! Modules::available('rental')) {
                        return 0;
                    }

                    return $expirer->expire();
                });
            } catch (Throwable $e) {
                $this->error("  {$tenant->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Expired {$expired} pending-reserved rental(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
