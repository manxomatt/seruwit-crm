<?php

namespace Modules\Fleet\Support;

use App\Modules\Facades\Modules;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;

/**
 * Vehicle status board: counts by status, recent odometer activity,
 * and soft compliance cues (STNK/KIR + Document module when available).
 */
class FleetStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(?Request $request = null, int $perPage = 15): array
    {
        $basesByStatus = FleetBase::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $byStatus = Vehicle::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $driversByStatus = Driver::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $vehicles = Vehicle::query()
            ->orderBy('name')
            ->paginate(
                $perPage,
                ['id', 'name', 'plate_number', 'type', 'status', 'odometer_km', 'stnk_expires_at', 'kir_expires_at', 'updated_at'],
                'page',
                $request?->integer('page') ?: null,
            )
            ->withQueryString();

        $lastFuelByVehicle = FuelLog::query()
            ->selectRaw('vehicle_id, max(filled_at) as last_filled_at, max(odometer_km) as last_fuel_odometer')
            ->whereIn('vehicle_id', $vehicles->getCollection()->pluck('id'))
            ->groupBy('vehicle_id')
            ->get()
            ->keyBy('vehicle_id');

        /** @var LengthAwarePaginator<int, array<string, mixed>> $rows */
        $rows = $vehicles->through(function (Vehicle $vehicle) use ($lastFuelByVehicle): array {
            $fuel = $lastFuelByVehicle->get($vehicle->id);

            return [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
                'status' => $vehicle->status,
                'odometer_km' => (int) $vehicle->odometer_km,
                'last_fuel_at' => $fuel?->last_filled_at
                    ? \Illuminate\Support\Carbon::parse($fuel->last_filled_at)->toDateString()
                    : null,
                'last_fuel_odometer' => $fuel?->last_fuel_odometer !== null ? (int) $fuel->last_fuel_odometer : null,
                'stnk_expires_at' => $vehicle->stnk_expires_at?->toDateString(),
                'kir_expires_at' => $vehicle->kir_expires_at?->toDateString(),
                'stnk_status' => $this->expiryStatus($vehicle->stnk_expires_at?->toDateString()),
                'kir_status' => $this->expiryStatus($vehicle->kir_expires_at?->toDateString()),
                'updated_at' => $vehicle->updated_at?->toIso8601String(),
            ];
        });

        return [
            'bases' => [
                'active' => (int) ($basesByStatus[FleetBase::STATUS_ACTIVE] ?? 0),
                'inactive' => (int) ($basesByStatus[FleetBase::STATUS_INACTIVE] ?? 0),
                'total' => (int) ($basesByStatus->sum()),
            ],
            'counts' => [
                'active' => (int) ($byStatus[Vehicle::STATUS_ACTIVE] ?? 0),
                'maintenance' => (int) ($byStatus[Vehicle::STATUS_MAINTENANCE] ?? 0),
                'inactive' => (int) ($byStatus[Vehicle::STATUS_INACTIVE] ?? 0),
                'total' => (int) ($byStatus->sum()),
            ],
            'drivers' => [
                'available' => (int) ($driversByStatus[Driver::STATUS_AVAILABLE] ?? 0),
                'on_leave' => (int) ($driversByStatus[Driver::STATUS_ON_LEAVE] ?? 0),
                'inactive' => (int) ($driversByStatus[Driver::STATUS_INACTIVE] ?? 0),
                'total' => array_sum($driversByStatus->map(fn ($n) => (int) $n)->all()),
            ],
            'expiring_docs' => $this->expiringDocSummary(),
            'vehicles' => $rows,
        ];
    }

    /**
     * @return array{expired: int, expiring_30: int, available: bool}
     */
    private function expiringDocSummary(): array
    {
        if (! Modules::available('document') || ! Schema::hasTable('documents')) {
            return [
                'expired' => 0,
                'expiring_30' => 0,
                'available' => false,
            ];
        }

        $today = now()->toDateString();
        $in30 = now()->addDays(30)->toDateString();

        $expired = (int) \Modules\Document\Models\Document::query()
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '<', $today)
            ->count();

        $expiring = (int) \Modules\Document\Models\Document::query()
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '>=', $today)
            ->whereDate('expires_at', '<=', $in30)
            ->count();

        return [
            'expired' => $expired,
            'expiring_30' => $expiring,
            'available' => true,
        ];
    }

    private function expiryStatus(?string $date): string
    {
        if ($date === null) {
            return 'unknown';
        }

        $expires = \Carbon\Carbon::parse($date)->startOfDay();
        $today = now()->startOfDay();

        if ($expires->lt($today)) {
            return 'expired';
        }

        if ($expires->lte($today->copy()->addDays(30))) {
            return 'expiring_soon';
        }

        return 'valid';
    }
}
