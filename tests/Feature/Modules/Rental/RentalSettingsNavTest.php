<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
            );
    }

    public function test_settings_general_tab_renders_and_can_toggle_calendar_click_to_book(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.rental.settings.index', ['tab' => 'general']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'general')
                ->where('general.calendar_click_to_book', true)
            );

        $this->actingAs($user)
            ->from(route('module.rental.settings.index', ['tab' => 'general']))
            ->patch(route('module.rental.settings.general.update'), [
                'calendar_click_to_book' => false,
            ])
            ->assertRedirect(route('module.rental.settings.index', ['tab' => 'general']));

        $this->assertFalse(\Modules\Rental\Support\RentalCalendarOptions::clickToBookEnabled());

        $this->actingAs($user)
            ->get(route('module.rental.calendar.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Calendar/Index')
                ->where('calendarClickToBook', false)
            );
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
