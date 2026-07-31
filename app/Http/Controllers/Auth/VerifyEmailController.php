<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ResolvePostAuthDestination;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    public function __construct(
        private readonly ResolvePostAuthDestination $postAuthDestination,
    ) {}

    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if (! $request->user()->hasVerifiedEmail()) {
            if ($request->user()->markEmailAsVerified()) {
                event(new Verified($request->user()));
            }
        }

        $destination = $this->postAuthDestination->url($request->user()->fresh());

        return redirect()->intended($destination.'?verified=1');
    }
}
