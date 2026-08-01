<?php

namespace Modules\Shuttle\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Shuttle\Models\ShuttleCorridor;

/**
 * @mixin ShuttleCorridor
 */
class MobileCorridorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'origin_city' => $this->origin_city,
            'destination_city' => $this->destination_city,
            'service_type' => $this->service_type,
            'base_fare' => (float) $this->base_fare,
        ];
    }
}
