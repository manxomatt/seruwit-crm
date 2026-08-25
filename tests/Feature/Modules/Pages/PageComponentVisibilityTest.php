<?php

namespace Tests\Feature\Modules\Pages;

use App\Modules\Facades\Modules;
use Modules\Pages\Models\PageComponent;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Verifies the module-binding guarantee for the central widget library: a
 * component bound to a module is hidden from a tenant's editor unless that
 * tenant has the module installed, while universal components always show. The
 * widget rows live only in the central schema (CentralConnection), so a tenant
 * never stores its own copy.
 */
class PageComponentVisibilityTest extends TestCase
{
    use WithTenant;

    public function test_module_bound_component_is_hidden_from_a_tenant_without_the_module(): void
    {
        $universal = PageComponent::create([
            'key' => 'universal-hero',
            'label' => 'Universal Hero',
            'category' => 'Sections',
            'module' => null,
            'content' => '<section>Hero</section>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $rentalWidget = PageComponent::create([
            'key' => 'rental-fleet',
            'label' => 'Rental Fleet',
            'category' => 'Rental',
            'module' => 'rental',
            'content' => '<div class="rental-fleet-block"></div>',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $tenant = $this->provisionTenant('No Rental Co', 'no-rental-co', 'owner@no-rental.test');

        $tenant->run(function () use ($universal, $rentalWidget): void {
            $this->assertTrue(tenancy()->initialized);
            $this->assertFalse(Modules::available('rental'));

            $this->assertTrue($universal->isAvailableInCurrentContext());
            $this->assertFalse($rentalWidget->isAvailableInCurrentContext());
        });
    }

    public function test_widget_library_is_not_stored_in_the_tenant_schema(): void
    {
        $tenant = $this->provisionTenant('Schema Co', 'schema-co', 'owner@schema.test');

        $tenant->run(function (): void {
            $this->assertFalse(
                \Illuminate\Support\Facades\Schema::hasTable('page_components'),
                'page_components must live only in the central schema.',
            );
        });
    }
}
