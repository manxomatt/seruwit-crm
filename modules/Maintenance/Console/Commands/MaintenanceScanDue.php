<?php

namespace Modules\Maintenance\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Maintenance\Support\MaintenanceDueScanner;
use Throwable;

/**
 * Alerts staff about preventive schedules due soon or overdue, and optionally
 * opens draft work orders for overdue items.
 */
class MaintenanceScanDue extends Command
{
    protected $signature = 'maintenance:scan-due
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Notify staff about due/overdue maintenance schedules and optionally create draft WOs';

    public function handle(MaintenanceDueScanner $scanner): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $reminders = 0;
        $workOrders = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $result = $tenant->run(function () use ($scanner): array {
                    if (! Modules::available('maintenance')) {
                        return ['reminders' => 0, 'work_orders' => 0];
                    }

                    return $scanner->scan();
                });

                $reminders += $result['reminders'];
                $workOrders += $result['work_orders'];
            } catch (Throwable $e) {
                $this->error("  {$tenant->id}: scan failed — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Raised {$reminders} reminder(s) and created {$workOrders} draft work order(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
