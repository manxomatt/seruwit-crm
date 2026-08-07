<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FleetBaseKind;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Receivables\Models\GatewayCharge;
use Modules\Receivables\Models\PaymentGatewayConfig;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalRate;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PublicRentalBookingTest extends TestCase
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
                'label' => 'Passenger rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );
    }

    public function test_search_is_unavailable_when_passenger_booking_disabled(): void
    {
        Setting::query()->where('key', 'rental.passenger_booking_enabled')->update(['value' => '0']);

        $this->get(route('book.rental.search'))->assertNotFound();
    }

    public function test_search_lists_available_vehicles(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'mpv',
            'name' => 'Avanza Silver',
            'plate_number' => 'B1234XYZ',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 350000,
            'deposit_amount' => 1000000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(3)->toDateString();

        $this->get(route('book.rental.search', [
            'start_date' => $start,
            'end_date' => $end,
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/Search')
                ->where('searched', true)
                ->has('vehicles', 1)
                ->where('vehicles.0.id', $vehicle->id)
                ->where('vehicles.0.from_price', 350000)
                ->where('vehicles.0.plate_number', 'B **** XYZ'));
    }

    public function test_search_lists_depot_bases_as_branch_options(): void
    {
        $depot = FleetBase::factory()->create([
            'name' => 'Depot Cakung',
            'kind' => FleetBaseKind::Depot->value,
            'status' => FleetBase::STATUS_ACTIVE,
            'city' => 'Jakarta',
        ]);
        FleetBase::factory()->create([
            'name' => 'Yard Only',
            'kind' => FleetBaseKind::Yard->value,
            'status' => FleetBase::STATUS_ACTIVE,
        ]);

        $this->get(route('book.rental.search'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/Search')
                ->has('locations', 1)
                ->where('locations.0.id', $depot->id)
                ->where('locations.0.name', 'Depot Cakung'));
    }

    public function test_search_defaults_dates_and_hides_vehicles_without_rate(): void
    {
        $bookable = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'economy',
            'name' => 'Bookable Car',
        ]);
        Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => null,
            'name' => 'No Class Car',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => null,
            'rental_class' => 'economy',
            'rate_per_period' => 250000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $this->get(route('book.rental.search'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/Search')
                ->where('searched', true)
                ->has('filters.start_date')
                ->has('filters.end_date')
                ->has('vehicles', 1)
                ->where('vehicles.0.id', $bookable->id)
                ->where('vehicles.0.from_price', 250000));
    }

    public function test_vehicle_show_and_booking_lifecycle(): void
    {
        $depot = FleetBase::factory()->create([
            'name' => 'Depot Sudirman',
            'kind' => FleetBaseKind::Depot->value,
            'status' => FleetBase::STATUS_ACTIVE,
            'address' => 'Jl. Sudirman 1',
            'city' => 'Jakarta',
        ]);
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'mpv',
            'name' => 'Avanza Silver',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 350000,
            'deposit_amount' => 1000000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(3)->toDateString();

        $this->get(route('book.rental.vehicles.show', [
            'vehicle' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'pickup_location_id' => $depot->id,
            'return_location_id' => $depot->id,
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/VehicleShow')
                ->where('quote.available', true)
                ->where('quote.total_periods', 3)
                ->where('quote.deposit_amount', 1000000));

        $phone = '081234567890';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->from(route('book.rental.vehicles.show', [
            'vehicle' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
        ]))
            ->post(route('book.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'customer_name' => 'Budi Santoso',
                'booker_phone' => $phone,
                'otp_code' => $otp,
                'pickup_location_id' => $depot->id,
                'return_location_id' => $depot->id,
            ])
            ->assertRedirect();

        $rental = Rental::query()->where('channel', Rental::CHANNEL_WEB)->first();
        $this->assertNotNull($rental);
        $this->assertSame(Rental::STATUS_PENDING_RESERVED, $rental->status);
        $this->assertSame('6281234567890', $rental->booker_phone);
        $this->assertNotNull($rental->public_token);
        $this->assertSame($depot->id, $rental->pickup_fleet_base_id);
        $this->assertSame($depot->id, $rental->return_fleet_base_id);
        $this->assertStringContainsString('Sudirman', (string) $rental->pickup_location);

        $this->get(route('book.rental.booking.show', $rental->public_token))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/Booking')
                ->where('booking.code', $rental->code)
                ->where('booking.can_pay_deposit', true)
                ->where('booking.cancel.can_cancel', true));

        $otpCancel = app(PassengerOtpService::class)->send($phone);

        $this->from(route('book.rental.booking.show', $rental->public_token))
            ->post(route('book.rental.booking.cancel', $rental->public_token), [
                'booker_phone' => $phone,
                'otp_code' => $otpCancel,
                'cancelled_reason' => 'Change of plans',
            ])
            ->assertRedirect(route('book.rental.booking.show', $rental->public_token));

        $this->assertSame(Rental::STATUS_CANCELLED, $rental->fresh()->status);
    }

    public function test_store_rejects_invalid_otp(): void
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

        $this->from(route('book.rental.vehicles.show', [
            'vehicle' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
        ]))
            ->post(route('book.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'customer_name' => 'Budi',
                'booker_phone' => '081211122233',
                'otp_code' => '000000',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('otp_code');

        $this->assertSame(0, Rental::query()->count());
    }

    public function test_zero_deposit_auto_confirms(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 150000,
            'deposit_amount' => 0,
            'is_active' => true,
        ]);

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(2)->toDateString();
        $phone = '081298765432';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->post(route('book.rental.bookings.store'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'period_type' => 'daily',
            'customer_name' => 'Siti',
            'booker_phone' => $phone,
            'otp_code' => $otp,
        ])->assertRedirect();

        $rental = Rental::query()->first();
        $this->assertNotNull($rental);
        $this->assertSame(Rental::CHANNEL_WEB, $rental->channel);
        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->status);
    }

    public function test_history_lists_passenger_bookings_after_otp(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 200000,
            'deposit_amount' => 0,
            'is_active' => true,
        ]);

        $phone = '081200011122';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->post(route('book.rental.bookings.store'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'period_type' => 'daily',
            'customer_name' => 'Andi',
            'booker_phone' => $phone,
            'otp_code' => $otp,
        ])->assertRedirect();

        // OTP was consumed by store; isVerified remains true for the phone.
        $this->get(route('book.rental.history', [
            'phone' => $phone,
            'otp_code' => '999999',
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/History')
                ->has('bookings', 1));
    }

    public function test_overlapping_booking_is_blocked(): void
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

        $phone = '081233344455';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->post(route('book.rental.bookings.store'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'period_type' => 'daily',
            'customer_name' => 'One',
            'booker_phone' => $phone,
            'otp_code' => $otp,
        ])->assertRedirect();

        $otp2 = app(PassengerOtpService::class)->send($phone);

        $this->from(route('book.rental.search'))
            ->post(route('book.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'customer_name' => 'Two',
                'booker_phone' => $phone,
                'otp_code' => $otp2,
            ])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame(1, Rental::query()->where('status', '!=', Rental::STATUS_CANCELLED)->count());
    }

    public function test_booking_with_email_sends_booked_mail(): void
    {
        \Illuminate\Support\Facades\Notification::fake();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'plate_number' => 'B 1234 XYZ']);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 200000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $phone = '081255566677';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->post(route('book.rental.bookings.store'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'period_type' => 'daily',
            'customer_name' => 'Rina',
            'customer_email' => 'rina@example.test',
            'booker_phone' => $phone,
            'otp_code' => $otp,
        ])->assertRedirect();

        $rental = Rental::query()->where('channel', Rental::CHANNEL_WEB)->first();
        $this->assertNotNull($rental);
        $this->assertSame('rina@example.test', $rental->partner?->email);

        \Illuminate\Support\Facades\Notification::assertSentOnDemand(
            \Modules\Rental\Notifications\RentalLifecycleMailNotification::class,
            function (\Modules\Rental\Notifications\RentalLifecycleMailNotification $mail, array $channels, object $notifiable): bool {
                return $mail->event === \Modules\Rental\Notifications\RentalLifecycleMailNotification::EVENT_BOOKED
                    && ($notifiable->routes['mail'] ?? null) === 'rina@example.test';
            },
        );
    }

    public function test_confirmed_cancel_within_window_charges_fee(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_free_cancel_hours'],
            ['group' => 'rental', 'value' => '48', 'type' => 'number', 'label' => 'x', 'is_public' => false, 'sort_order' => 15],
        );
        Setting::query()->updateOrCreate(
            ['key' => 'rental.cancellation_fee_type'],
            ['group' => 'rental', 'value' => 'fixed', 'type' => 'string', 'label' => 'x', 'is_public' => false, 'sort_order' => 11],
        );
        Setting::query()->updateOrCreate(
            ['key' => 'rental.cancellation_fee_amount'],
            ['group' => 'rental', 'value' => '100000', 'type' => 'number', 'label' => 'x', 'is_public' => false, 'sort_order' => 12],
        );

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $rental = Rental::factory()->confirmed()->create([
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '6281999888777',
            'public_token' => 'tokencancelfee'.str_repeat('x', 20),
            'vehicle_id' => $vehicle->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
            'base_amount' => 500000,
            'deposit_amount' => 0,
        ]);

        $assessment = app(\Modules\Rental\Support\RentalBookingPolicy::class)->passengerCancelAssessment($rental);
        $this->assertTrue($assessment['can_cancel']);
        $this->assertTrue($assessment['charge_fee']);
        $this->assertSame(100000.0, $assessment['fee_amount']);

        $phone = '081999888777';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->post(route('book.rental.booking.cancel', $rental->public_token), [
            'booker_phone' => $phone,
            'otp_code' => $otp,
            'cancelled_reason' => 'Too close to start',
        ])->assertRedirect();

        $this->assertSame(Rental::STATUS_CANCELLED_PAID, $rental->fresh()->status);
    }

    public function test_plate_masker_formats_spaced_plates(): void
    {
        $this->assertSame('B **** XYZ', \Modules\Rental\Support\RentalPlateMasker::mask('B 1234 XYZ', force: true));
        $this->assertSame('B **** XYZ', \Modules\Rental\Support\RentalPlateMasker::mask('B1234XYZ', force: true));
    }

    public function test_active_booking_can_request_extension_for_staff_approval(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $rental = Rental::factory()->active()->create([
            'vehicle_id' => $vehicle->id,
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '6281111222333',
            'public_token' => 'tokenextend'.str_repeat('a', 24),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'period_type' => 'daily',
            'rate_per_period' => 400000,
            'total_periods' => 3,
            'base_amount' => 1200000,
            'total_amount' => 1200000,
            'deposit_amount' => 0,
        ]);

        $phone = '081111222333';
        $otp = app(PassengerOtpService::class)->send($phone);
        $newEnd = now()->addDays(5)->toDateString();

        $this->from(route('book.rental.booking.show', $rental->public_token))
            ->post(route('book.rental.booking.extend_request', $rental->public_token), [
                'booker_phone' => $phone,
                'otp_code' => $otp,
                'new_end_date' => $newEnd,
                'notes' => 'Need a few more days',
            ])
            ->assertRedirect(route('book.rental.booking.show', $rental->public_token));

        $request = \Modules\Rental\Models\RentalExtensionRequest::query()
            ->where('rental_id', $rental->id)
            ->first();

        $this->assertNotNull($request);
        $this->assertSame(\Modules\Rental\Models\RentalExtensionRequest::STATUS_PENDING, $request->status);
        $this->assertSame($newEnd, $request->requested_end_date->toDateString());
        $this->assertSame(Rental::CHANNEL_WEB, $request->channel);
        $this->assertSame($rental->end_date->toDateString(), $rental->fresh()->end_date->toDateString());

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.extension_requests.approve', [$rental, $request]))
            ->assertRedirect();

        $this->assertSame($newEnd, $rental->fresh()->end_date->toDateString());
        $this->assertSame(
            \Modules\Rental\Models\RentalExtensionRequest::STATUS_APPROVED,
            $request->fresh()->status,
        );
    }

    public function test_passenger_can_upload_ktp_and_sim(): void
    {
        Storage::fake('public');

        $rental = Rental::factory()->pendingReserved()->create([
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '628999888777',
            'public_token' => 'tokendocs'.str_repeat('b', 26),
        ]);

        $phone = '08999888777';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->from(route('book.rental.booking.show', $rental->public_token))
            ->post(route('book.rental.booking.documents', $rental->public_token), [
                'booker_phone' => $phone,
                'otp_code' => $otp,
                'ktp' => UploadedFile::fake()->image('ktp.jpg'),
                'sim' => UploadedFile::fake()->image('sim.jpg'),
            ])
            ->assertRedirect(route('book.rental.booking.show', $rental->public_token));

        $rental->refresh();
        $this->assertNotNull($rental->passenger_ktp_path);
        $this->assertNotNull($rental->passenger_sim_path);
        Storage::disk('public')->assertExists($rental->passenger_ktp_path);
        Storage::disk('public')->assertExists($rental->passenger_sim_path);
    }

    public function test_passenger_can_pay_open_invoice_online(): void
    {
        PaymentGatewayConfig::query()->updateOrCreate([], [
            'provider' => PaymentGatewayConfig::PROVIDER_MIDTRANS,
            'is_enabled' => true,
            'is_production' => false,
            'server_key' => 'SB-Mid-server-test',
            'client_key' => 'SB-Mid-client-test',
            'merchant_id' => 'G123',
        ]);

        Http::fake([
            'app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-invoice-1',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-invoice-1',
            ], 201),
        ]);

        $rental = Rental::factory()->confirmed()->create([
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '628777666555',
            'public_token' => 'tokeninvoice'.str_repeat('c', 23),
            'deposit_amount' => 0,
            'base_amount' => 900000,
            'total_amount' => 900000,
        ]);

        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_BASE,
            'amount' => 900000,
            'description' => 'Base rental',
        ]);

        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $rental->partner_id,
            'subtotal' => 900000,
            'tax_amount' => 0,
            'total' => 900000,
            'amount_paid' => 0,
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Base rental',
            'amount' => 900000,
            'source_type' => $charge->getMorphClass(),
            'source_id' => $charge->id,
        ]);

        $phone = '08777666555';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->from(route('book.rental.booking.show', $rental->public_token))
            ->post(route('book.rental.booking.pay_invoice', $rental->public_token), [
                'booker_phone' => $phone,
                'otp_code' => $otp,
                'invoice_id' => $invoice->id,
            ])
            ->assertRedirect('https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-invoice-1');

        $this->assertDatabaseHas('gateway_charges', [
            'invoice_id' => $invoice->id,
            'purpose' => GatewayCharge::PURPOSE_INVOICE,
            'status' => GatewayCharge::STATUS_PENDING,
            'amount' => 900000,
        ]);
    }
}
