<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Support\PartnerStatusBoard;

class PartnerDashboardController extends Controller
{
    public function index(PartnerStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Partners/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('partners', 'create'),
            ],
        ]);
    }
}
