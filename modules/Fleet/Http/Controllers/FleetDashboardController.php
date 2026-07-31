<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Support\FleetStatusBoard;

class FleetDashboardController extends Controller
{
    public function index(Request $request, FleetStatusBoard $board): Response
    {
        return Inertia::render('Modules/Fleet/Dashboard/Index', [
            'board' => $board->build($request),
        ]);
    }
}
