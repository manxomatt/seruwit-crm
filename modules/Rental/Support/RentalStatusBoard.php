<?php

namespace Modules\Rental\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;

/**
 * Operational snapshot for the rental desk: status counts, utilisation,
 * month-to-date revenue, and actionable overdue / ending-soon lists.
 */
class RentalStatusBoard
{
    public function __construct(private readonly RentalInvoiceService $invoices) {}

    /**
     * @return array<string, mixed>
     */
    public function build(): array
    {
        $byStatus = Rental::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $activeFleet = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->count();

        $onRentVehicleIds = Rental::query()
            ->checkedOut()
            ->pluck('vehicle_id')
            ->unique()
            ->values();

        $onRent = $onRentVehicleIds->count();
        $utilisation = $activeFleet > 0
            ? round(($onRent / $activeFleet) * 100, 1)
            : 0.0;

        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $revenueMtd = (float) Rental::query()
            ->whereIn('status', [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ])
            ->whereDate('start_date', '>=', $monthStart)
            ->whereDate('start_date', '<=', $monthEnd)
            ->sum('total_amount');

        $unsettledDeposits = Rental::query()
            ->where('deposit_status', Rental::DEPOSIT_HELD)
            ->where('deposit_amount', '>', 0)
            ->whereIn('status', [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED])
            ->count();

        $overdue = $this->rentalRows(Rental::query()->overdue()->orderBy('end_date')->limit(15)->get());
        $endingSoon = $this->rentalRows(Rental::query()->endingSoon(3)->orderBy('end_date')->limit(15)->get());

        $idleVehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->whereNotIn('id', $onRentVehicleIds->all())
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'plate_number', 'type'])
            ->map(fn (Vehicle $vehicle): array => [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
            ])
            ->all();

        return [
            'counts' => [
                'draft' => (int) ($byStatus[Rental::STATUS_DRAFT] ?? 0),
                'confirmed' => (int) ($byStatus[Rental::STATUS_CONFIRMED] ?? 0),
                'active' => (int) ($byStatus[Rental::STATUS_ACTIVE] ?? 0),
                'returned' => (int) ($byStatus[Rental::STATUS_RETURNED] ?? 0),
                'completed' => (int) ($byStatus[Rental::STATUS_COMPLETED] ?? 0),
                'overdue' => Rental::query()->overdue()->count(),
                'ending_soon' => Rental::query()->endingSoon(3)->count(),
                'unsettled_deposits' => $unsettledDeposits,
            ],
            'utilisation' => [
                'percent' => $utilisation,
                'on_rent' => $onRent,
                'fleet_active' => $activeFleet,
                'idle' => max(0, $activeFleet - $onRent),
            ],
            'revenue' => [
                'mtd' => round($revenueMtd, 2),
                'by_type' => $this->revenueByType($monthStart, $monthEnd),
                'by_partner' => $this->revenueByPartner($monthStart, $monthEnd),
                'by_vehicle' => $this->revenueByVehicle($monthStart, $monthEnd),
            ],
            'overdue' => $overdue,
            'ending_soon' => $endingSoon,
            'idle_vehicles' => $idleVehicles,
            'compliance' => [
                'documents' => $this->documentSummary($onRentVehicleIds->all()),
                'maintenance' => $this->maintenanceSummary($onRentVehicleIds->all()),
                'invoicing' => $this->invoicingSummary(),
            ],
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Rental>  $rentals
     * @return list<array<string, mixed>>
     */
    private function rentalRows($rentals): array
    {
        return $rentals->loadMissing(['vehicle:id,name,plate_number', 'partner:id,name,code'])
            ->map(fn (Rental $rental): array => [
                'id' => $rental->id,
                'code' => $rental->code,
                'status' => $rental->status,
                'start_date' => $rental->start_date?->toDateString(),
                'end_date' => $rental->end_date?->toDateString(),
                'is_overdue' => $rental->is_overdue,
                'total_amount' => (float) $rental->total_amount,
                'vehicle' => $rental->vehicle ? [
                    'id' => $rental->vehicle->id,
                    'name' => $rental->vehicle->name,
                    'plate_number' => $rental->vehicle->plate_number,
                ] : null,
                'partner' => $rental->partner ? [
                    'id' => $rental->partner->id,
                    'name' => $rental->partner->name,
                    'code' => $rental->partner->code,
                ] : null,
            ])
            ->all();
    }

    /**
     * @return list<array{type: string, total: float, count: int}>
     */
    private function revenueByType(string $monthStart, string $monthEnd): array
    {
        return Rental::query()
            ->join('vehicles', 'vehicles.id', '=', 'rentals.vehicle_id')
            ->whereIn('rentals.status', [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ])
            ->whereDate('rentals.start_date', '>=', $monthStart)
            ->whereDate('rentals.start_date', '<=', $monthEnd)
            ->groupBy('vehicles.type')
            ->orderByDesc('total')
            ->limit(8)
            ->get([
                'vehicles.type as type',
                DB::raw('sum(rentals.total_amount) as total'),
                DB::raw('count(*) as count'),
            ])
            ->map(fn ($row): array => [
                'type' => $row->type ?: '—',
                'total' => round((float) $row->total, 2),
                'count' => (int) $row->count,
            ])
            ->all();
    }

    /**
     * @return list<array{partner_id: int, name: string, total: float, count: int}>
     */
    private function revenueByPartner(string $monthStart, string $monthEnd): array
    {
        return Rental::query()
            ->join('partners', 'partners.id', '=', 'rentals.partner_id')
            ->whereIn('rentals.status', [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ])
            ->whereDate('rentals.start_date', '>=', $monthStart)
            ->whereDate('rentals.start_date', '<=', $monthEnd)
            ->groupBy('partners.id', 'partners.name')
            ->orderByDesc('total')
            ->limit(8)
            ->get([
                'partners.id as partner_id',
                'partners.name as name',
                DB::raw('sum(rentals.total_amount) as total'),
                DB::raw('count(*) as count'),
            ])
            ->map(fn ($row): array => [
                'partner_id' => (int) $row->partner_id,
                'name' => $row->name,
                'total' => round((float) $row->total, 2),
                'count' => (int) $row->count,
            ])
            ->all();
    }

    /**
     * @return list<array{vehicle_id: int, name: string, plate_number: string, total: float, count: int}>
     */
    private function revenueByVehicle(string $monthStart, string $monthEnd): array
    {
        return Rental::query()
            ->join('vehicles', 'vehicles.id', '=', 'rentals.vehicle_id')
            ->whereIn('rentals.status', [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ])
            ->whereDate('rentals.start_date', '>=', $monthStart)
            ->whereDate('rentals.start_date', '<=', $monthEnd)
            ->groupBy('vehicles.id', 'vehicles.name', 'vehicles.plate_number')
            ->orderByDesc('total')
            ->limit(8)
            ->get([
                'vehicles.id as vehicle_id',
                'vehicles.name as name',
                'vehicles.plate_number as plate_number',
                DB::raw('sum(rentals.total_amount) as total'),
                DB::raw('count(*) as count'),
            ])
            ->map(fn ($row): array => [
                'vehicle_id' => (int) $row->vehicle_id,
                'name' => $row->name,
                'plate_number' => $row->plate_number,
                'total' => round((float) $row->total, 2),
                'count' => (int) $row->count,
            ])
            ->all();
    }

    /**
     * @param  list<int>  $onRentVehicleIds
     * @return array{available: bool, expired: int, expiring_30: int}
     */
    private function documentSummary(array $onRentVehicleIds): array
    {
        if ($onRentVehicleIds === [] || ! Modules::available('document') || ! Schema::hasTable('documents')) {
            return ['available' => Modules::available('document') && Schema::hasTable('documents'), 'expired' => 0, 'expiring_30' => 0];
        }

        $today = now()->toDateString();
        $in30 = now()->addDays(30)->toDateString();
        $vehicleMorph = 'vehicle';

        $base = \Modules\Document\Models\Document::query()
            ->where('documentable_type', $vehicleMorph)
            ->whereIn('documentable_id', $onRentVehicleIds)
            ->whereNotNull('expires_at');

        return [
            'available' => true,
            'expired' => (int) (clone $base)->whereDate('expires_at', '<', $today)->count(),
            'expiring_30' => (int) (clone $base)
                ->whereDate('expires_at', '>=', $today)
                ->whereDate('expires_at', '<=', $in30)
                ->count(),
        ];
    }

    /**
     * @param  list<int>  $onRentVehicleIds
     * @return array{available: bool, overdue_work_orders: int, due_schedules: int}
     */
    private function maintenanceSummary(array $onRentVehicleIds): array
    {
        if (! Modules::available('maintenance')) {
            return ['available' => false, 'overdue_work_orders' => 0, 'due_schedules' => 0];
        }

        $overdueWo = 0;
        $dueSchedules = 0;

        if (Schema::hasTable('work_orders') && class_exists(\Modules\Maintenance\Models\WorkOrder::class)) {
            $query = \Modules\Maintenance\Models\WorkOrder::query()->overdue();
            if ($onRentVehicleIds !== []) {
                $query->whereIn('vehicle_id', $onRentVehicleIds);
            }
            $overdueWo = (int) $query->count();
        }

        if (Schema::hasTable('maintenance_schedules') && class_exists(\Modules\Maintenance\Models\MaintenanceSchedule::class)) {
            $query = \Modules\Maintenance\Models\MaintenanceSchedule::query()
                ->where('is_active', true)
                ->whereNotNull('next_service_date')
                ->whereDate('next_service_date', '<=', now()->addDays(14)->toDateString());

            if ($onRentVehicleIds !== []) {
                $query->whereIn('vehicle_id', $onRentVehicleIds);
            }

            $dueSchedules = (int) $query->count();
        }

        return [
            'available' => true,
            'overdue_work_orders' => $overdueWo,
            'due_schedules' => $dueSchedules,
        ];
    }

    /**
     * @return array{available: bool, unsettled_deposits: int}
     */
    private function invoicingSummary(): array
    {
        return [
            'available' => $this->invoices->isAvailable(),
            'unsettled_deposits' => Rental::query()
                ->where('deposit_status', Rental::DEPOSIT_HELD)
                ->where('deposit_amount', '>', 0)
                ->whereIn('status', [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED])
                ->count(),
        ];
    }
}
