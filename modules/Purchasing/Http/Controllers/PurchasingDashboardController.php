<?php

namespace Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Purchasing\Support\PurchasingStatusBoard;

class PurchasingDashboardController extends Controller
{
    public function index(PurchasingStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Purchasing/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('purchasing', 'create'),
            ],
        ]);
    }
}
