<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Support\RentalCalendarOptions;
use Modules\Rental\Support\RentalGeneralSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalSettingsNavTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array<string, mixed>
     */
    private function generalPayload(array $overrides = []): array
    {
        return array_merge([
            'default_one_way_fee' => 150000,
            'passenger_booking_enabled' => false,
            'pending_reserved_ttl_minutes' => 120,
            'cancellation_fee_type' => 'fixed',
            'cancellation_fee_amount' => 0,
            'no_show_fee_type' => 'fixed',
            'no_show_fee_amount' => 0,
            'passenger_free_cancel_hours' => 24,
            'public_mask_plates' => true,
            'calendar_click_to_book' => true,
            'ai_inspection_enabled' => true,
            'ai_kyc_enabled' => true,
            'ai_pricing_optimizer_enabled' => true,
        ], $overrides);
    }

    public function test_settings_rates_tab_renders(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.settings.index', ['tab' => 'rates']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'rates')
                ->has('rates')
                ->has('rentalClasses')
                ->has('general.calendar_click_to_book')
                ->has('general.default_one_way_fee')
            );
    }

    public function test_settings_general_tab_renders_and_can_save_all_rental_settings(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.rental.settings.index', ['tab' => 'general']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'general')
                ->where('general.calendar_click_to_book', true)
                ->has('general.default_one_way_fee')
                ->has('general.passenger_booking_enabled')
                ->has('general.pending_reserved_ttl_minutes')
                ->has('general.cancellation_fee_type')
                ->has('general.no_show_fee_amount')
                ->where('general.ai_inspection_enabled', true)
                ->where('general.ai_kyc_enabled', true)
                ->where('general.ai_pricing_optimizer_enabled', true)
            );

        $this->actingAs($user)
            ->from(route('module.rental.settings.index', ['tab' => 'general']))
            ->patch(route('module.rental.settings.general.update'), $this->generalPayload([
                'default_one_way_fee' => 175000,
                'passenger_booking_enabled' => true,
                'pending_reserved_ttl_minutes' => 90,
                'cancellation_fee_type' => 'percent',
                'cancellation_fee_amount' => 10,
                'no_show_fee_type' => 'fixed',
                'no_show_fee_amount' => 50000,
                'calendar_click_to_book' => false,
                'ai_inspection_enabled' => false,
                'ai_kyc_enabled' => false,
                'ai_pricing_optimizer_enabled' => false,
            ]))
            ->assertRedirect(route('module.rental.settings.index', ['tab' => 'general']));

        $settings = RentalGeneralSettings::all();
        $this->assertSame('175000', $settings['default_one_way_fee']);
        $this->assertTrue($settings['passenger_booking_enabled']);
        $this->assertSame('90', $settings['pending_reserved_ttl_minutes']);
        $this->assertSame('percent', $settings['cancellation_fee_type']);
        $this->assertSame('10', $settings['cancellation_fee_amount']);
        $this->assertSame('fixed', $settings['no_show_fee_type']);
        $this->assertSame('50000', $settings['no_show_fee_amount']);
        $this->assertFalse($settings['calendar_click_to_book']);
        $this->assertFalse($settings['ai_inspection_enabled']);
        $this->assertFalse($settings['ai_kyc_enabled']);
        $this->assertFalse($settings['ai_pricing_optimizer_enabled']);
        $this->assertFalse(RentalCalendarOptions::clickToBookEnabled());

        foreach (RentalGeneralSettings::managedKeys() as $key) {
            $this->assertSame(
                RentalGeneralSettings::GROUP,
                Setting::query()->where('key', $key)->value('group'),
            );
        }

        $this->actingAs($user)
            ->get(route('module.rental.calendar.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Calendar/Index')
                ->where('calendarClickToBook', false)
            );
    }

    public function test_rental_module_settings_are_not_shown_on_generic_settings_rental_group(): void
    {
        $user = $this->createAdminUser();

        RentalGeneralSettings::update($this->generalPayload());

        Setting::query()->updateOrCreate(
            ['key' => 'rental.visible_placeholder'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Visible rental setting',
                'description' => 'Shown in generic settings.',
                'is_public' => false,
                'sort_order' => 1,
            ],
        );

        $this->actingAs($user)
            ->get(route('module.settings.group', 'rental'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Settings/Group')
                ->where('currentGroup', 'rental')
                ->where('groupSettings', fn ($settings) => collect($settings)->contains('key', 'rental.visible_placeholder')
                    && collect($settings)->every(
                        fn ($setting) => ! in_array($setting['key'], RentalGeneralSettings::managedKeys(), true)
                    ))
            );

        $this->actingAs($user)
            ->get(route('module.settings.group', RentalGeneralSettings::GROUP))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Settings/Group')
                ->has('groupSettings', 0)
                ->where('groups', fn ($groups) => ! collect($groups)->contains(RentalGeneralSettings::GROUP))
            );
    }

    public function test_settings_index_without_tab_redirects_to_general(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.settings.index'))
            ->assertRedirect(route('module.rental.settings.index', ['tab' => 'general']));
    }

    public function test_rates_index_redirects_to_settings_rates_tab(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.rates.index'))
            ->assertRedirect(route('module.rental.settings.index', ['tab' => 'rates']));
    }

    public function test_availability_remains_standalone_page(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.availability.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Availability/Index')
                ->has('board')
                ->has('filters')
            );
    }
}
