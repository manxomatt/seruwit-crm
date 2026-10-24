<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Rental\Models\RentalMaintenanceBlackout;
use Modules\Rental\Support\RentalStatusBoard;

class StaffDashboardApiController extends Controller
{
    /**
     * Get operational and financial summary metrics for staff and owner dashboard.
     */
    public function summary(Request $request, RentalStatusBoard $statusBoard): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        $activeFleet = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->count();

        $onRentVehicleIds = Rental::query()
            ->checkedOut()
            ->pluck('vehicle_id')
            ->unique()
            ->values();

        $onRentCount = $onRentVehicleIds->count();

        $blackoutVehicleIds = RentalMaintenanceBlackout::query()
            ->whereIn('status', [
                RentalMaintenanceBlackout::STATUS_SCHEDULED,
                RentalMaintenanceBlackout::STATUS_IN_PROGRESS,
            ])
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->pluck('vehicle_id')
            ->unique()
            ->values();

        $maintenanceCount = $blackoutVehicleIds->count();

        $availableCount = max(0, $activeFleet - $onRentCount - $maintenanceCount);

        $bookedTodayCount = Rental::query()
            ->whereDate('start_date', $today)
            ->whereNotIn('status', [Rental::STATUS_CANCELLED])
            ->count();

        // Handovers Today
        $pickupPending = Rental::query()
            ->whereDate('start_date', $today)
            ->whereIn('status', [Rental::STATUS_CONFIRMED, Rental::STATUS_PENDING, Rental::STATUS_PENDING_RESERVED])
            ->whereNull('checked_out_at')
            ->count();

        $pickupCompleted = Rental::query()
            ->whereDate('start_date', $today)
            ->whereNotNull('checked_out_at')
            ->count();

        $returnPending = Rental::query()
            ->whereDate('end_date', $today)
            ->where('status', Rental::STATUS_ACTIVE)
            ->whereNull('returned_at')
            ->count();

        $returnCompleted = Rental::query()
            ->whereDate('end_date', $today)
            ->where(function ($q): void {
                $q->whereNotNull('returned_at')
                    ->orWhereIn('status', [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED]);
            })
            ->count();

        // Approvals Pending
        $pendingPaymentProofs = Rental::query()
            ->where('deposit_proof_status', Rental::PROOF_PENDING)
            ->count();

        $pendingExtensions = RentalExtensionRequest::query()
            ->where('status', RentalExtensionRequest::STATUS_PENDING)
            ->count();

        // Revenue
        $boardData = $statusBoard->build();
        $revenueMtd = (float) ($boardData['revenueMtd'] ?? 0);

        $todayRevenue = (float) Rental::query()
            ->whereIn('status', [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ])
            ->whereDate('confirmed_at', $today)
            ->sum('total_amount');

        return response()->json([
            'success' => true,
            'data' => [
                'vehicles' => [
                    'total' => $activeFleet,
                    'on_rent' => $onRentCount,
                    'available' => $availableCount,
                    'maintenance' => $maintenanceCount,
                    'booked_today' => $bookedTodayCount,
                ],
                'handovers_today' => [
                    'pickup_pending' => $pickupPending,
                    'pickup_completed' => $pickupCompleted,
                    'return_pending' => $returnPending,
                    'return_completed' => $returnCompleted,
                ],
                'approvals_pending' => [
                    'payment_proofs' => $pendingPaymentProofs,
                    'extensions' => $pendingExtensions,
                ],
                'revenue_snapshot' => [
                    'today_cash_collected' => $todayRevenue,
                    'month_to_date' => $revenueMtd,
                    'currency' => 'IDR',
                ],
            ],
        ]);
    }
}
