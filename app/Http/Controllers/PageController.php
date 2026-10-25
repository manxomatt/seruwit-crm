<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use App\Support\MaintenanceModePage;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
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
    public function homepage(): Response|InertiaResponse
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

            $isTenant = tenancy()->initialized || request()->boolean('preview_tenant');
            $tenantRentalData = null;

            if ($isTenant) {
                $tenantRentalData = $this->resolveTenantRentalData($settings);
            }

            return Inertia::render('Welcome', [
                'canLogin' => Route::has('login'),
                // Tenant workspaces invite users; public self-registration belongs on central only.
                'canRegister' => Route::has('register') && ! tenancy()->initialized,
                'laravelVersion' => Application::VERSION,
                'phpVersion' => PHP_VERSION,
                'settings' => $settings,
                'isTenant' => $isTenant,
                'tenantRentalData' => $tenantRentalData,
            ]);
        }

        return response()->view('pages::render', ['page' => $page]);
    }

    /**
     * Resolve rich car rental storefront data for tenant default homepage.
     *
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    private function resolveTenantRentalData(array $settings): array
    {
        $storefront = class_exists(\Modules\Rental\Support\RentalStorefrontSettings::class)
            ? \Modules\Rental\Support\RentalStorefrontSettings::all()
            : [];

        $siteName = ($storefront['brand_name'] ?? '') ?: ($settings['general.site_name'] ?? config('app.name', 'Rental Mobil'));
        $siteTagline = ($storefront['hero_title'] ?? '') ?: ($settings['general.site_tagline'] ?? 'Layanan Rental Mobil Nyaman, Cepat & Terpercaya');
        $siteDescription = ($storefront['hero_subtitle'] ?? '') ?: ($settings['general.site_description'] ?? 'Pilihan armada terlengkap untuk liburan, bisnis, dan acara keluarga. Sewa lepas kunci bebas ribet atau dengan sopir berpengalaman.');
        $supportPhone = ($storefront['support_phone'] ?? '') ?: ($settings['site.phone'] ?? null);
        $logoUrl = ($storefront['logo_url'] ?? '') ?: ($settings['site.logo'] ?? null);
        $heroImageUrl = ($storefront['hero_image_url'] ?? '') ?: null;
        $businessHours = ($storefront['business_hours'] ?? '') ?: ($settings['site.working_hours'] ?? 'Buka Setiap Hari: 07:00 - 22:00 WIB (Antar 24 Jam)');
        $primaryColor = ($storefront['primary_color'] ?? '') ?: '#0f766e';
        $secondaryColor = ($storefront['secondary_color'] ?? '') ?: '#0f172a';

        $termsUrl = $this->publishedPageUrl(['syarat-ketentuan', 'syarat', 'terms']);
        $privacyUrl = $this->publishedPageUrl(['kebijakan-privasi', 'privasi', 'privacy']);

        $brand = [
            'name' => $siteName,
            'tagline' => $siteTagline,
            'description' => $siteDescription,
            'logo_url' => $logoUrl,
            'hero_image_url' => $heroImageUrl,
            'support_phone' => $supportPhone,
            'address' => $settings['site.address'] ?? 'Layanan Antar-Jemput Seluruh Area Kota, Bandara & Stasiun',
            'contact_email' => $settings['site.contact_email'] ?? null,
            'business_hours' => $businessHours,
            'primary_color' => $primaryColor,
            'secondary_color' => $secondaryColor,
            'terms_url' => $termsUrl,
            'privacy_url' => $privacyUrl,
            'social' => [
                'instagram' => ! empty($storefront['social_instagram']) ? $storefront['social_instagram'] : null,
                'facebook' => ! empty($storefront['social_facebook']) ? $storefront['social_facebook'] : null,
                'tiktok' => ! empty($storefront['social_tiktok']) ? $storefront['social_tiktok'] : null,
            ],
        ];

        // Pickup / Depot locations
        $locations = [];
        if (class_exists(\Modules\Rental\Support\RentalLocationHydrator::class)) {
            $locations = app(\Modules\Rental\Support\RentalLocationHydrator::class)->depotOptions();
        }

        // Vehicle Rental Classes
        $classes = [];
        if (class_exists(\Modules\Fleet\Support\VehicleRentalClass::class)) {
            $classes = collect(\Modules\Fleet\Support\VehicleRentalClass::values())
                ->map(fn (string $value): array => [
                    'value' => $value,
                    'label' => \Modules\Fleet\Support\VehicleRentalClass::label($value) ?: ucfirst($value),
                ])
                ->values()
                ->all();
        }

        // Active Fleet Vehicles
        $vehicles = [];
        if (
            Modules::available('rental')
            && Modules::available('fleet')
            && class_exists(\Modules\Fleet\Models\Vehicle::class)
            && Schema::hasTable('vehicles')
        ) {
            $rates = app(\Modules\Rental\Support\RentalRateResolver::class);
            $start = now()->toDateString();
            $end = now()->addDays(2)->toDateString();

            $vehicles = \Modules\Fleet\Models\Vehicle::query()
                ->where('status', \Modules\Fleet\Models\Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->limit(12)
                ->get()
                ->map(function (\Modules\Fleet\Models\Vehicle $v) use ($rates, $start, $end): array {
                    $rate = $rates->suggest($v, $start, $end, 'daily');
                    $displayName = class_exists(\Modules\Rental\Support\PublicRentalCatalog::class)
                        ? \Modules\Rental\Support\PublicRentalCatalog::displayName((string) $v->name)
                        : (string) $v->name;
                    $fuelLabel = class_exists(\Modules\Rental\Support\PublicRentalCatalog::class)
                        ? \Modules\Rental\Support\PublicRentalCatalog::fuelLabel($v->fuel_type)
                        : ucfirst((string) $v->fuel_type);

                    return [
                        'id' => $v->id,
                        'name' => $displayName,
                        'rental_class' => $v->rental_class,
                        'rental_class_label' => $v->rental_class_label,
                        'capacity_seats' => $v->capacity_seats ?: 5,
                        'fuel_label' => $fuelLabel,
                        'fuel_type' => $v->fuel_type,
                        'transmission' => $v->transmission ?? 'Automatic',
                        'model_year' => $v->model_year,
                        'photo_url' => $v->photo_url,
                        'from_price' => $rate ? (float) $rate->rate_per_period : null,
                        'deposit_amount' => $rate && $rate->deposit_amount !== null ? (float) $rate->deposit_amount : null,
                    ];
                })
                ->values()
                ->all();
        }

        $customer = auth('customer')->check()
            ? [
                'id' => auth('customer')->user()->id,
                'name' => auth('customer')->user()->name,
                'phone' => auth('customer')->user()->phone,
                'email' => auth('customer')->user()->email,
            ]
            : null;

        $passengerBookingEnabled = Setting::getValue('rental.passenger_booking_enabled', '0') === '1';

        return [
            'brand' => $brand,
            'featuredVehicles' => $vehicles,
            'locations' => $locations,
            'classes' => $classes,
            'customer' => $customer,
            'passengerBookingEnabled' => $passengerBookingEnabled,
        ];
    }

    /**
     * @param  list<string>  $slugs
     */
    private function publishedPageUrl(array $slugs): ?string
    {
        if (! class_exists(\Modules\Pages\Models\Page::class) || ! Schema::hasTable('pages')) {
            return null;
        }

        $published = Page::query()
            ->where('is_published', true)
            ->whereIn('slug', $slugs)
            ->pluck('slug');

        foreach ($slugs as $candidate) {
            if ($published->contains($candidate)) {
                return route('pages.render', $candidate);
            }
        }

        return null;
    }
}
