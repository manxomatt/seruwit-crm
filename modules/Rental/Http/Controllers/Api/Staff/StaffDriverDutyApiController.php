<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Modules\Fleet\Models\Driver;
use Modules\Rental\Models\RentalDutyOrder;
use Modules\Rental\Models\RentalDutyOrderExpense;
use Throwable;

class StaffDriverDutyApiController extends Controller
{
    /**
     * Get list of duty orders for the authenticated driver or all drivers (if manager/admin).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $user ? Driver::forUser($user) : null;

        $query = RentalDutyOrder::query()
            ->with([
                'driver:id,name,phone,license_number,status',
                'vehicle:id,name,plate_number,type,color',
                'rental:id,code,status,start_date,end_date',
            ]);

        // If the logged-in user is a driver, scope to their own orders only
        if ($driver) {
            $query->where('driver_id', $driver->id);
        } elseif ($request->filled('driver_id')) {
            $query->where('driver_id', (int) $request->input('driver_id'));
        }

        // Filter status
        $status = (string) $request->input('status', 'all');
        if ($status === 'active') {
            $query->whereIn('status', [RentalDutyOrder::STATUS_DRAFT, RentalDutyOrder::STATUS_DISPATCHED]);
        } elseif ($status !== 'all' && $status !== '') {
            // Map mobile status aliases if any (e.g. on_duty -> dispatched)
            $dbStatus = $status === 'on_duty' ? RentalDutyOrder::STATUS_DISPATCHED : $status;
            $query->where('status', $dbStatus);
        }

        // Filter date
        if ($request->filled('date')) {
            $date = (string) $request->input('date');
            $query->where(function ($q) use ($date) {
                $q->whereDate('departure_date', '<=', $date)
                    ->whereDate('return_date', '>=', $date);
            });
        }

        $duties = $query->latest('id')
            ->get()
            ->map(fn (RentalDutyOrder $order): array => $this->transformDutyOrderSummary($order));

        return response()->json([
            'success' => true,
            'data' => $duties,
            'meta' => [
                'count' => $duties->count(),
                'is_driver_account' => $driver !== null,
                'driver_id' => $driver?->id,
            ],
        ]);
    }

    /**
     * Get detail of a specific duty order along with its itemized expenses.
     */
    public function show(Request $request, RentalDutyOrder $dutyOrder): JsonResponse
    {
        $this->authorizeDutyAccess($request, $dutyOrder);

        $dutyOrder->load([
            'driver:id,name,phone,license_number,license_type,status',
            'vehicle:id,name,plate_number,type,color,brand',
            'rental:id,code,status,start_date,end_date,partner_id',
            'rental.partner:id,name,phone',
            'expenses' => fn ($q) => $q->orderBy('date', 'desc')->orderBy('id', 'desc'),
        ]);

        $dutyOrder->recalculateExpenses();

        return response()->json([
            'success' => true,
            'data' => [
                'duty_id' => $dutyOrder->id,
                'duty_order_number' => $dutyOrder->duty_order_number,
                'rental_id' => $dutyOrder->rental_id,
                'status' => $dutyOrder->status,
                'status_label' => $this->getStatusLabel($dutyOrder->status),
                'origin' => $dutyOrder->origin,
                'destination' => $dutyOrder->destination,
                'departure_date' => $dutyOrder->departure_date?->toDateString(),
                'departure_time' => $dutyOrder->departure_time,
                'return_date' => $dutyOrder->return_date?->toDateString(),
                'return_time' => $dutyOrder->return_time,
                'actual_departure_at' => $dutyOrder->actual_departure_at?->toIso8601String(),
                'actual_return_at' => $dutyOrder->actual_return_at?->toIso8601String(),
                'passenger' => [
                    'name' => $dutyOrder->passenger_name ?? $dutyOrder->rental?->partner?->name ?? '-',
                    'phone' => $dutyOrder->passenger_phone ?? $dutyOrder->rental?->partner?->phone ?? '-',
                ],
                'driver' => [
                    'id' => $dutyOrder->driver?->id,
                    'name' => $dutyOrder->driver?->name ?? '-',
                    'phone' => $dutyOrder->driver?->phone ?? '-',
                ],
                'vehicle' => [
                    'id' => $dutyOrder->vehicle?->id,
                    'name' => $dutyOrder->vehicle?->name ?? '-',
                    'license_plate' => $dutyOrder->vehicle?->plate_number ?? '-',
                    'color' => $dutyOrder->vehicle?->color ?? '-',
                ],
                'financials' => [
                    'cash_advance_amount' => (float) $dutyOrder->cash_advance_amount,
                    'actual_expense_total' => (float) $dutyOrder->actual_expense_total,
                    'net_balance' => (float) $dutyOrder->net_balance,
                    'settlement_status' => $dutyOrder->settlement_status,
                ],
                'notes' => $dutyOrder->notes,
                'expenses' => $dutyOrder->expenses->map(fn (RentalDutyOrderExpense $e): array => [
                    'id' => $e->id,
                    'category' => $e->category,
                    'category_label' => $e->category_label,
                    'amount' => (float) $e->amount,
                    'date' => $e->date?->toDateString(),
                    'receipt_number' => $e->receipt_number,
                    'receipt_url' => $e->receipt_url,
                    'description' => $e->description,
                ]),
            ],
        ]);
    }

    /**
     * Update operational status of a duty order (e.g. dispatched/on_duty, completed).
     */
    public function updateStatus(Request $request, RentalDutyOrder $dutyOrder): JsonResponse
    {
        $this->authorizeDutyAccess($request, $dutyOrder);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:draft,dispatched,on_duty,completed,cancelled'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newStatus = $validated['status'];
        if ($newStatus === 'on_duty') {
            $newStatus = RentalDutyOrder::STATUS_DISPATCHED;
        }

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

        return response()->json([
            'success' => true,
            'message' => 'Status surat jalan berhasil diperbarui.',
            'data' => [
                'duty_id' => $dutyOrder->id,
                'status' => $dutyOrder->status,
                'status_label' => $this->getStatusLabel($dutyOrder->status),
                'actual_departure_at' => $dutyOrder->actual_departure_at?->toIso8601String(),
                'actual_return_at' => $dutyOrder->actual_return_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Record an itemized cash expense (fuel, toll, parking, etc.) for a duty order.
     */
    public function addExpense(Request $request, RentalDutyOrder $dutyOrder): JsonResponse
    {
        $this->authorizeDutyAccess($request, $dutyOrder);

        if ($dutyOrder->settlement_status === RentalDutyOrder::SETTLEMENT_SETTLED) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DUTY_ORDER_ALREADY_SETTLED',
                    'message' => 'Tidak dapat menambah pengeluaran karena surat jalan telah disettle oleh finance.',
                ],
            ], 422);
        }

        $validated = $request->validate([
            'category' => ['required', 'string', 'in:fuel,toll,parking,meal,lodging,repair,other'],
            'amount' => ['required', 'numeric', 'min:1'],
            'date' => ['nullable', 'date'],
            'receipt_number' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'receipt_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'receipt_photo' => ['nullable'], // can be dataUrl or file
        ]);

        $receiptUrl = null;
        if ($request->hasFile('receipt_file')) {
            $path = $request->file('receipt_file')->store('duty-orders/receipts', 'public');
            $receiptUrl = Storage::disk('public')->url($path);
        } elseif ($request->hasFile('receipt_photo')) {
            $path = $request->file('receipt_photo')->store('duty-orders/receipts', 'public');
            $receiptUrl = Storage::disk('public')->url($path);
        } elseif ($request->filled('receipt_photo') && is_string($request->input('receipt_photo')) && str_starts_with($request->input('receipt_photo'), 'data:image/')) {
            try {
                $dataUrl = $request->input('receipt_photo');
                $parts = explode(',', $dataUrl, 2);
                if (count($parts) === 2) {
                    $binary = base64_decode($parts[1]);
                    $filename = 'duty-orders/receipts/'.uniqid('rcpt_', true).'.jpg';
                    Storage::disk('public')->put($filename, $binary);
                    $receiptUrl = Storage::disk('public')->url($filename);
                }
            } catch (Throwable) {
                // Ignore base64 parse failure, keep receiptUrl null
            }
        }

        $expense = $dutyOrder->expenses()->create([
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'date' => $validated['date'] ?? Carbon::today()->toDateString(),
            'receipt_number' => $validated['receipt_number'] ?? null,
            'receipt_url' => $receiptUrl,
            'description' => $validated['description'] ?? null,
        ]);

        $dutyOrder->recalculateExpenses();
        $dutyOrder->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Bukti pengeluaran berhasil dicatat.',
            'data' => [
                'expense_id' => $expense->id,
                'category' => $expense->category,
                'category_label' => $expense->category_label,
                'amount' => (float) $expense->amount,
                'date' => $expense->date?->toDateString(),
                'receipt_url' => $expense->receipt_url,
                'description' => $expense->description,
                'summary' => [
                    'cash_advance_amount' => (float) $dutyOrder->cash_advance_amount,
                    'actual_expense_total' => (float) $dutyOrder->actual_expense_total,
                    'net_balance' => (float) $dutyOrder->net_balance,
                ],
            ],
        ], 201);
    }

    /**
     * Delete an itemized cash expense.
     */
    public function deleteExpense(Request $request, RentalDutyOrder $dutyOrder, RentalDutyOrderExpense $expense): JsonResponse
    {
        $this->authorizeDutyAccess($request, $dutyOrder);

        if ($expense->duty_order_id !== $dutyOrder->id) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Data pengeluaran tidak ditemukan pada surat jalan ini.',
                ],
            ], 404);
        }

        if ($dutyOrder->settlement_status === RentalDutyOrder::SETTLEMENT_SETTLED) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DUTY_ORDER_ALREADY_SETTLED',
                    'message' => 'Tidak dapat menghapus pengeluaran karena surat jalan telah disettle.',
                ],
            ], 422);
        }

        $expense->delete();
        $dutyOrder->recalculateExpenses();
        $dutyOrder->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Pengeluaran berhasil dihapus.',
            'data' => [
                'cash_advance_amount' => (float) $dutyOrder->cash_advance_amount,
                'actual_expense_total' => (float) $dutyOrder->actual_expense_total,
                'net_balance' => (float) $dutyOrder->net_balance,
            ],
        ]);
    }

    /**
     * Authorize that the authenticated user can access/modify this duty order.
     */
    private function authorizeDutyAccess(Request $request, RentalDutyOrder $dutyOrder): void
    {
        $user = $request->user();
        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $driver = Driver::forUser($user);
        // If user is a driver and does not own this duty order, deny access
        if ($driver && $dutyOrder->driver_id !== $driver->id) {
            abort(403, 'Anda tidak memiliki hak akses terhadap surat jalan ini.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function transformDutyOrderSummary(RentalDutyOrder $order): array
    {
        return [
            'duty_id' => $order->id,
            'duty_order_number' => $order->duty_order_number,
            'rental_id' => $order->rental_id,
            'status' => $order->status,
            'status_label' => $this->getStatusLabel($order->status),
            'departure_date' => $order->departure_date?->toDateString(),
            'departure_time' => $order->departure_time,
            'return_date' => $order->return_date?->toDateString(),
            'return_time' => $order->return_time,
            'origin' => $order->origin,
            'destination' => $order->destination,
            'passenger' => [
                'name' => $order->passenger_name ?? '-',
                'phone' => $order->passenger_phone ?? '-',
            ],
            'vehicle' => [
                'id' => $order->vehicle?->id,
                'name' => $order->vehicle?->name ?? '-',
                'license_plate' => $order->vehicle?->plate_number ?? '-',
                'color' => $order->vehicle?->color ?? '-',
            ],
            'financials' => [
                'cash_advance_amount' => (float) $order->cash_advance_amount,
                'actual_expense_total' => (float) $order->actual_expense_total,
                'net_balance' => (float) $order->net_balance,
                'settlement_status' => $order->settlement_status,
            ],
        ];
    }

    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            RentalDutyOrder::STATUS_DRAFT => 'Draft / Menunggu',
            RentalDutyOrder::STATUS_DISPATCHED => 'Sedang Bertugas (On Duty)',
            RentalDutyOrder::STATUS_COMPLETED => 'Selesai Tugas',
            RentalDutyOrder::STATUS_CANCELLED => 'Dibatalkan',
            RentalDutyOrder::STATUS_SETTLED => 'Diselesaikan (Settled)',
            default => $status,
        };
    }
}
