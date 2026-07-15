<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Tenancy\CreateTenantAction;
use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use App\Models\User;
use App\Rules\ValidSubdomain;
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
    public function __construct(private readonly CreateTenantAction $createTenant) {}

    /**
     * Display the registration view.
     *
     * Registration is a central-only flow: it signs up a company (tenant).
     * Users join existing workspaces through invitations instead.
     */
    public function create(): Response
    {
        abort_if(tenancy()->initialized, 404);

        return Inertia::render('Auth/Register');
    }

    /**
     * Register a new company: central account + tenant + workspace admin,
     * then send the user straight into their new workspace via SSO.
     */
    public function store(Request $request): RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'company_name' => 'required|string|max:255',
            'subdomain' => ['required', 'string', 'lowercase', new ValidSubdomain],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        $tenant = $this->createTenant->execute(
            companyName: $request->string('company_name')->value(),
            subdomain: $request->string('subdomain')->value(),
            owner: CentralUser::query()->firstWhere('global_id', $user->global_id),
        );

        Auth::login($user);

        return redirect()->route('central.workspaces.enter', $tenant);
    }
}
