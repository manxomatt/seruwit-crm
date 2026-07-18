<?php

namespace Tests\Feature\Modules\Product;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Product;
use Modules\TransportationManagement\Models\TripItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ProductTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_products(): void
    {
        $this->get(route('module.products.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_products(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.products.index'))->assertForbidden();
    }

    public function test_read_only_user_sees_index_without_write_abilities(): void
    {
        $user = $this->createUserWithRole();
        Product::factory()->create();

        $this->actingAs($user)->get(route('module.products.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Index')
                ->where('can.create', false)
                ->where('can.update', false)
                ->where('can.delete', false)
            );
    }

    public function test_index_supports_search_and_status_filter(): void
    {
        $user = $this->createAdminUser();
        Product::factory()->create(['name' => 'Semen Portland', 'status' => 'active']);
        Product::factory()->create(['name' => 'Pasir Halus', 'status' => 'inactive']);

        $this->actingAs($user)->get(route('module.products.index', ['search' => 'Portland']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Semen Portland')
            );

        $this->actingAs($user)->get(route('module.products.index', ['status' => 'inactive']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Pasir Halus')
            );
    }

    public function test_create_and_edit_pages_offer_units_sourced_from_settings(): void
    {
        $user = $this->createAdminUser();
        Setting::factory()->group('units')->create(['value' => 'kg', 'label' => 'Kilogram', 'sort_order' => 1]);
        Setting::factory()->group('units')->create(['value' => 'pcs', 'label' => 'Pieces', 'sort_order' => 2]);
        Setting::factory()->group('general')->create(); // a setting outside the "units" group must not leak in
        $product = Product::factory()->create(['unit' => 'legacy-unit']);

        $this->actingAs($user)->get(route('module.products.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('units', 2)
                ->where('units.0.value', 'kg')
                ->where('units.1.value', 'pcs')
            );

        // A product's existing unit stays selectable even after it falls out
        // of the Settings-managed list, so editing never silently drops it.
        $this->actingAs($user)->get(route('module.products.edit', $product))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('units', 2));
    }

    public function test_admin_can_create_a_product_and_gets_an_auto_generated_code(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.products.store'), [
            'name' => 'Semen Portland',
            'unit' => 'sak',
            'status' => 'active',
        ]);

        $product = Product::firstWhere('name', 'Semen Portland');
        $response->assertRedirect(route('module.products.show', $product));
        $this->assertNotEmpty($product->code);
        $this->assertStringStartsWith('PROD-', $product->code);
    }

    public function test_creating_a_product_requires_name_and_unit(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.store'), [
            'status' => 'active',
        ])->assertSessionHasErrors(['name', 'unit']);
    }

    public function test_admin_can_update_a_product(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)->patch(route('module.products.update', $product), [
            'name' => 'New Name',
            'unit' => $product->unit,
            'status' => 'inactive',
        ])->assertRedirect(route('module.products.show', $product));

        $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'New Name', 'status' => 'inactive']);
    }

    public function test_admin_can_delete_a_product_without_references(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create();

        $this->actingAs($user)->delete(route('module.products.destroy', $product))
            ->assertRedirect(route('module.products.index'));

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    /**
     * Product has no knowledge of Trip, so this is enforced by the
     * database's own foreign key constraint on trip_items.product_id (see
     * the trip_items migration) — Product's controller just turns the
     * resulting QueryException into a friendly redirect instead of a 500.
     */
    public function test_a_product_referenced_by_a_trip_item_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create();
        TripItem::factory()->create(['product_id' => $product->id]);

        $this->actingAs($user)->delete(route('module.products.destroy', $product))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }
}
