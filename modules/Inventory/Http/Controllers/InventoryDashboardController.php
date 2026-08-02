<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Support\InventoryStatusBoard;

class InventoryDashboardController extends Controller
{
    public function index(InventoryStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Inventory/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('inventory', 'create'),
                'adjust' => $user->hasPermissionFor('inventory', 'adjust'),
            ],
        ]);
    }
}
