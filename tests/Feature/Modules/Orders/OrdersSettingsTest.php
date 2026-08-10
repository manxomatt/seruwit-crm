<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Support\OrdersSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class OrdersSettingsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_and_update_orders_settings(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.orders.settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Orders/Settings/Edit')
                ->has('settings.auto_confirm_do_from_gin')
                ->has('settings.require_pod_before_trip_complete')
            );

        $this->actingAs($user)
            ->from(route('module.orders.settings.edit'))
            ->patch(route('module.orders.settings.update'), [
                'auto_confirm_do_from_gin' => true,
                'require_pod_before_trip_complete' => 'from_gin',
            ])
            ->assertRedirect(route('module.orders.settings.edit'));

        $settings = OrdersSettings::all();
        $this->assertTrue($settings['auto_confirm_do_from_gin']);
        $this->assertSame('from_gin', $settings['require_pod_before_trip_complete']);
    }

    public function test_orders_settings_are_hidden_from_general_settings_ui(): void
    {
        OrdersSettings::update([
            'auto_confirm_do_from_gin' => false,
            'require_pod_before_trip_complete' => 'off',
        ]);

        $this->assertFalse(
            \App\Models\Setting::query()->visibleInSettingsUi()->where('group', 'orders')->exists()
        );
    }
}
