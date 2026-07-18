<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pages\Models\Page;

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
    public function render(string $slug): \Illuminate\Http\Response
    {
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
    public function homepage(): Response|\Illuminate\Http\Response
    {
        $page = Modules::available('pages')
            ? Page::query()->where('is_homepage', true)->where('is_published', true)->first()
            : null;

        if (! $page) {
            $settings = Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->toArray();

            return Inertia::render('Welcome', [
                'canLogin' => Route::has('login'),
                'canRegister' => Route::has('register'),
                'laravelVersion' => Application::VERSION,
                'phpVersion' => PHP_VERSION,
                'settings' => $settings,
            ]);
        }

        return response()->view('pages::render', ['page' => $page]);
    }
}
