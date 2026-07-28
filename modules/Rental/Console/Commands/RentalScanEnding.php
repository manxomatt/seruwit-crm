<?php

namespace Modules\Rental\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Rental\Support\RentalReminderScanner;
use Throwable;

/**
 * Alerts staff about rentals ending soon or already overdue.
 *
 * Idempotent per (rental, kind, days_before) so re-runs never double-notify.
 */
class RentalScanEnding extends Command
{
    protected $signature = 'rental:scan-ending
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Notify staff about rentals ending soon or overdue';

    public function handle(RentalReminderScanner $scanner): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $created = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $created += $tenant->run(function () use ($scanner): int {
                    if (! Modules::available('rental')) {
                        return 0;
                    }

                    return $scanner->scan();
                });
            } catch (Throwable $e) {
                $this->error("  {$tenant->id}: scan failed — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Raised {$created} rental reminder(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
