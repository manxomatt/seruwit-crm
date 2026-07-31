<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * P0 placeholder: verified users land here before workspace provisioning (P1).
 */
class OnboardingController extends Controller
{
    public function show(Request $request): Response
    {
        abort_if(tenancy()->initialized, 404);

        return Inertia::render('Central/Onboarding', [
            'user' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
        ]);
    }
}
