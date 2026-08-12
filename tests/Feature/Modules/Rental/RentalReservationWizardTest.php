<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FleetBaseKind;
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

    public function test_available_vehicles_excludes_units_without_rates(): void
    {
        $withRate = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'Priced Car']);
        $withoutRate = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'No Rate Car']);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $withRate->id,
            'vehicle_type' => null,
            'rental_class' => null,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDays(2)->toDateString();
        $end = now()->addDays(4)->toDateString();

        $response = $this->actingAs($this->user)
            ->getJson(route('module.rental.reservations.available_vehicles', [
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
            ]))
            ->assertOk()
            ->assertJsonPath('meta.has_active_rates', true)
            ->assertJsonPath('meta.skipped_no_rate', 1);

        $ids = collect($response->json('vehicles'))->pluck('id')->all();
        $this->assertContains($withRate->id, $ids);
        $this->assertNotContains($withoutRate->id, $ids);
        $this->assertNotNull($response->json('vehicles.0.rate'));
    }

    public function test_quote_rejects_vehicle_without_tariff(): void
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
            ->assertJsonPath('quote.available', false)
            ->assertJsonPath('quote.rate', null);
    }

    public function test_available_vehicles_returns_only_free_units_for_range(): void
    {
        $free = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'name' => 'Free Car',
            'photo_url' => 'https://cdn.example.test/vehicles/free-car.jpg',
        ]);
        $busy = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'Busy Car']);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $free->id,
            'vehicle_type' => null,
            'rental_class' => null,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $busy->id,
            'vehicle_type' => null,
            'rental_class' => null,
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

        $freeRow = collect($response->json('vehicles'))->firstWhere('id', $free->id);
        $this->assertSame('https://cdn.example.test/vehicles/free-car.jpg', $freeRow['photo_url']);
        $this->assertArrayHasKey('photo_url', $freeRow);
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
            ->assertJsonStructure(['partner' => ['id', 'name', 'code', 'phone', 'email'], 'created', 'message']);

        $this->assertDatabaseHas('partners', [
            'id' => $response->json('partner.id'),
            'name' => 'Walk In Guest',
        ]);
    }

    public function test_create_page_exposes_wizard_urls(): void
    {
        $partner = Partner::factory()->create([
            'status' => 'active',
            'phone' => '628111222333',
            'email' => 'customer@example.test',
            'is_blacklisted' => false,
        ]);

        $this->actingAs($this->user)
            ->get(route('module.rental.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->has('availableVehiclesUrl')
                ->has('quoteUrl')
                ->has('walkInUrl')
                ->where('partners.0.id', $partner->id)
                ->where('partners.0.phone', '628111222333')
                ->where('partners.0.email', 'customer@example.test')
                ->has('partners.0.mobile')
                ->has('partners.0.account_type')
                ->has('partners.0.license_expires_at'));
    }

    public function test_create_page_prefills_availability_board_reservation(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $depot = FleetBase::factory()->create([
            'kind' => FleetBaseKind::Depot->value,
            'status' => FleetBase::STATUS_ACTIVE,
            'name' => 'Bintaro Junction',
            'address' => 'Jl. Palem',
            'city' => 'Depok',
        ]);
        FleetBase::factory()->create([
            'kind' => FleetBaseKind::Depot->value,
            'status' => FleetBase::STATUS_INACTIVE,
        ]);

        $tomorrow = now()->addDay()->toDateString();

        $this->actingAs($this->user)
            ->get(route('module.rental.create', [
                'vehicle_id' => $vehicle->id,
                'start_date' => $tomorrow,
                'end_date' => $tomorrow,
                'start_step' => 4,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->where('prefill.vehicle_id', $vehicle->id)
                ->where('prefill.start_date', $tomorrow)
                ->where('prefill.end_date', $tomorrow)
                ->where('prefill.start_step', 4)
                ->where('prefill.pickup_location_id', $depot->id)
                ->where('prefill.return_location_id', $depot->id)
                ->where('prefill.pickup_location', $depot->displayAddress())
                ->where('prefill.return_location', $depot->displayAddress()));
    }

    public function test_create_page_without_start_step_does_not_prefill_depot(): void
    {
        $this->actingAs($this->user)
            ->get(route('module.rental.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->where('prefill.start_step', null)
                ->missing('prefill.pickup_location_id')
                ->missing('prefill.return_location_id'));
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
