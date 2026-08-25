<?php

namespace App\Http\Middleware;

use App\Support\LocaleResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Middleware;

/**
 * Lean Inertia middleware for the installer.
 *
 * The main HandleInertiaRequests shares menus, auth, settings and more — all
 * database-backed, none of which exist during first-run installation. This shares
 * only what the wizard needs (validation errors, the install translations, locale,
 * flash status) and renders through the DB-free install root view.
 */
class HandleInstallerInertiaRequests extends Middleware
{
    protected $rootView = 'install';

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $locale = app(LocaleResolver::class)->resolve($request);
        App::setLocale($locale);

        return [
            ...parent::share($request),
            'appName' => config('app.name'),
            'locale' => $locale,
            'availableLocales' => app(LocaleResolver::class)->availableLocales(),
            'translations' => [
                'install' => (array) trans('install'),
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
