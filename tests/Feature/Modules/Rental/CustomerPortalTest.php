<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\Models\Customer;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CustomerPortalTest extends TestCase
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

    public function test_login_page_renders_for_guest(): void
    {
        $response = $this->get(route('book.rental.login'));
        $response->assertOk();
    }

    public function test_register_page_renders_for_guest(): void
    {
        $response = $this->get(route('book.rental.register'));
        $response->assertOk();
    }

    public function test_send_otp_for_customer_login(): void
    {
        $response = $this->postJson(route('book.rental.login.otp'), [
            'phone' => '081234567890',
        ]);

        $response->assertOk()
            ->assertJson([
                'ok' => true,
            ]);
    }

    public function test_verify_otp_logs_in_customer_and_creates_account_if_new(): void
    {
        $phone = '081234567890';
        $normalized = app(PassengerOtpService::class)->normalize($phone);
        $code = app(PassengerOtpService::class)->send($phone);

        $response = $this->post(route('book.rental.login.verify_otp'), [
            'phone' => $phone,
            'otp_code' => $code,
        ]);

        $response->assertRedirect(route('book.rental.portal.dashboard'));
        $this->assertTrue(auth('customer')->check());
        $this->assertSame($normalized, auth('customer')->user()->phone);
        $this->assertNotNull(auth('customer')->user()->partner_id);
    }

    public function test_customer_can_register_with_password(): void
    {
        $response = $this->post(route('book.rental.register.submit'), [
            'name' => 'Budi Santoso',
            'phone' => '081987654321',
            'email' => 'budi.santoso@example.com',
            'password' => 'secret12345',
            'password_confirmation' => 'secret12345',
        ]);

        $response->assertRedirect(route('book.rental.portal.dashboard'));
        $this->assertTrue(auth('customer')->check());
        $customer = auth('customer')->user();
        $this->assertSame('Budi Santoso', $customer->name);
        $this->assertTrue(Hash::check('secret12345', $customer->password));
    }

    public function test_customer_can_login_with_password(): void
    {
        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Citra Dewi',
            'phone' => '628111222333',
            'email' => 'citra@example.com',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Citra Dewi',
            'phone' => '628111222333',
            'email' => 'citra@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $response = $this->post(route('book.rental.login.password'), [
            'login' => '628111222333',
            'password' => 'password123',
        ]);

        $response->assertRedirect(route('book.rental.portal.dashboard'));
        $this->assertTrue(auth('customer')->check());
        $this->assertSame('Citra Dewi', auth('customer')->user()->name);
    }

    public function test_unauthenticated_customer_portal_redirects_to_login(): void
    {
        $response = $this->get(route('book.rental.portal.dashboard'));
        $response->assertRedirect(route('book.rental.login'));
    }

    public function test_authenticated_customer_can_access_portal_pages(): void
    {
        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Doni Siregar',
            'phone' => '628555666777',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Doni Siregar',
            'phone' => '628555666777',
            'is_active' => true,
        ]);

        $this->actingAs($customer, 'customer');

        $this->get(route('book.rental.portal.dashboard'))->assertOk();
        $this->get(route('book.rental.portal.rentals.index'))->assertOk();
        $this->get(route('book.rental.portal.documents.index'))->assertOk();
        $this->get(route('book.rental.portal.profile'))->assertOk();
    }

    public function test_customer_can_update_profile_and_password(): void
    {
        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Eko Prasetyo',
            'phone' => '628777888999',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Eko Prasetyo',
            'phone' => '628777888999',
            'is_active' => true,
        ]);

        $this->actingAs($customer, 'customer');

        $updateResponse = $this->put(route('book.rental.portal.profile.update'), [
            'name' => 'Eko Prasetyo Updated',
            'email' => 'eko.updated@example.com',
            'phone' => '08777888999',
        ]);

        $updateResponse->assertRedirect();
        $this->assertSame('Eko Prasetyo Updated', $customer->fresh()->name);
        $this->assertSame('eko.updated@example.com', $customer->fresh()->email);

        $pwResponse = $this->put(route('book.rental.portal.profile.password'), [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $pwResponse->assertRedirect();
        $this->assertTrue(Hash::check('newpassword123', $customer->fresh()->password));
    }

    public function test_customer_can_upload_kyc_documents(): void
    {
        Storage::fake('public');

        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Fajar Nugraha',
            'phone' => '628999000111',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Fajar Nugraha',
            'phone' => '628999000111',
            'is_active' => true,
        ]);

        $this->actingAs($customer, 'customer');

        $ktpFile = UploadedFile::fake()->image('ktp.jpg');
        $simFile = UploadedFile::fake()->image('sim.jpg');

        $response = $this->post(route('book.rental.portal.documents.update'), [
            'ktp' => $ktpFile,
            'sim' => $simFile,
            'id_number' => '3201234567890001',
            'license_number' => '987654321012',
        ]);

        $response->assertRedirect();
        $partner->refresh();
        $this->assertNotNull($partner->id_card_photo_path);
        $this->assertNotNull($partner->driver_license_photo_path);
        $this->assertSame('3201234567890001', $partner->id_number);
        $this->assertSame('987654321012', $partner->license_number);
        $this->assertSame(Partner::KYC_STATUS_PENDING, $partner->kyc_status);
    }

    public function test_customer_booking_inherits_kyc_documents_and_bypasses_otp(): void
    {
        Storage::fake('public');

        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Gita Gutawa',
            'phone' => '628123456789',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
            'id_card_photo_path' => 'rental_docs/partner_ktp.jpg',
            'driver_license_photo_path' => 'rental_docs/partner_sim.jpg',
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Gita Gutawa',
            'phone' => '628123456789',
            'is_active' => true,
        ]);

        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'city_car',
            'name' => 'Brio Satya',
            'plate_number' => 'B5555XYZ',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $this->actingAs($customer, 'customer');

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(2)->toDateString();

        $response = $this->post(route('book.rental.bookings.store'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'period_type' => 'daily',
            'customer_name' => 'Gita Gutawa',
            'customer_email' => 'gita@example.com',
            'booker_phone' => '08123456789',
            // No otp_code required for authenticated customer
        ]);

        $response->assertRedirect();
        $rental = Rental::query()->where('partner_id', $partner->id)->first();
        $this->assertNotNull($rental);
        $this->assertSame('rental_docs/partner_ktp.jpg', $rental->passenger_ktp_path);
        $this->assertSame('rental_docs/partner_sim.jpg', $rental->passenger_sim_path);
    }

    public function test_customer_logout(): void
    {
        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Hendra Setiawan',
            'phone' => '628333444555',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Hendra Setiawan',
            'phone' => '628333444555',
            'is_active' => true,
        ]);

        $this->actingAs($customer, 'customer');
        $this->assertTrue(auth('customer')->check());

        $response = $this->post(route('book.rental.logout'));
        $response->assertRedirect(route('book.rental.search'));
        $this->assertFalse(auth('customer')->check());
    }

    public function test_customer_can_scan_ktp_document_via_ocr(): void
    {
        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Budi Santoso',
            'phone' => '628112233445',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Budi Santoso',
            'phone' => '628112233445',
            'is_active' => true,
        ]);

        $this->mock(DocumentKycServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('scanSingleDocument')
                ->once()
                ->andReturn([
                    'doc_type' => 'ktp',
                    'confidence' => 0.94,
                    'data' => [
                        'nik' => '3271012345670001',
                        'name' => 'BUDI SANTOSO',
                        'birth_date' => '1990-05-12',
                        'address' => 'Jl. Sudirman No. 45, Jakarta',
                    ],
                    'raw' => [],
                ]);
        });

        $this->actingAs($customer, 'customer');

        $file = UploadedFile::fake()->image('ktp.jpg');

        $response = $this->postJson(route('book.rental.portal.documents.scan'), [
            'file' => $file,
            'doc_type' => 'ktp',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.doc_type', 'ktp')
            ->assertJsonPath('result.data.nik', '3271012345670001')
            ->assertJsonPath('result.data.name', 'BUDI SANTOSO');
    }

    public function test_customer_can_scan_sim_document_via_ocr(): void
    {
        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Budi Santoso',
            'phone' => '628112233445',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Budi Santoso',
            'phone' => '628112233445',
            'is_active' => true,
        ]);

        $this->mock(DocumentKycServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('scanSingleDocument')
                ->once()
                ->andReturn([
                    'doc_type' => 'sim',
                    'confidence' => 0.92,
                    'data' => [
                        'license_number' => '900512345678',
                        'license_type' => 'SIM A',
                        'name' => 'BUDI SANTOSO',
                        'expires_at' => '2028-11-15',
                    ],
                    'raw' => [],
                ]);
        });

        $this->actingAs($customer, 'customer');

        $file = UploadedFile::fake()->image('sim.jpg');

        $response = $this->postJson(route('book.rental.portal.documents.scan'), [
            'file' => $file,
            'doc_type' => 'sim',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.doc_type', 'sim')
            ->assertJsonPath('result.data.license_number', '900512345678')
            ->assertJsonPath('result.data.license_type', 'SIM A');
    }

    public function test_customer_can_view_rentals_with_vehicles_on_portal(): void
    {
        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'name' => 'Faisal Basri',
            'phone' => '6281999888777',
            'sub_type' => 'customer',
            'account_type' => 'individual',
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'partner_id' => $partner->id,
            'name' => 'Faisal Basri',
            'phone' => '6281999888777',
            'is_active' => true,
        ]);

        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'mpv',
            'fuel_type' => 'petrol',
            'name' => 'Innova Reborn',
            'plate_number' => 'B1234ABC',
        ]);

        $rental = Rental::query()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'code' => Rental::nextCode(),
            'public_token' => \Illuminate\Support\Str::random(32),
            'status' => Rental::STATUS_ACTIVE,
            'channel' => Rental::CHANNEL_WEB,
            'booker_name' => 'Faisal Basri',
            'booker_phone' => '6281999888777',
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
            'period_type' => 'daily',
            'total_periods' => 2,
            'rate_per_period' => 500000,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
            'deposit_amount' => 500000,
        ]);

        $this->actingAs($customer, 'customer');

        $this->get(route('book.rental.portal.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('activeRentals.0.vehicle.rental_class_label'));

        $this->get(route('book.rental.portal.rentals.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('rentals.data.0.vehicle.rental_class_label'));

        $this->get(route('book.rental.portal.rentals.show', $rental->code))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('rental.vehicle.rental_class_label', 'MPV')
                ->has('rental.vehicle.fuel_label')
            );
    }
}
