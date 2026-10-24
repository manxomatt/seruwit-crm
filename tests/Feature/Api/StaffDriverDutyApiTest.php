<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDutyOrder;
use Modules\Rental\Models\RentalDutyOrderExpense;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StaffDriverDutyApiTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected User $driverUser;

    protected Driver $driver;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        $this->driverUser = User::factory()->create([
            'email' => 'driver1@seruwit.test',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        $this->driver = Driver::factory()->create([
            'user_id' => $this->driverUser->id,
            'name' => 'Bambang Supir',
            'phone' => '081234567890',
        ]);

        $this->token = $this->driverUser->createToken('driver-mobile-token')->plainTextToken;
    }

    public function test_driver_can_view_own_assigned_duties(): void
    {
        $vehicle = Vehicle::factory()->create(['plate_number' => 'B 1234 SJO']);
        $partner = Partner::factory()->create();

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_ACTIVE,
        ]);

        // Duty 1: Assigned to this driver
        RentalDutyOrder::create([
            'duty_order_number' => 'SJO-202610-0001',
            'rental_id' => $rental->id,
            'driver_id' => $this->driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool Jakarta',
            'destination' => 'Bandara Soetta',
            'departure_date' => Carbon::today(),
            'return_date' => Carbon::today(),
            'status' => RentalDutyOrder::STATUS_DISPATCHED,
            'cash_advance_amount' => 500000,
            'actual_expense_total' => 0,
            'net_balance' => 500000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
        ]);

        // Duty 2: Assigned to another driver
        $otherDriver = Driver::factory()->create(['name' => 'Driver Lain']);
        RentalDutyOrder::create([
            'duty_order_number' => 'SJO-202610-0002',
            'rental_id' => $rental->id,
            'driver_id' => $otherDriver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool Jakarta',
            'destination' => 'Bandung',
            'departure_date' => Carbon::today(),
            'return_date' => Carbon::today()->addDay(),
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'cash_advance_amount' => 300000,
            'actual_expense_total' => 0,
            'net_balance' => 300000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.driver.duties.index'));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'meta' => [
                    'count' => 1,
                    'is_driver_account' => true,
                    'driver_id' => $this->driver->id,
                ],
            ]);

        $this->assertEquals('SJO-202610-0001', $response->json('data.0.duty_order_number'));
    }

    public function test_driver_can_view_duty_detail(): void
    {
        $vehicle = Vehicle::factory()->create(['plate_number' => 'B 9999 SJO']);

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SJO-202610-0003',
            'driver_id' => $this->driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Kantor Pusat',
            'destination' => 'Hotel Indonesia Kempinski',
            'departure_date' => Carbon::today(),
            'return_date' => Carbon::today(),
            'status' => RentalDutyOrder::STATUS_DISPATCHED,
            'passenger_name' => 'Pak Direktur',
            'passenger_phone' => '081122334455',
            'cash_advance_amount' => 1000000,
            'actual_expense_total' => 150000,
            'net_balance' => 850000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
        ]);

        $dutyOrder->expenses()->create([
            'category' => RentalDutyOrderExpense::CATEGORY_TOLL,
            'amount' => 150000,
            'date' => Carbon::today(),
            'description' => 'Tol Dalam Kota & Jagorawi',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.driver.duties.show', ['dutyOrder' => $dutyOrder->id]));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'duty_id' => $dutyOrder->id,
                    'duty_order_number' => 'SJO-202610-0003',
                    'passenger' => [
                        'name' => 'Pak Direktur',
                    ],
                    'financials' => [
                        'cash_advance_amount' => 1000000,
                        'actual_expense_total' => 150000,
                        'net_balance' => 850000,
                    ],
                ],
            ]);

        $this->assertCount(1, $response->json('data.expenses'));
        $this->assertEquals(150000, $response->json('data.expenses.0.amount'));
    }

    public function test_driver_cannot_view_other_driver_duty(): void
    {
        $otherDriver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SJO-202610-0004',
            'driver_id' => $otherDriver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Jakarta',
            'destination' => 'Bogor',
            'departure_date' => Carbon::today(),
            'return_date' => Carbon::today(),
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.driver.duties.show', ['dutyOrder' => $dutyOrder->id]));

        $response->assertStatus(403);
    }

    public function test_driver_can_update_duty_status(): void
    {
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SJO-202610-0005',
            'driver_id' => $this->driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool',
            'destination' => 'Airport',
            'departure_date' => Carbon::today(),
            'return_date' => Carbon::today(),
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
        ]);

        // Start duty (dispatched)
        $response1 = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.driver.duties.status', ['dutyOrder' => $dutyOrder->id]), [
                'status' => 'on_duty',
                'notes' => 'Driver sudah meluncur ke lokasi penjemputan.',
            ]);

        $response1->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'duty_id' => $dutyOrder->id,
                    'status' => RentalDutyOrder::STATUS_DISPATCHED,
                ],
            ]);

        $this->assertDatabaseHas('rental_duty_orders', [
            'id' => $dutyOrder->id,
            'status' => RentalDutyOrder::STATUS_DISPATCHED,
        ]);

        // Complete duty
        $response2 = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.driver.duties.status', ['dutyOrder' => $dutyOrder->id]), [
                'status' => 'completed',
            ]);

        $response2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => RentalDutyOrder::STATUS_COMPLETED,
                ],
            ]);

        $this->assertDatabaseHas('rental_duty_orders', [
            'id' => $dutyOrder->id,
            'status' => RentalDutyOrder::STATUS_COMPLETED,
        ]);
    }

    public function test_driver_can_record_itemized_expense(): void
    {
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SJO-202610-0006',
            'driver_id' => $this->driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool',
            'destination' => 'Bandung',
            'departure_date' => Carbon::today(),
            'return_date' => Carbon::today(),
            'status' => RentalDutyOrder::STATUS_DISPATCHED,
            'cash_advance_amount' => 500000,
            'actual_expense_total' => 0,
            'net_balance' => 500000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.driver.duties.expenses.store', ['dutyOrder' => $dutyOrder->id]), [
                'category' => 'fuel',
                'amount' => 200000,
                'receipt_number' => 'SPBU-12345',
                'description' => 'Isi Pertamax 15L di Rest Area KM 57',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'category' => 'fuel',
                    'amount' => 200000,
                    'summary' => [
                        'cash_advance_amount' => 500000,
                        'actual_expense_total' => 200000,
                        'net_balance' => 300000,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('rental_duty_order_expenses', [
            'duty_order_id' => $dutyOrder->id,
            'category' => 'fuel',
            'amount' => 200000,
            'receipt_number' => 'SPBU-12345',
        ]);

        $this->assertDatabaseHas('rental_duty_orders', [
            'id' => $dutyOrder->id,
            'actual_expense_total' => 200000,
            'net_balance' => 300000,
        ]);
    }

    public function test_driver_cannot_add_expense_to_settled_duty(): void
    {
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SJO-202610-0007',
            'driver_id' => $this->driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool',
            'destination' => 'Bandung',
            'departure_date' => Carbon::today(),
            'return_date' => Carbon::today(),
            'status' => RentalDutyOrder::STATUS_COMPLETED,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_SETTLED,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.driver.duties.expenses.store', ['dutyOrder' => $dutyOrder->id]), [
                'category' => 'parking',
                'amount' => 20000,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'DUTY_ORDER_ALREADY_SETTLED',
                ],
            ]);
    }
}
