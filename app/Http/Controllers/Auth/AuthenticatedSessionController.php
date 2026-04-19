<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\LoginAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function __construct(private readonly LoginAction $loginAction) {}

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'settings' => $settings,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     *
     * Executes the dual authentication flow:
     * Local DB → on failure → External API → sync user → Laravel session.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->ensureIsNotRateLimited();

        $this->loginAction->execute(
            login: $request->string('login')->value(),
            password: $request->string('password')->value(),
            throttleKey: $request->throttleKey(),
            remember: $request->boolean('remember'),
        );

        $request->session()->regenerate();

        $dashboardPath = $request->user()->getDashboardPath();

        return redirect()->intended($dashboardPath);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return Inertia::location('/');
    }
}
