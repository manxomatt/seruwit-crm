<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AppearanceSettingsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_public_appearance_colors_are_shared_with_inertia(): void
    {
        $user = $this->createAdminUser();

        Setting::factory()->create([
            'key' => 'appearance.primary_color',
            'group' => 'appearance',
            'value' => '#0f766e',
            'type' => 'color',
            'is_public' => true,
        ]);
        Setting::factory()->create([
            'key' => 'appearance.secondary_color',
            'group' => 'appearance',
            'value' => '#f59e0b',
            'type' => 'color',
            'is_public' => true,
        ]);
        Setting::factory()->create([
            'key' => 'appearance.font_family',
            'group' => 'appearance',
            'value' => 'Inter, sans-serif',
            'type' => 'text',
            'is_public' => true,
        ]);
        Setting::factory()->create([
            'key' => 'appearance.dark_mode',
            'group' => 'appearance',
            'value' => '1',
            'type' => 'boolean',
            'is_public' => true,
        ]);

        $this->actingAs($user)
            ->get(route('module.settings.group', 'appearance'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('settings', fn ($settings) => $settings
                    ->where('appearance.primary_color', '#0f766e')
                    ->where('appearance.secondary_color', '#f59e0b')
                    ->where('appearance.font_family', 'Inter, sans-serif')
                    ->where('appearance.dark_mode', '1')
                    ->etc()
                )
            );
    }

    public function test_app_shell_injects_css_variables_and_custom_assets(): void
    {
        $user = $this->createAdminUser();

        Setting::factory()->create([
            'key' => 'appearance.primary_color',
            'group' => 'appearance',
            'value' => '#112233',
            'type' => 'color',
            'is_public' => true,
        ]);
        Setting::factory()->create([
            'key' => 'appearance.secondary_color',
            'group' => 'appearance',
            'value' => '#445566',
            'type' => 'color',
            'is_public' => true,
        ]);
        Setting::factory()->create([
            'key' => 'appearance.dark_mode',
            'group' => 'appearance',
            'value' => '1',
            'type' => 'boolean',
            'is_public' => true,
        ]);
        Setting::factory()->create([
            'key' => 'appearance.custom_css',
            'group' => 'appearance',
            'value' => '.appearance-test{outline:1px solid red}',
            'type' => 'textarea',
            'is_public' => false,
        ]);
        Setting::factory()->create([
            'key' => 'appearance.custom_js',
            'group' => 'appearance',
            'value' => 'window.__appearanceTest = true;',
            'type' => 'textarea',
            'is_public' => false,
        ]);

        $response = $this->actingAs($user)->get(route('module.settings.group', 'appearance'));

        $response->assertOk();
        $response->assertSee('--color-primary: #112233', false);
        $response->assertSee('--color-secondary: #445566', false);
        $response->assertSee('class="dark"', false);
        $response->assertSee('.appearance-test{outline:1px solid red}', false);
        $response->assertSee('window.__appearanceTest = true;', false);
        $response->assertSee('name="theme-color" content="#112233"', false);
    }
}
