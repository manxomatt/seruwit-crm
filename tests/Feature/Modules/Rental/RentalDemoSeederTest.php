<?php

namespace Tests\Feature\Modules\Rental;

use Database\Seeders\TenantRentalDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seeds_thirty_demo_rentals(): void
    {
        $this->seed(TenantRentalDemoSeeder::class);

        $this->assertSame(
            TenantRentalDemoSeeder::RENTAL_COUNT,
            Rental::query()->where('notes', 'like', '%'.TenantRentalDemoSeeder::TAG.'%')->count(),
        );

        $this->assertGreaterThan(0, RentalRate::query()->where('notes', 'like', '%'.TenantRentalDemoSeeder::TAG.'%')->count());
        $this->assertGreaterThan(0, Rental::query()->where('status', Rental::STATUS_ACTIVE)->count());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantRentalDemoSeeder::class);
        $rentalCount = Rental::query()->where('notes', 'like', '%'.TenantRentalDemoSeeder::TAG.'%')->count();
        $rateCount = RentalRate::query()->where('notes', 'like', '%'.TenantRentalDemoSeeder::TAG.'%')->count();

        $this->seed(TenantRentalDemoSeeder::class);

        $this->assertSame(
            $rentalCount,
            Rental::query()->where('notes', 'like', '%'.TenantRentalDemoSeeder::TAG.'%')->count(),
        );
        $this->assertSame(
            $rateCount,
            RentalRate::query()->where('notes', 'like', '%'.TenantRentalDemoSeeder::TAG.'%')->count(),
        );
    }

    public function test_rental_index_paginates_demo_results(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantRentalDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.rental.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Index')
                ->where('rentals.per_page', 15)
                ->where('rentals.total', TenantRentalDemoSeeder::RENTAL_COUNT)
                ->where('rentals.last_page', 2)
                ->has('rentals.data', 15)
                ->has('rentals.links'));

        $this->actingAs($user)
            ->get(route('module.rental.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('rentals.data', 15));
    }
}
