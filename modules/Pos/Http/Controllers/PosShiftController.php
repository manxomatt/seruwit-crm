<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Inventory\Support\WarehouseKind;
use Modules\Pos\Http\Requests\ClosePosShiftRequest;
use Modules\Pos\Http\Requests\OpenPosShiftRequest;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosShift;
use Modules\Pos\Support\PosSaleService;
use RuntimeException;

class PosShiftController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $accessibleIds = AccessibleWarehouses::ids();

        $shifts = PosShift::query()
            ->with(['warehouse:id,name', 'opener:id,name', 'closer:id,name'])
            ->withCount([
                'sales as completed_sales_count' => fn ($q) => $q->where('status', PosSale::STATUS_COMPLETED),
            ])
            ->when($accessibleIds !== null, fn ($q) => $q->whereIn('warehouse_id', $accessibleIds ?: [0]))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('warehouse_id'), fn ($q) => $q->where('warehouse_id', $request->integer('warehouse_id')))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $stores = AccessibleWarehouses::query()
            ->ofKind(WarehouseKind::Store)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        $openShift = PosShift::query()
            ->where('status', PosShift::STATUS_OPEN)
            ->when($accessibleIds !== null, fn ($q) => $q->whereIn('warehouse_id', $accessibleIds ?: [0]))
            ->latest('opened_at')
            ->first();

        return Inertia::render('Modules/Pos/Shifts/Index', [
            'shifts' => $shifts,
            'stores' => $stores,
            'openShift' => $openShift?->load('warehouse:id,name'),
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
                'warehouse_id' => $request->integer('warehouse_id') ?: null,
            ],
            'promptOpen' => $request->boolean('open'),
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function store(OpenPosShiftRequest $request): RedirectResponse
    {
        $warehouseId = $request->integer('warehouse_id');

        $existing = PosShift::query()
            ->where('warehouse_id', $warehouseId)
            ->where('status', PosShift::STATUS_OPEN)
            ->exists();

        if ($existing) {
            return back()->withErrors([
                'warehouse_id' => __('pos.messages.shift_already_open'),
            ]);
        }

        $shift = PosShift::query()->create([
            'warehouse_id' => $warehouseId,
            'opened_by' => Auth::id(),
            'status' => PosShift::STATUS_OPEN,
            'opening_float' => $request->input('opening_float'),
            'opened_at' => now(),
            'notes' => $request->input('notes'),
        ]);

        return redirect()
            ->route($this->getRoutePrefix().'.pos.terminal')
            ->with('success', __('pos.messages.shift_opened', ['id' => $shift->id]));
    }

    public function show(PosShift $shift): Response
    {
        if (! AccessibleWarehouses::allows(Auth::user(), (int) $shift->warehouse_id)) {
            abort(403);
        }

        $shift->load([
            'warehouse:id,name',
            'opener:id,name',
            'closer:id,name',
            'sales' => fn ($q) => $q->with(['cashier:id,name', 'payments'])->latest('id')->limit(50),
        ]);

        $service = app(PosSaleService::class);
        $expectedCash = $shift->isOpen()
            ? $service->expectedCashForShift($shift)
            : (float) ($shift->expected_cash ?? 0);

        return Inertia::render('Modules/Pos/Shifts/Show', [
            'shift' => $shift,
            'expectedCash' => $expectedCash,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function close(ClosePosShiftRequest $request, PosShift $shift, PosSaleService $service): RedirectResponse
    {
        if (! AccessibleWarehouses::allows(Auth::user(), (int) $shift->warehouse_id)) {
            abort(403);
        }

        if (! $shift->isOpen()) {
            return back()->withErrors(['shift' => __('pos.messages.shift_already_closed')]);
        }

        try {
            $expected = $service->expectedCashForShift($shift);
            $counted = round((float) $request->input('closing_cash_counted'), 2);

            $shift->update([
                'status' => PosShift::STATUS_CLOSED,
                'closed_by' => Auth::id(),
                'closed_at' => now(),
                'closing_cash_counted' => $counted,
                'expected_cash' => $expected,
                'cash_variance' => round($counted - $expected, 2),
                'notes' => $request->filled('notes')
                    ? trim(($shift->notes ? $shift->notes."\n" : '').$request->string('notes'))
                    : $shift->notes,
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['shift' => $e->getMessage()]);
        }

        return redirect()
            ->route($this->getRoutePrefix().'.pos.shifts.show', $shift)
            ->with('success', __('pos.messages.shift_closed_ok'));
    }

    /**
     * @return array<string, bool>
     */
    protected function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'open_shift' => $user?->hasPermissionFor('pos', 'open_shift') ?? false,
            'close_shift' => $user?->hasPermissionFor('pos', 'close_shift') ?? false,
            'sell' => $user?->hasPermissionFor('pos', 'sell') ?? false,
        ];
    }
}
