<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobilePassengerApi;
use Modules\Shuttle\Http\Resources\Mobile\MobileBookingResource;
use Modules\Shuttle\Models\ShuttleBooking;

class BookingHistoryController extends Controller
{
    use InteractsWithMobilePassengerApi;

    public function __invoke(Request $request): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $phone = (string) $request->attributes->get('mobile_passenger_phone');

        $query = ShuttleBooking::query()
            ->where('channel', ShuttleBooking::CHANNEL_PASSENGER)
            ->where('booker_phone', $phone)
            ->with(['departure.corridor', 'passengers'])
            ->latest()
            ->limit(20);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $bookings = $query->get();

        return response()->json([
            'data' => MobileBookingResource::collection($bookings)->resolve(),
            'meta' => [
                'count' => $bookings->count(),
            ],
        ]);
    }
}
