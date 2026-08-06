<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalRateResolver;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAssessmentP2Test extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_rate_resolver_prefers_rental_class_over_general(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'type' => 'car',
            'rental_class' => 'suv',
        ]);

        RentalRate::factory()->daily()->create([
            'name' => 'General daily',
            'rate_per_period' => 400000,
            'vehicle_id' => null,
            'vehicle_type' => null,
            'rental_class' => null,
            'priority' => 0,
        ]);

        $classRate = RentalRate::factory()->daily()->create([
            'name' => 'SUV daily',
            'rate_per_period' => 750000,
            'vehicle_id' => null,
            'vehicle_type' => null,
            'rental_class' => 'suv',
            'priority' => 5,
            'min_periods' => 2,
        ]);

        $suggested = app(RentalRateResolver::class)->suggest(
            $vehicle,
            now()->toDateString(),
            now()->addDays(3)->toDateString(),
            'daily',
        );

        $this->assertNotNull($suggested);
        $this->assertSame($classRate->id, $suggested->id);
    }

    public function test_suggest_endpoint_returns_best_rate(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'mpv',
        ]);

        $rate = RentalRate::factory()->daily()->create([
            'rental_class' => 'mpv',
            'rate_per_period' => 500000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->getJson(route('module.rental.rates.suggest', [
                'vehicle_id' => $vehicle->id,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays(2)->toDateString(),
                'period_type' => 'daily',
            ]))
            ->assertOk()
            ->assertJsonPath('rate.id', $rate->id);
    }

    public function test_store_rejects_booking_shorter_than_rate_min_periods(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'suv',
        ]);
        $partner = Partner::factory()->create(['status' => 'active']);

        RentalRate::factory()->daily()->create([
            'rental_class' => 'suv',
            'min_periods' => 3,
            'rate_per_period' => 750000,
            'deposit_amount' => 1000000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.store'), [
                'vehicle_id' => $vehicle->id,
                'partner_id' => $partner->id,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDay()->toDateString(),
                'period_type' => 'daily',
                'rate_per_period' => 750000,
                'deposit_amount' => 1000000,
            ])
            ->assertSessionHasErrors('end_date');
    }

    public function test_rates_index_includes_rental_classes(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.settings.index', ['tab' => 'rates']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'rates')
                ->has('rentalClasses')
                ->where('rentalClasses.0.value', 'economy')
            );
    }
}
