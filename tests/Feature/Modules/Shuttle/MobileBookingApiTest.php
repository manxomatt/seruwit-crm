<?php

namespace Tests\Feature\Modules\Shuttle;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Shuttle\Models\MobilePassengerToken;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttleSetting;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileBookingApiTest extends TestCase
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
            ShuttleSetting::KEY_PUBLIC_BRAND_NAME => 'Demo Travel',
            ShuttleSetting::KEY_PUBLIC_BRAND_COLOR => '#0f766e',
        ]);
    }

    public function test_health_and_bootstrap_are_public(): void
    {
        $this->getJson(route('mobile.v1.health'))
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('api_version', 1)
            ->assertHeader('X-Api-Version', '1');

        $this->getJson(route('mobile.v1.bootstrap'))
            ->assertOk()
            ->assertJsonPath('brand.name', 'Demo Travel')
            ->assertJsonPath('surfaces.shuttle.enabled', true)
            ->assertJsonPath('surfaces.rental.enabled', false)
            ->assertJsonPath('api_version', 1);
    }

    public function test_bootstrap_reports_disabled_surface_without_404(): void
    {
        ShuttleSetting::putMany([ShuttleSetting::KEY_PASSENGER_BOOKING_ENABLED => '0']);

        $this->getJson(route('mobile.v1.bootstrap'))
            ->assertOk()
            ->assertJsonPath('surfaces.shuttle.enabled', false);

        $this->getJson(route('mobile.v1.shuttle.corridors'))
            ->assertNotFound()
            ->assertJsonPath('code', 'passenger_booking_disabled');
    }

    public function test_otp_verify_issues_bearer_token(): void
    {
        $send = $this->postJson(route('mobile.v1.auth.otp.send'), [
            'phone' => '08123456789',
        ])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonStructure(['debug_code']);

        $response = $this->postJson(route('mobile.v1.auth.otp.verify'), [
            'phone' => '08123456789',
            'code' => $send->json('debug_code'),
        ])->assertOk()
            ->assertJsonStructure(['token', 'token_type', 'expires_at', 'phone']);

        $token = $response->json('token');
        $this->assertNotEmpty($token);
        $this->assertSame('628123456789', $response->json('phone'));

        $this->withToken($token)
            ->getJson(route('mobile.v1.auth.me'))
            ->assertOk()
            ->assertJsonPath('phone', '628123456789');
    }

    public function test_invalid_otp_is_rejected(): void
    {
        app(PassengerOtpService::class)->send('081200000001');

        $this->postJson(route('mobile.v1.auth.otp.verify'), [
            'phone' => '081200000001',
            'code' => '000000',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'otp_invalid');
    }

    public function test_hold_with_bearer_creates_ticket_and_history(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $token = $this->issueToken('081211122233');

        $response = $this->withToken($token)
            ->postJson(route('mobile.v1.shuttle.holds.store'), [
                'departure_id' => $departure->id,
                'passenger_count' => 2,
                'pickup_mode' => 'pool',
                'dropoff_mode' => 'pool',
                'passengers' => [
                    ['name' => 'A'],
                    ['name' => 'B'],
                ],
            ], [
                'Idempotency-Key' => (string) Str::uuid(),
            ])
            ->assertCreated()
            ->assertJsonPath('booking.passenger_count', 2)
            ->assertJsonStructure(['booking' => ['public_token', 'booking_number', 'qr_payload', 'hold_expires_at']]);

        $publicToken = $response->json('booking.public_token');
        $this->assertSame(2, $departure->fresh()->seats_booked);

        $this->getJson(route('mobile.v1.shuttle.tickets.show', $publicToken))
            ->assertOk()
            ->assertJsonPath('booking.public_token', $publicToken);

        $this->withToken($token)
            ->getJson(route('mobile.v1.shuttle.bookings'))
            ->assertOk()
            ->assertJsonPath('meta.count', 1)
            ->assertJsonPath('data.0.public_token', $publicToken);
    }

    public function test_hold_dual_mode_accepts_otp_without_bearer(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $code = app(PassengerOtpService::class)->send('081299988877');

        $this->postJson(route('mobile.v1.shuttle.holds.store'), [
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'pickup_mode' => 'pool',
            'dropoff_mode' => 'pool',
            'booker_phone' => '081299988877',
            'otp_code' => $code,
            'passengers' => [
                ['name' => 'Solo'],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('booking.booker_phone', '6281299988877');
    }

    public function test_hold_idempotency_replays_same_response(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $token = $this->issueToken('081233344455');
        $key = (string) Str::uuid();
        $payload = [
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'pickup_mode' => 'pool',
            'dropoff_mode' => 'pool',
            'passengers' => [
                ['name' => 'One'],
            ],
        ];

        $first = $this->withToken($token)
            ->postJson(route('mobile.v1.shuttle.holds.store'), $payload, ['Idempotency-Key' => $key])
            ->assertCreated();

        $this->withToken($token)
            ->postJson(route('mobile.v1.shuttle.holds.store'), $payload, ['Idempotency-Key' => $key])
            ->assertCreated()
            ->assertHeader('Idempotent-Replayed', 'true')
            ->assertJsonPath('booking.public_token', $first->json('booking.public_token'));

        $this->assertSame(1, ShuttleBooking::query()->where('channel', ShuttleBooking::CHANNEL_PASSENGER)->count());
        $this->assertSame(1, $departure->fresh()->seats_booked);
    }

    public function test_cancel_releases_hold(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $token = $this->issueToken('081255566677');

        $publicToken = $this->withToken($token)
            ->postJson(route('mobile.v1.shuttle.holds.store'), [
                'departure_id' => $departure->id,
                'passenger_count' => 1,
                'pickup_mode' => 'pool',
                'dropoff_mode' => 'pool',
                'passengers' => [['name' => 'X']],
            ])
            ->assertCreated()
            ->json('booking.public_token');

        $this->withToken($token)
            ->postJson(route('mobile.v1.shuttle.tickets.cancel', $publicToken), [
                'cancel_reason' => 'Changed mind',
            ])
            ->assertOk()
            ->assertJsonPath('booking.status', ShuttleBooking::STATUS_CANCELLED);

        $this->assertSame(0, $departure->fresh()->seats_booked);
    }

    public function test_corridors_and_departures_list(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 1,
            'status' => ShuttleDeparture::STATUS_OPEN,
            'depart_date' => now()->addDay()->toDateString(),
        ]);

        $this->getJson(route('mobile.v1.shuttle.corridors'))
            ->assertOk()
            ->assertJsonFragment(['id' => $departure->corridor_id]);

        $this->getJson(route('mobile.v1.shuttle.departures', [
            'date' => $departure->depart_date->toDateString(),
            'corridor_id' => $departure->corridor_id,
        ]))
            ->assertOk()
            ->assertJsonPath('data.0.id', $departure->id)
            ->assertJsonPath('meta.hold_ttl_minutes', 15);
    }

    public function test_logout_revokes_token(): void
    {
        $token = $this->issueToken('081277788899');

        $this->withToken($token)
            ->postJson(route('mobile.v1.auth.logout'))
            ->assertOk();

        $this->assertSame(0, MobilePassengerToken::query()->count());

        $this->withToken($token)
            ->getJson(route('mobile.v1.auth.me'))
            ->assertUnauthorized();
    }

    public function test_pay_requires_gateway(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $token = $this->issueToken('081200011122');
        $publicToken = $this->withToken($token)
            ->postJson(route('mobile.v1.shuttle.holds.store'), [
                'departure_id' => $departure->id,
                'passenger_count' => 1,
                'pickup_mode' => 'pool',
                'dropoff_mode' => 'pool',
                'passengers' => [['name' => 'Pay']],
            ])
            ->json('booking.public_token');

        // Receivables gateway typically unavailable without Midtrans config.
        $this->postJson(route('mobile.v1.shuttle.tickets.pay', $publicToken))
            ->assertStatus(503)
            ->assertJsonPath('code', 'gateway_unavailable');
    }

    private function issueToken(string $phone): string
    {
        $otp = app(PassengerOtpService::class);
        $code = $otp->send($phone);

        return $this->postJson(route('mobile.v1.auth.otp.verify'), [
            'phone' => $phone,
            'code' => $code,
        ])->json('token');
    }
}
