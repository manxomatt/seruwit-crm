<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalInsurancePackage;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalGeneralSettings;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PublicRentalVehicleInsuranceTest extends TestCase
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

    public function test_vehicle_show_and_quote_include_insurance_when_enabled(): void
    {
        RentalGeneralSettings::update(array_merge(
            RentalGeneralSettings::all(),
            ['insurance_packages_enabled' => true]
        ));

        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'name' => 'Avanza Silver',
            'rental_class' => 'mpv',
            'plate_number' => 'B1234XYZ',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $package = RentalInsurancePackage::query()->firstWhere('code', 'cdw');
        if (! $package) {
            $package = RentalInsurancePackage::factory()->create([
                'code' => 'custom_cdw',
                'name' => 'Collision Damage Waiver',
                'period_type' => 'daily',
                'amount' => 50000,
                'is_active' => true,
            ]);
        }

        $packageAmount = (float) $package->amount;
        $start = now()->addDay()->toDateString();
        $end = now()->addDays(2)->toDateString();

        $this->get(route('book.rental.vehicles.show', [
            'vehicle' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'insurance_package_id' => $package->id,
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/VehicleShow')
                ->where('insurance_packages_enabled', true)
                ->where('filters.insurance_package_id', $package->id)
                ->where('quote.insurance_amount', $packageAmount));

        $this->postJson(route('book.rental.quote'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'period_type' => 'daily',
            'insurance_package_id' => $package->id,
        ])
            ->assertOk()
            ->assertJsonPath('quote.insurance_amount', $packageAmount);
    }

    public function test_vehicle_show_and_booking_ignore_insurance_when_disabled(): void
    {
        RentalGeneralSettings::update(array_merge(
            RentalGeneralSettings::all(),
            ['insurance_packages_enabled' => false]
        ));

        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'name' => 'Avanza Silver',
            'rental_class' => 'mpv',
            'plate_number' => 'B1234XYZ',
        ]);

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $package = RentalInsurancePackage::query()->firstWhere('code', 'cdw');
        if (! $package) {
            $package = RentalInsurancePackage::factory()->create([
                'code' => 'custom_cdw_2',
                'name' => 'Collision Damage Waiver',
                'period_type' => 'daily',
                'amount' => 50000,
                'is_active' => true,
            ]);
        }

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(2)->toDateString();

        $this->get(route('book.rental.vehicles.show', [
            'vehicle' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'insurance_package_id' => $package->id,
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/VehicleShow')
                ->where('insurance_packages_enabled', false)
                ->has('insurance_packages', 0)
                ->where('filters.insurance_package_id', null)
                ->where('quote.insurance_amount', null));

        $this->postJson(route('book.rental.quote'), [
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
            'period_type' => 'daily',
            'insurance_package_id' => $package->id,
        ])
            ->assertOk()
            ->assertJsonPath('quote.insurance_amount', null);

        $phone = '081299990001';
        $otp = app(PassengerOtpService::class)->send($phone);

        $this->from(route('book.rental.vehicles.show', ['vehicle' => $vehicle->id]))
            ->post(route('book.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'customer_name' => 'Jane Doe',
                'booker_phone' => $phone,
                'otp_code' => $otp,
                'insurance_package_id' => $package->id,
            ])
            ->assertSessionHasNoErrors();

        $rental = Rental::query()->latest('id')->first();
        $this->assertNotNull($rental);
        $this->assertNull($rental->insurance_package_id);
    }
}
