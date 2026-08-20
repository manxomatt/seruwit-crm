<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class WorkspaceController extends Controller
{
    /**
     * List the workspaces (tenants) the authenticated user belongs to.
     */
    public function index(Request $request): Response
    {
        $workspaces = $this->centralUser($request)
            ->tenants()
            ->with('domains')
            ->get()
            ->map(function (Tenant $tenant): array {
                $planModel = $tenant->planModel();
                $trialDaysLeft = $tenant->trial_ends_at && $tenant->trial_ends_at->isFuture()
                    ? max(1, (int) ceil(now()->diffInSeconds($tenant->trial_ends_at, false) / 86400))
                    : 0;

                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'status' => $tenant->status,
                    'plan_key' => $tenant->planKey(),
                    'plan_name' => $planModel?->name ?? ($tenant->planKey() ?: 'Starter'),
                    'plan_badge' => $planModel?->badge,
                    'domain' => $tenant->domains->first()?->domain,
                    'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                    'trial_days_left' => $trialDaysLeft,
                    'is_on_trial' => $tenant->isOnTrial ?? false,
                ];
            });

        return Inertia::render('Central/Workspaces', [
            'workspaces' => $workspaces,
            'settings' => Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->toArray(),
        ]);
    }

    /**
     * Enter a workspace: mint a single-use impersonation token and redirect
     * to the tenant domain, where /impersonate/{token} opens the session.
     */
    public function enter(Request $request, Tenant $tenant): RedirectResponse|SymfonyResponse
    {
        $centralUser = $this->centralUser($request);

        $isAdmin = $request->user()->isAdmin();

        if (! $isAdmin) {
            abort_unless(
                $centralUser->tenants()->whereKey($tenant->getTenantKey())->exists(),
                403,
                'Anda bukan anggota workspace ini.',
            );
        }

        $tenantUserId = $tenant->run(
            fn (): ?int => User::query()
                ->where('global_id', $centralUser->global_id)
                ->value('id'),
        );

        if ($tenantUserId === null && $isAdmin) {
            // Admin entering a tenant they are not a member of: impersonate the tenant owner (first admin).
            $tenantUserId = $tenant->run(
                fn (): ?int => User::query()
                    ->whereHas('roles', fn ($q) => $q->where('slug', 'admin'))
                    ->value('id'),
            );
        }

        abort_if($tenantUserId === null, 403, 'Akun Anda belum tersedia di workspace ini.');

        $domain = $tenant->domains->first()?->domain;
        abort_if($domain === null, 404, 'Workspace ini belum memiliki domain.');

        $isUnpaidOrSuspended = ($tenant->status !== 'active') || (bool) ($tenant->is_trial_expired ?? false);

        if ($isUnpaidOrSuspended) {
            $activeOrder = \App\Models\PaymentOrder::on('central')
                ->where('tenant_id', $tenant->getTenantKey())
                ->active()
                ->latest()
                ->first();

            $targetPath = $activeOrder
                ? '/module/subscription/payment/'.$activeOrder->id
                : '/module/subscription';
        } else {
            $targetPath = '/module/dashboard';
        }

        $token = tenancy()->impersonate($tenant, (string) $tenantUserId, $targetPath, 'web');

        $port = $request->getPort();
        $portSuffix = in_array($port, [80, 443], true) ? '' : ':'.$port;

        return redirect()->away(
            $request->getScheme().'://'.$domain.$portSuffix.'/impersonate/'.$token->token,
        );
    }

    /**
     * Resolve the central identity of the authenticated user.
     */
    private function centralUser(Request $request): CentralUser
    {
        return CentralUser::query()
            ->where('global_id', $request->user()->global_id)
            ->firstOrFail();
    }
}
