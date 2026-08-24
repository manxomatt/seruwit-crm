<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Pages\Models\Page;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalStorefrontBlocks;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalStorefrontBlocksTest extends TestCase
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

    private function bookableVehicle(string $name = 'Avanza Silver'): Vehicle
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'mpv',
            'name' => $name,
            'plate_number' => 'B1234XYZ',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 350000,
            'deposit_amount' => 1000000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        return $vehicle;
    }

    public function test_render_fleet_returns_live_grid(): void
    {
        $vehicle = $this->bookableVehicle();

        $html = RentalStorefrontBlocks::renderFleet('featured', 6);

        $this->assertStringContainsString('Avanza Silver', $html);
        $this->assertStringContainsString('350.000', $html);
        $this->assertStringContainsString(route('book.rental.vehicles.show', $vehicle->id), $html);
    }

    public function test_render_fleet_respects_limit(): void
    {
        $this->bookableVehicle('Avanza Silver');
        $this->bookableVehicle('Xenia Black');
        $this->bookableVehicle('Innova White');

        $html = RentalStorefrontBlocks::renderFleet('featured', 2);

        $this->assertSame(2, preg_match_all('#/book/rental/vehicles/#', $html));
    }

    public function test_render_fleet_filters_by_class(): void
    {
        $suv = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'suv',
            'name' => 'Fortuner Black',
            'plate_number' => 'B9SUV',
        ]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $suv->id,
            'rate_per_period' => 800000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $this->bookableVehicle('Avanza Silver'); // mpv, should be excluded

        $html = RentalStorefrontBlocks::renderFleet('featured', 6, 'suv');

        $this->assertStringContainsString('Fortuner Black', $html);
        $this->assertStringNotContainsString('Avanza Silver', $html);
    }

    public function test_render_fleet_empty_when_booking_disabled(): void
    {
        Setting::query()->where('key', 'rental.passenger_booking_enabled')->update(['value' => '0']);
        $this->bookableVehicle();

        $this->assertSame('', RentalStorefrontBlocks::renderFleet('featured', 6));
    }

    public function test_render_fleet_empty_when_no_bookable_vehicles(): void
    {
        $this->assertSame('', RentalStorefrontBlocks::renderFleet('featured', 6));
    }

    public function test_published_page_renders_fleet_marker_as_live_grid(): void
    {
        $vehicle = $this->bookableVehicle();

        Page::factory()->published()->create([
            'slug' => 'sewa-mobil',
            'html' => '<section><rental-fleet type="featured" limit="3"></rental-fleet></section>',
        ]);

        $this->get(route('pages.render', 'sewa-mobil'))
            ->assertOk()
            ->assertSee('Avanza Silver')
            ->assertSee(route('book.rental.vehicles.show', $vehicle->id), false)
            ->assertSee('--brand-primary', false)
            ->assertDontSee('<rental-fleet', false);
    }

    public function test_published_page_drops_fleet_marker_when_booking_disabled(): void
    {
        Setting::query()->where('key', 'rental.passenger_booking_enabled')->update(['value' => '0']);
        $this->bookableVehicle();

        Page::factory()->published()->create([
            'slug' => 'sewa-mobil',
            'html' => '<section><rental-fleet type="featured" limit="3"></rental-fleet></section>',
        ]);

        $this->get(route('pages.render', 'sewa-mobil'))
            ->assertOk()
            ->assertDontSee('Avanza Silver')
            ->assertDontSee('<rental-fleet', false);
    }
}
