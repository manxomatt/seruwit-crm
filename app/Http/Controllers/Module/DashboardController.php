<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the module dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $primaryRole = $user->getPrimaryRole();

        return Inertia::render('Module/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
            'primaryRole' => $primaryRole ? [
                'name' => $primaryRole->name,
                'slug' => $primaryRole->slug,
            ] : null,
        ]);
    }
}
