<?php

namespace Modules\Inventory\Support;

use Illuminate\Support\Facades\Http;
use RuntimeException;

final class NominatimGeocoder
{
    /**
     * Reverse-geocode coordinates via OpenStreetMap Nominatim.
     *
     * @return array{address: string, latitude: float, longitude: float}
     */
    public function reverse(float $latitude, float $longitude): array
    {
        $response = Http::acceptJson()
            ->withHeaders([
                'User-Agent' => config('app.name', 'SeruwitCRM').'/1.0 (warehouse-location-picker)',
            ])
            ->timeout(8)
            ->get('https://nominatim.openstreetmap.org/reverse', [
                'lat' => $latitude,
                'lon' => $longitude,
                'format' => 'jsonv2',
                'addressdetails' => 1,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(__('inventory.messages.geocode_failed'));
        }

        $displayName = trim((string) $response->json('display_name', ''));

        if ($displayName === '') {
            throw new RuntimeException(__('inventory.messages.geocode_not_found'));
        }

        return [
            'address' => $displayName,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ];
    }
}
