<?php

namespace Tests\Feature\Modules\Customer;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Customer\Models\Customer;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CustomerTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_customers(): void
    {
        $this->get(route('module.customers.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_customers(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.customers.index'))->assertForbidden();
    }

    public function test_read_only_user_sees_index_without_write_abilities(): void
    {
        $user = $this->createUserWithRole();
        Customer::factory()->create();

        $this->actingAs($user)->get(route('module.customers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Customer/Index')
                ->where('can.create', false)
                ->where('can.update', false)
                ->where('can.delete', false)
            );
    }

    public function test_index_supports_search_and_status_filter(): void
    {
        $user = $this->createAdminUser();
        Customer::factory()->create(['name' => 'PT Maju Jaya', 'status' => 'active']);
        Customer::factory()->create(['name' => 'CV Lama', 'status' => 'inactive']);

        $this->actingAs($user)->get(route('module.customers.index', ['search' => 'Maju Jaya']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'PT Maju Jaya')
            );

        $this->actingAs($user)->get(route('module.customers.index', ['status' => 'inactive']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'CV Lama')
            );
    }

    public function test_admin_can_create_a_customer_and_gets_an_auto_generated_code(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.customers.store'), [
            'name' => 'PT Maju Jaya',
            'phone' => '081234567890',
            'status' => 'active',
        ]);

        $customer = Customer::firstWhere('name', 'PT Maju Jaya');
        $response->assertRedirect(route('module.customers.show', $customer));
        $this->assertNotEmpty($customer->code);
        $this->assertStringStartsWith('CUST-', $customer->code);
    }

    public function test_creating_a_customer_requires_name_and_phone(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.customers.store'), [
            'status' => 'active',
        ])->assertSessionHasErrors(['name', 'phone']);
    }

    public function test_admin_can_update_a_customer(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)->patch(route('module.customers.update', $customer), [
            'name' => 'New Name',
            'phone' => $customer->phone,
            'status' => 'inactive',
        ])->assertRedirect(route('module.customers.show', $customer));

        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'name' => 'New Name', 'status' => 'inactive']);
    }

    public function test_admin_can_delete_a_customer_without_active_trips(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();

        $this->actingAs($user)->delete(route('module.customers.destroy', $customer))
            ->assertRedirect(route('module.customers.index'));

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    /**
     * Customer has no knowledge of Trip, so this is enforced by the
     * database's own foreign key constraint on trips.customer_id (see the
     * trips migration) — Customer's controller just turns the resulting
     * QueryException into a friendly redirect instead of a 500.
     */
    public function test_a_customer_referenced_by_a_trip_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();
        Trip::factory()->create(['customer_id' => $customer->id, 'status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)->delete(route('module.customers.destroy', $customer))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }
}
