<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileRentalManualTransferTest extends TestCase
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

    public function test_can_get_payment_methods_and_bank_accounts(): void
    {
        CompanyBankAccount::query()->create([
            'name' => 'BCA Operasional',
            'kind' => CompanyBankAccount::KIND_BANK,
            'bank_name' => 'BCA',
            'account_number' => '8880011223',
            'account_holder' => 'PT Rental Sukses',
            'is_active' => true,
            'is_default' => true,
            'currency' => 'IDR',
        ]);

        CompanyBankAccount::query()->create([
            'name' => 'Mandiri Bisnis',
            'kind' => CompanyBankAccount::KIND_BANK,
            'bank_name' => 'Bank Mandiri',
            'account_number' => '142000998877',
            'account_holder' => 'PT Rental Sukses',
            'is_active' => true,
            'is_default' => false,
            'currency' => 'IDR',
        ]);

        $this->getJson(route('mobile.v1.rental.payment_methods'))
            ->assertOk()
            ->assertJsonPath('bank_accounts.0.bank_name', 'BCA')
            ->assertJsonPath('bank_accounts.0.account_number', '8880011223')
            ->assertJsonPath('bank_accounts.0.account_holder', 'PT Rental Sukses')
            ->assertJsonPath('bank_accounts.1.bank_name', 'Bank Mandiri');
    }

    public function test_authenticated_customer_can_upload_deposit_proof(): void
    {
        Storage::fake('public');

        $phone = '081234567890';
        $token = $this->issueToken($phone);
        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $bank = CompanyBankAccount::query()->create([
            'name' => 'BCA Utama',
            'kind' => CompanyBankAccount::KIND_BANK,
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'PT Rental Sukses',
            'is_active' => true,
            'is_default' => true,
            'currency' => 'IDR',
        ]);

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'booker_phone' => '6281234567890',
            'status' => Rental::STATUS_PENDING_RESERVED,
            'deposit_amount' => 500000,
            'deposit_status' => Rental::DEPOSIT_HELD,
        ]);

        $proofFile = UploadedFile::fake()->image('struk_transfer.jpg', 600, 800);

        $response = $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.deposit_proof', $rental->public_token), [
                'deposit_proof' => $proofFile,
                'company_bank_account_id' => $bank->id,
                'notes' => 'Transfer via BCA Mobile jam 10 pagi',
            ]);

        $response->assertOk()
            ->assertJsonPath('booking.deposit_payment_method', 'transfer')
            ->assertJsonPath('booking.deposit_proof.status', Rental::PROOF_PENDING)
            ->assertJsonPath('booking.deposit_proof.company_bank_account_id', $bank->id);

        $rental->refresh();
        $this->assertSame('transfer', $rental->deposit_payment_method);
        $this->assertSame(Rental::PROOF_PENDING, $rental->deposit_proof_status);
        $this->assertNotNull($rental->deposit_proof_path);
        Storage::disk('public')->assertExists($rental->deposit_proof_path);
    }

    public function test_cannot_upload_proof_if_deposit_already_received(): void
    {
        Storage::fake('public');

        $phone = '081234567890';
        $token = $this->issueToken($phone);
        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'booker_phone' => '6281234567890',
            'status' => Rental::STATUS_CONFIRMED,
            'deposit_amount' => 500000,
            'deposit_received_at' => now(),
            'deposit_status' => Rental::DEPOSIT_SETTLED,
        ]);

        $proofFile = UploadedFile::fake()->image('struk.jpg', 600, 800);

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.deposit_proof', $rental->public_token), [
                'deposit_proof' => $proofFile,
            ])
            ->assertStatus(400)
            ->assertJsonPath('code', 'deposit_already_received');
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
