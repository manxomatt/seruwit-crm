<?php

namespace Tests\Feature\Modules\Shuttle;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttlePassenger;
use Modules\Shuttle\Models\ShuttleSetting;
use Modules\Shuttle\Support\PassengerBookingService;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PassengerBookingTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        ShuttleSetting::putMany([
            ShuttleSetting::KEY_PASSENGER_BOOKING_ENABLED => '1',
            ShuttleSetting::KEY_HOLD_TTL_MINUTES => '15',
        ]);
    }

    public function test_public_search_requires_channel_enabled(): void
    {
        ShuttleSetting::putMany([ShuttleSetting::KEY_PASSENGER_BOOKING_ENABLED => '0']);

        $this->get(route('book.shuttle.search'))->assertNotFound();
    }

    public function test_hold_reserves_seats_and_ticket_is_public(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $otp = app(PassengerOtpService::class);
        $code = $otp->send('08123456789');

        $this->post(route('book.shuttle.hold'), [
            'departure_id' => $departure->id,
            'passenger_count' => 2,
            'pickup_mode' => 'pool',
            'dropoff_mode' => 'pool',
            'booker_phone' => '08123456789',
            'otp_code' => $code,
            'passengers' => [
                ['name' => 'A'],
                ['name' => 'B'],
            ],
        ])->assertRedirect();

        $booking = ShuttleBooking::query()->where('channel', ShuttleBooking::CHANNEL_PASSENGER)->first();
        $this->assertNotNull($booking);
        $this->assertTrue($booking->seats_held);
        $this->assertSame(2, $departure->fresh()->seats_booked);
        $this->assertNotNull($booking->public_token);
        $this->assertSame(ShuttleBooking::STATUS_DRAFT, $booking->status);

        $this->get(route('book.shuttle.ticket', $booking->public_token))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Shuttle/Public/Ticket')
                ->where('booking.booking_number', $booking->booking_number));
    }

    public function test_expired_hold_releases_seats(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $service = app(PassengerBookingService::class);
        $booking = $service->hold([
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'unit_fare' => 200000,
            'pickup_mode' => 'pool',
            'dropoff_mode' => 'pool',
            'booker_phone' => '628111111111',
        ], [['name' => 'Solo']]);

        $booking->update(['hold_expires_at' => now()->subMinute()]);

        $this->assertSame(1, $service->releaseExpiredHolds());
        $this->assertSame(0, $departure->fresh()->seats_booked);
        $this->assertSame(ShuttleBooking::STATUS_EXPIRED, $booking->fresh()->status);
    }

    public function test_mark_paid_confirms_without_double_seat_increment(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $service = app(PassengerBookingService::class);
        $booking = $service->hold([
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'unit_fare' => 150000,
            'pickup_mode' => 'pool',
            'dropoff_mode' => 'pool',
            'booker_phone' => '628122222222',
        ], [['name' => 'Pay']]);
        ShuttlePassenger::query()->where('booking_id', $booking->id)->exists();

        $this->assertSame(1, $departure->fresh()->seats_booked);

        $confirmed = $service->markPaidAndConfirm($booking->fresh());

        $this->assertSame(ShuttleBooking::STATUS_CONFIRMED, $confirmed->status);
        $this->assertSame(ShuttleBooking::PAYMENT_PAID, $confirmed->payment_status);
        $this->assertFalse($confirmed->seats_held);
        $this->assertSame(1, $departure->fresh()->seats_booked);
    }

    public function test_passenger_cancel_releases_hold(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $service = app(PassengerBookingService::class);
        $booking = $service->hold([
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'unit_fare' => 100000,
            'pickup_mode' => 'pool',
            'dropoff_mode' => 'pool',
            'booker_phone' => '628133333333',
        ], [['name' => 'Cancel']]);

        $service->cancelPassenger($booking->fresh(), 'changed mind');

        $this->assertSame(0, $departure->fresh()->seats_booked);
        $this->assertSame(ShuttleBooking::STATUS_CANCELLED, $booking->fresh()->status);
    }

    public function test_door_hold_requires_pickup_coordinates(): void
    {
        $departure = ShuttleDeparture::factory()->door()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $otp = app(PassengerOtpService::class);
        $code = $otp->send('08123456780');

        $this->from(route('book.shuttle.search'))
            ->post(route('book.shuttle.hold'), [
                'departure_id' => $departure->id,
                'passenger_count' => 1,
                'pickup_mode' => 'door',
                'dropoff_mode' => 'door',
                'booker_phone' => '08123456780',
                'otp_code' => $code,
                'passengers' => [
                    ['name' => 'Door Rider'],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasErrors(['pickup_lat', 'pickup_lng', 'pickup_address', 'dropoff_lat', 'dropoff_lng', 'dropoff_address']);
    }

    public function test_door_hold_stores_pickup_coordinates(): void
    {
        $departure = ShuttleDeparture::factory()->door()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $otp = app(PassengerOtpService::class);
        $code = $otp->send('08123456781');

        $this->post(route('book.shuttle.hold'), [
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'pickup_mode' => 'door',
            'dropoff_mode' => 'door',
            'booker_phone' => '08123456781',
            'otp_code' => $code,
            'pickup_address' => 'Jl. Pickup 1',
            'pickup_lat' => -5.3971,
            'pickup_lng' => 105.2668,
            'dropoff_address' => 'Jl. Dropoff 2',
            'dropoff_lat' => -5.45,
            'dropoff_lng' => 105.27,
            'passengers' => [
                ['name' => 'Door Rider'],
            ],
        ])->assertRedirect();

        $booking = ShuttleBooking::query()->where('channel', ShuttleBooking::CHANNEL_PASSENGER)->first();
        $this->assertNotNull($booking);
        $this->assertSame(ShuttleBooking::MODE_DOOR, $booking->pickup_mode);
        $this->assertSame('Jl. Pickup 1', $booking->pickup_address);
        $this->assertEqualsWithDelta(-5.3971, (float) $booking->pickup_lat, 0.0001);
        $this->assertEqualsWithDelta(105.2668, (float) $booking->pickup_lng, 0.0001);
        $this->assertSame('Jl. Dropoff 2', $booking->dropoff_address);
        $this->assertEqualsWithDelta(-5.45, (float) $booking->dropoff_lat, 0.0001);
        $this->assertEqualsWithDelta(105.27, (float) $booking->dropoff_lng, 0.0001);
    }

    public function test_gateway_payment_recovers_expired_hold_when_seats_remain(): void
    {
        ShuttleSetting::putMany([
            ShuttleSetting::KEY_PASSENGER_BOOKING_ENABLED => '1',
            ShuttleSetting::KEY_HOLD_TTL_MINUTES => '15',
        ]);

        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $service = app(PassengerBookingService::class);
        $booking = $service->hold([
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'unit_fare' => 100000,
            'pickup_mode' => 'pool',
            'dropoff_mode' => 'pool',
            'booker_phone' => '628144444444',
        ], [['name' => 'Late Pay']]);

        $booking->update(['hold_expires_at' => now()->subMinute()]);
        $this->assertSame(1, $service->releaseExpiredHolds());
        $this->assertSame(ShuttleBooking::STATUS_EXPIRED, $booking->fresh()->status);
        $this->assertSame(0, $departure->fresh()->seats_booked);

        $confirmed = $service->fulfillGatewayPayment($booking->fresh(), [
            'payment_method' => 'transfer',
        ]);

        $this->assertSame(ShuttleBooking::STATUS_CONFIRMED, $confirmed->status);
        $this->assertSame(ShuttleBooking::PAYMENT_PAID, $confirmed->payment_status);
        $this->assertSame(1, $departure->fresh()->seats_booked);
    }

    public function test_public_geocode_reverse_is_available_without_auth(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'nominatim.openstreetmap.org/*' => \Illuminate\Support\Facades\Http::response([
                'display_name' => 'Bandar Lampung',
            ], 200),
        ]);

        $this->getJson(route('book.shuttle.geocode.reverse', [
            'lat' => -5.3971,
            'lng' => 105.2668,
        ]))
            ->assertOk()
            ->assertJsonPath('address', 'Bandar Lampung');
    }
}
