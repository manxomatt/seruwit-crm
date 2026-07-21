<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Inventory\Models\StockMovement;

class StockMovementController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index()
    {
        return inertia('Modules/Inventory/StockMovements/Index', [
            'movements' => StockMovement::query()
                ->with(['product:id,name', 'warehouse:id,name', 'recordedBy:id,name'])
                ->select('id', 'product_id', 'warehouse_id', 'type', 'quantity', 'source_type', 'reference_code', 'notes', 'recorded_by', 'recorded_at')
                ->latest('recorded_at')
                ->paginate(50),
        ]);
    }
}
