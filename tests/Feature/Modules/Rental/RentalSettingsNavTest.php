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
