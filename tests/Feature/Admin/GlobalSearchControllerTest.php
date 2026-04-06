<?php

namespace Tests\Feature\Admin;

use App\Models\Carousel;
use App\Models\Media;
use App\Models\Page;
use App\Models\Permission;
use App\Models\Post;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GlobalSearchControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_requires_authentication(): void
    {
        $response = $this->getJson(route('admin.search', ['q' => 'test']));

        $response->assertStatus(401);
    }

    public function test_search_returns_empty_results_for_short_query(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson(route('admin.search', ['q' => 'a']));

        $response->assertStatus(200);
        $response->assertJson(['results' => []]);
    }

    public function test_admin_can_search_users(): void
    {
        $admin = $this->createAdminUser();
        User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'John']));

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'results');
        $response->assertJsonFragment([
            'title' => 'John Doe',
            'type' => 'user',
        ]);
    }

    public function test_admin_can_search_users_by_email(): void
    {
        $admin = $this->createAdminUser();
        User::factory()->create(['name' => 'Test User', 'email' => 'searchable@example.com']);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'searchable']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'subtitle' => 'searchable@example.com',
            'type' => 'user',
        ]);
    }

    public function test_admin_can_search_posts(): void
    {
        $admin = $this->createAdminUser();
        Post::factory()->create(['title' => 'My Amazing Post', 'is_published' => true]);
        Post::factory()->create(['title' => 'Another Post', 'is_published' => false]);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'Amazing']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'title' => 'My Amazing Post',
            'subtitle' => 'Published',
            'type' => 'post',
        ]);
    }

    public function test_admin_can_search_pages(): void
    {
        $admin = $this->createAdminUser();
        Page::factory()->create(['title' => 'About Us Page', 'slug' => 'about-us']);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'About']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'title' => 'About Us Page',
            'subtitle' => '/about-us',
            'type' => 'page',
        ]);
    }

    public function test_admin_can_search_media(): void
    {
        $admin = $this->createAdminUser();
        Media::factory()->create([
            'name' => 'company-logo',
            'original_name' => 'company-logo.png',
            'type' => 'image',
            'size' => 1024,
        ]);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'logo']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'title' => 'company-logo',
            'type' => 'media',
        ]);
    }

    public function test_admin_can_search_carousels(): void
    {
        $admin = $this->createAdminUser();
        Carousel::factory()->create([
            'name' => 'Homepage Slider',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'Homepage']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'title' => 'Homepage Slider',
            'subtitle' => 'Active',
            'type' => 'carousel',
        ]);
    }

    public function test_admin_can_search_roles(): void
    {
        $admin = $this->createAdminUser();
        Role::factory()->create([
            'name' => 'Content Editor',
            'description' => 'Can edit content',
        ]);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'Editor']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'title' => 'Content Editor',
            'type' => 'role',
        ]);
    }

    public function test_admin_can_search_settings(): void
    {
        $admin = $this->createAdminUser();
        Setting::factory()->create([
            'key' => 'site_name',
            'label' => 'Site Name',
            'group' => 'general',
            'value' => 'My Website',
        ]);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'Site']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'title' => 'Site Name',
            'type' => 'setting',
        ]);
    }

    public function test_admin_can_search_settings_by_key(): void
    {
        $admin = $this->createAdminUser();
        Setting::factory()->create([
            'key' => 'app_logo',
            'label' => 'Application Logo',
            'group' => 'branding',
        ]);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'app_logo']));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'title' => 'Application Logo',
            'type' => 'setting',
        ]);
    }

    public function test_search_returns_multiple_types(): void
    {
        $admin = $this->createAdminUser();
        User::factory()->create(['name' => 'Test User']);
        Post::factory()->create(['title' => 'Test Post']);
        Page::factory()->create(['title' => 'Test Page']);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'Test']));

        $response->assertStatus(200);
        $types = collect($response->json('results'))->pluck('type')->unique()->values()->toArray();
        $this->assertContains('user', $types);
        $this->assertContains('post', $types);
        $this->assertContains('page', $types);
    }

    public function test_search_limits_results_per_type(): void
    {
        $admin = $this->createAdminUser();
        User::factory()->count(10)->create(['name' => 'Test User']);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'Test']));

        $response->assertStatus(200);
        $userResults = collect($response->json('results'))->where('type', 'user');
        $this->assertLessThanOrEqual(5, $userResults->count());
    }

    public function test_user_without_permission_cannot_search_users(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson(route('admin.search', ['q' => 'test']));

        $response->assertStatus(200);
        $userResults = collect($response->json('results'))->where('type', 'user');
        $this->assertCount(0, $userResults);
    }

    public function test_search_results_include_urls(): void
    {
        $admin = $this->createAdminUser();
        $user = User::factory()->create(['name' => 'Searchable User']);

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'Searchable']));

        $response->assertStatus(200);
        $result = collect($response->json('results'))->firstWhere('type', 'user');
        $this->assertNotNull($result);
        $this->assertStringContainsString('/admin/users/', $result['url']);
    }

    public function test_search_returns_query_in_response(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)->getJson(route('admin.search', ['q' => 'myquery']));

        $response->assertStatus(200);
        $response->assertJson(['query' => 'myquery']);
    }

    /**
     * Create an admin user with all permissions.
     */
    private function createAdminUser(): User
    {
        $adminRole = Role::factory()->create(['slug' => 'admin', 'name' => 'Admin']);

        $modules = ['users', 'posts', 'pages', 'media', 'carousels', 'roles', 'settings'];
        foreach ($modules as $module) {
            $permission = Permission::factory()->create([
                'module' => $module,
                'action' => 'view',
                'slug' => "{$module}.view",
            ]);
            $adminRole->permissions()->attach($permission);
        }

        $user = User::factory()->create();
        $user->roles()->attach($adminRole);

        return $user;
    }
}
