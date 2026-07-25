<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GlobalSearchTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_search(): void
    {
        $this->getJson(route('module.search', ['q' => 'acme']))
            ->assertUnauthorized();
    }

    public function test_search_requires_minimum_query_length(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->getJson(route('module.search', ['q' => 'a']))
            ->assertOk()
            ->assertJson([
                'results' => [],
                'query' => 'a',
            ]);
    }

    public function test_search_finds_installed_module_records(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::factory()->create([
            'name' => 'Acme Global Trading',
            'code' => 'PART-ACME01',
        ]);
        $product = Product::factory()->create([
            'name' => 'Acme Premium Coffee',
            'code' => 'PRD-ACME',
        ]);
        $vehicle = Vehicle::factory()->create([
            'name' => 'Acme Fleet Truck',
            'plate_number' => 'B 1234 ACM',
        ]);
        $driver = Driver::factory()->create([
            'name' => 'Acme Driver One',
        ]);
        $order = DeliveryOrder::factory()->create([
            'code' => 'DO-ACME01',
            'partner_id' => $partner->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('module.search', ['q' => 'Acme']))
            ->assertOk();

        $types = collect($response->json('results'))->pluck('type')->unique()->values()->all();

        $this->assertContains('partner', $types);
        $this->assertContains('product', $types);
        $this->assertContains('vehicle', $types);
        $this->assertContains('driver', $types);
        $this->assertContains('order', $types);

        $partnerHit = collect($response->json('results'))->firstWhere('type', 'partner');
        $this->assertSame($partner->name, $partnerHit['title']);
        $this->assertStringContainsString((string) $partner->id, $partnerHit['url']);
    }

    public function test_search_respects_permissions(): void
    {
        $user = $this->createUserWithoutRole();

        Partner::factory()->create(['name' => 'Secret Partner Corp']);

        $this->actingAs($user)
            ->getJson(route('module.search', ['q' => 'Secret']))
            ->assertOk()
            ->assertJson([
                'results' => [],
            ]);
    }

    public function test_search_finds_core_users(): void
    {
        $admin = $this->createAdminUser();
        $target = User::factory()->create([
            'name' => 'Zelda Searchable',
            'email' => 'zelda.search@example.com',
        ]);

        $response = $this->actingAs($admin)
            ->getJson(route('module.search', ['q' => 'Zelda']))
            ->assertOk();

        $userHit = collect($response->json('results'))->firstWhere('type', 'user');

        $this->assertNotNull($userHit);
        $this->assertSame($target->name, $userHit['title']);
        $this->assertSame($target->email, $userHit['subtitle']);
    }
}
