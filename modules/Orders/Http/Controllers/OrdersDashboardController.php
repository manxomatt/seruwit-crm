<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Support\OrdersStatusBoard;

class OrdersDashboardController extends Controller
{
    public function index(OrdersStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Orders/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('orders', 'create'),
            ],
        ]);
    }
}
