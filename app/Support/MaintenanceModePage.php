<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class MaintenanceModePage
{
    /**
     * Render the maintenance mode screen with HTTP 503.
     */
    public static function toResponse(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Layanan sedang dalam pemeliharaan (Under Maintenance). Silakan coba beberapa saat lagi.',
            ], 503, ['Retry-After' => '3600']);
        }

        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return Inertia::render('Errors/Maintenance', [
            'siteName' => $settings['general.site_name'] ?? config('app.name'),
            'siteTagline' => $settings['general.site_tagline'] ?? null,
            'siteDescription' => $settings['general.site_description'] ?? null,
            'siteLogo' => $settings['site.logo'] ?? null,
            'contactEmail' => $settings['site.contact_email'] ?? $settings['general.admin_email'] ?? null,
            'phone' => $settings['site.phone'] ?? null,
            'whatsapp' => $settings['social.whatsapp'] ?? null,
            'workingHours' => $settings['site.working_hours'] ?? null,
            'loginUrl' => route('login'),
        ])->toResponse($request)->setStatusCode(503)->header('Retry-After', '3600');
    }
}
