<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Reverse-geocode coordinates via OpenStreetMap Nominatim.
 *
 * Lives in core so map pickers (Partners, Orders, Shuttle, Inventory, …) can
 * resolve an address without depending on any vertical module.
 */
final class NominatimGeocoder
{
    /**
     * @return array{address: string, latitude: float, longitude: float}
     */
    public function reverse(float $latitude, float $longitude): array
    {
        $response = Http::acceptJson()
            ->withHeaders([
                'User-Agent' => config('app.name', 'SeruwitCRM').'/1.0 (location-map-picker)',
            ])
            ->timeout(8)
            ->get('https://nominatim.openstreetmap.org/reverse', [
                'lat' => $latitude,
                'lon' => $longitude,
                'format' => 'jsonv2',
                'addressdetails' => 1,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(__('common.geocode.failed'));
        }

        $displayName = trim((string) $response->json('display_name', ''));

        if ($displayName === '') {
            throw new RuntimeException(__('common.geocode.not_found'));
        }

        return [
            'address' => $displayName,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ];
    }
}
