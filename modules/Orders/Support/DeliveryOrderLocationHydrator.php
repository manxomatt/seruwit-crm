<?php

namespace Modules\Orders\Support;

use Modules\Partners\Models\Location;

/**
 * Fills snapshot address / coordinate columns from master locations so PDFs,
 * trip stops, and legacy text matching keep working after a location is chosen.
 */
class DeliveryOrderLocationHydrator
{
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function hydrate(array $data): array
    {
        $pickupId = filled($data['pickup_location_id'] ?? null) ? (int) $data['pickup_location_id'] : null;
        $deliveryId = filled($data['delivery_location_id'] ?? null) ? (int) $data['delivery_location_id'] : null;

        $data['pickup_location_id'] = $pickupId;
        $data['delivery_location_id'] = $deliveryId;

        if ($pickupId) {
            $pickup = Location::query()->find($pickupId);
            if ($pickup) {
                $data['pickup_address'] = $pickup->displayAddress();
            }
        }

        if ($deliveryId) {
            $delivery = Location::query()->find($deliveryId);
            if ($delivery) {
                $data['delivery_address'] = $delivery->displayAddress();
                if ($delivery->latitude !== null && $delivery->longitude !== null) {
                    $data['delivery_lat'] = (float) $delivery->latitude;
                    $data['delivery_lng'] = (float) $delivery->longitude;
                }
            }
        }

        return $data;
    }
}
