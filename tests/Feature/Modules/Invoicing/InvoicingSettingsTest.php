<?php

namespace Tests\Feature\Modules\Invoicing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Support\InvoicingSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class InvoicingSettingsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_and_update_invoicing_settings(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.invoicing.settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Invoicing/Settings/Edit')
                ->has('settings.default_payment_term_days')
            );

        $this->actingAs($user)
            ->from(route('module.invoicing.settings.edit'))
            ->patch(route('module.invoicing.settings.update'), [
                'default_payment_term_days' => 14,
            ])
            ->assertRedirect(route('module.invoicing.settings.edit'));

        $this->assertSame('14', InvoicingSettings::all()['default_payment_term_days']);
    }

    public function test_invoicing_settings_are_hidden_from_general_settings_ui(): void
    {
        InvoicingSettings::update(['default_payment_term_days' => 0]);

        $this->assertFalse(
            \App\Models\Setting::query()->visibleInSettingsUi()->where('group', 'invoicing')->exists()
        );
    }
}
