<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Support\FleetBaseKind;
use Modules\Partners\Models\Location;

/**
 * Fills pickup/return text snapshots from Fleet depot bases (preferred)
 * or legacy Partners Location master, and resolves one-way fee when branches differ.
 */
class RentalLocationHydrator
{
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function hydrate(array $data): array
    {
        $pickupFleetBaseId = $this->resolveFleetBaseId(
            $data['pickup_fleet_base_id'] ?? null,
            $data['pickup_location_id'] ?? null,
        );
        $returnFleetBaseId = $this->resolveFleetBaseId(
            $data['return_fleet_base_id'] ?? null,
            $data['return_location_id'] ?? null,
        );

        $pickupLocationId = null;
        $returnLocationId = null;

        if ($pickupFleetBaseId !== null) {
            $pickup = FleetBase::query()->find($pickupFleetBaseId);
            if ($pickup) {
                $data['pickup_fleet_base_id'] = $pickup->id;
                $data['pickup_location'] = $pickup->displayAddress();
                $pickupLocationId = $pickup->location_id;
            }
        } elseif (filled($data['pickup_location_id'] ?? null)) {
            $pickupLocationId = (int) $data['pickup_location_id'];
            $pickup = Location::query()->find($pickupLocationId);
            if ($pickup) {
                $data['pickup_location'] = $pickup->displayAddress();
            }
        }

        if ($returnFleetBaseId !== null) {
            $return = FleetBase::query()->find($returnFleetBaseId);
            if ($return) {
                $data['return_fleet_base_id'] = $return->id;
                $data['return_location'] = $return->displayAddress();
                $returnLocationId = $return->location_id;
            }
        } elseif (filled($data['return_location_id'] ?? null)) {
            $returnLocationId = (int) $data['return_location_id'];
            $return = Location::query()->find($returnLocationId);
            if ($return) {
                $data['return_location'] = $return->displayAddress();
            }
        }

        $data['pickup_location_id'] = $pickupLocationId;
        $data['return_location_id'] = $returnLocationId;
        $data['pickup_fleet_base_id'] = $pickupFleetBaseId;
        $data['return_fleet_base_id'] = $returnFleetBaseId;

        $isOneWay = $pickupFleetBaseId !== null && $returnFleetBaseId !== null && $pickupFleetBaseId !== $returnFleetBaseId;
        if (! $isOneWay) {
            $isOneWay = $pickupLocationId !== null && $returnLocationId !== null && $pickupLocationId !== $returnLocationId;
        }

        if ($isOneWay) {
            if (! array_key_exists('one_way_fee_amount', $data) || $data['one_way_fee_amount'] === null || $data['one_way_fee_amount'] === '') {
                $data['one_way_fee_amount'] = (float) Setting::getValue('rental.default_one_way_fee', '150000');
            }
        } else {
            $data['one_way_fee_amount'] = null;
        }

        return $data;
    }

    /**
     * Active depot bases for pickup / return branch selects.
     *
     * @return list<array{id: int, code: string, name: string, address: string|null, city: string|null, province: string|null, zip: string|null, latitude: string|null, longitude: string|null}>
     */
    public function depotOptions(): array
    {
        if (! Schema::hasTable('fleet_bases')) {
            return [];
        }

        return FleetBase::query()
            ->active()
            ->ofKind(FleetBaseKind::Depot)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'address', 'city', 'province', 'zip', 'latitude', 'longitude'])
            ->map(fn (FleetBase $base): array => [
                'id' => $base->id,
                'code' => $base->code,
                'name' => $base->name,
                'address' => $base->address,
                'city' => $base->city,
                'province' => $base->province,
                'zip' => $base->zip,
                'latitude' => $base->latitude !== null ? (string) $base->latitude : null,
                'longitude' => $base->longitude !== null ? (string) $base->longitude : null,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<\Illuminate\Contracts\Validation\ValidationRule|string>
     */
    public function depotIdRules(bool $required = false): array
    {
        $rules = [$required ? 'required' : 'nullable', 'integer'];

        if (Schema::hasTable('fleet_bases')) {
            $rules[] = Rule::exists('fleet_bases', 'id')
                ->where('kind', FleetBaseKind::Depot->value)
                ->where('status', FleetBase::STATUS_ACTIVE);
        }

        return $rules;
    }

    private function resolveFleetBaseId(mixed $explicitFleetBaseId, mixed $legacyLocationId): ?int
    {
        if (filled($explicitFleetBaseId)) {
            $id = (int) $explicitFleetBaseId;

            return $this->isDepotBase($id) ? $id : null;
        }

        if (! filled($legacyLocationId)) {
            return null;
        }

        $id = (int) $legacyLocationId;

        // Public / staff forms send depot ids in the legacy pickup_location_id field.
        return $this->isDepotBase($id) ? $id : null;
    }

    private function isDepotBase(int $id): bool
    {
        if (! Schema::hasTable('fleet_bases')) {
            return false;
        }

        return FleetBase::query()
            ->whereKey($id)
            ->active()
            ->ofKind(FleetBaseKind::Depot)
            ->exists();
    }
}
