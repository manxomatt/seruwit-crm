<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ResolvePostAuthDestination;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(
        private readonly ResolvePostAuthDestination $postAuthDestination,
    ) {}

    /**
     * Display the registration view.
     *
     * Registration is a central-only flow: it creates a platform identity.
     * Workspace (tenant) provisioning happens after email verification + onboarding.
     * Users join existing workspaces through invitations instead.
     */
    public function create(): Response
    {
        abort_if(tenancy()->initialized, 404);

        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return Inertia::render('Auth/Register', [
            'settings' => $settings,
        ]);
    }

    /**
     * Register a platform account (no tenant yet), then require email verification.
     */
    public function store(Request $request): RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->to($this->postAuthDestination->url($user));
    }
}
