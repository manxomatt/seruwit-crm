<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Rental\Models\RentalRate;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StaffDashboardAndApprovalApiTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected User $staff;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        $this->staff = User::factory()->create([
            'email' => 'manager@seruwit.test',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        $this->token = $this->staff->createToken('test-mobile-token')->plainTextToken;
    }

    public function test_authenticated_staff_can_fetch_dashboard_summary(): void
    {
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.dashboard.summary'));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'vehicles' => [
                        'total',
                        'on_rent',
                        'available',
                        'maintenance',
                        'booked_today',
                    ],
                    'handovers_today' => [
                        'pickup_pending',
                        'pickup_completed',
                        'return_pending',
                        'return_completed',
                    ],
                    'approvals_pending' => [
                        'payment_proofs',
                        'extensions',
                    ],
                    'revenue_snapshot' => [
                        'today_cash_collected',
                        'month_to_date',
                        'currency',
                    ],
                ],
            ]);
    }

    public function test_staff_can_view_pending_payment_proofs(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create(['name' => 'Pak Budi']);

        Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'deposit_amount' => 500000,
            'deposit_proof_status' => Rental::PROOF_PENDING,
            'deposit_proof_path' => 'rental/proofs/sample.jpg',
            'deposit_proof_uploaded_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.approvals.payments.index'));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'booking_number',
                        'customer_name',
                        'vehicle_name',
                        'amount',
                        'payment_type',
                    ],
                ],
            ]);

        $this->assertNotEmpty($response->json('data'));
    }

    public function test_staff_can_confirm_payment_proof(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        /** @var Rental $rental */
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_PENDING,
            'deposit_amount' => 500000,
            'deposit_proof_status' => Rental::PROOF_PENDING,
            'deposit_proof_path' => 'rental/proofs/test.jpg',
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.approvals.payments.confirm', $rental));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.rental_id', $rental->id)
            ->assertJsonPath('data.status', Rental::STATUS_CONFIRMED);

        $this->assertSame(Rental::PROOF_APPROVED, $rental->fresh()->deposit_proof_status);
        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->fresh()->status);
    }

    public function test_staff_can_reject_payment_proof(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();

        /** @var Rental $rental */
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'deposit_amount' => 500000,
            'deposit_proof_status' => Rental::PROOF_PENDING,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.approvals.payments.reject', $rental), [
                'reason' => 'Nominal transfer tidak sesuai dengan tagihan.',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(Rental::PROOF_REJECTED, $rental->fresh()->deposit_proof_status);
        $this->assertSame('Nominal transfer tidak sesuai dengan tagihan.', $rental->fresh()->deposit_proof_rejected_reason);
    }

    public function test_staff_can_view_and_review_extension_requests(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 300000,
            'is_active' => true,
        ]);

        /** @var Rental $rental */
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_ACTIVE,
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
        ]);

        /** @var RentalExtensionRequest $req */
        $req = RentalExtensionRequest::query()->create([
            'rental_id' => $rental->id,
            'requested_by_type' => 'passenger',
            'requested_end_date' => now()->addDays(3)->toDateString(),
            'estimated_periods' => 2,
            'estimated_amount' => 600000,
            'status' => RentalExtensionRequest::STATUS_PENDING,
            'notes' => 'Mau nambah 2 hari lagi.',
        ]);

        // 1. List pending extensions
        $listResponse = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.approvals.extensions.index'));

        $listResponse->assertOk()
            ->assertJsonPath('success', true);

        $this->assertNotEmpty($listResponse->json('data'));

        // 2. Approve extension
        $reviewResponse = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.approvals.extensions.review', $req), [
                'action' => 'approve',
                'staff_notes' => 'Disetujui via mobile manager.',
            ]);

        $reviewResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'approved');

        $this->assertSame(RentalExtensionRequest::STATUS_APPROVED, $req->fresh()->status);
        $this->assertSame(now()->addDays(3)->toDateString(), $rental->fresh()->end_date->toDateString());
    }
}
