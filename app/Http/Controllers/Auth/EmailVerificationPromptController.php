<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ResolvePostAuthDestination;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\EmailVerificationUrl;
use App\Support\SystemMode;
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
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($this->postAuthDestination->url($request->user()));
        }

        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
            'settings' => $settings,
            'verificationUrl' => SystemMode::isDevelopment()
                ? (session('dev_verification_url') ?: EmailVerificationUrl::for($request->user()))
                : null,
        ]);
    }
}
