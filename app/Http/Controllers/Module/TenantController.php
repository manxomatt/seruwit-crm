<?php

namespace App\Http\Controllers\Module;

use App\Actions\Tenancy\CreateTenantAction;
use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use App\Models\Tenant;
use App\Models\User;
use App\Rules\ValidSubdomain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function __construct(private readonly CreateTenantAction $createTenant) {}

    /**
     * List all tenants for the platform super admin.
     */
    public function index(): Response
    {
        $tenants = Tenant::query()
            ->with('domains')
            ->withCount('users')
            ->latest()
            ->get()
            ->map(fn (Tenant $tenant): array => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'status' => $tenant->status,
                'domain' => $tenant->domains->first()?->domain,
                'members' => $tenant->users_count,
                'created_at' => $tenant->created_at?->toDateString(),
            ]);

        return Inertia::render('Module/Tenants/Index', [
            'tenants' => $tenants,
        ]);
    }

    /**
     * Create a tenant on behalf of a customer (closed/B2B onboarding).
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'subdomain' => ['required', 'string', 'lowercase', new ValidSubdomain],
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|string|lowercase|email|max:255',
            'owner_password' => ['nullable', Rules\Password::defaults()],
        ]);

        $owner = CentralUser::query()->firstWhere('email', $request->string('owner_email')->value());

        if ($owner === null) {
            User::create([
                'name' => $request->owner_name,
                'email' => $request->owner_email,
                'password' => Hash::make($request->string('owner_password')->value() ?: str()->random(32)),
            ]);

            $owner = CentralUser::query()->firstWhere('email', $request->string('owner_email')->value());
        }

        $this->createTenant->execute(
            companyName: $request->string('company_name')->value(),
            subdomain: $request->string('subdomain')->value(),
            owner: $owner,
        );

        return back()->with('success', 'Tenant berhasil dibuat.');
    }

    /**
     * Show a single tenant with its members.
     */
    public function show(Tenant $tenant): Response
    {
        $tenant->loadCount('users');
        $domain = $tenant->domains()->first()?->domain;

        $members = $tenant->run(fn (): array => User::query()
            ->with('roles')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->all(),
            ])
            ->all());

        return Inertia::render('Module/Tenants/Show', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'status' => $tenant->status,
                'domain' => $domain,
                'subdomain' => $domain ? explode('.', $domain)[0] : null,
                'members' => $tenant->users_count,
                'created_at' => $tenant->created_at?->toDateString(),
            ],
            'members' => $members,
        ]);
    }

    /**
     * Update a tenant's name, subdomain, and status.
     */
    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $currentDomain = $tenant->domains()->first();

        $request->validate([
            'name' => 'required|string|max:255',
            'subdomain' => ['required', 'string', 'lowercase', new ValidSubdomain($currentDomain?->domain)],
            'status' => 'required|in:active,suspended',
        ]);

        $tenant->update([
            'name' => $request->string('name')->value(),
            'status' => $request->string('status')->value(),
        ]);

        $newDomain = CreateTenantAction::fullDomain($request->string('subdomain')->value());

        if ($currentDomain !== null && $currentDomain->domain !== $newDomain) {
            $currentDomain->update(['domain' => $newDomain]);
        }

        return back()->with('success', 'Detail tenant diperbarui.');
    }

    /**
     * Toggle a tenant between active and suspended.
     */
    public function toggleStatus(Tenant $tenant): RedirectResponse
    {
        $tenant->update([
            'status' => $tenant->status === 'active' ? 'suspended' : 'active',
        ]);

        return back()->with('success', 'Status tenant diperbarui.');
    }

    /**
     * Permanently delete a tenant: drops its schema and all data.
     *
     * Guarded by a typed confirmation of the tenant name so the destructive
     * action cannot fire on a stray click.
     */
    public function destroy(Request $request, Tenant $tenant): RedirectResponse
    {
        $request->validate([
            'confirm_name' => 'required|string',
        ]);

        if ($request->string('confirm_name')->value() !== $tenant->name) {
            return back()->withErrors([
                'confirm_name' => 'Nama konfirmasi tidak cocok dengan nama tenant.',
            ]);
        }

        $tenant->delete();

        return redirect()
            ->route('module.tenants.index')
            ->with('success', 'Tenant beserta seluruh datanya telah dihapus.');
    }
}
