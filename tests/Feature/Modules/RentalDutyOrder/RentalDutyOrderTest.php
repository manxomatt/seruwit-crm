<?php

namespace Tests\Feature\Modules\RentalDutyOrder;

use App\Modules\Facades\Modules;
use App\Support\SystemRolePermissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\RentalDutyOrder\Models\RentalDutyOrder;
use Modules\RentalDutyOrder\Models\RentalDutyOrderExpense;
use Modules\RentalDutyOrder\RentalDutyOrderModule;
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
        SystemRolePermissions::seedRolesForModule('rental-duty-order');
        SystemRolePermissions::syncAllSystemRoles();

        $this->ensureTablesExist();
    }

    protected function ensureTablesExist(): void
    {
        if (! Schema::hasTable('rental_duty_orders')) {
            $migration = require base_path('modules/RentalDutyOrder/Database/Migrations/2026_10_15_150000_create_rental_duty_orders_tables.php');
            $migration->up();
        }
    }

    public function test_module_is_registered_with_correct_properties(): void
    {
        $module = Modules::find('rental-duty-order');

        $this->assertNotNull($module);
        $this->assertInstanceOf(RentalDutyOrderModule::class, $module);
        $this->assertSame('rental-duty-order', $module->key());
        $this->assertSame('Surat Jalan & Kas Jalan', $module->label());
        $this->assertEquals(['rental', 'driver'], $module->requires());
        $this->assertContains('view', $module->permissions());
        $this->assertContains('dispatch', $module->permissions());
        $this->assertContains('finance', $module->permissions());
    }

    public function test_guests_cannot_access_duty_orders(): void
    {
        $this->get(route('module.rental.duty_orders.index'))->assertRedirect(route('login'));
        $this->get(route('module.rental-duty-orders.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_access_duty_orders_index(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.rental.duty_orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/RentalDutyOrder/Index')
                ->has('orders')
                ->has('metrics')
                ->has('drivers')
                ->has('vehicles')
            );

        $this->actingAs($user)->get(route('module.rental-duty-orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/RentalDutyOrder/Index')
            );
    }

    public function test_duty_order_number_generation_is_formatted(): void
    {
        $orderNumber = RentalDutyOrder::generateNumber();
        $this->assertStringStartsWith('SJO-'.now()->format('Ym'), $orderNumber);
        $this->assertStringEndsWith('-0001', $orderNumber);

        // Verify alias works too
        $this->assertSame($orderNumber, RentalDutyOrder::generateOrderNumber());
    }

    public function test_backward_compatible_model_aliases_work(): void
    {
        $order = new \Modules\Rental\Models\RentalDutyOrder;
        $this->assertInstanceOf(RentalDutyOrder::class, $order);

        $expense = new \Modules\Rental\Models\RentalDutyOrderExpense;
        $this->assertInstanceOf(RentalDutyOrderExpense::class, $expense);
    }
}
