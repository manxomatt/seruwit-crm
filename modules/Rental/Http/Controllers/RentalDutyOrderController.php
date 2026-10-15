<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDutyOrder;
use Modules\Rental\Models\RentalDutyOrderExpense;

class RentalDutyOrderController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of Driver Duty Orders (SPPD).
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $settlementStatus = $request->query('settlement_status');
        $driverId = $request->query('driver_id');
        $vehicleId = $request->query('vehicle_id');
        $date = $request->query('date');

        $query = RentalDutyOrder::query()
            ->with([
                'driver:id,name,phone,license_number,status',
                'vehicle:id,name,plate_number,type',
                'rental:id,code,status,start_date,end_date',
                'creator:id,name',
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('duty_order_number', 'ilike', "%{$search}%")
                    ->orWhere('origin', 'ilike', "%{$search}%")
                    ->orWhere('destination', 'ilike', "%{$search}%")
                    ->orWhere('passenger_name', 'ilike', "%{$search}%")
                    ->orWhereHas('driver', fn ($dq) => $dq->where('name', 'ilike', "%{$search}%"))
                    ->orWhereHas('vehicle', fn ($vq) => $vq->where('plate_number', 'ilike', "%{$search}%")->orWhere('name', 'ilike', "%{$search}%"))
                    ->orWhereHas('rental', fn ($rq) => $rq->where('code', 'ilike', "%{$search}%"));
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($settlementStatus && $settlementStatus !== 'all') {
            $query->where('settlement_status', $settlementStatus);
        }

        if ($driverId) {
            $query->where('driver_id', (int) $driverId);
        }

        if ($vehicleId) {
            $query->where('vehicle_id', (int) $vehicleId);
        }

        if ($date) {
            $query->where(function ($q) use ($date) {
                $q->whereDate('departure_date', '<=', $date)
                    ->whereDate('return_date', '>=', $date);
            });
        }

        $orders = $query->latest('id')->paginate(15)->withQueryString();

        // Calculate KPIs
        $allOrders = RentalDutyOrder::query()->get();
        $metrics = [
            'total_orders' => $allOrders->count(),
            'active_orders' => $allOrders->whereIn('status', [RentalDutyOrder::STATUS_DRAFT, RentalDutyOrder::STATUS_DISPATCHED])->count(),
            'pending_settlement' => $allOrders->where('settlement_status', RentalDutyOrder::SETTLEMENT_PENDING)->where('status', '!=', RentalDutyOrder::STATUS_CANCELLED)->count(),
            'total_advance_disbursed' => (float) $allOrders->where('status', '!=', RentalDutyOrder::STATUS_CANCELLED)->sum('cash_advance_amount'),
            'total_actual_expenses' => (float) $allOrders->where('status', '!=', RentalDutyOrder::STATUS_CANCELLED)->sum('actual_expense_total'),
            'total_net_balance' => (float) $allOrders->where('status', '!=', RentalDutyOrder::STATUS_CANCELLED)->sum('net_balance'),
        ];

        $drivers = Driver::query()
            ->where('status', '!=', Driver::STATUS_INACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        $vehicles = Vehicle::query()
            ->orderBy('plate_number')
            ->get(['id', 'name', 'plate_number', 'type']);

        return Inertia::render('Modules/Rental/DutyOrders/Index', [
            'orders' => $orders,
            'metrics' => $metrics,
            'drivers' => $drivers,
            'vehicles' => $vehicles,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'settlement_status' => $settlementStatus ?? 'all',
                'driver_id' => $driverId ? (int) $driverId : null,
                'vehicle_id' => $vehicleId ? (int) $vehicleId : null,
                'date' => $date ?? '',
            ],
        ]);
    }

    /**
     * Show form to create a new duty order.
     */
    public function create(Request $request): Response
    {
        $prefilledRentalId = $request->query('rental_id');
        $selectedRental = null;

        if ($prefilledRentalId) {
            $selectedRental = Rental::query()
                ->with(['partner:id,name,phone', 'vehicle:id,name,plate_number', 'driver:id,name,phone'])
                ->find($prefilledRentalId);
        }

        $activeRentals = Rental::query()
            ->whereIn('status', [Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE])
            ->with(['partner:id,name,phone', 'vehicle:id,name,plate_number', 'driver:id,name,phone'])
            ->latest('id')
            ->limit(50)
            ->get();

        $drivers = Driver::query()
            ->where('status', '!=', Driver::STATUS_INACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'status']);

        $vehicles = Vehicle::query()
            ->orderBy('plate_number')
            ->get(['id', 'name', 'plate_number', 'type']);

        return Inertia::render('Modules/Rental/DutyOrders/Create', [
            'suggestedNumber' => RentalDutyOrder::generateNumber(),
            'activeRentals' => $activeRentals,
            'selectedRental' => $selectedRental,
            'drivers' => $drivers,
            'vehicles' => $vehicles,
        ]);
    }

    /**
     * Store a newly created duty order.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'duty_order_number' => ['nullable', 'string', 'max:50', 'unique:rental_duty_orders,duty_order_number'],
            'rental_id' => ['nullable', 'exists:rentals,id'],
            'driver_id' => ['required', 'exists:drivers,id'],
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'origin' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:255'],
            'departure_date' => ['required', 'date'],
            'return_date' => ['required', 'date', 'after_or_equal:departure_date'],
            'departure_time' => ['nullable', 'string', 'max:10'],
            'return_time' => ['nullable', 'string', 'max:10'],
            'passenger_name' => ['nullable', 'string', 'max:255'],
            'passenger_phone' => ['nullable', 'string', 'max:50'],
            'cash_advance_amount' => ['nullable', 'numeric', 'min:0'],
            'cash_advance_notes' => ['nullable', 'string', 'max:1000'],
            'standard_hours_per_day' => ['nullable', 'integer', 'min:1', 'max:24'],
            'driver_overtime_rate_per_hour' => ['nullable', 'numeric', 'min:0'],
            'customer_overtime_rate_per_hour' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $cashAdvance = (float) ($validated['cash_advance_amount'] ?? 0);
        $orderNumber = ! empty($validated['duty_order_number'])
            ? $validated['duty_order_number']
            : RentalDutyOrder::generateNumber();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => $orderNumber,
            'rental_id' => $validated['rental_id'] ?? null,
            'driver_id' => $validated['driver_id'],
            'vehicle_id' => $validated['vehicle_id'],
            'origin' => $validated['origin'],
            'destination' => $validated['destination'],
            'departure_date' => $validated['departure_date'],
            'return_date' => $validated['return_date'],
            'departure_time' => $validated['departure_time'] ?? null,
            'return_time' => $validated['return_time'] ?? null,
            'passenger_name' => $validated['passenger_name'] ?? null,
            'passenger_phone' => $validated['passenger_phone'] ?? null,
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'cash_advance_amount' => $cashAdvance,
            'cash_advance_notes' => $validated['cash_advance_notes'] ?? null,
            'cash_advance_paid_at' => $cashAdvance > 0 ? now() : null,
            'cash_advance_paid_by' => $cashAdvance > 0 ? Auth::id() : null,
            'actual_expense_total' => 0,
            'net_balance' => $cashAdvance,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'standard_hours_per_day' => $validated['standard_hours_per_day'] ?? 12,
            'driver_overtime_rate_per_hour' => $validated['driver_overtime_rate_per_hour'] ?? 0,
            'customer_overtime_rate_per_hour' => $validated['customer_overtime_rate_per_hour'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.rental.duty_orders.show', $dutyOrder)
            ->with('success', "Surat Tugas {$dutyOrder->duty_order_number} berhasil dibuat.");
    }

    /**
     * Display the specified duty order and its expense reconciliation.
     */
    public function show(RentalDutyOrder $dutyOrder): Response
    {
        $dutyOrder->load([
            'driver:id,name,phone,license_number,license_type,status',
            'vehicle:id,name,plate_number,type,brand',
            'rental:id,code,status,start_date,end_date,partner_id',
            'rental.partner:id,name,phone',
            'creator:id,name',
            'cashAdvancePayer:id,name',
            'settler:id,name',
            'expenses' => fn ($q) => $q->orderBy('date', 'desc')->orderBy('id', 'desc'),
        ]);

        $dutyOrder->recalculateExpenses();

        $categories = [
            RentalDutyOrderExpense::CATEGORY_FUEL => 'BBM / Bensin',
            RentalDutyOrderExpense::CATEGORY_TOLL => 'E-Toll / Tol',
            RentalDutyOrderExpense::CATEGORY_PARKING => 'Parkir & Retribusi',
            RentalDutyOrderExpense::CATEGORY_MEAL => 'Uang Makan Supir',
            RentalDutyOrderExpense::CATEGORY_LODGING => 'Penginapan Supir',
            RentalDutyOrderExpense::CATEGORY_REPAIR => 'Perbaikan Darurat Lapangan',
            RentalDutyOrderExpense::CATEGORY_OTHER => 'Lain-lain',
        ];

        return Inertia::render('Modules/Rental/DutyOrders/Show', [
            'dutyOrder' => $dutyOrder,
            'expenseCategories' => $categories,
        ]);
    }

    /**
     * Update order operational lifecycle status.
     */
    public function updateStatus(Request $request, RentalDutyOrder $dutyOrder): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:draft,dispatched,completed,cancelled'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newStatus = $validated['status'];
        $dutyOrder->status = $newStatus;

        if ($newStatus === RentalDutyOrder::STATUS_DISPATCHED && ! $dutyOrder->actual_departure_at) {
            $dutyOrder->actual_departure_at = now();
        } elseif ($newStatus === RentalDutyOrder::STATUS_COMPLETED && ! $dutyOrder->actual_return_at) {
            $dutyOrder->actual_return_at = now();
        }

        if (! empty($validated['notes'])) {
            $dutyOrder->notes = trim(($dutyOrder->notes ? $dutyOrder->notes."\n" : '').$validated['notes']);
        }

        $dutyOrder->save();

        $labels = [
            RentalDutyOrder::STATUS_DRAFT => 'Draft',
            RentalDutyOrder::STATUS_DISPATCHED => 'Berangkat (On Duty)',
            RentalDutyOrder::STATUS_COMPLETED => 'Selesai Tugas',
            RentalDutyOrder::STATUS_CANCELLED => 'Dibatalkan',
        ];

        return back()->with('success', 'Status tugas diperbarui: '.($labels[$newStatus] ?? $newStatus));
    }

    /**
     * Add an itemized expense receipt.
     */
    public function addExpense(Request $request, RentalDutyOrder $dutyOrder): RedirectResponse
    {
        if ($dutyOrder->settlement_status === RentalDutyOrder::SETTLEMENT_SETTLED) {
            return back()->with('error', 'Tidak dapat menambah pengeluaran karena SPPD telah disettle.');
        }

        $validated = $request->validate([
            'category' => ['required', 'string', 'in:fuel,toll,parking,meal,lodging,repair,other'],
            'amount' => ['required', 'numeric', 'min:1'],
            'date' => ['required', 'date'],
            'receipt_number' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'receipt_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $receiptUrl = null;
        if ($request->hasFile('receipt_file')) {
            $path = $request->file('receipt_file')->store('duty-orders/receipts', 'public');
            $receiptUrl = Storage::disk('public')->url($path);
        }

        $dutyOrder->expenses()->create([
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'date' => $validated['date'],
            'receipt_number' => $validated['receipt_number'] ?? null,
            'receipt_url' => $receiptUrl,
            'description' => $validated['description'] ?? null,
        ]);

        $dutyOrder->recalculateExpenses();

        return back()->with('success', 'Bukti pengeluaran berhasil ditambahkan.');
    }

    /**
     * Delete an itemized expense receipt.
     */
    public function deleteExpense(RentalDutyOrder $dutyOrder, RentalDutyOrderExpense $expense): RedirectResponse
    {
        if ($expense->duty_order_id !== $dutyOrder->id) {
            abort(403);
        }

        if ($dutyOrder->settlement_status === RentalDutyOrder::SETTLEMENT_SETTLED) {
            return back()->with('error', 'Tidak dapat menghapus pengeluaran karena SPPD telah disettle.');
        }

        $expense->delete();
        $dutyOrder->recalculateExpenses();

        return back()->with('success', 'Pengeluaran berhasil dihapus.');
    }

    /**
     * Update driver overtime calculations.
     */
    public function updateOvertime(Request $request, RentalDutyOrder $dutyOrder): RedirectResponse
    {
        $validated = $request->validate([
            'actual_hours_worked' => ['required', 'numeric', 'min:0'],
            'standard_hours_per_day' => ['required', 'integer', 'min:1', 'max:24'],
            'driver_overtime_rate_per_hour' => ['required', 'numeric', 'min:0'],
            'customer_overtime_rate_per_hour' => ['nullable', 'numeric', 'min:0'],
            'is_overtime_billed_to_customer' => ['nullable', 'boolean'],
        ]);

        $startDate = Carbon::parse($dutyOrder->departure_date);
        $endDate = Carbon::parse($dutyOrder->return_date);
        $totalDays = max(1, $startDate->diffInDays($endDate) + 1);

        $standardTotalHours = $totalDays * $validated['standard_hours_per_day'];
        $actualHours = (float) $validated['actual_hours_worked'];
        $overtimeHours = max(0, $actualHours - $standardTotalHours);

        $driverRate = (float) $validated['driver_overtime_rate_per_hour'];
        $customerRate = (float) ($validated['customer_overtime_rate_per_hour'] ?? 0);
        $isBilled = (bool) ($validated['is_overtime_billed_to_customer'] ?? false);

        $dutyOrder->update([
            'actual_hours_worked' => $actualHours,
            'standard_hours_per_day' => $validated['standard_hours_per_day'],
            'overtime_hours' => $overtimeHours,
            'driver_overtime_rate_per_hour' => $driverRate,
            'total_driver_overtime_pay' => $overtimeHours * $driverRate,
            'customer_overtime_rate_per_hour' => $customerRate,
            'total_customer_overtime_charge' => $overtimeHours * $customerRate,
            'is_overtime_billed_to_customer' => $isBilled,
        ]);

        return back()->with('success', 'Data jam kerja & lembur supir berhasil diperbarui.');
    }

    /**
     * Settle cash advance & expenses.
     */
    public function settle(Request $request, RentalDutyOrder $dutyOrder): RedirectResponse
    {
        $validated = $request->validate([
            'settlement_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $dutyOrder->recalculateExpenses();

        $dutyOrder->update([
            'status' => RentalDutyOrder::STATUS_SETTLED,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_SETTLED,
            'settled_at' => now(),
            'settled_by' => Auth::id(),
            'settlement_notes' => $validated['settlement_notes'] ?? null,
        ]);

        return back()->with('success', 'Uang jalan dan pengeluaran berhasil diselesaikan (Settled).');
    }

    /**
     * Printable SPPD document view.
     */
    public function print(RentalDutyOrder $dutyOrder): Response
    {
        $dutyOrder->load([
            'driver:id,name,phone,license_number,license_type',
            'vehicle:id,name,plate_number,type,brand',
            'rental:id,code,status,start_date,end_date,partner_id',
            'rental.partner:id,name,phone',
            'creator:id,name',
            'cashAdvancePayer:id,name',
            'settler:id,name',
            'expenses' => fn ($q) => $q->orderBy('date', 'asc'),
        ]);

        $company = [
            'name' => Setting::getValue('general.site_name', config('app.name')),
            'address' => Setting::getValue('site.address', ''),
            'phone' => Setting::getValue('site.phone', ''),
            'email' => Setting::getValue('site.email', ''),
        ];

        return Inertia::render('Modules/Rental/DutyOrders/Print', [
            'dutyOrder' => $dutyOrder,
            'company' => $company,
        ]);
    }
}
