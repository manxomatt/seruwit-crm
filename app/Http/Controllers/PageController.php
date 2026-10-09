<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use App\Support\MaintenanceModePage;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Modules\Pages\Models\Page;
use Symfony\Component\HttpFoundation\Response;

/**
 * The public face of the Pages module: the homepage and /p/{slug}. These
 * routes are core — a workspace's public site exists whether or not the
 * module is installed — so they stay registered here and gate on
 * Modules::available('pages') at runtime, the same way GlobalSearch gates
 * its Carousel results. Managing pages happens in the module's own
 * controller (Modules\Pages\Http\Controllers\PageController).
 */
class PageController extends Controller
{
    /**
     * Render the published page for public viewing.
     */
    public function render(string $slug): Response
    {
        if (Setting::getValue('general.maintenance_mode') === '1' && ! Auth::guard('web')->check()) {
            return MaintenanceModePage::toResponse(request());
        }

        abort_unless(Modules::available('pages'), 404);

        $page = Page::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->view('pages::render', ['page' => $page]);
    }

    /**
     * Render the homepage: the tenant's designated page when the Pages module
     * is available and one is set, the stock landing page otherwise.
     */
    public function homepage(): Response
    {
        if (Setting::getValue('general.maintenance_mode') === '1' && ! Auth::guard('web')->check()) {
            return MaintenanceModePage::toResponse(request());
        }
        $page = Modules::available('pages')
            ? Page::query()->where('is_homepage', true)->where('is_published', true)->first()
            : null;

        if (! $page) {
            $settings = Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->toArray();

            return Inertia::render('Welcome', [
                'canLogin' => Route::has('login'),
                // Tenant workspaces invite users; public self-registration belongs on central only.
                'canRegister' => Route::has('register') && ! tenancy()->initialized,
                'laravelVersion' => Application::VERSION,
                'phpVersion' => PHP_VERSION,
                'settings' => $settings,
            ]);
        }

        return response()->view('pages::render', ['page' => $page]);
    }
}
