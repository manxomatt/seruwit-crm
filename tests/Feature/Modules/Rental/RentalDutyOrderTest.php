<?php

namespace Tests\Feature\Modules\Rental;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDutyOrder;
use Modules\Rental\Models\RentalDutyOrderExpense;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalDutyOrderTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_duty_orders_index_page_with_metrics(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create(['name' => 'Bambang Supir']);
        $vehicle = Vehicle::factory()->create(['plate_number' => 'BE 1234 AA']);

        RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-202610-0001',
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool Rental',
            'destination' => 'Bandara Radin Inten',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->toDateString(),
            'status' => RentalDutyOrder::STATUS_DISPATCHED,
            'cash_advance_amount' => 500000,
            'actual_expense_total' => 200000,
            'net_balance' => 300000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('module.rental.duty_orders.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Rental/DutyOrders/Index')
            ->has('orders.data', 1)
            ->has('metrics')
            ->where('metrics.total_orders', 1)
            ->where('metrics.active_orders', 1)
            ->where('metrics.pending_settlement', 1)
            ->where('metrics.total_advance_disbursed', 500000)
            ->where('metrics.total_actual_expenses', 200000)
            ->where('metrics.total_net_balance', 300000)
        );
    }

    public function test_admin_can_view_duty_orders_create_page(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->get(route('module.rental.duty_orders.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Rental/DutyOrders/Create')
            ->has('suggestedNumber')
            ->has('drivers')
            ->has('vehicles')
        );
    }

    public function test_admin_can_store_duty_order_with_cash_advance(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create(['name' => 'Pak Joko']);
        $vehicle = Vehicle::factory()->create(['plate_number' => 'B 9999 XYZ']);

        $customer = Partner::create([
            'code' => 'PTN-SPPD-01',
            'name' => 'PT Krakatau Steel',
            'phone' => '0811223344',
            'account_type' => 'company',
            'status' => 'active',
        ]);

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $customer->id,
            'driver_id' => $driver->id,
        ]);

        $payload = [
            'duty_order_number' => 'SPPD-202610-0099',
            'rental_id' => $rental->id,
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Bandar Lampung',
            'destination' => 'Bakauheni Port',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->addDays(2)->toDateString(),
            'departure_time' => '07:00',
            'return_time' => '19:00',
            'passenger_name' => 'Bpk. Direktur',
            'passenger_phone' => '0812345678',
            'cash_advance_amount' => 1000000,
            'cash_advance_notes' => 'BBM Rp 500rb, Tol Rp 300rb, Makan Rp 200rb',
            'standard_hours_per_day' => 12,
            'driver_overtime_rate_per_hour' => 30000,
            'customer_overtime_rate_per_hour' => 60000,
            'notes' => 'Pakaian batik rapi, unit harus bersih.',
        ];

        $response = $this->actingAs($user)->post(
            route('module.rental.duty_orders.store'),
            $payload
        );

        $dutyOrder = RentalDutyOrder::where('duty_order_number', 'SPPD-202610-0099')->first();
        $this->assertNotNull($dutyOrder);

        $response->assertRedirect(route('module.rental.duty_orders.show', $dutyOrder->id));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('rental_duty_orders', [
            'duty_order_number' => 'SPPD-202610-0099',
            'rental_id' => $rental->id,
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Bandar Lampung',
            'destination' => 'Bakauheni Port',
            'cash_advance_amount' => 1000000,
            'net_balance' => 1000000,
            'actual_expense_total' => 0,
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
        ]);
    }

    public function test_admin_can_view_duty_order_show_page(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-202610-0002',
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Hotel Novotel',
            'destination' => 'Pantai Mutun',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->toDateString(),
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'cash_advance_amount' => 400000,
            'actual_expense_total' => 0,
            'net_balance' => 400000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('module.rental.duty_orders.show', $dutyOrder->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Rental/DutyOrders/Show')
            ->has('dutyOrder')
            ->where('dutyOrder.id', $dutyOrder->id)
            ->where('dutyOrder.duty_order_number', 'SPPD-202610-0002')
            ->has('expenseCategories')
        );
    }

    public function test_admin_can_update_duty_order_status(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-202610-0003',
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Kantor',
            'destination' => 'Bandara',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->toDateString(),
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'cash_advance_amount' => 200000,
            'net_balance' => 200000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'created_by' => $user->id,
        ]);

        // 1. Dispatch
        $response = $this->actingAs($user)->patch(
            route('module.rental.duty_orders.status', $dutyOrder->id),
            ['status' => RentalDutyOrder::STATUS_DISPATCHED]
        );

        $response->assertRedirect();
        $dutyOrder->refresh();
        $this->assertSame(RentalDutyOrder::STATUS_DISPATCHED, $dutyOrder->status);
        $this->assertNotNull($dutyOrder->actual_departure_at);

        // 2. Complete
        $this->actingAs($user)->patch(
            route('module.rental.duty_orders.status', $dutyOrder->id),
            ['status' => RentalDutyOrder::STATUS_COMPLETED]
        );

        $dutyOrder->refresh();
        $this->assertSame(RentalDutyOrder::STATUS_COMPLETED, $dutyOrder->status);
        $this->assertNotNull($dutyOrder->actual_return_at);
    }

    public function test_admin_can_add_and_delete_itemized_expense_and_recalculate_balance(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-202610-0004',
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Kantor',
            'destination' => 'Palembang',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->addDays(1)->toDateString(),
            'status' => RentalDutyOrder::STATUS_DISPATCHED,
            'cash_advance_amount' => 800000,
            'actual_expense_total' => 0,
            'net_balance' => 800000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'created_by' => $user->id,
        ]);

        // Add expense 1: Fuel Rp 350.000
        $response = $this->actingAs($user)->post(
            route('module.rental.duty_orders.expenses.store', $dutyOrder->id),
            [
                'category' => RentalDutyOrderExpense::CATEGORY_FUEL,
                'amount' => 350000,
                'date' => Carbon::today()->toDateString(),
                'receipt_number' => 'SPBU-0199',
                'description' => 'Dexlite 25 Liter',
            ]
        );

        $response->assertRedirect();
        $dutyOrder->refresh();

        $this->assertEquals(350000, (float) $dutyOrder->actual_expense_total);
        $this->assertEquals(450000, (float) $dutyOrder->net_balance); // 800.000 - 350.000

        // Add expense 2: Toll Rp 250.000
        $this->actingAs($user)->post(
            route('module.rental.duty_orders.expenses.store', $dutyOrder->id),
            [
                'category' => RentalDutyOrderExpense::CATEGORY_TOLL,
                'amount' => 250000,
                'date' => Carbon::today()->toDateString(),
                'receipt_number' => 'TOLL-992',
                'description' => 'Tol Kayu Agung',
            ]
        );

        $dutyOrder->refresh();
        $this->assertEquals(600000, (float) $dutyOrder->actual_expense_total);
        $this->assertEquals(200000, (float) $dutyOrder->net_balance); // 800.000 - 600.000

        // Delete toll expense
        $tollExpense = $dutyOrder->expenses()->where('category', RentalDutyOrderExpense::CATEGORY_TOLL)->first();
        $this->assertNotNull($tollExpense);

        $deleteResponse = $this->actingAs($user)->delete(
            route('module.rental.duty_orders.expenses.destroy', [$dutyOrder->id, $tollExpense->id])
        );

        $deleteResponse->assertRedirect();
        $dutyOrder->refresh();

        $this->assertEquals(350000, (float) $dutyOrder->actual_expense_total);
        $this->assertEquals(450000, (float) $dutyOrder->net_balance);
    }

    public function test_admin_can_calculate_driver_overtime(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        // 2 days trip (standard 12 hours/day = 24 hours total)
        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-202610-0005',
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool',
            'destination' => 'Jakarta',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->addDay()->toDateString(),
            'status' => RentalDutyOrder::STATUS_COMPLETED,
            'cash_advance_amount' => 1000000,
            'net_balance' => 1000000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'created_by' => $user->id,
        ]);

        // Driver worked 28 hours (4 hours overtime)
        $response = $this->actingAs($user)->post(
            route('module.rental.duty_orders.overtime', $dutyOrder->id),
            [
                'actual_hours_worked' => 28,
                'standard_hours_per_day' => 12,
                'driver_overtime_rate_per_hour' => 30000,
                'customer_overtime_rate_per_hour' => 60000,
                'is_overtime_billed_to_customer' => true,
            ]
        );

        $response->assertRedirect();
        $dutyOrder->refresh();

        $this->assertEquals(28, (float) $dutyOrder->actual_hours_worked);
        $this->assertEquals(4, (float) $dutyOrder->overtime_hours);
        $this->assertEquals(120000, (float) $dutyOrder->total_driver_overtime_pay); // 4 * 30.000
        $this->assertEquals(240000, (float) $dutyOrder->total_customer_overtime_charge); // 4 * 60.000
        $this->assertTrue($dutyOrder->is_overtime_billed_to_customer);
    }

    public function test_admin_can_settle_duty_order_and_cash_advance(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-202610-0006',
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool',
            'destination' => 'Kalianda',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->toDateString(),
            'status' => RentalDutyOrder::STATUS_COMPLETED,
            'cash_advance_amount' => 500000,
            'actual_expense_total' => 450000,
            'net_balance' => 50000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(
            route('module.rental.duty_orders.settle', $dutyOrder->id),
            ['settlement_notes' => 'Sisa uang muka Rp 50.000 dikembalikan tunai ke kasir.']
        );

        $response->assertRedirect();
        $dutyOrder->refresh();

        $this->assertSame(RentalDutyOrder::STATUS_SETTLED, $dutyOrder->status);
        $this->assertSame(RentalDutyOrder::SETTLEMENT_SETTLED, $dutyOrder->settlement_status);
        $this->assertNotNull($dutyOrder->settled_at);
        $this->assertSame($user->id, $dutyOrder->settled_by);
        $this->assertSame('Sisa uang muka Rp 50.000 dikembalikan tunai ke kasir.', $dutyOrder->settlement_notes);
    }

    public function test_admin_can_view_printable_sppd_document(): void
    {
        $user = $this->createAdminUser();

        $driver = Driver::factory()->create(['name' => 'Pak Ahmad']);
        $vehicle = Vehicle::factory()->create(['plate_number' => 'BE 8888 BB']);

        $dutyOrder = RentalDutyOrder::create([
            'duty_order_number' => 'SPPD-202610-0007',
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Pool Rental',
            'destination' => 'Tanjung Karang',
            'departure_date' => Carbon::today()->toDateString(),
            'return_date' => Carbon::today()->toDateString(),
            'status' => RentalDutyOrder::STATUS_DRAFT,
            'cash_advance_amount' => 300000,
            'net_balance' => 300000,
            'settlement_status' => RentalDutyOrder::SETTLEMENT_PENDING,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('module.rental.duty_orders.print', $dutyOrder->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Rental/DutyOrders/Print')
            ->has('dutyOrder')
            ->has('company')
        );
    }
}
