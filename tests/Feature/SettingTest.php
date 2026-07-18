<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SettingTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_a_settings_group(): void
    {
        Setting::factory()->group('general')->create();

        $this->get(route('module.settings.group', 'general'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_access_a_settings_group(): void
    {
        $user = $this->createUserWithoutRole();
        Setting::factory()->group('general')->create();

        $this->actingAs($user)->get(route('module.settings.group', 'general'))->assertForbidden();
    }

    public function test_index_redirects_to_the_first_group_alphabetically(): void
    {
        $user = $this->createAdminUser();
        Setting::factory()->group('site')->create();
        Setting::factory()->group('general')->create();

        $this->actingAs($user)->get(route('module.settings.index'))
            ->assertRedirect(route('module.settings.group', 'general'));
    }

    public function test_a_group_page_only_returns_that_groups_settings_in_sort_order(): void
    {
        $user = $this->createAdminUser();
        Setting::factory()->group('general')->create(['label' => 'Second', 'sort_order' => 2]);
        Setting::factory()->group('general')->create(['label' => 'First', 'sort_order' => 1]);
        Setting::factory()->group('site')->create(['label' => 'Other Group']);

        $this->actingAs($user)->get(route('module.settings.group', 'general'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Settings/Group')
                ->where('currentGroup', 'general')
                ->has('settings', 2)
                ->where('settings.0.label', 'First')
                ->where('settings.1.label', 'Second')
                ->has('groups', 2)
            );
    }

    public function test_bulk_update_persists_multiple_values_and_redirects_back_to_the_group(): void
    {
        $user = $this->createAdminUser();
        $a = Setting::factory()->group('general')->create(['value' => 'old-a']);
        $b = Setting::factory()->group('general')->create(['value' => 'old-b']);

        $this->actingAs($user)->post(route('module.settings.bulk-update'), [
            'group' => 'general',
            'settings' => [
                ['id' => $a->id, 'value' => 'new-a'],
                ['id' => $b->id, 'value' => 'new-b'],
            ],
        ])->assertRedirect(route('module.settings.group', 'general'));

        $this->assertDatabaseHas('settings', ['id' => $a->id, 'value' => 'new-a']);
        $this->assertDatabaseHas('settings', ['id' => $b->id, 'value' => 'new-b']);
    }

    public function test_bulk_update_requires_the_settings_update_permission(): void
    {
        $user = $this->createUserWithRole();
        $setting = Setting::factory()->group('general')->create();

        $this->actingAs($user)->post(route('module.settings.bulk-update'), [
            'group' => 'general',
            'settings' => [['id' => $setting->id, 'value' => 'nope']],
        ])->assertForbidden();
    }

    public function test_create_prefills_the_selected_group_and_redirects_into_it(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.settings.create', ['group' => 'seo']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('selectedGroup', 'seo'));

        $this->actingAs($user)->post(route('module.settings.store'), [
            'key' => 'seo.new_key',
            'group' => 'seo',
            'value' => 'hello',
            'type' => 'text',
            'label' => 'New Key',
        ])->assertRedirect(route('module.settings.group', 'seo'));

        $this->assertDatabaseHas('settings', ['key' => 'seo.new_key', 'group' => 'seo']);
    }

    public function test_create_can_define_a_brand_new_group_not_seen_before(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.settings.create', ['new_group' => 1]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('isNewGroup', true));

        $this->actingAs($user)->post(route('module.settings.store'), [
            'key' => 'shipping.provider',
            'group' => 'shipping',
            'value' => 'JNE',
            'type' => 'text',
            'label' => 'Shipping Provider',
        ])->assertRedirect(route('module.settings.group', 'shipping'));

        $this->assertDatabaseHas('settings', ['key' => 'shipping.provider', 'group' => 'shipping']);
    }

    public function test_a_group_name_must_be_url_safe(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.settings.store'), [
            'key' => 'bad.key',
            'group' => 'Not Valid!',
            'value' => 'x',
            'type' => 'text',
            'label' => 'Bad',
        ])->assertSessionHasErrors('group');
    }

    public function test_admin_can_delete_a_setting(): void
    {
        $user = $this->createAdminUser();
        $setting = Setting::factory()->group('general')->create();

        $this->actingAs($user)->delete(route('module.settings.destroy', $setting))
            ->assertRedirect(route('module.settings.group', 'general'));

        $this->assertDatabaseMissing('settings', ['id' => $setting->id]);
    }
}
