<?php

namespace Tests\Feature\Modules\Product;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PrincipalTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_principals(): void
    {
        $this->get(route('module.products.principals.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_principals(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.products.principals.index'))->assertForbidden();
    }

    public function test_admin_can_view_principals_index(): void
    {
        $user = $this->createAdminUser();
        Principal::factory()->create(['name' => 'PT Unilever']);

        $this->actingAs($user)->get(route('module.products.principals.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Principals/Index')
                ->has('principals.data', 1)
                ->where('principals.data.0.name', 'PT Unilever')
            );
    }

    public function test_principals_index_supports_search(): void
    {
        $user = $this->createAdminUser();
        Principal::factory()->create(['name' => 'PT Unilever']);
        Principal::factory()->create(['name' => 'PT Indofood']);

        $this->actingAs($user)->get(route('module.products.principals.index', ['search' => 'Unilever']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('principals.data', 1));
    }

    public function test_admin_can_create_a_principal(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.products.principals.store'), [
            'name' => 'PT Wings Surya',
            'contact_person' => 'John Doe',
            'phone' => '08123456789',
            'email' => 'info@wings.co.id',
            'address' => 'Surabaya',
            'status' => 'active',
        ]);

        $response->assertRedirect(route('module.products.principals.index'));
        $this->assertDatabaseHas('principals', ['name' => 'PT Wings Surya']);
    }

    public function test_creating_a_principal_requires_name(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.principals.store'), [
            'status' => 'active',
        ])->assertSessionHasErrors(['name']);
    }

    public function test_admin_can_update_a_principal(): void
    {
        $user = $this->createAdminUser();
        $principal = Principal::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)->patch(route('module.products.principals.update', $principal), [
            'name' => 'New Name',
            'status' => 'inactive',
        ])->assertRedirect(route('module.products.principals.index'));

        $this->assertDatabaseHas('principals', ['id' => $principal->id, 'name' => 'New Name', 'status' => 'inactive']);
    }

    public function test_admin_can_delete_a_principal_without_brands(): void
    {
        $user = $this->createAdminUser();
        $principal = Principal::factory()->create();

        $this->actingAs($user)->delete(route('module.products.principals.destroy', $principal))
            ->assertRedirect(route('module.products.principals.index'));

        $this->assertDatabaseMissing('principals', ['id' => $principal->id]);
    }

    public function test_principal_with_brands_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $principal = Principal::factory()->create();
        Brand::factory()->create(['principal_id' => $principal->id]);

        $this->actingAs($user)->delete(route('module.products.principals.destroy', $principal))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('principals', ['id' => $principal->id]);
    }

    public function test_principal_auto_generates_code(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.principals.store'), [
            'name' => 'PT Test',
            'status' => 'active',
        ]);

        $principal = Principal::firstWhere('name', 'PT Test');
        $this->assertStringStartsWith('PRC-', $principal->code);
    }
}
