<?php

namespace Modules\Invoicing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Invoicing\Support\InvoicingStatusBoard;

class InvoicingDashboardController extends Controller
{
    public function index(InvoicingStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Invoicing/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('invoicing', 'create'),
            ],
        ]);
    }
}
