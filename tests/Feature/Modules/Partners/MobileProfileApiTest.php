<?php

namespace Tests\Feature\Modules\Partners;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileProfileApiTest extends TestCase
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

    public function test_unauthenticated_user_cannot_access_profile_or_delete_account(): void
    {
        $this->getJson(route('mobile.v1.auth.profile.show'))
            ->assertUnauthorized();

        $this->putJson(route('mobile.v1.auth.profile.update'), ['name' => 'John'])
            ->assertUnauthorized();

        $this->deleteJson(route('mobile.v1.auth.account.delete'))
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_get_full_profile(): void
    {
        $phone = '081234567890';
        $token = $this->issueToken($phone);

        $partner = Partner::query()->where('phone', '6281234567890')->first();
        $partner->update([
            'name' => 'Ahmad Dahlan',
            'email' => 'ahmad@example.com',
            'address' => 'Jl. Sudirman No. 10, Jakarta',
        ]);

        $this->withToken($token)
            ->getJson(route('mobile.v1.auth.profile.show'))
            ->assertOk()
            ->assertJsonPath('profile.name', 'Ahmad Dahlan')
            ->assertJsonPath('profile.phone', '6281234567890')
            ->assertJsonPath('profile.email', 'ahmad@example.com')
            ->assertJsonPath('profile.address', 'Jl. Sudirman No. 10, Jakarta')
            ->assertJsonPath('profile.kyc_status', Partner::KYC_STATUS_UNVERIFIED);
    }

    public function test_authenticated_user_can_update_profile_and_avatar(): void
    {
        Storage::fake('public');

        $phone = '081234567890';
        $token = $this->issueToken($phone);

        $avatar = UploadedFile::fake()->image('avatar.jpg', 300, 300);

        $response = $this->withToken($token)
            ->postJson(route('mobile.v1.auth.profile.update'), [
                'name' => 'Budi Gunawan',
                'email' => 'budi.gunawan@example.com',
                'address' => 'Bandung, Jawa Barat',
                'avatar' => $avatar,
                'emergency_contact_name' => 'Siti Rahma',
                'emergency_contact_phone' => '081299887766',
                'emergency_contact_relationship' => 'Istri',
            ]);

        $response->assertOk()
            ->assertJsonPath('profile.name', 'Budi Gunawan')
            ->assertJsonPath('profile.email', 'budi.gunawan@example.com')
            ->assertJsonPath('profile.emergency_contact.name', 'Siti Rahma');

        $partner = Partner::query()->where('phone', '6281234567890')->first();
        $this->assertSame('Budi Gunawan', $partner->name);
        $this->assertSame('budi.gunawan@example.com', $partner->email);
        $this->assertNotNull($partner->picture_url);
        Storage::disk('public')->assertExists($partner->picture_url);
    }

    public function test_user_with_active_rental_cannot_delete_account(): void
    {
        $phone = '081234567890';
        $token = $this->issueToken($phone);

        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        Rental::factory()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'booker_phone' => '6281234567890',
            'status' => Rental::STATUS_CONFIRMED,
        ]);

        $this->withToken($token)
            ->deleteJson(route('mobile.v1.auth.account.delete'))
            ->assertStatus(400)
            ->assertJsonPath('code', 'active_rentals_exist');

        $this->assertNull($partner->fresh()->deleted_at);
    }

    public function test_user_without_active_rental_can_delete_account(): void
    {
        $phone = '081234567890';
        $token = $this->issueToken($phone);

        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $this->withToken($token)
            ->deleteJson(route('mobile.v1.auth.account.delete'))
            ->assertOk()
            ->assertJsonPath('ok', true);

        // Partner soft deleted
        $this->assertSoftDeleted('partners', ['id' => $partner->id]);

        // Tokens revoked
        $this->assertDatabaseMissing('mobile_passenger_tokens', ['phone' => '6281234567890']);

        // Subsequent requests with token should be unauthenticated
        $this->withToken($token)
            ->getJson(route('mobile.v1.auth.profile.show'))
            ->assertUnauthorized();
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
