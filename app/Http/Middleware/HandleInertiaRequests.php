<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $routePrefix = $this->getRoutePrefix($request);

        // Eager load profile and roles with permissions to avoid N+1 query
        if ($user) {
            $user->load(['profile', 'roles.permissions']);
        }

        // Get public settings for logo and site name
        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'is_admin' => $user->isAdmin(),
                    'dashboard_path' => $user->getDashboardPath(),
                    'profile' => $user->profile ? [
                        'id' => $user->profile->id,
                        'first_name' => $user->profile->first_name,
                        'last_name' => $user->profile->last_name,
                        'phone_number' => $user->profile->phone_number,
                        'avatar_url' => $user->profile->avatar_url,
                    ] : null,
                    'permissions' => $this->getUserPermissions($user),
                ] : null,
            ],
            'route_prefix' => $routePrefix,
            // Controllers already redirect with these; lazily resolved so a page
            // that never reads them does not touch the session.
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'menus' => $this->getMenus($user, $routePrefix),
            'settings' => $settings,
            // The tenant *domain* we're currently on (null on the central domain).
            // Named distinctly so it never collides with page props that carry a
            // tenant record (e.g. the tenant management detail page).
            'currentTenant' => tenancy()->initialized ? [
                'id' => tenant('id'),
                'name' => tenant('name'),
            ] : null,
        ];
    }

    /**
     * Get the current route prefix (admin, user, or module).
     *
     * Routes served on the central domain carry a "central." name prefix
     * (see routes/web.php); it is stripped here so the inner prefix is
     * detected identically on central and tenant domains.
     */
    private function getRoutePrefix(Request $request): string
    {
        $routeName = str_replace('central.', '', $request->route()?->getName() ?? '');

        if (str_starts_with($routeName, 'admin.')) {
            return 'admin';
        }

        if (str_starts_with($routeName, 'user.')) {
            return 'user';
        }

        return 'module';
    }

    /**
     * Get menus for the current user from the active schema.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getMenus(?\App\Models\User $user, string $routePrefix): array
    {
        if (! $user) {
            return [];
        }

        return Menu::getMenusForUser($user, $routePrefix)->toArray();
    }

    /**
     * Get the user's permissions grouped by module from the active schema.
     *
     * An admin's permission rows survive a module uninstall on purpose (see
     * ModuleInstaller::uninstall()), so this is what actually keeps an
     * uninstalled module's sidebar entry from leaking back in for them — the
     * `permission` route middleware alone would not catch it, since it never
     * runs before `requires-module`.
     *
     * @return array<string, array<string>>
     */
    private function getUserPermissions(\App\Models\User $user): array
    {
        $permissions = $user->getAllPermissions();

        $grouped = [];
        foreach ($permissions as $permission) {
            if (! Modules::available($permission->module)) {
                continue;
            }

            if (! isset($grouped[$permission->module])) {
                $grouped[$permission->module] = [];
            }

            $grouped[$permission->module][] = $permission->action;
        }

        return $grouped;
    }
}
