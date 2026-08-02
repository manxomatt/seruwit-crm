<?php

namespace Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Support\BillingStatusBoard;

class BillingDashboardController extends Controller
{
    public function index(BillingStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Billing/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('billing', 'create'),
                'update' => $user->hasPermissionFor('billing', 'update'),
            ],
        ]);
    }
}
