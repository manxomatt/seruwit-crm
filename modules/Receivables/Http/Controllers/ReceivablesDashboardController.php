<?php

namespace Modules\Receivables\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Receivables\Support\ReceivablesStatusBoard;

class ReceivablesDashboardController extends Controller
{
    public function index(ReceivablesStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Receivables/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('receivables', 'create'),
            ],
        ]);
    }
}
