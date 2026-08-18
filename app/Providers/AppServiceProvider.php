<?php

namespace App\Providers;

use App\Actions\Auth\ResolvePostAuthDestination;
use App\Events\PaymentOrderConfirmed;
use App\Listeners\AccrueResellerCommission;
use App\Listeners\PostSaasRevenue;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\UserRepository;
use App\Support\EmailVerificationUrl;
use App\Support\SystemMode;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        $this->configureGuestRedirect();
        $this->configureEmailVerificationUrls();
        $this->configureDevelopmentMailGate();
        $this->registerDomainEventListeners();

        Gate::define('manage-tenants', fn (User $user): bool => $user->isAdmin() || $user->hasRole('reseller'));

        // Installing a module reshapes the whole workspace, so it stays with the
        // workspace admin rather than becoming another view/create/update subject.
        Gate::define('manage-modules', fn (User $user): bool => $user->isAdmin());

        // Plans define what every tenant may buy — platform staff, not tenants.
        Gate::define('manage-plans', fn (User $user): bool => $user->isAdmin());

        // Turning a module off platform-wide overrides every tenant's plan and
        // install state at once — platform staff only, distinct from
        // manage-modules (a workspace admin's own install/uninstall).
        Gate::define('manage-module-registry', fn (User $user): bool => $user->isAdmin());

        // Settings are a platform-wide definition, edited by platform staff only —
        // a tenant may still view them, but not add or change them.
        Gate::define('manage-settings', fn (User $user): bool => $user->isAdmin());
    }

    /**
     * Wire application events to their listeners.
     *
     * Registered by hand because this application does not opt into Laravel's
     * event discovery in bootstrap/app.php — a listener dropped into
     * app/Listeners is otherwise never called.
     */
    private function registerDomainEventListeners(): void
    {
        Event::listen(PaymentOrderConfirmed::class, PostSaasRevenue::class);
        Event::listen(PaymentOrderConfirmed::class, AccrueResellerCommission::class);
    }

    /**
     * When an authenticated user hits a guest-only route (e.g. /login, /register),
     * send them to the correct destination instead of the default /dashboard.
     * Tenant users with no workspace chosen go to /workspace; platform staff go
     * to their role dashboard; everyone else falls through ResolvePostAuthDestination.
     */
    private function configureGuestRedirect(): void
    {
        RedirectIfAuthenticated::redirectUsing(function (Request $request): string {
            $user = $request->user();

            if ($user === null) {
                return '/';
            }

            return app(ResolvePostAuthDestination::class)->url($user);
        });
    }

    /**
     * Prefer the central verification route and log a copy-pasteable URL when
     * mail is written to laravel.log (HTML sources encode "&" as "&amp;").
     */
    private function configureEmailVerificationUrls(): void
    {
        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            $url = EmailVerificationUrl::for($notifiable);

            if (config('mail.default') === 'log') {
                Log::info('Email verification URL (copy-paste as-is): '.$url);
            }

            return $url;
        });
    }

    /**
     * System mode "development" blocks every outbound mail message (transaction
     * notifications, invitations, password resets, etc.).
     */
    private function configureDevelopmentMailGate(): void
    {
        Event::listen(MessageSending::class, function (): ?bool {
            if (SystemMode::shouldSendMail()) {
                return null;
            }

            return false;
        });
    }
}
