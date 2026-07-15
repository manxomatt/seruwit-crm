<?php

namespace App\Http\Controllers\Central;

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

class TenantAdminController extends Controller
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

        return Inertia::render('Central/Tenants/Index', [
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
     * Toggle a tenant between active and suspended.
     */
    public function toggleStatus(Tenant $tenant): RedirectResponse
    {
        $tenant->update([
            'status' => $tenant->status === 'active' ? 'suspended' : 'active',
        ]);

        return back()->with('success', 'Status tenant diperbarui.');
    }
}
