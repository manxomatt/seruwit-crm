<?php

namespace App\Http\Controllers\Module;

use App\Actions\Tenancy\CreateTenantAction;
use App\Http\Controllers\Controller;
use App\Jobs\Tenancy\FinalizeTenantSetupJob;
use App\Models\CentralUser;
use App\Models\Tenant;
use App\Models\TenantActivityLog;
use App\Models\User;
use App\Modules\Facades\Modules;
use App\Modules\ModuleCatalog;
use App\Modules\ModuleInstaller;
use App\Rules\ValidSubdomain;
use App\Services\TenantActivityLogger;
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

        $search = $request->string('search')->trim()->value();
        $status = $request->input('status');

        $query = $this->scopedQuery($request)
            ->with(['domains', 'subscription.plan:id,name'])
            ->withCount('users')
            ->latest();

        if ($search !== '') {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhereHas('domains', fn (Builder $d) => $d->where('domain', 'ilike', "%{$search}%"));
            });
        }

        if (in_array($status, ['active', 'suspended'], true)) {
            $query->where('status', $status);
        }

        $paginated = $query->paginate(10)->withQueryString();

        $tenants = $paginated->through(fn (Tenant $tenant): array => [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'status' => $tenant->status,
            'domain' => $tenant->domains->first()?->domain,
            'members' => $tenant->users_count,
            'created_at' => $tenant->created_at?->toDateString(),
            'subscription_plan' => $tenant->subscription?->plan?->name ?? $tenant->planModel()?->name,
            'subscription_status' => $tenant->subscription?->status,
        ]);

        return Inertia::render('Module/Tenants/Index', [
            'tenants' => $tenants,
            'filters' => [
                'search' => $search ?: null,
                'status' => in_array($status, ['active', 'suspended'], true) ? $status : null,
            ],
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('manage-tenants');

        return Inertia::render('Module/Tenants/Create', [
            'tenantBaseDomain' => config('tenancy.tenant_base_domain') ?: 'localhost',
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
            $user = User::create([
                'name' => $request->owner_name,
                'email' => $request->owner_email,
                'password' => Hash::make($request->string('owner_password')->value() ?: str()->random(32)),
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();

            $owner = CentralUser::query()->firstWhere('email', $request->string('owner_email')->value());
        } else {
            // Admin-provisioned owners should be able to sign in without a
            // self-serve verification loop.
            if ($owner->email_verified_at === null) {
                $owner->forceFill(['email_verified_at' => now()])->save();
            }
        }

        // Guard: users seeded before the global_id hook was in place may have null.
        if (blank($owner->global_id)) {
            $owner->forceFill(['global_id' => (string) \Illuminate\Support\Str::uuid()])->save();
            $owner->refresh();
        }

        $user = $request->user();
        $resellerGlobalId = ($user && ! $user->isAdmin() && $user->hasRole('reseller'))
            ? $user->global_id
            : null;

        $tenant = $this->createTenant->execute(
            companyName: $request->string('company_name')->value(),
            subdomain: $request->string('subdomain')->value(),
            owner: $owner,
            resellerGlobalId: $resellerGlobalId,
        );

        TenantActivityLogger::log(
            $tenant,
            'created',
            'Tenant dibuat oleh admin.',
            $request->user(),
            ['owner_email' => $owner->email],
        );

        return redirect()
            ->route('module.tenants.index')
            ->with('success', __('tenants.messages.created'));
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

        $activityLogs = TenantActivityLog::query()
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (TenantActivityLog $log): array => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'actor_name' => $log->actor_name,
                'created_at' => $log->created_at?->toIso8601String(),
                'meta' => $log->meta,
            ])
            ->all();

        $provision = $tenant->provision ?? [];
        $canRetrySetup = ! empty($provision['owner_global_id'] ?? null);

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
                'can_install_demo_data' => $tenant->canInstallDemoData(),
            ],
            'members' => $members,
            'modules' => $this->catalog->forTenant($tenant),
            'plans' => $this->catalog->allPlans(),
            'graceDays' => config('modules.purge_after_days'),
            'activityLogs' => $activityLogs,
            'canRetrySetup' => $canRetrySetup,
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
            'can_install_demo_data' => 'sometimes|boolean',
            'billing_email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:2000',
        ]);

        $oldStatus = $tenant->status;
        $oldPlan = $tenant->plan;

        $tenant->update([
            'name' => $validated['name'],
            'status' => $validated['status'],
            'plan' => $validated['plan'],
            'can_install_demo_data' => $request->boolean('can_install_demo_data'),
            'billing_email' => $validated['billing_email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'tax_id' => $validated['tax_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $newDomain = CreateTenantAction::fullDomain($request->string('subdomain')->value());

        if ($currentDomain === null) {
            $tenant->domains()->create(['domain' => $newDomain]);
        } elseif ($currentDomain->domain !== $newDomain) {
            $currentDomain->update(['domain' => $newDomain]);
        }

        $changes = array_filter([
            'status' => $oldStatus !== $validated['status'] ? ['from' => $oldStatus, 'to' => $validated['status']] : null,
            'plan' => $oldPlan !== $validated['plan'] ? ['from' => $oldPlan, 'to' => $validated['plan']] : null,
        ], fn ($v) => $v !== null);

        TenantActivityLogger::log(
            $tenant,
            'updated',
            'Detail tenant diperbarui.',
            $request->user(),
            $changes,
        );

        return back()->with('success', __('tenants.messages.updated'));
    }

    /**
     * Toggle a tenant between active and suspended. Resellers may only toggle their own.
     */
    public function toggleStatus(Request $request, Tenant $tenant): RedirectResponse
    {
        $this->authorizeOwnership($request, $tenant);

        $oldStatus = $tenant->status;
        $newStatus = $oldStatus === 'active' ? 'suspended' : 'active';

        $tenant->update(['status' => $newStatus]);

        TenantActivityLogger::log(
            $tenant,
            'status_changed',
            "Status diubah dari {$oldStatus} ke {$newStatus}.",
            $request->user(),
            ['from' => $oldStatus, 'to' => $newStatus],
        );

        return back()->with('success', __('tenants.messages.status_updated'));
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
                'confirm_name' => __('tenants.messages.confirm_name_mismatch'),
            ]);
        }

        $tenant->delete();

        return redirect()
            ->route('module.tenants.index')
            ->with('success', __('tenants.messages.deleted'));
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

        TenantActivityLogger::log(
            $tenant,
            'module_installed',
            "Modul {$registered->label()} dipasang.",
            $request->user(),
            ['module' => $module],
        );

        return back()->with('success', __('tenants.messages.module_installed', [
            'module' => $registered->label(),
            'tenant' => $tenant->name,
        ]));
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

        TenantActivityLogger::log(
            $tenant,
            'module_uninstalled',
            "Modul {$registered->label()} dicopot.",
            $request->user(),
            ['module' => $module],
        );

        return back()->with('success', __('tenants.messages.module_uninstalled', [
            'module' => $registered->label(),
            'tenant' => $tenant->name,
            'days' => $days,
        ]));
    }

    /**
     * Re-dispatch FinalizeTenantSetupJob to retry a failed or incomplete provisioning.
     */
    public function retrySetup(Request $request, Tenant $tenant): RedirectResponse
    {
        $this->authorizeOwnership($request, $tenant);

        $provision = $tenant->provision ?? [];

        if (empty($provision['owner_global_id'] ?? null)) {
            return back()->with('error', __('tenants.messages.setup_retry_no_provision'));
        }

        FinalizeTenantSetupJob::dispatch($tenant);

        TenantActivityLogger::log(
            $tenant,
            'setup_retried',
            'Setup tenant diulang.',
            $request->user(),
        );

        return back()->with('success', __('tenants.messages.setup_retried'));
    }

    /**
     * Batch-update the status (active / suspended) for multiple tenants.
     */
    public function batchStatus(Request $request): RedirectResponse
    {
        Gate::authorize('manage-tenants');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'string',
            'status' => 'required|in:active,suspended',
        ]);

        $this->scopedQuery($request)
            ->whereIn('id', $request->input('ids'))
            ->get()
            ->each(fn (Tenant $tenant) => $tenant->update(['status' => $request->input('status')]));

        return back()->with('success', __('tenants.messages.batch_status_updated'));
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
