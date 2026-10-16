<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\AI\DTO\KycDocumentResult;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\MobileRentalBookingService;
use Modules\Rental\Support\RentalWhatsAppSettings;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;

class PublicRentalSelfServiceCoreTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->withoutMiddleware([
            \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
            \Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
            \App\Http\Middleware\EnsureTenantIsActive::class,
            \App\Http\Middleware\CheckPermission::class,
            \App\Http\Middleware\RedirectUnfinishedSignup::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental_internal',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Passenger rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );

        Setting::query()->updateOrCreate(
            ['key' => 'rental.default_driver_rate'],
            [
                'group' => 'rental_internal',
                'value' => '150000',
                'type' => 'number',
                'label' => 'Default Driver Rate',
                'is_public' => false,
                'sort_order' => 35,
            ],
        );

        Setting::query()->updateOrCreate(
            ['key' => 'rental.default_airport_delivery_fee'],
            [
                'group' => 'rental_internal',
                'value' => '50000',
                'type' => 'number',
                'label' => 'Airport Delivery Fee',
                'is_public' => false,
                'sort_order' => 36,
            ],
        );
    }

    public function test_rental_model_service_type_helpers(): void
    {
        $selfDrive = new Rental(['service_type' => Rental::SERVICE_SELF_DRIVE]);
        $withDriver = new Rental(['service_type' => Rental::SERVICE_WITH_DRIVER]);

        $this->assertTrue($selfDrive->isSelfDrive());
        $this->assertFalse($selfDrive->isWithDriver());

        $this->assertTrue($withDriver->isWithDriver());
        $this->assertFalse($withDriver->isSelfDrive());
    }

    public function test_quote_calculates_driver_fee_for_with_driver_service(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->general()->create([
            'rate_per_period' => 300_000,
        ]);

        $service = app(MobileRentalBookingService::class);
        $startDate = now()->addDay()->toDateString();
        $endDate = now()->addDays(3)->toDateString(); // 3 days

        $quote = $service->quote([
            'vehicle_id' => $vehicle->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'period_type' => 'daily',
            'service_type' => Rental::SERVICE_WITH_DRIVER,
        ]);

        $this->assertTrue($quote['available']);
        $this->assertSame(Rental::SERVICE_WITH_DRIVER, $quote['service_type']);
        $this->assertSame(450_000.0, $quote['driver_fee_amount']); // 3 * 150_000
        $this->assertSame(900_000.0, $quote['base_amount']); // 3 * 300_000
        $this->assertSame(1_350_000.0, $quote['total_amount']); // 900_000 + 450_000
    }

    public function test_quote_calculates_airport_delivery_fee(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->general()->create([
            'rate_per_period' => 250_000,
        ]);

        $service = app(MobileRentalBookingService::class);
        $date = now()->addDay()->toDateString();

        $quote = $service->quote([
            'vehicle_id' => $vehicle->id,
            'start_date' => $date,
            'end_date' => $date, // 1 day
            'period_type' => 'daily',
            'service_type' => Rental::SERVICE_SELF_DRIVE,
            'delivery_type' => Rental::DELIVERY_AIRPORT,
            'return_delivery_type' => Rental::DELIVERY_AIRPORT,
        ]);

        $this->assertTrue($quote['available']);
        $this->assertSame(50_000.0, $quote['delivery_fee']);
        $this->assertSame(50_000.0, $quote['return_delivery_fee']);
        $this->assertSame(350_000.0, $quote['total_amount']); // 250_000 + 50_000 + 50_000
    }

    public function test_store_creates_booking_with_self_service_enhancements(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->general()->create([
            'rate_per_period' => 200_000,
            'deposit_amount' => 500_000,
        ]);

        $phone = '081234567890';
        $otpService = app(PassengerOtpService::class);
        $normalizedPhone = $otpService->normalize($phone);
        $code = $otpService->send($phone);

        $startDate = now()->addDay()->toDateString();
        $endDate = now()->addDays(2)->toDateString();

        $response = $this->post(route('book.rental.bookings.store'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'pickup_time' => '09:00',
            'return_time' => '18:00',
            'period_type' => 'daily',
            'service_type' => 'with_driver',
            'delivery_type' => 'airport',
            'delivery_address' => 'Terminal 3 Ultimate',
            'delivery_landmark' => 'Gate 2 Departure',
            'return_delivery_type' => 'depot',
            'customer_name' => 'Budi Santoso',
            'customer_email' => 'budi@example.com',
            'booker_phone' => $phone,
            'otp_code' => $code,
            'emergency_contact_name' => 'Siti Rahma',
            'emergency_contact_phone' => '08987654321',
            'emergency_contact_relation' => 'Spouse',
            'social_media_account' => '@budi_santoso',
        ]);

        if ($response->getSession()->get('error')) {
            $this->fail('Store failed with error: '.$response->getSession()->get('error'));
        }

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $rental = Rental::query()->where('booker_phone', $normalizedPhone)->first();
        $this->assertNotNull($rental);
        $this->assertSame('with_driver', $rental->service_type);
        $this->assertSame('airport', $rental->delivery_type);
        $this->assertSame('Terminal 3 Ultimate', $rental->delivery_address);
        $this->assertSame('Gate 2 Departure', $rental->delivery_landmark);
        $this->assertSame(50_000.0, (float) $rental->delivery_fee);
        $this->assertSame(300_000.0, (float) $rental->driver_fee_amount); // 2 days * 150_000
        $this->assertSame('Siti Rahma', $rental->emergency_contact_name);
        $this->assertSame('08987654321', $rental->emergency_contact_phone);
        $this->assertSame('Spouse', $rental->emergency_contact_relation);
        $this->assertSame('@budi_santoso', $rental->social_media_account);
    }

    public function test_upload_documents_accepts_guarantor_doc(): void
    {
        Storage::fake('public');

        $otpService = app(PassengerOtpService::class);
        $phone = '081234567890';
        $normalizedPhone = $otpService->normalize($phone);

        $rental = Rental::factory()->create([
            'public_token' => (string) \Illuminate\Support\Str::uuid(),
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => $normalizedPhone,
            'status' => Rental::STATUS_PENDING_RESERVED,
        ]);

        $code = $otpService->send($phone);

        $response = $this->post(route('book.rental.booking.documents', ['token' => $rental->public_token]), [
            'booker_phone' => '081234567890',
            'otp_code' => $code,
            'ktp' => UploadedFile::fake()->create('ktp.jpg', 200),
            'guarantor_doc' => UploadedFile::fake()->create('flight_ticket.pdf', 300),
            'guarantor_doc_type' => 'flight_ticket',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $rental->refresh();
        $this->assertNotNull($rental->passenger_ktp_path);
        $this->assertNotNull($rental->passenger_guarantor_doc_path);
        $this->assertSame('flight_ticket', $rental->passenger_guarantor_doc_type);
    }

    public function test_staff_upload_documents_accepts_guarantor_doc(): void
    {
        Storage::fake();
        $user = \App\Models\User::factory()->admin()->create();
        $this->actingAs($user);

        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_CONFIRMED,
        ]);

        $response = $this->post(route('module.rental.documents.upload', $rental), [
            'guarantor_doc' => UploadedFile::fake()->image('hotel_voucher.jpg'),
            'guarantor_doc_type' => 'hotel_booking',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $rental->refresh();
        $this->assertNotNull($rental->passenger_guarantor_doc_path);
        $this->assertSame('hotel_booking', $rental->passenger_guarantor_doc_type);
    }

    public function test_request_pickup_records_contract_signature(): void
    {
        Storage::fake();
        $otpService = app(PassengerOtpService::class);
        $phone = '081234567890';
        $normalizedPhone = $otpService->normalize($phone);

        $rental = Rental::factory()->create([
            'public_token' => (string) \Illuminate\Support\Str::uuid(),
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => $normalizedPhone,
            'status' => Rental::STATUS_CONFIRMED,
            'deposit_amount' => 0,
        ]);

        $code = $otpService->send($phone);

        // Valid data URI base64 PNG signature
        $dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->post(route('book.rental.booking.request_pickup', ['token' => $rental->public_token]), [
            'booker_phone' => '081234567890',
            'otp_code' => $code,
            'terms_agreed' => true,
            'customer_signature' => $dataUri,
            'pickup_notes' => 'Diantar depan lobby hotel jam 9 pagi',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $rental->refresh();
        $this->assertNotNull($rental->pickup_customer_signature_path);
        $this->assertNotNull($rental->contract_signature_path);
        $this->assertNotNull($rental->contract_signed_at);
        $this->assertSame('pending', $rental->pickup_request_status);
    }

    public function test_confirm_with_driver_service_auto_creates_duty_order(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $driver = \Modules\Fleet\Models\Driver::factory()->create();
        $partner = Partner::factory()->create();

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_DRAFT,
            'service_type' => Rental::SERVICE_WITH_DRIVER,
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(2),
            'delivery_address' => 'Hotel Grand Mercure',
        ]);

        $confirmService = app(\Modules\Rental\Support\RentalConfirmationService::class);
        $confirmedRental = $confirmService->confirm($rental);

        $this->assertSame(Rental::STATUS_CONFIRMED, $confirmedRental->status);
        $this->assertDatabaseHas('rental_duty_orders', [
            'rental_id' => $rental->id,
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'status' => \Modules\Rental\Models\RentalDutyOrder::STATUS_DRAFT,
        ]);
    }

    public function test_whatsapp_notifier_formats_self_service_booking_confirmed_message(): void
    {
        RentalWhatsAppSettings::update([
            'is_enabled' => true,
            'provider' => 'log',
            'send_on_booking_confirmed' => true,
        ]);

        $vehicle = Vehicle::factory()->create(['name' => 'Innova Zenix', 'plate_number' => 'B 1234 ABC']);
        $partner = Partner::factory()->create(['name' => 'Budi Santoso', 'phone' => '081234567890']);

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'code' => 'RNT-SELF-001',
            'service_type' => Rental::SERVICE_LEPAS_KUNCI,
            'delivery_type' => Rental::DELIVERY_AIRPORT,
            'delivery_address' => 'Terminal 3 Gate 4',
            'total_amount' => 1500000,
            'deposit_amount' => 500000,
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(3),
            'status' => Rental::STATUS_CONFIRMED,
        ]);

        $notifier = app(\Modules\Rental\Support\RentalWhatsAppNotifier::class);
        $sent = $notifier->sendBookingConfirmed($rental);

        $this->assertTrue($sent);
    }

    public function test_whatsapp_notifier_sends_driver_assignment_and_duty_order_notifications(): void
    {
        RentalWhatsAppSettings::update([
            'is_enabled' => true,
            'provider' => 'log',
            'send_on_driver_assigned' => true,
            'send_to_driver_on_duty' => true,
        ]);

        $vehicle = Vehicle::factory()->create(['name' => 'Toyota HiAce', 'plate_number' => 'B 9999 XYZ']);
        $driver = \Modules\Fleet\Models\Driver::factory()->create(['name' => 'Pak Joko', 'phone' => '081987654321']);
        $partner = Partner::factory()->create(['name' => 'Ibu Siti', 'phone' => '081234567890']);

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'partner_id' => $partner->id,
            'code' => 'RNT-DRV-002',
            'service_type' => Rental::SERVICE_WITH_DRIVER,
        ]);

        $dutyOrder = \Modules\Rental\Models\RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-TEST-001',
            'rental_id' => $rental->id,
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Hotel Indonesia Kempinski',
            'destination' => 'Bandara Soekarno Hatta',
            'departure_date' => now()->addDay()->toDateString(),
            'departure_time' => '06:00',
            'return_date' => now()->addDay()->toDateString(),
            'return_time' => '12:00',
            'passenger_name' => 'Ibu Siti',
            'passenger_phone' => '081234567890',
            'cash_advance_amount' => 200000,
            'status' => \Modules\Rental\Models\RentalDutyOrder::STATUS_DRAFT,
            'settlement_status' => \Modules\Rental\Models\RentalDutyOrder::SETTLEMENT_PENDING,
        ]);

        $notifier = app(\Modules\Rental\Support\RentalWhatsAppNotifier::class);
        $customerNotified = $notifier->sendDriverAssignedToCustomer($dutyOrder);
        $driverNotified = $notifier->sendDutyOrderToDriver($dutyOrder);

        $this->assertTrue($customerNotified);
        $this->assertTrue($driverNotified);
    }

    public function test_duty_order_creation_syncs_driver_id_to_rental(): void
    {
        $vehicle = Vehicle::factory()->create();
        $driver = \Modules\Fleet\Models\Driver::factory()->create();
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => null,
            'service_type' => Rental::SERVICE_WITH_DRIVER,
        ]);

        $this->assertNull($rental->driver_id);

        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('module.rental.duty_orders.store'), [
            'rental_id' => $rental->id,
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool Pusat',
            'destination' => 'Bandara',
            'departure_date' => now()->addDay()->toDateString(),
            'return_date' => now()->addDay()->toDateString(),
        ]);

        $response->assertSessionHasNoErrors();
        $rental->refresh();
        $this->assertSame($driver->id, $rental->driver_id);
    }

    public function test_customer_can_view_track_lookup_page(): void
    {
        $response = $this->get(route('book.rental.track'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Modules/Rental/Public/TrackLookup'));
    }

    public function test_customer_can_track_booking_by_code_and_phone(): void
    {
        $vehicle = Vehicle::factory()->create();
        $driver = \Modules\Fleet\Models\Driver::factory()->create(['name' => 'Bambang Driver']);
        $partner = Partner::factory()->create(['phone' => '081299887766']);
        $rental = Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'driver_id' => $driver->id,
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '081299887766',
            'public_token' => \Illuminate\Support\Str::random(40),
        ]);

        // Failed lookup (wrong phone)
        $badResponse = $this->post(route('book.rental.track.find'), [
            'booking_code' => $rental->code,
            'phone' => '089999999999',
        ]);
        $badResponse->assertSessionHas('error');

        // Successful lookup
        $goodResponse = $this->post(route('book.rental.track.find'), [
            'booking_code' => strtolower($rental->code),
            'phone' => '081299887766',
        ]);
        $goodResponse->assertRedirect(route('book.rental.booking.show', $rental->public_token));

        // Check show payload contains timeline, driver, and pdf_urls
        $showResponse = $this->get(route('book.rental.booking.show', $rental->public_token));
        $showResponse->assertOk();
        $showResponse->assertInertia(fn ($page) => $page
            ->component('Modules/Rental/Public/Booking')
            ->has('booking.tracking_timeline')
            ->where('booking.driver.name', 'Bambang Driver')
            ->has('booking.pdf_urls.contract')
        );
    }

    public function test_customer_can_download_contract_and_handover_pdf_via_public_token(): void
    {
        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->active()->create([
            'vehicle_id' => $vehicle->id,
            'channel' => Rental::CHANNEL_WEB,
            'start_fuel_level' => 'full',
            'checkout_checklist' => ['exterior_body' => true],
            'public_token' => \Illuminate\Support\Str::random(40),
        ]);

        $contractResponse = $this->get(route('book.rental.booking.contract_pdf', $rental->public_token));
        $contractResponse->assertOk();
        $contractResponse->assertHeader('Content-Type', 'application/pdf');

        $handoverResponse = $this->get(route('book.rental.booking.handover_pdf', $rental->public_token));
        $handoverResponse->assertOk();
        $handoverResponse->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_customer_can_scan_ktp_via_public_ocr(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'rental.ai_kyc_enabled'],
            ['group' => 'rental_internal', 'value' => '1', 'type' => 'boolean', 'label' => 'AI KYC']
        );

        $partner = Partner::factory()->create([
            'name' => 'Budi Santoso',
            'phone' => '081234567890',
        ]);

        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '081234567890',
            'public_token' => \Illuminate\Support\Str::random(40),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ]);

        $this->mock(DocumentKycServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('scanSingleDocument')
                ->once()
                ->andReturn([
                    'doc_type' => 'ktp',
                    'confidence' => 0.95,
                    'data' => [
                        'nik' => '3271012345670001',
                        'name' => 'BUDI SANTOSO',
                        'birth_date' => '1990-05-12',
                        'address' => 'Jl. Sudirman No. 45, Jakarta',
                    ],
                    'raw' => [],
                ]);
        });

        $file = UploadedFile::fake()->image('ktp.jpg');

        $response = $this->postJson(route('book.rental.booking.ocr', $rental->public_token), [
            'file' => $file,
            'doc_type' => 'ktp',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.doc_type', 'ktp')
            ->assertJsonPath('result.data.nik', '3271012345670001')
            ->assertJsonPath('result.data.name', 'BUDI SANTOSO')
            ->assertJsonPath('validation.checks.nik_16_digits.passed', true)
            ->assertJsonPath('validation.checks.name_match.passed', true);
    }

    public function test_customer_can_scan_sim_via_public_ocr(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'rental.ai_kyc_enabled'],
            ['group' => 'rental_internal', 'value' => '1', 'type' => 'boolean', 'label' => 'AI KYC']
        );

        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'channel' => Rental::CHANNEL_WEB,
            'public_token' => \Illuminate\Support\Str::random(40),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ]);

        $this->mock(DocumentKycServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('scanSingleDocument')
                ->once()
                ->andReturn([
                    'doc_type' => 'sim',
                    'confidence' => 0.92,
                    'data' => [
                        'license_number' => '900512345678',
                        'name' => 'BUDI SANTOSO',
                        'expires_at' => now()->addYears(3)->format('Y-m-d'),
                    ],
                    'raw' => [],
                ]);
        });

        $file = UploadedFile::fake()->image('sim.jpg');

        $response = $this->postJson(route('book.rental.booking.ocr', $rental->public_token), [
            'file' => $file,
            'doc_type' => 'sim',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.doc_type', 'sim')
            ->assertJsonPath('result.data.license_number', '900512345678')
            ->assertJsonPath('validation.checks.sim_expiry.passed', true);
    }

    public function test_public_ocr_fails_gracefully_when_disabled(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'rental.ai_kyc_enabled'],
            ['group' => 'rental_internal', 'value' => '0', 'type' => 'boolean', 'label' => 'AI KYC']
        );

        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'channel' => Rental::CHANNEL_WEB,
            'public_token' => \Illuminate\Support\Str::random(40),
        ]);

        $file = UploadedFile::fake()->image('ktp.jpg');

        $response = $this->postJson(route('book.rental.booking.ocr', $rental->public_token), [
            'file' => $file,
            'doc_type' => 'ktp',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_customer_upload_documents_syncs_partner_identity_and_triggers_ai_kyc(): void
    {
        Storage::fake('local');

        Setting::query()->updateOrCreate(
            ['key' => 'rental.ai_kyc_enabled'],
            ['group' => 'rental_internal', 'value' => '1', 'type' => 'boolean', 'label' => 'AI KYC']
        );

        $otpService = app(PassengerOtpService::class);
        $phone = '081234567890';
        $normalizedPhone = $otpService->normalize($phone);

        $partner = Partner::factory()->create([
            'phone' => $normalizedPhone,
            'id_number' => null,
            'license_number' => null,
        ]);

        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => $normalizedPhone,
            'status' => Rental::STATUS_PENDING_RESERVED,
            'public_token' => \Illuminate\Support\Str::random(40),
        ]);

        $code = $otpService->send($phone);

        $this->mock(DocumentKycServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('analyzeRentalKyc')
                ->once()
                ->andReturn(new KycDocumentResult(
                    status: 'verified',
                    riskLevel: 'low',
                    riskScore: 95,
                    summary: 'KTP valid dan sesuai',
                    ktp: [
                        'nik' => '3271012345670001',
                        'name' => 'BUDI SANTOSO',
                        'birth_date' => '1990-05-12',
                        'address' => 'Jl. Sudirman',
                        'religion' => 'Islam',
                        'occupation' => 'Wiraswasta',
                        'confidence' => 0.95,
                    ],
                ));
        });

        $ktpFile = UploadedFile::fake()->create('ktp.jpg', 200);
        $simFile = UploadedFile::fake()->create('sim.jpg', 200);

        $response = $this->post(route('book.rental.booking.documents', $rental->public_token), [
            'booker_phone' => $phone,
            'otp_code' => $code,
            'ktp' => $ktpFile,
            'sim' => $simFile,
            'id_number' => '3271012345670001',
            'license_number' => '900512345678',
            'license_expires_at' => now()->addYears(2)->toDateString(),
            'birth_date' => '1990-05-12',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $rental->refresh();
        $this->assertNotNull($rental->passenger_ktp_path);
        $this->assertNotNull($rental->passenger_sim_path);

        $partner->refresh();
        $this->assertSame('3271012345670001', $partner->id_number);
        $this->assertSame('900512345678', $partner->license_number);
    }
}
