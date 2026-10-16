<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\FleetBase;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDispatch;

class RentalDispatchController extends Controller
{
    /**
     * Display the Delivery & Pickup Runner Dispatch Board.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $dateFilter = $request->query('date', 'today'); // today, tomorrow, upcoming, all
        $typeFilter = $request->query('type', 'all'); // all, delivery, pickup
        $statusFilter = $request->query('status', 'all'); // all, scheduled, assigned, en_route, arrived, completed, cancelled
        $driverId = $request->query('driver_id');
        $baseId = $request->query('fleet_base_id');

        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        $query = RentalDispatch::query()
            ->with([
                'rental:id,code,status,start_date,pickup_time,end_date,return_time,vehicle_id,partner_id',
                'rental.vehicle:id,name,plate_number,type,home_base_id',
                'rental.vehicle.homeBase:id,code,name',
                'rental.partner:id,code,name,phone',
                'driver:id,name,phone,status',
                'user:id,name',
            ]);

        // Search by rental code, plate, vehicle name, customer name, location
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('location_name', 'ilike', "%{$search}%")
                    ->orWhere('contact_name', 'ilike', "%{$search}%")
                    ->orWhere('contact_phone', 'ilike', "%{$search}%")
                    ->orWhereHas('rental', function ($rq) use ($search) {
                        $rq->where('code', 'ilike', "%{$search}%")
                            ->orWhereHas('vehicle', function ($vq) use ($search) {
                                $vq->where('plate_number', 'ilike', "%{$search}%")
                                    ->orWhere('name', 'ilike', "%{$search}%");
                            })
                            ->orWhereHas('partner', function ($pq) use ($search) {
                                $pq->where('name', 'ilike', "%{$search}%")
                                    ->orWhere('phone', 'ilike', "%{$search}%");
                            });
                    });
            });
        }

        // Date filter
        if ($dateFilter === 'today') {
            $query->whereDate('scheduled_at', $today);
        } elseif ($dateFilter === 'tomorrow') {
            $query->whereDate('scheduled_at', $tomorrow);
        } elseif ($dateFilter === 'upcoming') {
            $query->where('scheduled_at', '>=', $today->copy()->startOfDay())
                ->where('scheduled_at', '<=', $today->copy()->addDays(7)->endOfDay());
        }

        // Type filter
        if ($typeFilter !== 'all') {
            $query->where('type', $typeFilter);
        }

        // Status filter
        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Driver filter
        if ($driverId) {
            $query->where('driver_id', $driverId);
        }

        // Fleet Base filter
        if ($baseId) {
            $query->whereHas('rental.vehicle', function ($vq) use ($baseId) {
                $vq->where('home_base_id', $baseId);
            });
        }

        $dispatches = $query->orderBy('scheduled_at', 'asc')->get();

        // Calculate KPI Metrics
        $todayDispatches = RentalDispatch::query()->whereDate('scheduled_at', $today)->get();
        $metrics = [
            'today_total' => $todayDispatches->count(),
            'unassigned_count' => $todayDispatches->whereNull('driver_id')->whereNotIn('status', [RentalDispatch::STATUS_COMPLETED, RentalDispatch::STATUS_CANCELLED])->count(),
            'en_route_count' => $todayDispatches->where('status', RentalDispatch::STATUS_EN_ROUTE)->count(),
            'completed_today' => $todayDispatches->where('status', RentalDispatch::STATUS_COMPLETED)->count(),
        ];

        $drivers = Driver::query()
            ->where('status', '!=', Driver::STATUS_INACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'status']);

        $fleetBases = FleetBase::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        return Inertia::render('Modules/Rental/Dispatch/Index', [
            'dispatches' => $dispatches,
            'metrics' => $metrics,
            'drivers' => $drivers,
            'fleetBases' => $fleetBases,
            'filters' => [
                'search' => $search ?? '',
                'date' => $dateFilter,
                'type' => $typeFilter,
                'status' => $statusFilter,
                'driver_id' => $driverId ? (int) $driverId : null,
                'fleet_base_id' => $baseId ? (int) $baseId : null,
            ],
        ]);
    }

    /**
     * Store a new dispatch task for a rental.
     */
    public function store(Request $request, Rental $rental): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:delivery,pickup'],
            'scheduled_at' => ['required', 'date'],
            'location_name' => ['required', 'string', 'max:255'],
            'location_address' => ['nullable', 'string', 'max:1000'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'fee_payer' => ['required', 'string', 'in:customer,free,included'],
            'driver_id' => ['nullable', 'exists:drivers,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $initialStatus = ! empty($validated['driver_id'])
            ? RentalDispatch::STATUS_ASSIGNED
            : RentalDispatch::STATUS_SCHEDULED;

        RentalDispatch::create([
            'rental_id' => $rental->id,
            'type' => $validated['type'],
            'driver_id' => $validated['driver_id'] ?? null,
            'status' => $initialStatus,
            'scheduled_at' => $validated['scheduled_at'],
            'location_name' => $validated['location_name'],
            'location_address' => $validated['location_address'] ?? null,
            'contact_name' => $validated['contact_name'] ?? $rental->partner?->name,
            'contact_phone' => $validated['contact_phone'] ?? $rental->partner?->phone,
            'fee' => $validated['fee'] ?? 0,
            'fee_payer' => $validated['fee_payer'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Jadwal dispatch antar-jemput berhasil dibuat.');
    }

    /**
     * Assign a runner/driver to a dispatch task.
     */
    public function assign(Request $request, RentalDispatch $dispatch): RedirectResponse
    {
        $validated = $request->validate([
            'driver_id' => ['required', 'exists:drivers,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $dispatch->driver_id = $validated['driver_id'];
        if ($dispatch->status === RentalDispatch::STATUS_SCHEDULED) {
            $dispatch->status = RentalDispatch::STATUS_ASSIGNED;
        }

        if (! empty($validated['notes'])) {
            $dispatch->notes = trim(($dispatch->notes ? $dispatch->notes."\n" : '').$validated['notes']);
        }

        $dispatch->save();

        $driver = Driver::find($validated['driver_id']);

        try {
            app(\Modules\Rental\Support\RentalWhatsAppNotifier::class)->sendDispatchToRunner($dispatch);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('[RentalDispatchController] WhatsApp runner dispatch error: '.$e->getMessage());
        }

        return redirect()->back()->with('success', "Runner {$driver?->name} berhasil ditugaskan.");
    }

    /**
     * Advance the dispatch task lifecycle status.
     */
    public function updateStatus(Request $request, RentalDispatch $dispatch): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:assigned,en_route,arrived,completed,cancelled'],
            'start_odometer' => ['nullable', 'integer', 'min:0'],
            'start_fuel_level' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newStatus = $validated['status'];
        $dispatch->status = $newStatus;

        if ($newStatus === RentalDispatch::STATUS_EN_ROUTE) {
            $dispatch->dispatched_at = now();
            if (isset($validated['start_odometer'])) {
                $dispatch->start_odometer = $validated['start_odometer'];
            }
            if (! empty($validated['start_fuel_level'])) {
                $dispatch->start_fuel_level = $validated['start_fuel_level'];
            }
        } elseif ($newStatus === RentalDispatch::STATUS_ARRIVED) {
            $dispatch->arrived_at = now();
        } elseif ($newStatus === RentalDispatch::STATUS_COMPLETED) {
            $dispatch->completed_at = now();
        }

        if (! empty($validated['notes'])) {
            $dispatch->notes = trim(($dispatch->notes ? $dispatch->notes."\n" : '').$validated['notes']);
        }

        $dispatch->save();

        $statusLabels = [
            RentalDispatch::STATUS_ASSIGNED => 'Ditugaskan',
            RentalDispatch::STATUS_EN_ROUTE => 'Sedang Dalam Perjalanan',
            RentalDispatch::STATUS_ARRIVED => 'Telah Tiba di Lokasi',
            RentalDispatch::STATUS_COMPLETED => 'Selesai Serah Terima',
            RentalDispatch::STATUS_CANCELLED => 'Dibatalkan',
        ];

        $label = $statusLabels[$newStatus] ?? $newStatus;

        return redirect()->back()->with('success', "Status tugas diperbarui menjadi: {$label}.");
    }

    /**
     * Auto-generate delivery and pickup dispatch tasks for a rental based on its booking dates and locations.
     */
    public function autoGenerate(Rental $rental): RedirectResponse
    {
        $rental->loadMissing(['partner', 'pickupLocation', 'returnLocation', 'vehicle']);

        $createdCount = 0;

        // 1. Delivery Dispatch
        $deliveryExists = $rental->dispatches()->where('type', RentalDispatch::TYPE_DELIVERY)->exists();
        if (! $deliveryExists) {
            $pickupTime = $rental->pickup_time ? substr($rental->pickup_time, 0, 5) : '09:00';
            $deliveryDate = Carbon::parse($rental->start_date->format('Y-m-d').' '.$pickupTime);

            $locationName = $rental->pickupLocation?->name
                ?: $rental->pickup_location
                ?: 'Pool / Kantor Rental';

            RentalDispatch::create([
                'rental_id' => $rental->id,
                'type' => RentalDispatch::TYPE_DELIVERY,
                'status' => RentalDispatch::STATUS_SCHEDULED,
                'scheduled_at' => $deliveryDate,
                'location_name' => $locationName,
                'contact_name' => $rental->partner?->name,
                'contact_phone' => $rental->partner?->phone,
                'fee' => 0,
                'fee_payer' => RentalDispatch::PAYER_CUSTOMER,
                'created_by' => Auth::id(),
            ]);

            $createdCount++;
        }

        // 2. Pickup Dispatch
        $pickupExists = $rental->dispatches()->where('type', RentalDispatch::TYPE_PICKUP)->exists();
        if (! $pickupExists) {
            $returnTime = $rental->return_time ? substr($rental->return_time, 0, 5) : '09:00';
            $returnDate = Carbon::parse($rental->end_date->format('Y-m-d').' '.$returnTime);

            $locationName = $rental->returnLocation?->name
                ?: $rental->return_location
                ?: 'Pool / Kantor Rental';

            RentalDispatch::create([
                'rental_id' => $rental->id,
                'type' => RentalDispatch::TYPE_PICKUP,
                'status' => RentalDispatch::STATUS_SCHEDULED,
                'scheduled_at' => $returnDate,
                'location_name' => $locationName,
                'contact_name' => $rental->partner?->name,
                'contact_phone' => $rental->partner?->phone,
                'fee' => 0,
                'fee_payer' => RentalDispatch::PAYER_CUSTOMER,
                'created_by' => Auth::id(),
            ]);

            $createdCount++;
        }

        return redirect()->back()->with('success', "{$createdCount} tugas dispatch antar-jemput berhasil dibuat otomatis.");
    }
}
