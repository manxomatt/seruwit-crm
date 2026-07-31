<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ResolvePostAuthDestination;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    public function __construct(
        private readonly ResolvePostAuthDestination $postAuthDestination,
    ) {}

    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended($this->postAuthDestination->url($request->user()))
                    : Inertia::render('Auth/VerifyEmail', ['status' => session('status')]);
    }
}
