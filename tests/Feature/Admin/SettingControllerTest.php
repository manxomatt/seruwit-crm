<?php

namespace Tests\Feature\Admin;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_index_requires_authentication(): void
    {
        $response = $this->get(route('admin.settings.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_settings_index(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.settings.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('settings')
            ->has('groups')
            ->has('filters')
        );
    }

    public function test_settings_index_shows_all_settings(): void
    {
        $user = User::factory()->create();
        Setting::factory()->count(3)->create();

        $response = $this->actingAs($user)->get(route('admin.settings.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('settings.data', 3)
        );
    }

    public function test_settings_index_can_search_by_key(): void
    {
        $user = User::factory()->create();
        Setting::factory()->create(['key' => 'site.name', 'label' => 'Site Name']);
        Setting::factory()->create(['key' => 'email.host', 'label' => 'Email Host']);

        $response = $this->actingAs($user)->get(route('admin.settings.index', ['search' => 'site']));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('settings.data', 1)
            ->where('settings.data.0.key', 'site.name')
        );
    }

    public function test_settings_index_can_filter_by_group(): void
    {
        $user = User::factory()->create();
        Setting::factory()->create(['group' => 'general']);
        Setting::factory()->create(['group' => 'email']);
        Setting::factory()->create(['group' => 'email']);

        $response = $this->actingAs($user)->get(route('admin.settings.index', ['group' => 'email']));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('settings.data', 2)
        );
    }

    public function test_authenticated_user_can_access_create_setting(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.settings.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Create')
            ->has('groups')
        );
    }

    public function test_authenticated_user_can_store_setting(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.settings.store'), [
            'key' => 'site.name',
            'group' => 'general',
            'value' => 'My Website',
            'type' => 'text',
            'label' => 'Site Name',
            'description' => 'The name of the website',
            'is_public' => true,
            'sort_order' => 0,
        ]);

        $response->assertRedirect(route('admin.settings.index'));
        $this->assertDatabaseHas('settings', [
            'key' => 'site.name',
            'group' => 'general',
            'value' => 'My Website',
            'type' => 'text',
            'label' => 'Site Name',
            'is_public' => true,
        ]);
    }

    public function test_store_setting_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.settings.store'), []);

        $response->assertSessionHasErrors(['key', 'group', 'type', 'label']);
    }

    public function test_store_setting_validates_unique_key(): void
    {
        $user = User::factory()->create();
        Setting::factory()->create(['key' => 'existing.key']);

        $response = $this->actingAs($user)->post(route('admin.settings.store'), [
            'key' => 'existing.key',
            'group' => 'general',
            'type' => 'text',
            'label' => 'Test Setting',
        ]);

        $response->assertSessionHasErrors(['key']);
    }

    public function test_store_setting_validates_key_format(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.settings.store'), [
            'key' => 'Invalid Key!',
            'group' => 'general',
            'type' => 'text',
            'label' => 'Test Setting',
        ]);

        $response->assertSessionHasErrors(['key']);
    }

    public function test_store_setting_validates_type(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.settings.store'), [
            'key' => 'test.key',
            'group' => 'general',
            'type' => 'invalid_type',
            'label' => 'Test Setting',
        ]);

        $response->assertSessionHasErrors(['type']);
    }

    public function test_authenticated_user_can_view_setting(): void
    {
        $user = User::factory()->create();
        $setting = Setting::factory()->create(['label' => 'Test Setting']);

        $response = $this->actingAs($user)->get(route('admin.settings.show', $setting));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Show')
            ->has('setting')
            ->where('setting.id', $setting->id)
            ->where('setting.label', 'Test Setting')
        );
    }

    public function test_authenticated_user_can_edit_setting(): void
    {
        $user = User::factory()->create();
        $setting = Setting::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.settings.edit', $setting));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Edit')
            ->has('setting')
            ->has('groups')
            ->where('setting.id', $setting->id)
        );
    }

    public function test_authenticated_user_can_update_setting(): void
    {
        $user = User::factory()->create();
        $setting = Setting::factory()->create();

        $response = $this->actingAs($user)->patch(route('admin.settings.update', $setting), [
            'key' => 'updated.key',
            'group' => 'email',
            'value' => 'Updated Value',
            'type' => 'textarea',
            'label' => 'Updated Label',
            'description' => 'Updated description',
            'is_public' => false,
            'sort_order' => 10,
        ]);

        $response->assertRedirect(route('admin.settings.index'));
        $this->assertDatabaseHas('settings', [
            'id' => $setting->id,
            'key' => 'updated.key',
            'group' => 'email',
            'value' => 'Updated Value',
            'type' => 'textarea',
            'label' => 'Updated Label',
        ]);
    }

    public function test_update_setting_validates_unique_key_except_self(): void
    {
        $user = User::factory()->create();
        $setting = Setting::factory()->create(['key' => 'original.key']);
        Setting::factory()->create(['key' => 'existing.key']);

        $response = $this->actingAs($user)->patch(route('admin.settings.update', $setting), [
            'key' => 'existing.key',
            'group' => 'general',
            'type' => 'text',
            'label' => 'Test Setting',
        ]);

        $response->assertSessionHasErrors(['key']);
    }

    public function test_update_setting_allows_same_key(): void
    {
        $user = User::factory()->create();
        $setting = Setting::factory()->create(['key' => 'original.key']);

        $response = $this->actingAs($user)->patch(route('admin.settings.update', $setting), [
            'key' => 'original.key',
            'group' => 'general',
            'value' => 'New Value',
            'type' => 'text',
            'label' => 'Updated Label',
        ]);

        $response->assertRedirect(route('admin.settings.index'));
        $this->assertDatabaseHas('settings', [
            'id' => $setting->id,
            'key' => 'original.key',
            'value' => 'New Value',
            'label' => 'Updated Label',
        ]);
    }

    public function test_authenticated_user_can_delete_setting(): void
    {
        $user = User::factory()->create();
        $setting = Setting::factory()->create();

        $response = $this->actingAs($user)->delete(route('admin.settings.destroy', $setting));

        $response->assertRedirect(route('admin.settings.index'));
        $this->assertDatabaseMissing('settings', ['id' => $setting->id]);
    }

    public function test_settings_index_is_paginated(): void
    {
        $user = User::factory()->create();
        Setting::factory()->count(20)->create();

        $response = $this->actingAs($user)->get(route('admin.settings.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('settings.data', 15)
            ->has('settings.links')
            ->where('settings.total', 20)
        );
    }

    public function test_bulk_update_settings(): void
    {
        $user = User::factory()->create();
        $setting1 = Setting::factory()->create(['value' => 'old1']);
        $setting2 = Setting::factory()->create(['value' => 'old2']);

        $response = $this->actingAs($user)->post(route('admin.settings.bulk-update'), [
            'settings' => [
                ['id' => $setting1->id, 'value' => 'new1'],
                ['id' => $setting2->id, 'value' => 'new2'],
            ],
        ]);

        $response->assertRedirect(route('admin.settings.index'));
        $this->assertDatabaseHas('settings', ['id' => $setting1->id, 'value' => 'new1']);
        $this->assertDatabaseHas('settings', ['id' => $setting2->id, 'value' => 'new2']);
    }

    public function test_setting_model_get_value_method(): void
    {
        Setting::factory()->create(['key' => 'test.key', 'value' => 'test value']);

        $value = Setting::getValue('test.key');

        $this->assertEquals('test value', $value);
    }

    public function test_setting_model_get_value_returns_default(): void
    {
        $value = Setting::getValue('nonexistent.key', 'default');

        $this->assertEquals('default', $value);
    }

    public function test_setting_model_set_value_method(): void
    {
        Setting::factory()->create(['key' => 'test.key', 'value' => 'old value']);

        $result = Setting::setValue('test.key', 'new value');

        $this->assertTrue($result);
        $this->assertDatabaseHas('settings', ['key' => 'test.key', 'value' => 'new value']);
    }

    public function test_setting_model_get_grouped_method(): void
    {
        Setting::factory()->create(['group' => 'general', 'sort_order' => 1]);
        Setting::factory()->create(['group' => 'general', 'sort_order' => 2]);
        Setting::factory()->create(['group' => 'email', 'sort_order' => 1]);

        $grouped = Setting::getGrouped();

        $this->assertArrayHasKey('general', $grouped->toArray());
        $this->assertArrayHasKey('email', $grouped->toArray());
        $this->assertCount(2, $grouped['general']);
        $this->assertCount(1, $grouped['email']);
    }

    public function test_setting_model_get_public_method(): void
    {
        Setting::factory()->create(['is_public' => true]);
        Setting::factory()->create(['is_public' => true]);
        Setting::factory()->create(['is_public' => false]);

        $public = Setting::getPublic();

        $this->assertCount(2, $public);
    }

    public function test_setting_model_group_scope(): void
    {
        Setting::factory()->create(['group' => 'general']);
        Setting::factory()->create(['group' => 'email']);
        Setting::factory()->create(['group' => 'email']);

        $emailSettings = Setting::group('email')->get();

        $this->assertCount(2, $emailSettings);
    }
}
