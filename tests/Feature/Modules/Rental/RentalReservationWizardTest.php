<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalReservationWizardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
        $this->user = $this->createAdminUser();
    }

    public function test_available_vehicles_includes_units_without_rates(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'No Rate Car']);

        $start = now()->addDays(2)->toDateString();
        $end = now()->addDays(4)->toDateString();

        $this->actingAs($this->user)
            ->getJson(route('module.rental.reservations.available_vehicles', [
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
            ]))
            ->assertOk()
            ->assertJsonPath('meta.has_active_rates', false)
            ->assertJsonPath('vehicles.0.id', $vehicle->id)
            ->assertJsonPath('vehicles.0.rate', null);
    }

    public function test_quote_accepts_manual_rate_when_no_tariff(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $start = now()->addDay()->toDateString();
        $end = now()->addDays(2)->toDateString();

        $this->actingAs($this->user)
            ->postJson(route('module.rental.reservations.quote'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'rate_per_period' => 400000,
                'deposit_amount' => 800000,
            ])
            ->assertOk()
            ->assertJsonPath('quote.available', true)
            ->assertJsonPath('quote.total_periods', 2)
            ->assertJsonPath('quote.rate_per_period', 400000)
            ->assertJsonPath('quote.base_amount', 800000)
            ->assertJsonPath('quote.deposit_amount', 800000);
    }

    public function test_available_vehicles_returns_only_free_units_for_range(): void
    {
        $free = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'Free Car']);
        $busy = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'Busy Car']);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $free->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $busy->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDays(2)->toDateString();
        $end = now()->addDays(4)->toDateString();

        Rental::factory()->confirmed()->create([
            'vehicle_id' => $busy->id,
            'start_date' => $start,
            'end_date' => $end,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson(route('module.rental.reservations.available_vehicles', [
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
            ]))
            ->assertOk();

        $ids = collect($response->json('vehicles'))->pluck('id')->all();
        $this->assertContains($free->id, $ids);
        $this->assertNotContains($busy->id, $ids);
    }

    public function test_available_vehicles_excludes_self_when_editing(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 250000,
            'deposit_amount' => 400000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDays(3)->toDateString();
        $end = now()->addDays(5)->toDateString();

        $rental = Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
        ]);

        $this->actingAs($this->user)
            ->getJson(route('module.rental.reservations.available_vehicles', [
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'exclude_rental_id' => $rental->id,
            ]))
            ->assertOk()
            ->assertJsonPath('vehicles.0.id', $vehicle->id);
    }

    public function test_quote_endpoint_returns_server_pricing(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 350000,
            'deposit_amount' => 1000000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(3)->toDateString();

        $this->actingAs($this->user)
            ->postJson(route('module.rental.reservations.quote'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
            ])
            ->assertOk()
            ->assertJsonPath('quote.available', true)
            ->assertJsonPath('quote.total_periods', 3)
            ->assertJsonPath('quote.rate_per_period', 350000)
            ->assertJsonPath('quote.base_amount', 1050000)
            ->assertJsonPath('quote.deposit_amount', 1000000);
    }

    public function test_walk_in_json_returns_partner_without_redirect(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('module.rental.walk_in_customers.store'), [
                'name' => 'Walk In Guest',
                'phone' => '081234567890',
            ], [
                'X-Reservation-Wizard' => '1',
            ])
            ->assertOk()
            ->assertJsonPath('partner.name', 'Walk In Guest')
            ->assertJsonStructure(['partner' => ['id', 'name', 'code'], 'created', 'message']);

        $this->assertDatabaseHas('partners', [
            'id' => $response->json('partner.id'),
            'name' => 'Walk In Guest',
        ]);
    }

    public function test_create_page_exposes_wizard_urls(): void
    {
        $this->actingAs($this->user)
            ->get(route('module.rental.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->has('availableVehiclesUrl')
                ->has('quoteUrl')
                ->has('walkInUrl'));
    }

    public function test_edit_page_exposes_wizard_urls(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'partner_id' => Partner::factory(),
            'vehicle_id' => Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]),
        ]);

        $this->actingAs($this->user)
            ->get(route('module.rental.edit', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Edit')
                ->has('availableVehiclesUrl')
                ->has('quoteUrl')
                ->has('walkInUrl'));
    }
}
