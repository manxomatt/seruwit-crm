<?php

namespace Tests\Feature\Modules\Pages;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Pages\Models\PageComponent;
use Tests\TestCase;

class PageComponentTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_page_component(): void
    {
        $component = PageComponent::create([
            'key' => 'test-hero',
            'label' => 'Test Hero',
            'category' => 'Sections',
            'content' => '<section>Test</section>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('page_components', [
            'key' => 'test-hero',
            'label' => 'Test Hero',
        ]);
    }

    public function test_active_and_ordered_scopes(): void
    {
        PageComponent::create([
            'key' => 'inactive-comp',
            'label' => 'Inactive',
            'category' => 'Sections',
            'content' => '<div>Inactive</div>',
            'sort_order' => 1,
            'is_active' => false,
        ]);

        PageComponent::create([
            'key' => 'active-comp-2',
            'label' => 'Active 2',
            'category' => 'Sections',
            'content' => '<div>Active 2</div>',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        PageComponent::create([
            'key' => 'active-comp-1',
            'label' => 'Active 1',
            'category' => 'Sections',
            'content' => '<div>Active 1</div>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $components = PageComponent::active()->ordered()->get();

        $this->assertCount(2, $components);
        $this->assertEquals('active-comp-1', $components->first()->key);
        $this->assertEquals('active-comp-2', $components->last()->key);
    }

    public function test_universal_component_is_always_available(): void
    {
        $component = PageComponent::create([
            'key' => 'universal-hero',
            'label' => 'Universal Hero',
            'category' => 'Sections',
            'module' => null,
            'content' => '<section>Hero</section>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->assertTrue($component->isAvailableInCurrentContext());
    }

    public function test_module_bound_component_is_available_in_central_context(): void
    {
        $component = PageComponent::create([
            'key' => 'rental-widget',
            'label' => 'Rental Widget',
            'category' => 'Rental',
            'module' => 'rental',
            'content' => '<div class="rental-fleet-block"></div>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        // No tenant is initialized in this context, so the central admin sees
        // every module's widgets regardless of any tenant's install state.
        $this->assertFalse(tenancy()->initialized);
        $this->assertTrue($component->isAvailableInCurrentContext());
    }
}
