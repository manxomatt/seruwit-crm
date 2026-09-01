<?php

namespace Modules\Fleet\Support;

use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\TenantCapacityTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use RuntimeException;

class VehicleCapacityService
{
    /**
     * Get the available capacity credits for the current or specified tenant.
     */
    public function getAvailableCredits(?Tenant $tenant = null): int
    {
        $tenantInstance = $tenant ?? tenant();

        if (! $tenantInstance instanceof Tenant) {
            return 0;
        }

        $centralConnection = config('tenancy.database.central_connection');

        /** @var Tenant|null $centralTenant */
        $centralTenant = Tenant::on($centralConnection)
            ->whereKey($tenantInstance->getTenantKey())
            ->first();

        if (! $centralTenant) {
            return 0;
        }

        $credits = $centralTenant->unit_capacity_credits;

        // Auto-initialize legacy/existing tenants that purchased a quota before the credits column was introduced:
        if ($credits === null || ($credits === 0 && ! TenantCapacityTransaction::on($centralConnection)->where('tenant_id', $centralTenant->getTenantKey())->exists())) {
            $initialCredits = (int) ($centralTenant->max_vehicles_allowed ?? 0);
            if ($initialCredits > 0) {
                $centralTenant->update(['unit_capacity_credits' => $initialCredits]);
                TenantCapacityTransaction::on($centralConnection)->create([
                    'tenant_id' => $centralTenant->getTenantKey(),
                    'amount' => $initialCredits,
                    'balance_after' => $initialCredits,
                    'type' => TenantCapacityTransaction::TYPE_TOPUP,
                    'description' => "Inisialisasi saldo kuota armada awal ({$initialCredits} unit) dari paket langganan aktif",
                ]);

                return $initialCredits;
            }
        }

        return (int) ($credits ?? 0);
    }

    /**
     * Check whether the tenant has at least one credit available.
     */
    public function hasAvailableCredits(?Tenant $tenant = null): bool
    {
        return $this->getAvailableCredits($tenant) >= 1;
    }

    /**
     * Normalize license plate for fingerprint comparison.
     */
    public function normalizePlateNumber(string $plateNumber): string
    {
        return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $plateNumber));
    }

    /**
     * Check if a license plate or VIN is eligible to claim a free trial.
     */
    public function canClaimTrial(string $plateNumber, ?string $vinNumber = null): bool
    {
        if (! PlatformSetting::isPreventDuplicatePlateTrial()) {
            return true;
        }

        if (! Schema::hasTable('vehicle_trial_fingerprints')) {
            return true;
        }

        $normalized = $this->normalizePlateNumber($plateNumber);
        if (blank($normalized)) {
            return true;
        }

        $query = DB::table('vehicle_trial_fingerprints')->where('plate_number_normalized', $normalized);

        if (filled($vinNumber)) {
            $query->orWhere('vin_number', $vinNumber);
        }

        return ! $query->exists();
    }

    /**
     * Record a license plate / VIN fingerprint after claiming a free trial.
     */
    public function recordTrialFingerprint(string $plateNumber, ?string $vinNumber = null): void
    {
        if (! Schema::hasTable('vehicle_trial_fingerprints')) {
            return;
        }

        $normalized = $this->normalizePlateNumber($plateNumber);
        if (blank($normalized)) {
            return;
        }

        DB::table('vehicle_trial_fingerprints')->updateOrInsert(
            ['plate_number_normalized' => $normalized],
            [
                'vin_number' => $vinNumber,
                'first_trial_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
                'created_at' => Carbon::now(),
            ]
        );
    }

    /**
     * Start a free trial period for a newly registered vehicle without consuming credit.
     *
     * @return array{success: bool, is_trial: bool, active_until: Carbon}
     */
    public function startTrial(Vehicle $vehicle, ?int $durationDays = null): array
    {
        $duration = $durationDays ?? PlatformSetting::getVehicleTrialDurationDays();
        $now = Carbon::now();
        $activeUntil = $now->copy()->addDays($duration);

        $vehicle->update([
            'status' => Vehicle::STATUS_ACTIVE,
            'is_trial' => true,
            'activated_at' => $now,
            'active_until' => $activeUntil,
            'trial_ends_at' => $activeUntil,
        ]);

        $this->recordTrialFingerprint($vehicle->plate_number);

        return [
            'success' => true,
            'is_trial' => true,
            'active_until' => $activeUntil,
        ];
    }

    /**
     * Activate a vehicle by consuming 1 unit capacity credit.
     *
     * @return array{success: bool, new_balance: int, active_until: Carbon}
     *
     * @throws RuntimeException
     */
    public function activate(Vehicle $vehicle, ?int $durationDays = null, ?string $actorGlobalId = null): array
    {
        $duration = $durationDays ?? PlatformSetting::getVehicleActivationDurationDays();
        $tenantInstance = tenant();

        if (! $tenantInstance instanceof Tenant) {
            throw new RuntimeException('Tenant context is required to activate vehicle.');
        }

        $centralConnection = config('tenancy.database.central_connection');
        $tenantKey = $tenantInstance->getTenantKey();

        return DB::connection($centralConnection)->transaction(function () use (
            $vehicle,
            $duration,
            $actorGlobalId,
            $centralConnection,
            $tenantKey
        ): array {
            /** @var Tenant|null $centralTenant */
            $centralTenant = Tenant::on($centralConnection)
                ->whereKey($tenantKey)
                ->lockForUpdate()
                ->first();

            if (! $centralTenant) {
                throw new RuntimeException('Central tenant record not found.');
            }

            $currentBalance = (int) ($centralTenant->unit_capacity_credits ?? 0);

            if ($currentBalance < 1) {
                throw new RuntimeException("Saldo kredit kapasitas unit tidak mencukupi (Saldo saat ini: {$currentBalance} unit). Silakan hubungi admin central untuk melakukan top-up.");
            }

            $newBalance = $currentBalance - 1;
            $centralTenant->update(['unit_capacity_credits' => $newBalance]);

            // Record transaction in central ledger
            TenantCapacityTransaction::on($centralConnection)->create([
                'tenant_id' => $tenantKey,
                'amount' => -1,
                'balance_after' => $newBalance,
                'type' => TenantCapacityTransaction::TYPE_ACTIVATION,
                'description' => "Aktivasi kendaraan {$vehicle->plate_number} ({$vehicle->name})",
                'reference_id' => (string) $vehicle->id,
                'created_by_id' => $actorGlobalId,
            ]);

            $now = Carbon::now();
            $activeUntil = $now->copy()->addDays($duration);

            // Update vehicle in tenant DB
            $vehicle->update([
                'status' => Vehicle::STATUS_ACTIVE,
                'is_trial' => false,
                'activated_at' => $now,
                'active_until' => $activeUntil,
            ]);

            return [
                'success' => true,
                'new_balance' => $newBalance,
                'active_until' => $activeUntil,
            ];
        });
    }

    /**
     * Renew an already activated or expired vehicle for another activation cycle.
     *
     * @return array{success: bool, new_balance: int, active_until: Carbon}
     *
     * @throws RuntimeException
     */
    public function renew(Vehicle $vehicle, ?int $durationDays = null, ?string $actorGlobalId = null): array
    {
        $duration = $durationDays ?? PlatformSetting::getVehicleActivationDurationDays();
        $tenantInstance = tenant();

        if (! $tenantInstance instanceof Tenant) {
            throw new RuntimeException('Tenant context is required to renew vehicle.');
        }

        $centralConnection = config('tenancy.database.central_connection');
        $tenantKey = $tenantInstance->getTenantKey();

        return DB::connection($centralConnection)->transaction(function () use (
            $vehicle,
            $duration,
            $actorGlobalId,
            $centralConnection,
            $tenantKey
        ): array {
            /** @var Tenant|null $centralTenant */
            $centralTenant = Tenant::on($centralConnection)
                ->whereKey($tenantKey)
                ->lockForUpdate()
                ->first();

            if (! $centralTenant) {
                throw new RuntimeException('Central tenant record not found.');
            }

            $currentBalance = (int) ($centralTenant->unit_capacity_credits ?? 0);

            if ($currentBalance < 1) {
                throw new RuntimeException("Saldo kredit kapasitas unit tidak mencukupi (Saldo saat ini: {$currentBalance} unit). Silakan hubungi admin central untuk melakukan top-up.");
            }

            $newBalance = $currentBalance - 1;
            $centralTenant->update(['unit_capacity_credits' => $newBalance]);

            // Record transaction in central ledger
            TenantCapacityTransaction::on($centralConnection)->create([
                'tenant_id' => $tenantKey,
                'amount' => -1,
                'balance_after' => $newBalance,
                'type' => TenantCapacityTransaction::TYPE_RENEWAL,
                'description' => "Perpanjangan masa aktif kendaraan {$vehicle->plate_number} ({$vehicle->name})",
                'reference_id' => (string) $vehicle->id,
                'created_by_id' => $actorGlobalId,
            ]);

            $now = Carbon::now();
            $baseDate = ($vehicle->active_until && $vehicle->active_until->isFuture())
                ? $vehicle->active_until->copy()
                : $now;

            $activeUntil = $baseDate->copy()->addDays($duration);

            // Update vehicle in tenant DB
            $vehicle->update([
                'status' => Vehicle::STATUS_ACTIVE,
                'is_trial' => false,
                'activated_at' => $now,
                'active_until' => $activeUntil,
            ]);

            return [
                'success' => true,
                'new_balance' => $newBalance,
                'active_until' => $activeUntil,
            ];
        });
    }

    /**
     * Toggle auto-renew setting for a vehicle.
     */
    public function toggleAutoRenew(Vehicle $vehicle, bool $autoRenew): void
    {
        $vehicle->update(['auto_renew' => $autoRenew]);
    }
}
