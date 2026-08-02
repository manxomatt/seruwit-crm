<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\TransportationManagement\Support\TransportationStatusBoard;

class TransportationDashboardController extends Controller
{
    public function index(TransportationStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/TransportationManagement/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('transportation', 'create'),
            ],
        ]);
    }
}
