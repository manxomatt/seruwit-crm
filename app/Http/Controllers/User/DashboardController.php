<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the user dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('User/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
        ]);
    }
}
