<?php

namespace Modules\Payables\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Payables\Support\PayablesStatusBoard;

class PayablesDashboardController extends Controller
{
    public function index(PayablesStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Payables/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('payables', 'create'),
            ],
        ]);
    }
}
