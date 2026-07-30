<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Http\Requests\StoreBookingRequest;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Support\BookingConfirmationService;

class BookingController extends Controller
{
    public function index(): Response
    {
        $bookings = ShuttleBooking::query()
            ->with(['partner', 'departure.corridor'])
            ->when(request('status'), fn ($q, $status) => $q->where('status', $status))
            ->when(request('search'), function ($q) {
                $search = request('search');
                $q->where(function ($inner) use ($search) {
                    $inner->where('booking_number', 'like', "%{$search}%")
                        ->orWhereHas('partner', fn ($p) => $p->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Shuttle/Bookings/Index', [
            'bookings' => $bookings,
            'filters' => request()->only(['status', 'search']),
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('shuttle', 'create') ?? false,
                'confirm' => auth()->user()?->hasPermissionFor('shuttle', 'confirm') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Shuttle/Bookings/Create', [
            'departures' => ShuttleDeparture::query()
                ->with([
                    'corridor.originLocation:id,name,address,latitude,longitude',
                    'corridor.destinationLocation:id,name,address,latitude,longitude',
                    'originPool:id,name,address,latitude,longitude',
                    'destinationPool:id,name,address,latitude,longitude',
                ])
                ->whereIn('status', [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_OPTIMIZED])
                ->whereDate('depart_date', '>=', today())
                ->orderBy('depart_date')
                ->orderBy('depart_time')
                ->get()
                ->map(function (ShuttleDeparture $d) {
                    $origin = $d->originPool ?? $d->corridor?->originLocation;
                    $destination = $d->destinationPool ?? $d->corridor?->destinationLocation;

                    return [
                        'id' => $d->id,
                        'label' => sprintf(
                            '%s · %s · %s %s · %s (%d/%d)',
                            $d->departure_number,
                            $d->resolvedServiceType() === ShuttleCorridor::SERVICE_DOOR
                                ? __('shuttle.service.door')
                                : __('shuttle.service.pool'),
                            $d->depart_date?->toDateString(),
                            substr((string) $d->depart_time, 0, 5),
                            $d->corridor?->name,
                            $d->seats_booked,
                            $d->seat_capacity,
                        ),
                        'service_type' => $d->resolvedServiceType(),
                        'unit_fare' => $d->corridor?->base_fare,
                        'seats_remaining' => $d->seatsRemaining(),
                        'origin_pool' => $this->poolPin($origin),
                        'destination_pool' => $this->poolPin($destination),
                    ];
                }),
            'partners' => Partner::query()
                ->where('customer_rank', '>', 0)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
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

    public function store(StoreBookingRequest $request, BookingConfirmationService $confirmation): RedirectResponse
    {
        $data = $request->validated();
        $passengers = $data['passengers'] ?? [];
        unset($data['passengers']);

        $booking = DB::transaction(function () use ($data, $passengers, $confirmation, $request) {
            $departure = ShuttleDeparture::query()->with('corridor')->findOrFail($data['departure_id']);
            $unitFare = (float) $departure->corridor->base_fare;
            $count = (int) $data['passenger_count'];

            $booking = ShuttleBooking::query()->create([
                ...$data,
                'booking_number' => ShuttleBooking::nextNumber(),
                'booked_by' => $request->user()?->id,
                'status' => ShuttleBooking::STATUS_DRAFT,
                'unit_fare' => $unitFare,
                'total_fare' => $unitFare * $count,
            ]);

            $confirmation->syncPassengers($booking, $passengers);

            return $booking;
        });

        return redirect()->route('module.shuttle.bookings.show', $booking)
            ->with('success', __('shuttle.messages.booking_created'));
    }

    public function show(ShuttleBooking $booking): Response
    {
        $booking->load(['partner', 'departure.corridor', 'passengers', 'invoice']);

        return Inertia::render('Modules/Shuttle/Bookings/Show', [
            'booking' => $booking,
            'can' => [
                'confirm' => auth()->user()?->hasPermissionFor('shuttle', 'confirm') ?? false,
                'update' => auth()->user()?->hasPermissionFor('shuttle', 'update') ?? false,
            ],
        ]);
    }
}
