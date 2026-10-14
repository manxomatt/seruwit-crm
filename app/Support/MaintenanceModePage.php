<?php

namespace App\Support;

use App\Models\Setting;
use App\Models\User;
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

        $siteName = $settings['general.site_name'] ?? config('app.name');
        $siteTagline = $settings['general.site_tagline'] ?? null;
        $siteDescription = $settings['general.site_description'] ?? null;
        $siteLogo = $settings['site.logo'] ?? null;
        $contactEmail = $settings['site.contact_email'] ?? $settings['general.admin_email'] ?? null;
        $phone = $settings['site.phone'] ?? null;
        $whatsapp = $settings['social.whatsapp'] ?? null;
        $workingHours = $settings['site.working_hours'] ?? null;

        if (tenancy()->initialized) {
            $tenant = tenant();

            // Override site name if default or empty
            if (empty($siteName) || in_array(strtolower(trim($siteName)), ['seruwit biz', 'seruwit'], true)) {
                $siteName = $tenant->name ?: config('app.name');
            }

            // Do not show default SaaS provider logo on tenant maintenance page if not customized
            if ($siteLogo === '/images/logo.png') {
                $siteLogo = null;
            }

            // Resolve real admin user in tenant schema
            $adminUser = User::query()
                ->whereHas('roles', fn ($q) => $q->where('slug', 'admin'))
                ->first() ?? User::query()->first();

            // Resolve HQ fleet base if exists
            $hqBase = class_exists(\Modules\Fleet\Models\FleetBase::class) && \Illuminate\Support\Facades\Schema::hasTable('fleet_bases')
                ? \Modules\Fleet\Models\FleetBase::query()->where('code', 'HQ')->first()
                : null;

            $isSaasEmail = function (?string $email): bool {
                if (empty($email)) {
                    return true;
                }
                $clean = strtolower(trim($email));

                return str_ends_with($clean, '@seruwit.com') || in_array($clean, [
                    'contact@seruwit.com',
                    'admin@seruwit.com',
                    'support@seruwit.com',
                    'noreply@seruwit.com',
                ], true);
            };

            if ($isSaasEmail($contactEmail)) {
                $candidateEmail = $adminUser?->email ?? $hqBase?->email ?? $tenant->billing_email ?? null;
                $contactEmail = $isSaasEmail($candidateEmail) ? null : $candidateEmail;
            }

            $isSaasPhone = function (?string $phoneNumber): bool {
                if (empty($phoneNumber)) {
                    return true;
                }
                $digits = preg_replace('/[^0-9]/', '', $phoneNumber);

                return $digits === '622112345678' || $digits === '02112345678';
            };

            if ($isSaasPhone($phone)) {
                $candidatePhone = $hqBase?->phone
                    ?? $tenant->phone
                    ?? ($tenant->provision['phone'] ?? null);

                $phone = $isSaasPhone($candidatePhone) ? null : $candidatePhone;
            }

            $isSaasWa = function (?string $waNumber): bool {
                if (empty($waNumber)) {
                    return true;
                }
                $digits = preg_replace('/[^0-9]/', '', $waNumber);

                return $digits === '6281234567890' || $digits === '081234567890';
            };

            if ($isSaasWa($whatsapp)) {
                // If phone is a mobile number, use it as WhatsApp
                $candidateWa = $phone ?? $tenant->phone ?? ($tenant->provision['phone'] ?? null);
                if ($candidateWa && ! $isSaasWa($candidateWa)) {
                    $digits = preg_replace('/[^0-9]/', '', $candidateWa);
                    if (str_starts_with($digits, '08') || str_starts_with($digits, '628')) {
                        $whatsapp = $candidateWa;
                    } else {
                        $whatsapp = null;
                    }
                } else {
                    $whatsapp = null;
                }
            }
        }

        return Inertia::render('Errors/Maintenance', [
            'siteName' => $siteName,
            'siteTagline' => $siteTagline,
            'siteDescription' => $siteDescription,
            'siteLogo' => $siteLogo,
            'contactEmail' => $contactEmail,
            'phone' => $phone,
            'whatsapp' => $whatsapp,
            'workingHours' => $workingHours,
            'loginUrl' => route('login'),
        ])->toResponse($request)->setStatusCode(503)->header('Retry-After', '3600');
    }
}
