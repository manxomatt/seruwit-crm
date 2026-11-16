<?php

namespace App\Support;

use App\Models\PlatformSetting;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class NotFoundPage
{
    /**
     * Render the custom 404 Not Found screen via Inertia with HTTP 404.
     */
    public static function toResponse(Request $request): Response
    {
        $locale = self::resolveLocale($request);
        App::setLocale($locale);

        $settings = rescue(
            fn (): array => Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting): array => [$setting->key => $setting->value])
                ->toArray(),
            [],
            false
        );

        $siteName = $settings['general.site_name'] ?? config('app.name', 'Seruwit Biz');
        $siteTagline = $settings['general.site_tagline'] ?? null;
        $siteLogo = $settings['site.logo'] ?? null;
        $contactEmail = $settings['site.contact_email'] ?? $settings['general.admin_email'] ?? null;

        if (! tenancy()->initialized) {
            $siteName = rescue(fn (): string => PlatformSetting::platformName(), $siteName, false);
            $siteTagline = rescue(
                fn (): ?string => PlatformSetting::getValue(PlatformSetting::KEY_PLATFORM_TAGLINE) ?: $siteTagline,
                $siteTagline,
                false
            );
            $contactEmail = rescue(
                fn (): ?string => PlatformSetting::getValue(PlatformSetting::KEY_ADMIN_EMAIL) ?: $contactEmail,
                $contactEmail,
                false
            );
        } else {
            $tenantName = rescue(fn (): ?string => tenant('name'), null, false);
            if (is_string($tenantName) && $tenantName !== '' && (empty($siteName) || in_array(strtolower(trim((string) $siteName)), ['seruwit biz', 'seruwit'], true))) {
                $siteName = $tenantName;
            }
            if ($siteLogo === '/images/logo.png') {
                $siteLogo = null;
            }
        }

        $isUserAuthenticated = rescue(fn (): bool => Auth::guard('web')->check(), false, false);
        $isCustomerAuthenticated = rescue(fn (): bool => Auth::guard('customer')->check(), false, false);
        $isAuthenticated = $isUserAuthenticated || $isCustomerAuthenticated;

        $homeUrl = url('/');
        $loginUrl = Route::has('login') ? route('login') : url('/login');
        $dashboardUrl = $homeUrl;

        if ($isCustomerAuthenticated && Route::has('book.rental.portal.dashboard')) {
            $dashboardUrl = route('book.rental.portal.dashboard');
        } elseif ($isUserAuthenticated) {
            $dashboardUrl = Route::has('dashboard') ? route('dashboard') : url('/dashboard');
        }

        $requestedPath = '/'.ltrim($request->path(), '/');
        if ($requestedPath === '//') {
            $requestedPath = '/';
        }

        $props = [
            'siteName' => $siteName ?: config('app.name', 'Seruwit Biz'),
            'siteTagline' => $siteTagline,
            'siteLogo' => $siteLogo,
            'contactEmail' => $contactEmail,
            'homeUrl' => $homeUrl,
            'dashboardUrl' => $dashboardUrl,
            'loginUrl' => $loginUrl,
            'isAuthenticated' => $isAuthenticated,
            'isTenant' => tenancy()->initialized,
            'requestedPath' => $requestedPath,
            'requestMethod' => $request->method(),
        ];

        // When a 404 is triggered by an unmatched route, HandleInertiaRequests
        // has not run, so we provide locale & translations explicitly.
        if (Inertia::getShared('locale') === null) {
            $props['locale'] = $locale;
            $props['availableLocales'] = app(LocaleResolver::class)->availableLocales();
            $props['translations'] = [
                'errors' => trans('errors'),
                'shell' => trans('shell'),
                'common' => trans('common'),
            ];
        }

        return Inertia::render('Errors/NotFound', $props)
            ->toResponse($request)
            ->setStatusCode(404);
    }

    /**
     * Resolve locale safely even when session middleware has not run.
     */
    private static function resolveLocale(Request $request): string
    {
        if ($request->hasSession()) {
            return rescue(
                fn (): string => app(LocaleResolver::class)->resolve($request),
                config('localization.default', config('app.locale', 'id')),
                false
            );
        }

        $supported = config('localization.supported', ['en', 'id']);
        $candidate = config('localization.default', config('app.locale', 'id'));

        return in_array($candidate, $supported, true) ? $candidate : 'id';
    }
}
