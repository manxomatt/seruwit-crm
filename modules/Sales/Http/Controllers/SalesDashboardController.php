<?php

namespace Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Sales\Support\SalesStatusBoard;

class SalesDashboardController extends Controller
{
    public function index(SalesStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Sales/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('sales', 'create'),
            ],
        ]);
    }
}
