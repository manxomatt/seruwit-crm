<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\RentalRate;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalVehicleSeoTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Passenger rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );
    }

    public function test_vehicle_show_exposes_seo_payload(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'name' => 'Avanza Silver',
            'rental_class' => 'mpv',
            'capacity_seats' => 7,
            'plate_number' => 'B1234XYZ',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 350000,
            'deposit_amount' => 1000000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(3)->toDateString();

        $this->get(route('book.rental.vehicles.show', [
            'vehicle' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/VehicleShow')
                ->where('seo.title', fn (string $title): bool => str_contains($title, 'Avanza Silver'))
                ->has('seo.description')
                ->has('seo.url')
                ->where('seo.json_ld.@type', 'Car')
                ->where('seo.json_ld.name', 'Avanza Silver')
                ->has('seo.json_ld.offers.price'));
    }
}
