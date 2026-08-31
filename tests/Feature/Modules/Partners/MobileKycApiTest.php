<?php

namespace Tests\Feature\Modules\Partners;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileKycApiTest extends TestCase
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

    public function test_unauthenticated_user_cannot_access_kyc_endpoints(): void
    {
        $this->getJson(route('mobile.v1.auth.kyc.show'))
            ->assertUnauthorized();

        $this->postJson(route('mobile.v1.auth.kyc.submit'))
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_get_initial_unverified_kyc_status(): void
    {
        $token = $this->issueToken('081234567890');

        $this->withToken($token)
            ->getJson(route('mobile.v1.auth.kyc.show'))
            ->assertOk()
            ->assertJsonPath('kyc.status', Partner::KYC_STATUS_UNVERIFIED)
            ->assertJsonPath('kyc.is_verified', false)
            ->assertJsonPath('kyc.is_pending', false);
    }

    public function test_authenticated_user_can_submit_kyc_documents(): void
    {
        Storage::fake('public');

        $token = $this->issueToken('081234567890');

        $idCardFile = UploadedFile::fake()->image('ktp.jpg', 600, 400);
        $licenseFile = UploadedFile::fake()->image('sim.png', 600, 400);
        $selfieFile = UploadedFile::fake()->image('selfie.jpg', 400, 400);

        $response = $this->withToken($token)
            ->postJson(route('mobile.v1.auth.kyc.submit'), [
                'id_number' => '3201123456780001',
                'license_number' => '123456789012',
                'license_expires_at' => now()->addYears(3)->toDateString(),
                'id_card_photo' => $idCardFile,
                'driver_license_photo' => $licenseFile,
                'selfie_photo' => $selfieFile,
                'emergency_contact_name' => 'Jane Doe',
                'emergency_contact_phone' => '081298765432',
                'emergency_contact_relationship' => 'Spouse',
            ]);

        $response->assertOk()
            ->assertJsonPath('kyc.status', Partner::KYC_STATUS_PENDING)
            ->assertJsonPath('kyc.is_pending', true)
            ->assertJsonPath('kyc.is_verified', false)
            ->assertJsonPath('kyc.emergency_contact.name', 'Jane Doe');

        $partner = Partner::query()->where('phone', '6281234567890')->first();
        $this->assertNotNull($partner);
        $this->assertSame(Partner::KYC_STATUS_PENDING, $partner->kyc_status);
        $this->assertSame('3201123456780001', $partner->id_number);
        $this->assertSame('123456789012', $partner->license_number);
        $this->assertNotNull($partner->id_card_photo_path);
        $this->assertNotNull($partner->driver_license_photo_path);
        $this->assertNotNull($partner->selfie_photo_path);

        Storage::disk('public')->assertExists($partner->id_card_photo_path);
        Storage::disk('public')->assertExists($partner->driver_license_photo_path);
        Storage::disk('public')->assertExists($partner->selfie_photo_path);

        // Fetch status again via GET
        $this->withToken($token)
            ->getJson(route('mobile.v1.auth.kyc.show'))
            ->assertOk()
            ->assertJsonPath('kyc.status', Partner::KYC_STATUS_PENDING)
            ->assertJsonPath('kyc.is_pending', true);
    }

    public function test_kyc_validation_rejects_missing_required_fields(): void
    {
        $token = $this->issueToken('081234567890');

        $this->withToken($token)
            ->postJson(route('mobile.v1.auth.kyc.submit'), [
                'id_number' => '',
                'license_expires_at' => now()->subDay()->toDateString(), // expired
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['id_number', 'license_number', 'license_expires_at', 'id_card_photo', 'driver_license_photo']);
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
