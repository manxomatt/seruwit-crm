<?php

declare(strict_types=1);

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomDomainRequest;
use App\Models\Domain;
use App\Models\Tenant;
use App\Services\CloudflareCustomHostnameService;
use App\Services\DomainVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomDomainController extends Controller
{
    /**
     * Display the domain settings page for the current tenant.
     */
    public function index(Request $request): Response
    {
        /** @var Tenant|null $tenant */
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404, 'Tenant context not initialized.');

        $domains = $tenant->domains()->orderByDesc('is_primary')->orderBy('created_at')->get();

        $systemDomain = $domains->firstWhere('is_custom', false);
        $customDomains = $domains->where('is_custom', true)->values();

        $tenantBaseDomain = (string) config('tenancy.tenant_base_domain');

        return Inertia::render('Modules/Settings/Domain', [
            'systemDomain' => $systemDomain ? [
                'id' => $systemDomain->id,
                'domain' => $systemDomain->domain,
                'is_primary' => $systemDomain->is_primary,
                'status' => $systemDomain->status,
            ] : null,
            'customDomains' => $customDomains->map(fn (Domain $d) => [
                'id' => $d->id,
                'domain' => $d->domain,
                'is_primary' => $d->is_primary,
                'status' => $d->status,
                'verification_token' => $d->verification_token,
                'cloudflare_status' => $d->cloudflare_status,
                'cloudflare_ssl_status' => $d->cloudflare_ssl_status,
                'verified_at' => $d->verified_at?->toIso8601String(),
                'last_checked_at' => $d->last_checked_at?->toIso8601String(),
                'last_error' => $d->last_error,
            ]),
            'dnsTarget' => $systemDomain?->domain ?? $tenantBaseDomain,
        ]);
    }

    /**
     * Store a newly created custom domain for the tenant.
     */
    public function store(StoreCustomDomainRequest $request, DomainVerificationService $verificationService): RedirectResponse
    {
        /** @var Tenant|null $tenant */
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404, 'Tenant context not initialized.');

        $domainName = strtolower(trim($request->validated('domain')));

        /** @var Domain $domain */
        $domain = $tenant->domains()->create([
            'domain' => $domainName,
            'is_custom' => true,
            'is_primary' => false,
            'status' => Domain::STATUS_PENDING_DNS,
            'verification_token' => Str::random(32),
        ]);

        // Attempt immediate verification
        $isVerified = $verificationService->verify($domain);

        if ($isVerified) {
            return back()->with('success', __('tenants.messages.domain_verified'));
        }

        return back()->with('success', __('tenants.messages.domain_created'));
    }

    /**
     * Re-verify DNS configuration for a custom domain.
     */
    public function verify(Domain $domain, DomainVerificationService $verificationService): RedirectResponse
    {
        /** @var Tenant|null $tenant */
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);
        abort_if($domain->tenant_id !== $tenant->id, 403);

        $isVerified = $verificationService->verify($domain);

        if ($isVerified) {
            return back()->with('success', __('tenants.messages.domain_verified'));
        }

        return back()->with('error', $domain->last_error ?? __('tenants.messages.domain_verify_failed'));
    }

    /**
     * Set a domain as the primary domain for the tenant.
     */
    public function setPrimary(Domain $domain): RedirectResponse
    {
        /** @var Tenant|null $tenant */
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);
        abort_if($domain->tenant_id !== $tenant->id, 403);

        if ($domain->is_custom && $domain->status !== Domain::STATUS_VERIFIED) {
            return back()->with('error', 'Domain harus terverifikasi sebelum dijadikan domain utama.');
        }

        $tenant->domains()->update(['is_primary' => false]);
        $domain->update(['is_primary' => true]);

        return back()->with('success', __('tenants.messages.domain_primary_updated'));
    }

    /**
     * Remove a custom domain from the tenant.
     */
    public function destroy(Domain $domain, CloudflareCustomHostnameService $cloudflareService): RedirectResponse
    {
        /** @var Tenant|null $tenant */
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);
        abort_if($domain->tenant_id !== $tenant->id, 403);
        abort_unless($domain->is_custom, 400, 'Domain bawaan sistem tidak dapat dihapus.');

        if (! empty($domain->cloudflare_hostname_id)) {
            $cloudflareService->deleteCustomHostname($domain->cloudflare_hostname_id);
        }

        $wasPrimary = $domain->is_primary;
        $domain->delete();

        // If the deleted domain was primary, revert primary to the system domain
        if ($wasPrimary) {
            $tenant->domains()->where('is_custom', false)->first()?->update(['is_primary' => true]);
        }

        return back()->with('success', __('tenants.messages.domain_deleted'));
    }
}
