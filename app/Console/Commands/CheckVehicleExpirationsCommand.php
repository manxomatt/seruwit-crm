<?php

namespace App\Console\Commands;

use App\Models\PlatformSetting;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleCapacityService;

class CheckVehicleExpirationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fleet:check-expirations {--tenant= : Specific tenant ID to check}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check vehicle active validity, auto-renew expiring vehicles with available capacity credits, or deactivate vehicles past grace period';

    /**
     * Execute the console command.
     */
    public function handle(VehicleCapacityService $capacityService): int
    {
        $durationDays = PlatformSetting::getVehicleActivationDurationDays();
        $graceDays = PlatformSetting::getVehicleGracePeriodDays();
        $pauseDuringMaintenance = PlatformSetting::isPauseDuringMaintenanceEnabled();

        $tenantId = $this->option('tenant');
        $tenants = $tenantId
            ? Tenant::query()->whereKey($tenantId)->get()
            : Tenant::query()->where('status', 'active')->get();

        $totalAutoRenewed = 0;
        $totalDeactivated = 0;

        foreach ($tenants as $tenant) {
            $tenant->run(function () use (
                $tenant,
                $capacityService,
                $durationDays,
                $graceDays,
                $pauseDuringMaintenance,
                &$totalAutoRenewed,
                &$totalDeactivated
            ): void {
                if (! Schema::hasTable('vehicles')) {
                    return;
                }

                $now = Carbon::now();

                // Find active vehicles that have reached or passed their expiration
                $expiringVehicles = Vehicle::query()
                    ->where('status', Vehicle::STATUS_ACTIVE)
                    ->whereNotNull('active_until')
                    ->where('active_until', '<=', $now)
                    ->get();

                foreach ($expiringVehicles as $vehicle) {
                    if ($pauseDuringMaintenance && $vehicle->status === Vehicle::STATUS_MAINTENANCE) {
                        continue;
                    }

                    // Attempt auto-renewal if vehicle has auto_renew enabled and tenant has credits
                    if ($vehicle->auto_renew && $capacityService->hasAvailableCredits($tenant)) {
                        try {
                            $capacityService->renew($vehicle, $durationDays);
                            $totalAutoRenewed++;
                            $this->line("Tenant [{$tenant->id}]: Auto-renewed vehicle {$vehicle->plate_number} (+{$durationDays} days).");

                            continue;
                        } catch (\Throwable $e) {
                            $this->error("Tenant [{$tenant->id}]: Failed to auto-renew vehicle {$vehicle->plate_number}: {$e->getMessage()}");
                        }
                    }

                    // If not renewed, check if past grace period
                    $graceDeadline = $vehicle->active_until->copy()->addDays($graceDays);
                    if ($now->greaterThan($graceDeadline)) {
                        $vehicle->update(['status' => Vehicle::STATUS_INACTIVE]);
                        $totalDeactivated++;
                        $this->warn("Tenant [{$tenant->id}]: Vehicle {$vehicle->plate_number} deactivated (past {$graceDays}-day grace period).");
                    }
                }
            });
        }

        $this->info("Vehicle expiration check finished. Auto-renewed: {$totalAutoRenewed}, Deactivated: {$totalDeactivated}.");

        return 0;
    }
}
