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

    /**
     * Forward-geocode a text address or location query via OpenStreetMap Nominatim,
     * falling back to curated Indonesian geographic reference data if unavailable.
     *
     * @return array{address: string, latitude: float, longitude: float, city: string, province: string, zip: string}|null
     */
    public function forward(string $query): ?array
    {
        $cleanQuery = trim($query);
        if ($cleanQuery === '') {
            return null;
        }

        try {
            $response = Http::acceptJson()
                ->withHeaders([
                    'User-Agent' => config('app.name', 'SeruwitCRM').'/1.0 (location-map-picker)',
                ])
                ->timeout(3)
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $cleanQuery,
                    'format' => 'jsonv2',
                    'addressdetails' => 1,
                    'countrycodes' => 'id',
                    'limit' => 1,
                ]);

            if ($response->successful()) {
                $items = $response->json();
                if (is_array($items) && ! empty($items[0])) {
                    $item = $items[0];
                    if (isset($item['lat'], $item['lon'])) {
                        $addrDetails = is_array($item['address'] ?? null) ? $item['address'] : [];

                        $city = (string) ($addrDetails['city'] ?? $addrDetails['town'] ?? $addrDetails['municipality'] ?? $addrDetails['county'] ?? '');
                        $province = (string) ($addrDetails['state'] ?? '');
                        $zip = (string) ($addrDetails['postcode'] ?? '');

                        return [
                            'address' => (string) ($item['display_name'] ?? $cleanQuery),
                            'latitude' => (float) $item['lat'],
                            'longitude' => (float) $item['lon'],
                            'city' => $city,
                            'province' => $province,
                            'zip' => $zip,
                        ];
                    }
                }
            }
        } catch (\Throwable) {
            // Silently fall back to local dictionary
        }

        // Fallback to local Indonesian Geo Data
        $fallback = IndonesiaGeoData::findLocation($cleanQuery);
        if ($fallback) {
            return [
                'address' => $cleanQuery,
                'latitude' => (float) $fallback['lat'],
                'longitude' => (float) $fallback['lng'],
                'city' => $fallback['city'],
                'province' => $fallback['province'],
                'zip' => '',
            ];
        }

        // Fallback by postal code if 5 digits exist
        if (preg_match('/\b([1-9][0-9]{4})\b/', $cleanQuery, $zipMatches)) {
            $zipFallback = IndonesiaGeoData::findByPostalCode($zipMatches[1]);
            if ($zipFallback) {
                return [
                    'address' => $cleanQuery,
                    'latitude' => (float) $zipFallback['lat'],
                    'longitude' => (float) $zipFallback['lng'],
                    'city' => $zipFallback['city'],
                    'province' => $zipFallback['province'],
                    'zip' => $zipMatches[1],
                ];
            }
        }

        return null;
    }
}
