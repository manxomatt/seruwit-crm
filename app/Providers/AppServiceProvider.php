<?php

namespace App\Providers;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

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

        Gate::define('manage-tenants', fn (User $user): bool => $user->isAdmin());

        // Installing a module reshapes the whole workspace, so it stays with the
        // workspace admin rather than becoming another view/create/update subject.
        Gate::define('manage-modules', fn (User $user): bool => $user->isAdmin());

        // Plans define what every tenant may buy — platform staff, not tenants.
        Gate::define('manage-plans', fn (User $user): bool => $user->isAdmin());

        // Turning a module off platform-wide overrides every tenant's plan and
        // install state at once — platform staff only, distinct from
        // manage-modules (a workspace admin's own install/uninstall).
        Gate::define('manage-module-registry', fn (User $user): bool => $user->isAdmin());
    }
}
