<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Throwable;

/**
 * Server-side renderer for the Rental "Bridge Blocks" embedded in GrapesJS
 * pages. A page stores only a lightweight marker (e.g.
 * <rental-fleet type="featured" limit="6">); this class turns that marker into
 * live HTML at render time, following the same pattern as the Carousel block.
 * It runs on the public, unauthenticated tenant site, so every path must fail
 * closed (return an empty string) rather than throw.
 */
class RentalStorefrontBlocks
{
    private const MIN_LIMIT = 1;

    private const MAX_LIMIT = 12;

    /**
     * Render the featured-fleet grid. Returns an empty string when the block
     * cannot be shown (module off, self-booking disabled, no bookable units,
     * or any error) so a marketing page never breaks.
     */
    public static function renderFleet(string $type = 'featured', int $limit = 6, ?string $class = null): string
    {
        if (! self::storefrontEnabled()) {
            return '';
        }

        $limit = max(self::MIN_LIMIT, min(self::MAX_LIMIT, $limit));

        try {
            $cards = self::fleetCards($limit, $class);

            if ($cards === []) {
                return '';
            }

            return View::make('rental::storefront.fleet', [
                'cards' => $cards,
                'type' => $type,
                'searchUrl' => route('book.rental.search'),
            ])->render();
        } catch (Throwable) {
            return '';
        }
    }

    /**
     * Render the curated testimonials grid. Returns an empty string when there
     * is nothing published or the module is unavailable, so a page never breaks.
     */
    public static function renderReviews(int $limit = 6): string
    {
        if (! Modules::available('rental')) {
            return '';
        }

        $limit = max(self::MIN_LIMIT, min(self::MAX_LIMIT, $limit));

        try {
            $items = array_slice(RentalTestimonials::published(), 0, $limit);

            if ($items === []) {
                return '';
            }

            return View::make('rental::storefront.reviews', [
                'items' => $items,
            ])->render();
        } catch (Throwable) {
            return '';
        }
    }

    private static function storefrontEnabled(): bool
    {
        return Modules::available('rental')
            && Schema::hasTable('rentals')
            && Schema::hasTable('vehicles')
            && Setting::getValue('rental.passenger_booking_enabled', '0') === '1';
    }

    /**
     * @return list<array{id: int, name: string, rental_class_label: string|null, capacity_seats: int|null, photo_url: string|null, from_price: float|null, url: string}>
     */
    private static function fleetCards(int $limit, ?string $class): array
    {
        $rates = app(RentalRateResolver::class);
        $start = now()->toDateString();
        $end = now()->addDays(2)->toDateString();

        $validClass = $class !== null && in_array($class, VehicleRentalClass::values(), true) ? $class : null;

        $vehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->when($validClass, fn ($query) => $query->where('rental_class', $validClass))
            ->orderBy('name')
            ->get();

        $cards = [];

        foreach ($vehicles as $vehicle) {
            $rate = $rates->suggest($vehicle, $start, $end, 'daily');

            if ($rate === null) {
                continue;
            }

            $cards[] = [
                'id' => $vehicle->id,
                'name' => (string) $vehicle->name,
                'rental_class_label' => $vehicle->rental_class
                    ? VehicleRentalClass::label((string) $vehicle->rental_class)
                    : null,
                'capacity_seats' => $vehicle->capacity_seats,
                'photo_url' => $vehicle->photo_url,
                'from_price' => (float) $rate->rate_per_period,
                'url' => route('book.rental.vehicles.show', $vehicle->id),
            ];

            if (count($cards) >= $limit) {
                break;
            }
        }

        return $cards;
    }
}
