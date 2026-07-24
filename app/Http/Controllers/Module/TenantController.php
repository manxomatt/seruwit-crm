<?php

namespace App\Http\Controllers\Module;

use App\Actions\Tenancy\CreateTenantAction;
use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\Facades\Modules;
use App\Modules\ModuleCatalog;
use App\Modules\ModuleInstaller;
use App\Rules\ValidSubdomain;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class TenantController extends Controller
{
    public function __construct(
        private readonly CreateTenantAction $createTenant,
        private readonly ModuleCatalog $catalog,
    ) {}

    /**
     * List tenants. Super admins see all; resellers see only their own.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manage-tenants');

        $tenants = $this->scopedQuery($request)
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
     * Create a tenant; resellers automatically become its owner.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage-tenants');

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

        $user = $request->user();
        $resellerGlobalId = ($user && ! $user->isAdmin() && $user->hasRole('reseller'))
            ? $user->global_id
            : null;

        $this->createTenant->execute(
            companyName: $request->string('company_name')->value(),
            subdomain: $request->string('subdomain')->value(),
            owner: $owner,
            resellerGlobalId: $resellerGlobalId,
        );

        return back()->with('success', 'Tenant berhasil dibuat.');
    }

    /**
     * Show a single tenant. Resellers may only view their own.
     */
    public function show(Request $request, Tenant $tenant): Response
    {
        $this->authorizeOwnership($request, $tenant);

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
                'billing_email' => $tenant->billing_email,
                'phone' => $tenant->phone,
                'address' => $tenant->address,
                'tax_id' => $tenant->tax_id,
                'notes' => $tenant->notes,
                'plan' => $tenant->planKey(),
            ],
            'members' => $members,
            'modules' => $this->catalog->forTenant($tenant),
            'plans' => $this->catalog->allPlans(),
            'graceDays' => config('modules.purge_after_days'),
        ]);
    }

    /**
     * Update a tenant's details. Resellers may only edit their own.
     */
    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $this->authorizeOwnership($request, $tenant);

        $currentDomain = $tenant->domains()->first();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subdomain' => ['required', 'string', 'lowercase', new ValidSubdomain($currentDomain?->domain)],
            'status' => 'required|in:active,suspended',
            'plan' => ['required', 'string', Rule::exists('plans', 'key')],
            'billing_email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:2000',
        ]);

        $tenant->update([
            'name' => $validated['name'],
            'status' => $validated['status'],
            'plan' => $validated['plan'],
            'billing_email' => $validated['billing_email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'tax_id' => $validated['tax_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $newDomain = CreateTenantAction::fullDomain($request->string('subdomain')->value());

        if ($currentDomain !== null && $currentDomain->domain !== $newDomain) {
            $currentDomain->update(['domain' => $newDomain]);
        }

        return back()->with('success', 'Detail tenant diperbarui.');
    }

    /**
     * Toggle a tenant between active and suspended. Resellers may only toggle their own.
     */
    public function toggleStatus(Request $request, Tenant $tenant): RedirectResponse
    {
        $this->authorizeOwnership($request, $tenant);

        $tenant->update([
            'status' => $tenant->status === 'active' ? 'suspended' : 'active',
        ]);

        return back()->with('success', 'Status tenant diperbarui.');
    }

    /**
     * Permanently delete a tenant. Resellers may only delete their own.
     */
    public function destroy(Request $request, Tenant $tenant): RedirectResponse
    {
        $this->authorizeOwnership($request, $tenant);

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

    /**
     * Install a module into a tenant. Resellers may only act on their own tenants.
     */
    public function installModule(Request $request, Tenant $tenant, string $module, ModuleInstaller $installer): RedirectResponse
    {
        $this->authorizeOwnership($request, $tenant);

        $registered = Modules::find($module);

        if (! $registered) {
            abort(404);
        }

        try {
            $installer->install($tenant, $registered);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Modul {$registered->label()} dipasang untuk {$tenant->name}.");
    }

    public function uninstallModule(Request $request, Tenant $tenant, string $module, ModuleInstaller $installer): RedirectResponse
    {
        $this->authorizeOwnership($request, $tenant);

        $registered = Modules::find($module);

        if (! $registered) {
            abort(404);
        }

        try {
            $installer->uninstall($tenant, $registered);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $days = config('modules.purge_after_days');

        return back()->with(
            'success',
            "Modul {$registered->label()} dicopot dari {$tenant->name}. Datanya disimpan {$days} hari.",
        );
    }

    /**
     * Returns a query scoped to only the tenants this user may manage.
     * Super admins see all tenants; resellers only see their own.
     *
     * @return Builder<Tenant>
     */
    private function scopedQuery(Request $request): Builder
    {
        $user = $request->user();
        $query = Tenant::query();

        if ($user && ! $user->isAdmin() && $user->hasRole('reseller')) {
            $query->where('reseller_global_id', $user->global_id);
        }

        return $query;
    }

    /**
     * Abort with 403 if a reseller tries to act on a tenant they don't own.
     * Super admins bypass this check entirely.
     */
    private function authorizeOwnership(Request $request, Tenant $tenant): void
    {
        Gate::authorize('manage-tenants');

        $user = $request->user();

        if ($user && ! $user->isAdmin() && $user->hasRole('reseller')) {
            abort_unless($tenant->reseller_global_id === $user->global_id, 403);
        }
    }
}
