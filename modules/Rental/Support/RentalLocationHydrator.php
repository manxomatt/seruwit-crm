<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use Modules\Partners\Models\Location;

/**
 * Fills pickup/return text snapshots from Partners Location master
 * and resolves one-way fee when branches differ.
 */
class RentalLocationHydrator
{
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function hydrate(array $data): array
    {
        $pickupId = filled($data['pickup_location_id'] ?? null) ? (int) $data['pickup_location_id'] : null;
        $returnId = filled($data['return_location_id'] ?? null) ? (int) $data['return_location_id'] : null;

        $data['pickup_location_id'] = $pickupId;
        $data['return_location_id'] = $returnId;

        if ($pickupId) {
            $pickup = Location::query()->find($pickupId);
            if ($pickup) {
                $data['pickup_location'] = $pickup->displayAddress();
            }
        }

        if ($returnId) {
            $return = Location::query()->find($returnId);
            if ($return) {
                $data['return_location'] = $return->displayAddress();
            }
        }

        $isOneWay = $pickupId !== null && $returnId !== null && $pickupId !== $returnId;

        if ($isOneWay) {
            if (! array_key_exists('one_way_fee_amount', $data) || $data['one_way_fee_amount'] === null || $data['one_way_fee_amount'] === '') {
                $data['one_way_fee_amount'] = (float) Setting::getValue('rental.default_one_way_fee', '150000');
            }
        } else {
            $data['one_way_fee_amount'] = null;
        }

        return $data;
    }
}
