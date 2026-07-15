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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
     * Update a tenant's name, subdomain, and status.
     */
    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $currentDomain = $tenant->domains()->first();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subdomain' => ['required', 'string', 'lowercase', new ValidSubdomain($currentDomain?->domain)],
            'status' => 'required|in:active,suspended',
            'plan' => ['required', 'string', Rule::in(array_keys(config('modules.plans')))],
            'billing_email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:2000',
        ]);

        // billing_email/phone/address/tax_id/notes/plan are stored in the tenant's
        // data JSON column (virtual columns), no migration required.
        //
        // Changing the plan is never destructive: a downgrade only revokes access,
        // leaving installed modules and their data in place, so an upgrade brings
        // them straight back.
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

    /**
     * Install a module into a tenant on their behalf.
     *
     * The same installer the tenant's own admin drives, including the plan check —
     * a super admin who wants to hand over a module moves the tenant's plan rather
     * than working around it, so entitlement stays the single source of truth.
     */
    public function installModule(Tenant $tenant, string $module, ModuleInstaller $installer): RedirectResponse
    {
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

    public function uninstallModule(Tenant $tenant, string $module, ModuleInstaller $installer): RedirectResponse
    {
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
}
