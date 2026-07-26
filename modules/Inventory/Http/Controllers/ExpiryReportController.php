<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;

class ExpiryReportController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $days = max(1, min(365, $request->integer('days', 30)));
        $warehouseId = $request->integer('warehouse_id') ?: null;
        $horizon = now()->addDays($days)->toDateString();
        $today = now()->toDateString();

        $levels = StockLevel::query()
            ->with([
                'product:id,name,code,unit',
                'warehouse:id,name',
                'location:id,name,code,type',
            ])
            ->where('on_hand', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', $horizon)
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->orderBy('expiry_date')
            ->orderBy('product_id')
            ->get()
            ->map(function (StockLevel $level) use ($today) {
                $expiry = $level->expiry_date?->toDateString();
                $expired = $expiry !== null && $expiry < $today;

                return [
                    'id' => $level->id,
                    'product' => $level->product,
                    'warehouse' => $level->warehouse,
                    'location' => $level->location,
                    'batch_number' => $level->batch_number !== '' ? $level->batch_number : null,
                    'expiry_date' => $expiry,
                    'on_hand' => $level->on_hand,
                    'reserved' => $level->reserved,
                    'available' => round((float) $level->on_hand - (float) $level->reserved, 2),
                    'status' => $expired ? 'expired' : 'near_expiry',
                    'days_left' => $expiry
                        ? (int) now()->startOfDay()->diffInDays($level->expiry_date->copy()->startOfDay(), false)
                        : null,
                ];
            });

        return inertia('Modules/Inventory/ExpiryReport/Index', [
            'levels' => $levels,
            'warehouses' => Warehouse::query()
                ->where('status', 'active')
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'warehouse_id' => $warehouseId,
                'days' => $days,
            ],
        ]);
    }
}
