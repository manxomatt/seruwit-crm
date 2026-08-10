<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\Location;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttleSetting;
use Modules\Shuttle\Support\PassengerBookingService;
use Modules\Shuttle\Support\PassengerOtpService;
use Throwable;

/**
 * Public passenger self-booking (PWA). Tenant resolved by domain; no staff auth.
 */
class PublicPassengerBookingController extends Controller
{
    public function search(Request $request): Response
    {
        $this->ensureAvailable();

        $brand = $this->brand();
        $date = $request->string('date', now()->toDateString())->toString();
        $corridorId = $request->integer('corridor_id') ?: null;

        $corridors = ShuttleCorridor::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'origin_city', 'destination_city', 'service_type', 'base_fare']);

        $departures = collect();
        if ($corridorId) {
            $departures = ShuttleDeparture::query()
                ->with([
                    'corridor:id,name,base_fare,service_type,origin_location_id,destination_location_id',
                    'corridor.originLocation:id,name,address,latitude,longitude',
                    'corridor.destinationLocation:id,name,address,latitude,longitude',
                    'originPool:id,name,address,latitude,longitude',
                    'destinationPool:id,name,address,latitude,longitude',
                ])
                ->where('corridor_id', $corridorId)
                ->whereDate('depart_date', $date)
                ->whereIn('status', [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_OPTIMIZED])
                ->orderBy('depart_time')
                ->get()
                ->map(function (ShuttleDeparture $d) {
                    $origin = $d->originPool ?? $d->corridor?->originLocation;
                    $destination = $d->destinationPool ?? $d->corridor?->destinationLocation;

                    return [
                        'id' => $d->id,
                        'departure_number' => $d->departure_number,
                        'depart_date' => $d->depart_date?->toDateString(),
                        'depart_time' => substr((string) $d->depart_time, 0, 5),
                        'seats_remaining' => $d->seatsRemaining(),
                        'seats_booked' => (int) $d->seats_booked,
                        'seat_capacity' => $d->seat_capacity,
                        'unit_fare' => (float) ($d->corridor?->base_fare ?? 0),
                        'service_type' => $d->resolvedServiceType(),
                        'corridor' => $d->corridor ? [
                            'id' => $d->corridor->id,
                            'name' => $d->corridor->name,
                        ] : null,
                        'origin_pool' => $this->poolPin($origin),
                        'destination_pool' => $this->poolPin($destination),
                    ];
                });
        }

        return Inertia::render('Modules/Shuttle/Public/Search', [
            'brand' => $brand,
            'filters' => [
                'date' => $date,
                'corridor_id' => $corridorId,
            ],
            'corridors' => $corridors,
            'departures' => $departures,
            'hold_ttl_minutes' => (int) (ShuttleSetting::getValue(ShuttleSetting::KEY_HOLD_TTL_MINUTES, '15') ?? 15),
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function hold(Request $request, PassengerBookingService $bookings, PassengerOtpService $otp): RedirectResponse
    {
        $this->ensureAvailable();

        $data = $request->validate([
            'departure_id' => ['required', 'integer', 'exists:shuttle_departures,id'],
            'passenger_count' => ['required', 'integer', 'min:1', 'max:20'],
            'pickup_mode' => ['required', Rule::in([ShuttleBooking::MODE_POOL, ShuttleBooking::MODE_DOOR])],
            'dropoff_mode' => ['required', Rule::in([ShuttleBooking::MODE_POOL, ShuttleBooking::MODE_DOOR])],
            'booker_phone' => ['required', 'string', 'max:32'],
            'otp_code' => ['required', 'string', 'size:6'],
            'pickup_address' => ['nullable', 'required_if:pickup_mode,door', 'string', 'max:500'],
            'pickup_lat' => ['nullable', 'required_if:pickup_mode,door', 'numeric', 'between:-90,90'],
            'pickup_lng' => ['nullable', 'required_if:pickup_mode,door', 'numeric', 'between:-180,180'],
            'dropoff_address' => ['nullable', 'required_if:dropoff_mode,door', 'string', 'max:500'],
            'dropoff_lat' => ['nullable', 'required_if:dropoff_mode,door', 'numeric', 'between:-90,90'],
            'dropoff_lng' => ['nullable', 'required_if:dropoff_mode,door', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.name' => ['required', 'string', 'max:120'],
            'passengers.*.phone' => ['nullable', 'string', 'max:32'],
            'passengers.*.id_number' => ['nullable', 'string', 'max:64'],
        ]);

        $departure = ShuttleDeparture::query()->with('corridor')->findOrFail($data['departure_id']);

        if ($departure->resolvedServiceType() === ShuttleCorridor::SERVICE_POOL) {
            $data['pickup_mode'] = ShuttleBooking::MODE_POOL;
            $data['dropoff_mode'] = ShuttleBooking::MODE_POOL;
            $data['pickup_address'] = null;
            $data['pickup_lat'] = null;
            $data['pickup_lng'] = null;
            $data['dropoff_address'] = null;
            $data['dropoff_lat'] = null;
            $data['dropoff_lng'] = null;
        } elseif ($data['pickup_mode'] === ShuttleBooking::MODE_POOL
            && $data['dropoff_mode'] === ShuttleBooking::MODE_POOL) {
            return back()->withErrors([
                'pickup_mode' => __('shuttle.validation.door_product_requires_door'),
            ])->withInput();
        }

        try {
            if (! $this->assertOtp($otp, $data['booker_phone'], $data['otp_code'])) {
                return back()->withErrors(['otp_code' => __('shuttle.public.otp_invalid')])->withInput();
            }

            $booking = $bookings->hold([
                'departure_id' => (int) $data['departure_id'],
                'passenger_count' => (int) $data['passenger_count'],
                'unit_fare' => (float) ($departure->corridor?->base_fare ?? 0),
                'pickup_mode' => $data['pickup_mode'],
                'dropoff_mode' => $data['dropoff_mode'],
                'booker_phone' => $otp->normalize($data['booker_phone']),
                'booker_phone_verified_at' => now(),
                'pickup_address' => $data['pickup_address'] ?? null,
                'pickup_lat' => $data['pickup_lat'] ?? null,
                'pickup_lng' => $data['pickup_lng'] ?? null,
                'dropoff_address' => $data['dropoff_address'] ?? null,
                'dropoff_lat' => $data['dropoff_lat'] ?? null,
                'dropoff_lng' => $data['dropoff_lng'] ?? null,
                'notes' => $data['notes'] ?? null,
            ], $data['passengers']);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }

        return redirect()->route('book.shuttle.ticket', $booking->public_token)
            ->with('success', __('shuttle.public.hold_created'));
    }

    public function sendOtp(Request $request, PassengerOtpService $otp): JsonResponse|RedirectResponse
    {
        $this->ensureAvailable();

        $data = $request->validate([
            'booker_phone' => ['required', 'string', 'max:32'],
        ]);

        $code = $otp->send($data['booker_phone']);

        if ($request->wantsJson()) {
            $payload = ['ok' => true, 'message' => __('shuttle.public.otp_sent')];
            if (\App\Support\SystemMode::shouldExposeDebugOtp()) {
                $payload['debug_code'] = $code;
            }

            return response()->json($payload);
        }

        $redirect = back()->with('success', __('shuttle.public.otp_sent'));

        if (\App\Support\SystemMode::shouldExposeDebugOtp()) {
            $redirect->with('debug_otp', $code);
        }

        return $redirect;
    }

    public function ticket(string $token): Response
    {
        $this->ensureAvailable();

        $booking = ShuttleBooking::query()
            ->where('public_token', $token)
            ->where('channel', ShuttleBooking::CHANNEL_PASSENGER)
            ->with(['passengers', 'departure.corridor'])
            ->firstOrFail();

        return Inertia::render('Modules/Shuttle/Public/Ticket', [
            'brand' => $this->brand(),
            'booking' => $this->ticketPayload($booking),
            'gateway_available' => $this->gatewayAvailable(),
            'qr_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='.urlencode(
                url('/book/shuttle/ticket/'.$booking->public_token)
            ),
        ]);
    }

    public function cancel(Request $request, string $token, PassengerBookingService $bookings): RedirectResponse
    {
        $this->ensureAvailable();

        $booking = ShuttleBooking::query()
            ->where('public_token', $token)
            ->where('channel', ShuttleBooking::CHANNEL_PASSENGER)
            ->firstOrFail();

        $data = $request->validate([
            'cancel_reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $bookings->cancelPassenger($booking, $data['cancel_reason'] ?? null);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('book.shuttle.ticket', $token)
            ->with('success', __('shuttle.messages.booking_cancelled'));
    }

    public function history(Request $request, PassengerOtpService $otp): Response
    {
        $this->ensureAvailable();

        $phone = $request->string('phone')->toString();
        $otpCode = $request->string('otp_code')->toString();
        $bookings = [];

        if ($phone !== '' && $otpCode !== '' && $this->assertOtp($otp, $phone, $otpCode)) {
            $normalized = $otp->normalize($phone);
            $bookings = ShuttleBooking::query()
                ->where('channel', ShuttleBooking::CHANNEL_PASSENGER)
                ->where('booker_phone', $normalized)
                ->with(['departure.corridor', 'passengers'])
                ->latest()
                ->limit(20)
                ->get()
                ->map(fn (ShuttleBooking $b) => $this->ticketPayload($b))
                ->all();
        }

        return Inertia::render('Modules/Shuttle/Public/History', [
            'brand' => $this->brand(),
            'phone' => $phone,
            'bookings' => $bookings,
        ]);
    }

    public function pay(string $token): RedirectResponse
    {
        $this->ensureAvailable();

        $booking = ShuttleBooking::query()
            ->where('public_token', $token)
            ->where('channel', ShuttleBooking::CHANNEL_PASSENGER)
            ->firstOrFail();

        if ($booking->status !== ShuttleBooking::STATUS_DRAFT) {
            return back()->with('error', __('shuttle.public.pay_draft_only'));
        }

        if ($booking->isHoldExpired()) {
            return back()->with('error', __('shuttle.public.hold_expired'));
        }

        if (! class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)) {
            return back()->with('error', __('shuttle.public.gateway_unavailable'));
        }

        try {
            $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
                ->createShuttleBookingCharge($booking);

            $booking->update(['payment_status' => ShuttleBooking::PAYMENT_PENDING]);

            return redirect()->away($charge->redirect_url);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    private function ensureAvailable(): void
    {
        // Public booking is tenant-scoped. Central domains have no shuttle
        // schema; PHPUnit RefreshDatabase runs without tenancy but has tables.
        if (! tenancy()->initialized && ! app()->runningUnitTests()) {
            abort(404);
        }

        if (! Modules::available('shuttle') || ! Schema::hasTable('shuttle_settings')) {
            abort(404);
        }

        if (ShuttleSetting::getValue(ShuttleSetting::KEY_PASSENGER_BOOKING_ENABLED, '0') !== '1') {
            abort(404, __('shuttle.public.disabled'));
        }
    }

    /**
     * @return array{name: string, color: string}
     */
    private function brand(): array
    {
        $defaults = ShuttleSetting::defaults();
        $mapped = array_merge($defaults, ShuttleSetting::allMapped());

        return [
            'name' => $mapped[ShuttleSetting::KEY_PUBLIC_BRAND_NAME] ?: 'Travel',
            'color' => $mapped[ShuttleSetting::KEY_PUBLIC_BRAND_COLOR] ?: '#0f766e',
        ];
    }

    private function gatewayAvailable(): bool
    {
        return class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable();
    }

    private function assertOtp(PassengerOtpService $otp, string $phone, string $code): bool
    {
        if ($otp->isVerified($phone)) {
            return true;
        }

        return $otp->verify($phone, $code);
    }

    /**
     * @return array<string, mixed>
     */
    private function ticketPayload(ShuttleBooking $booking): array
    {
        return [
            'booking_number' => $booking->booking_number,
            'public_token' => $booking->public_token,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'passenger_count' => $booking->passenger_count,
            'total_fare' => (float) $booking->total_fare,
            'amount_due' => class_exists(\Modules\Shuttle\Support\ShuttleAccountingService::class)
                ? (float) app(\Modules\Shuttle\Support\ShuttleAccountingService::class)
                    ->splitFare((float) $booking->total_fare)['paid']
                : (float) $booking->total_fare,
            'hold_expires_at' => $booking->hold_expires_at?->toIso8601String(),
            'booker_phone' => $booking->booker_phone,
            'pickup_mode' => $booking->pickup_mode,
            'dropoff_mode' => $booking->dropoff_mode,
            'pickup_address' => $booking->pickup_address,
            'dropoff_address' => $booking->dropoff_address,
            'departure' => $booking->departure ? [
                'depart_date' => $booking->departure->depart_date?->toDateString(),
                'depart_time' => substr((string) $booking->departure->depart_time, 0, 5),
                'corridor' => $booking->departure->corridor?->name,
            ] : null,
            'passengers' => $booking->passengers->map(fn ($p) => [
                'name' => $p->name,
                'phone' => $p->phone,
                'seat_label' => $p->seat_label,
            ])->all(),
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
