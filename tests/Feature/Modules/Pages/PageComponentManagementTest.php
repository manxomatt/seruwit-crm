<?php

namespace Tests\Feature\Modules\Pages;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Pages\Models\PageComponent;
use Tests\TestCase;

class PageComponentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::factory()->create([
            'name' => 'Administrator',
            'slug' => 'admin',
            'is_system' => true,
        ]);

        $this->adminUser = User::factory()->create();
        $this->adminUser->roles()->attach($adminRole);

        $this->regularUser = User::factory()->create();
    }

    public function test_central_admin_can_access_components_index(): void
    {
        PageComponent::create([
            'key' => 'comp-1',
            'label' => 'Comp 1',
            'category' => 'Sections',
            'content' => '<div>1</div>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->get('/module/pages/components');

        $response->assertOk();
    }

    public function test_non_admin_user_is_forbidden_from_components_management(): void
    {
        $response = $this->actingAs($this->regularUser)
            ->get('/module/pages/components');

        $response->assertStatus(403);
    }

    public function test_central_admin_can_create_component(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->get('/module/pages/components/create');

        $response->assertOk();

        $storeResponse = $this->actingAs($this->adminUser)
            ->post('/module/pages/components', [
                'key' => 'hero-central-new',
                'label' => 'Hero Central New',
                'category' => 'Sections',
                'content' => '<section>Central Banner</section>',
                'sort_order' => 5,
                'is_active' => true,
            ]);

        $storeResponse->assertRedirect('/module/pages/components');

        $this->assertDatabaseHas('page_components', [
            'key' => 'hero-central-new',
            'label' => 'Hero Central New',
        ]);
    }

    public function test_central_admin_can_update_component(): void
    {
        $component = PageComponent::create([
            'key' => 'hero-old',
            'label' => 'Hero Old',
            'category' => 'Sections',
            'content' => '<section>Old</section>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $updateResponse = $this->actingAs($this->adminUser)
            ->put("/module/pages/components/{$component->id}", [
                'key' => 'hero-updated',
                'label' => 'Hero Updated',
                'category' => 'Sections',
                'content' => '<section>Updated</section>',
                'sort_order' => 2,
                'is_active' => true,
            ]);

        $updateResponse->assertRedirect('/module/pages/components');

        $this->assertDatabaseHas('page_components', [
            'id' => $component->id,
            'key' => 'hero-updated',
            'label' => 'Hero Updated',
        ]);
    }

    public function test_central_admin_can_bind_a_component_to_a_module(): void
    {
        $storeResponse = $this->actingAs($this->adminUser)
            ->post('/module/pages/components', [
                'key' => 'rental-fleet-block-new',
                'label' => 'Rental Fleet',
                'category' => 'Rental',
                'module' => 'rental',
                'content' => '<div class="rental-fleet-block"></div>',
                'sort_order' => 5,
                'is_active' => true,
            ]);

        $storeResponse->assertRedirect('/module/pages/components');

        $this->assertDatabaseHas('page_components', [
            'key' => 'rental-fleet-block-new',
            'module' => 'rental',
        ]);
    }

    public function test_module_binding_persists_on_update(): void
    {
        $component = PageComponent::create([
            'key' => 'bind-me',
            'label' => 'Bind Me',
            'category' => 'Sections',
            'content' => '<section>Bind</section>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($this->adminUser)
            ->put("/module/pages/components/{$component->id}", [
                'key' => 'bind-me',
                'label' => 'Bind Me',
                'category' => 'Sections',
                'module' => 'rental',
                'content' => '<section>Bind</section>',
                'sort_order' => 1,
                'is_active' => true,
            ])
            ->assertRedirect('/module/pages/components');

        $this->assertDatabaseHas('page_components', [
            'id' => $component->id,
            'module' => 'rental',
        ]);
    }

    public function test_central_admin_can_toggle_active_status(): void
    {
        $component = PageComponent::create([
            'key' => 'toggle-comp',
            'label' => 'Toggle Comp',
            'category' => 'Sections',
            'content' => '<div>Content</div>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->patch("/module/pages/components/{$component->id}/toggle-active");

        $response->assertRedirect('/module/pages/components');

        $this->assertDatabaseHas('page_components', [
            'id' => $component->id,
            'is_active' => false,
        ]);
    }

    public function test_central_admin_can_delete_component(): void
    {
        $component = PageComponent::create([
            'key' => 'delete-comp',
            'label' => 'Delete Comp',
            'category' => 'Sections',
            'content' => '<div>Delete</div>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->delete("/module/pages/components/{$component->id}");

        $response->assertRedirect('/module/pages/components');

        $this->assertDatabaseMissing('page_components', [
            'id' => $component->id,
        ]);
    }
}
