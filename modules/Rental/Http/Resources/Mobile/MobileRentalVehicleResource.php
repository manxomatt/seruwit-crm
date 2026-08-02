<?php

namespace Modules\Rental\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Fleet\Models\Vehicle;

/**
 * @mixin Vehicle
 */
class MobileRentalVehicleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Vehicle $vehicle */
        $vehicle = $this->resource;

        return [
            'id' => $vehicle->id,
            'name' => $vehicle->name,
            'plate_number' => $vehicle->plate_number,
            'type' => $vehicle->type,
            'rental_class' => $vehicle->rental_class,
            'brand' => $vehicle->brand,
            'model_year' => $vehicle->model_year,
            'color' => $vehicle->color,
            'capacity_seats' => $vehicle->capacity_seats,
            'fuel_type' => $vehicle->fuel_type,
            'photo_url' => $vehicle->photo_url,
            'status' => $vehicle->status,
        ];
    }
}
