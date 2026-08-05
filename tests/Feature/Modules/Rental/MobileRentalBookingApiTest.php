<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileRentalBookingApiTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Mobile rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );
    }

    public function test_bootstrap_reports_rental_surface_when_enabled(): void
    {
        $this->getJson(route('mobile.v1.bootstrap'))
            ->assertOk()
            ->assertJsonPath('surfaces.rental.enabled', true)
            ->assertJsonPath('surfaces.rental.period_types.0', 'daily');
    }

    public function test_rental_catalog_requires_channel_enabled(): void
    {
        Setting::query()->where('key', 'rental.passenger_booking_enabled')->update(['value' => '0']);

        $this->getJson(route('mobile.v1.rental.vehicles.index'))
            ->assertNotFound()
            ->assertJsonPath('code', 'passenger_booking_disabled');
    }

    public function test_vehicles_and_quote_and_booking_lifecycle(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'mpv',
            'name' => 'Avanza Silver',
            'color' => 'Silver',
            'model_year' => 2024,
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 350000,
            'deposit_amount' => 1000000,
            'name' => 'Avanza Daily',
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(3)->toDateString();

        $this->getJson(route('mobile.v1.rental.classes'))
            ->assertOk()
            ->assertJsonPath('meta.count', 5);

        $this->getJson(route('mobile.v1.rental.vehicles.index', [
            'start_date' => $start,
            'end_date' => $end,
            'available_only' => true,
        ]))
            ->assertOk()
            ->assertJsonPath('data.0.id', $vehicle->id)
            ->assertJsonPath('data.0.color', 'Silver');

        $this->postJson(route('mobile.v1.rental.quotes'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'period_type' => 'daily',
        ])
            ->assertOk()
            ->assertJsonPath('quote.available', true)
            ->assertJsonPath('quote.total_periods', 3)
            ->assertJsonPath('quote.rate_per_period', 350000)
            ->assertJsonPath('quote.deposit_amount', 1000000)
            ->assertJsonPath('quote.base_amount', 1050000);

        $token = $this->issueToken('081234567890');

        $booking = $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'customer_name' => 'Budi Santoso',
            ], [
                'Idempotency-Key' => (string) Str::uuid(),
            ])
            ->assertCreated()
            ->assertJsonPath('booking.status', Rental::STATUS_PENDING_RESERVED)
            ->assertJsonPath('booking.vehicle.id', $vehicle->id)
            ->assertJsonStructure(['booking' => ['public_token', 'code', 'deposit_amount', 'reserved_until']]);

        $publicToken = $booking->json('booking.public_token');
        $this->assertNotEmpty($publicToken);

        $rental = Rental::query()->where('public_token', $publicToken)->first();
        $this->assertSame(Rental::CHANNEL_MOBILE, $rental->channel);
        $this->assertSame('6281234567890', $rental->booker_phone);
        $this->assertNotNull($rental->partner_id);

        $this->getJson(route('mobile.v1.rental.bookings.show', $publicToken))
            ->assertOk()
            ->assertJsonPath('booking.public_token', $publicToken);

        $this->withToken($token)
            ->getJson(route('mobile.v1.rental.bookings.index'))
            ->assertOk()
            ->assertJsonPath('meta.count', 1)
            ->assertJsonPath('data.0.public_token', $publicToken);

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.pay_deposit', $publicToken))
            ->assertStatus(503)
            ->assertJsonPath('code', 'gateway_unavailable');

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.cancel', $publicToken), [
                'cancelled_reason' => 'Change of plans',
            ])
            ->assertOk()
            ->assertJsonPath('booking.status', Rental::STATUS_CANCELLED);

        $this->assertSame(Rental::STATUS_CANCELLED, $rental->fresh()->status);
    }

    public function test_booking_blocks_overlapping_vehicle(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 200000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $start = now()->addDays(2)->toDateString();
        $end = now()->addDays(4)->toDateString();
        $token = $this->issueToken('081211122233');

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
            ])
            ->assertCreated();

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
            ])
            ->assertStatus(422);
    }

    private function issueToken(string $phone): string
    {
        $code = app(PassengerOtpService::class)->send($phone);

        return $this->postJson(route('mobile.v1.auth.otp.verify'), [
            'phone' => $phone,
            'code' => $code,
        ])->json('token');
    }
}
