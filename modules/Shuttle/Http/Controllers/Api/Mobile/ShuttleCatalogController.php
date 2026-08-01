<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobilePassengerApi;
use Modules\Shuttle\Http\Resources\Mobile\MobileCorridorResource;
use Modules\Shuttle\Http\Resources\Mobile\MobileDepartureResource;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;

class ShuttleCatalogController extends Controller
{
    use InteractsWithMobilePassengerApi;

    public function corridors(): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $corridors = ShuttleCorridor::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => MobileCorridorResource::collection($corridors)->resolve(),
        ]);
    }

    public function departures(Request $request): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'corridor_id' => ['required', 'integer', 'exists:shuttle_corridors,id'],
        ]);

        $departures = ShuttleDeparture::query()
            ->with([
                'corridor:id,name,base_fare,service_type,origin_location_id,destination_location_id',
                'corridor.originLocation:id,name,address,latitude,longitude',
                'corridor.destinationLocation:id,name,address,latitude,longitude',
                'originPool:id,name,address,latitude,longitude',
                'destinationPool:id,name,address,latitude,longitude',
            ])
            ->where('corridor_id', $data['corridor_id'])
            ->whereDate('depart_date', $data['date'])
            ->whereIn('status', [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_OPTIMIZED])
            ->orderBy('depart_time')
            ->get();

        return response()->json([
            'data' => MobileDepartureResource::collection($departures)->resolve(),
            'meta' => [
                'date' => $data['date'],
                'corridor_id' => (int) $data['corridor_id'],
                'hold_ttl_minutes' => $this->holdTtlMinutes(),
            ],
        ]);
    }
}
