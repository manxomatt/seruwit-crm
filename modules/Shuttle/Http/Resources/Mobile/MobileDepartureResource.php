<?php

namespace Modules\Shuttle\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Partners\Models\Location;
use Modules\Shuttle\Models\ShuttleDeparture;

/**
 * @mixin ShuttleDeparture
 */
class MobileDepartureResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ShuttleDeparture $departure */
        $departure = $this->resource;
        $origin = $departure->originPool ?? $departure->corridor?->originLocation;
        $destination = $departure->destinationPool ?? $departure->corridor?->destinationLocation;

        return [
            'id' => $departure->id,
            'departure_number' => $departure->departure_number,
            'depart_date' => $departure->depart_date?->toDateString(),
            'depart_time' => substr((string) $departure->depart_time, 0, 5),
            'seats_remaining' => $departure->seatsRemaining(),
            'seats_booked' => (int) $departure->seats_booked,
            'seat_capacity' => $departure->seat_capacity,
            'unit_fare' => (float) ($departure->corridor?->base_fare ?? 0),
            'service_type' => $departure->resolvedServiceType(),
            'corridor' => $departure->corridor ? [
                'id' => $departure->corridor->id,
                'name' => $departure->corridor->name,
            ] : null,
            'origin_pool' => $this->poolPin($origin),
            'destination_pool' => $this->poolPin($destination),
        ];
    }

    /**
     * @return array{latitude: string, longitude: string, address: string, name: string}|null
     */
    private function poolPin(?Location $location): ?array
    {
        if ($location === null || $location->latitude === null || $location->longitude === null) {
            return null;
        }

        return [
            'latitude' => (string) $location->latitude,
            'longitude' => (string) $location->longitude,
            'address' => filled($location->address) ? (string) $location->address : (string) $location->name,
            'name' => (string) $location->name,
        ];
    }
}
