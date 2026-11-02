<?php

namespace Modules\RentalStorefront\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Rental\Http\Requests\UpdateRentalTestimonialsRequest;
use Modules\Rental\Models\Customer;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalGeneralSettings;
use Modules\Rental\Support\RentalTestimonials;
use Modules\RentalStorefront\Http\Requests\UpdateRentalStorefrontSettingsRequest;
use Modules\RentalStorefront\Support\RentalStorefrontSettings;

class RentalStorefrontAdminController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $general = RentalGeneralSettings::all();

        return Inertia::render('Modules/RentalStorefront/Admin/Index', [
            'storefront' => RentalStorefrontSettings::all(),
            'testimonials' => RentalTestimonials::all(),
            'onlinePolicy' => [
                'passenger_booking_enabled' => (bool) ($general['passenger_booking_enabled'] ?? false),
                'pending_reserved_ttl_minutes' => (string) ($general['pending_reserved_ttl_minutes'] ?? '120'),
                'public_mask_plates' => (bool) ($general['public_mask_plates'] ?? true),
            ],
            'kpis' => $this->resolveStorefrontKpis(),
            'publicUrls' => $this->resolvePublicUrls(),
        ]);
    }

    public function updateSettings(UpdateRentalStorefrontSettingsRequest $request): RedirectResponse
    {
        RentalStorefrontSettings::update($request->validated());

        return back()->with('success', __('rental.messages.settings_updated'));
    }

    public function updateTestimonials(UpdateRentalTestimonialsRequest $request): RedirectResponse
    {
        RentalTestimonials::save($request->validated()['testimonials'] ?? []);

        return back()->with('success', __('rental.messages.settings_updated'));
    }

    public function updatePolicy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'passenger_booking_enabled' => ['required', 'boolean'],
            'pending_reserved_ttl_minutes' => ['required', 'numeric', 'min:5', 'max:10080'],
            'public_mask_plates' => ['required', 'boolean'],
        ]);

        $current = RentalGeneralSettings::all();
        $current['passenger_booking_enabled'] = (bool) $validated['passenger_booking_enabled'];
        $current['pending_reserved_ttl_minutes'] = $validated['pending_reserved_ttl_minutes'];
        $current['public_mask_plates'] = (bool) $validated['public_mask_plates'];

        RentalGeneralSettings::update($current);

        return back()->with('success', __('rental.messages.settings_updated'));
    }

    /**
     * @return array{online_bookings_count: int, portal_customers_count: int, pending_online_bookings: int}
     */
    protected function resolveStorefrontKpis(): array
    {
        $hasRentals = Schema::hasTable('rentals');
        $hasCustomers = Schema::hasTable('customers');

        $onlineBookingsCount = $hasRentals
            ? Rental::query()->whereNotNull('public_token')->count()
            : 0;

        $portalCustomersCount = $hasCustomers
            ? Customer::query()->whereNotNull('password')->count()
            : 0;

        $pendingOnlineBookings = $hasRentals
            ? Rental::query()
                ->whereNotNull('public_token')
                ->whereIn('status', ['reserved', 'pending_payment', 'pending_approval'])
                ->count()
            : 0;

        return [
            'online_bookings_count' => $onlineBookingsCount,
            'portal_customers_count' => $portalCustomersCount,
            'pending_online_bookings' => $pendingOnlineBookings,
        ];
    }

    /**
     * @return array{booking: string, portal: string, track: string}
     */
    protected function resolvePublicUrls(): array
    {
        return [
            'booking' => route('book.rental.search'),
            'portal' => route('book.rental.login'),
            'track' => route('book.rental.track'),
        ];
    }
}
