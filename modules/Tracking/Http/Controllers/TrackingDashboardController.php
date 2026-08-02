<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Tracking\Support\TrackingStatusBoard;

class TrackingDashboardController extends Controller
{
    public function index(TrackingStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Tracking/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'update' => $user->hasPermissionFor('tracking', 'update'),
                'create' => $user->hasPermissionFor('tracking', 'create'),
            ],
        ]);
    }
}
