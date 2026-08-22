<?php

use App\Http\Controllers\Central\InvitationController;
use App\Http\Controllers\Central\OnboardingController;
use App\Http\Controllers\Central\ResellerLandingPageController;
use App\Http\Controllers\Central\SubscriptionController;
use App\Http\Controllers\Central\SubscriptionTierController;
use App\Http\Controllers\Central\WebhookController;
use App\Http\Controllers\Central\WorkspaceController;
use App\Http\Controllers\Module\ModuleRegistryController;
use App\Http\Controllers\Module\PaymentOrderController;
use App\Http\Controllers\Module\PlanController;
use App\Http\Controllers\Module\ResellerCommissionController;
use App\Http\Controllers\Module\ResellerCommissionRuleController;
use App\Http\Controllers\Module\ResellerController;
use App\Http\Controllers\Module\ResellerPayoutController;
use App\Http\Controllers\Module\ResellerPortalController;
use App\Http\Controllers\Module\SettingController as ModuleSettingController;
use App\Http\Controllers\Module\TenantController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Webhook Routes
|--------------------------------------------------------------------------
|
| Unauthenticated webhook endpoints for payment processing.
| These must be accessible to external services (e.g., Midtrans).
|
*/
Route::post('/webhooks/payment', [WebhookController::class, 'handlePaymentWebhook'])->name('webhooks.payment');

/*
|--------------------------------------------------------------------------
| Central Routes
|--------------------------------------------------------------------------
|
| Bound to the central domain with a "central." name prefix, so their names
| never collide with the tenant routes (routes/tenant.php) that register
| the same URIs domain-less — which keeps route:cache usable.
|
| CENTRAL_SERVES_APP=true (default, for local development) serves the full
| CRM on the central domain too. In production set it to false: the central
| domain then only offers the landing page, auth, the workspace portal,
| tenant administration, and invitation acceptance.
|
*/

$centralDomain = config('tenancy.tenant_base_domain')
    ?: (parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost');

/*
| Settings *structure* (defining, renaming, or deleting a setting) is a
| platform capability, not a tenant-configurable one — a tenant may still
| view and edit the values of its own settings (routes/app.php's
| settings.index/group/bulk-update). This block must be registered *before*
| the main central group below, which requires routes/app.php: that file's
| GET /settings/{group} is a single-segment wildcard that would otherwise
| swallow a same-domain GET /settings/create registered after it (Laravel
| matches in registration order), since "create" is itself a valid {group}
| value.
*/
Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-settings'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/settings/create', [ModuleSettingController::class, 'create'])->name('settings.create');
        Route::post('/settings', [ModuleSettingController::class, 'store'])->name('settings.store');
        Route::get('/settings/{setting}/edit', [ModuleSettingController::class, 'edit'])->name('settings.edit');
        Route::patch('/settings/{setting}', [ModuleSettingController::class, 'update'])->name('settings.update');
        Route::delete('/settings/{setting}', [ModuleSettingController::class, 'destroy'])->name('settings.destroy');
    });

Route::domain($centralDomain)
    ->name('central.')
    ->group(function () {
        Route::middleware('auth')->group(function () {
            Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
            Route::get('/workspaces/{tenant}/enter', [WorkspaceController::class, 'enter'])->name('workspaces.enter');

            // Subscription management for tenants
            Route::get('/subscriptions/{tenant}', [SubscriptionController::class, 'show'])->name('subscriptions.show');
            Route::post('/subscriptions/{tenant}', [SubscriptionController::class, 'store'])->name('subscriptions.store');
            Route::get('/subscriptions/{tenant}/activate', [SubscriptionController::class, 'activate'])->name('subscriptions.activate');
            Route::get('/subscriptions/{tenant}/upgrade', [SubscriptionController::class, 'upgrade'])->name('subscriptions.upgrade');
            Route::post('/subscriptions/{tenant}/upgrade', [SubscriptionController::class, 'processUpgrade'])->name('subscriptions.upgrade.store');
            Route::get('/subscriptions/{tenant}/management', [SubscriptionController::class, 'management'])->name('subscriptions.management');
            Route::patch('/subscriptions/{tenant}/toggle-auto-renew', [SubscriptionController::class, 'toggleAutoRenew'])->name('subscriptions.toggle-auto-renew');
            Route::post('/subscriptions/{tenant}/cancel', [SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');
            Route::get('/subscriptions/{tenant}/renewal-history', [SubscriptionController::class, 'renewalHistory'])->name('subscriptions.renewal-history');
            Route::post('/subscriptions/{tenant}/renewal/process', [SubscriptionController::class, 'processRenewal'])->name('subscriptions.renewal.process');
            Route::post('/subscriptions/{tenant}/renewal/skip', [SubscriptionController::class, 'skipRenewal'])->name('subscriptions.renewal.skip');
            Route::post('/subscriptions/{tenant}/renewal/enable', [SubscriptionController::class, 'enableRenewal'])->name('subscriptions.renewal.enable');

            Route::get('/billing-reports/{tenant}', [BillingReportController::class, 'index'])->name('billing-reports.index');
            Route::get('/billing-reports/{tenant}/{year}/{month}', [BillingReportController::class, 'show'])->name('billing-reports.show');
            Route::get('/billing-reports/{tenant}/export/csv', [BillingReportController::class, 'exportCsv'])->name('billing-reports.export.csv');

            Route::middleware('verified')->group(function () {
                Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
                Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
                Route::get('/onboarding/payment', [OnboardingController::class, 'payment'])->name('onboarding.payment');
                Route::post('/onboarding/payment', [OnboardingController::class, 'submitPayment'])->name('onboarding.payment.submit');
                Route::get('/onboarding/status', [OnboardingController::class, 'status'])->name('onboarding.status');
            });
        });

        // Public legal pages (Terms & Conditions, Privacy Policy)
        Route::get('/terms', function () {
            $settings = \App\Models\Setting::getPublic()
                ->mapWithKeys(fn (\App\Models\Setting $s) => [$s->key => $s->value])
                ->toArray();

            return \Inertia\Inertia::render('Legal/Terms', ['settings' => $settings]);
        })->name('terms');

        Route::get('/privacy', function () {
            $settings = \App\Models\Setting::getPublic()
                ->mapWithKeys(fn (\App\Models\Setting $s) => [$s->key => $s->value])
                ->toArray();

            return \Inertia\Inertia::render('Legal/Privacy', ['settings' => $settings]);
        })->name('privacy');

        // Invitation acceptance (guest-accessible; account may not exist yet)
        Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
        Route::post('/invitations/{token}', [InvitationController::class, 'accept'])->name('invitations.accept');

        // A reseller's own public pitch page, shared under their referral code.
        Route::get('/r/{code}', [ResellerLandingPageController::class, 'show'])->name('reseller.landing');

        if (config('app.central_serves_app')) {
            require __DIR__.'/app.php';
        } else {
            Route::get('/', [PageController::class, 'homepage'])->name('home');

            require __DIR__.'/auth.php';
        }
    });

/*
|--------------------------------------------------------------------------
| Tenant Management (SaaS control plane)
|--------------------------------------------------------------------------
|
| The tenants/domains tables live only in the central schema, so this feature
| runs on the central domain exclusively. It is exposed under /module/tenants
| (name module.tenants.*) so it looks and behaves like any other CRM module,
| but it is gated to platform super admins via the manage-tenants ability.
|
*/

Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-tenants'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/tenants', [TenantController::class, 'index'])->name('tenants.index');
        Route::get('/tenants/create', [TenantController::class, 'create'])->name('tenants.create');
        Route::post('/tenants', [TenantController::class, 'store'])->name('tenants.store');
        Route::patch('/tenants/batch-status', [TenantController::class, 'batchStatus'])->name('tenants.batch-status');
        Route::get('/tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
        Route::patch('/tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
        Route::patch('/tenants/{tenant}/status', [TenantController::class, 'toggleStatus'])->name('tenants.toggle-status');
        Route::post('/tenants/{tenant}/retry-setup', [TenantController::class, 'retrySetup'])->name('tenants.retry-setup');
        Route::post('/tenants/{tenant}/modules/{module}', [TenantController::class, 'installModule'])->name('tenants.modules.install');
        Route::delete('/tenants/{tenant}/modules/{module}', [TenantController::class, 'uninstallModule'])->name('tenants.modules.uninstall');
        Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');

        Route::get('/payment-orders', [PaymentOrderController::class, 'index'])->name('payment-orders.index');
        Route::get('/payment-orders/{paymentOrder}', [PaymentOrderController::class, 'show'])->name('payment-orders.show');
        Route::post('/payment-orders/{paymentOrder}/confirm', [PaymentOrderController::class, 'confirm'])->name('payment-orders.confirm');
        Route::post('/payment-orders/{paymentOrder}/reject', [PaymentOrderController::class, 'reject'])->name('payment-orders.reject');
        Route::post('/webhooks/payment-orders/{paymentOrder}/confirm', [WebhookController::class, 'confirmPaymentManual'])->name('webhooks.payment-orders.confirm');
    });

/*
| Subscription plans: which modules each plan lets a tenant install. Central only
| and gated to platform super admins — a plan is a platform-wide definition, not
| something a workspace configures for itself.
*/
Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-plans'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/plans', [PlanController::class, 'index'])->name('plans.index');
        Route::get('/plans/create', [PlanController::class, 'create'])->name('plans.create');
        Route::post('/plans', [PlanController::class, 'store'])->name('plans.store');
        Route::get('/plans/{plan}/edit', [PlanController::class, 'edit'])->name('plans.edit');
        Route::patch('/plans/{plan}', [PlanController::class, 'update'])->name('plans.update');
        Route::delete('/plans/{plan}', [PlanController::class, 'destroy'])->name('plans.destroy');
    });

/*
| Subscription tiers: pricing configuration for PAYG subscriptions.
| Central only and gated to platform super admins.
*/
Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-plans'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/billing', [SubscriptionTierController::class, 'billingDashboard'])->name('subscription-tiers.dashboard');
        Route::get('/subscription-tiers', [SubscriptionTierController::class, 'index'])->name('subscription-tiers.index');
        Route::get('/subscription-tiers/create', [SubscriptionTierController::class, 'create'])->name('subscription-tiers.create');
        Route::post('/subscription-tiers', [SubscriptionTierController::class, 'store'])->name('subscription-tiers.store');
        Route::get('/subscription-tiers/{tier}/edit', [SubscriptionTierController::class, 'edit'])->name('subscription-tiers.edit');
        Route::patch('/subscription-tiers/{tier}', [SubscriptionTierController::class, 'update'])->name('subscription-tiers.update');
        Route::delete('/subscription-tiers/{tier}', [SubscriptionTierController::class, 'destroy'])->name('subscription-tiers.destroy');
        Route::get('/subscription-tiers/price-calculator', [SubscriptionTierController::class, 'priceCalculator'])->name('subscription-tiers.price-calculator');
    });

/*
| Reseller programme.
|
| Split in two on purpose. The portal is what a reseller sees of their own
| earnings and is scoped to the authenticated identity, never to a route
| parameter. Everything that sets the terms — rates, partner status, voiding a
| commission — sits behind manage-resellers and is platform staff only.
*/
Route::domain($centralDomain)
    ->middleware(['auth', 'can:view-reseller-earnings'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/reseller/dashboard', [ResellerPortalController::class, 'dashboard'])->name('reseller.dashboard');
        Route::get('/reseller/commissions', [ResellerPortalController::class, 'commissions'])->name('reseller.commissions');
        Route::get('/reseller/payouts', [ResellerPortalController::class, 'payouts'])->name('reseller.payouts');
        Route::get('/reseller/commissions/export', [ResellerPortalController::class, 'exportCommissions'])->name('reseller.commissions.export');
        Route::patch('/reseller/landing-page', [ResellerPortalController::class, 'updateLandingPage'])->name('reseller.landing-page.update');
    });

Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-resellers'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/resellers', [ResellerController::class, 'index'])->name('resellers.index');
        Route::get('/reseller-commissions', [ResellerCommissionController::class, 'index'])->name('reseller-commissions.index');
        Route::get('/reseller-commissions/export', [ResellerCommissionController::class, 'export'])->name('reseller-commissions.export');
        Route::post('/reseller-commissions/{commission}/void', [ResellerCommissionController::class, 'void'])->name('reseller-commissions.void');

        Route::get('/reseller-payouts', [ResellerPayoutController::class, 'index'])->name('reseller-payouts.index');
        Route::post('/reseller-payouts', [ResellerPayoutController::class, 'store'])->name('reseller-payouts.store');
        Route::get('/reseller-payouts/{payout}', [ResellerPayoutController::class, 'show'])->name('reseller-payouts.show');
        Route::post('/reseller-payouts/{payout}/approve', [ResellerPayoutController::class, 'approve'])->name('reseller-payouts.approve');
        Route::post('/reseller-payouts/{payout}/pay', [ResellerPayoutController::class, 'pay'])->name('reseller-payouts.pay');
        Route::post('/reseller-payouts/{payout}/cancel', [ResellerPayoutController::class, 'cancel'])->name('reseller-payouts.cancel');

        Route::post('/reseller-rules', [ResellerCommissionRuleController::class, 'store'])->name('reseller-rules.store');
        Route::patch('/reseller-rules/{rule}', [ResellerCommissionRuleController::class, 'update'])->name('reseller-rules.update');
        Route::delete('/reseller-rules/{rule}', [ResellerCommissionRuleController::class, 'destroy'])->name('reseller-rules.destroy');

        // Registered last: {reseller} is a bare segment and would otherwise
        // swallow /resellers/... siblings added later.
        Route::get('/resellers/{reseller}', [ResellerController::class, 'show'])->name('resellers.show');
        Route::patch('/resellers/{reseller}', [ResellerController::class, 'update'])->name('resellers.update');
    });

/*
| Platform-wide module kill switch: turns a module off for every tenant at
| once, regardless of plan or install state. Central only and gated to
| platform super admins — distinct from module.modules.* (a workspace admin's
| own install/uninstall of the modules their plan already covers).
*/
Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-module-registry'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/registry', [ModuleRegistryController::class, 'index'])->name('registry.index');
        Route::patch('/registry/{key}/status', [ModuleRegistryController::class, 'toggleStatus'])->name('registry.toggle-status');
    });
