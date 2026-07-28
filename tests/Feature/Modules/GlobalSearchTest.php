<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\DriverScoring\Models\DriverIncentiveRule;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\SupplierBill;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductAttribute;
use Modules\Product\Models\ProductTag;
use Modules\Product\Models\ProductType;
use Modules\Sales\Models\SalesOrder;
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

    public function test_search_finds_product_module_catalog_records(): void
    {
        $user = $this->createAdminUser();

        $principal = Principal::factory()->create([
            'name' => 'Zebra Principal Foods',
            'code' => 'PRC-ZEBRA',
        ]);
        $brand = Brand::factory()->create([
            'principal_id' => $principal->id,
            'name' => 'Zebra Brand',
        ]);
        ProductType::factory()->create(['name' => 'Zebra Snacks']);
        ProductAttribute::factory()->create(['name' => 'Zebra Size']);
        ProductTag::factory()->create(['name' => 'Zebra Promo']);

        $response = $this->actingAs($user)
            ->getJson(route('module.search', ['q' => 'Zebra']))
            ->assertOk();

        $types = collect($response->json('results'))->pluck('type')->unique()->values()->all();

        $this->assertContains('principal', $types);
        $this->assertContains('brand', $types);
        $this->assertContains('product_type', $types);
        $this->assertContains('product_attribute', $types);
        $this->assertContains('product_tag', $types);

        $brandHit = collect($response->json('results'))->firstWhere('type', 'brand');
        $this->assertSame($brand->name, $brandHit['title']);
        $this->assertStringContainsString('/brands/', $brandHit['url']);
    }

    public function test_search_finds_newer_module_records(): void
    {
        $user = $this->createAdminUser();

        $location = Location::factory()->create([
            'code' => 'LOC-NOVA01',
            'name' => 'Nova City Hub',
            'city' => 'Novapolis',
        ]);
        $salesOrder = SalesOrder::factory()->create([
            'so_number' => 'SO-NOVA-0001',
        ]);
        $partner = Partner::factory()->create(['name' => 'Nova Supplier Co']);
        $bill = SupplierBill::query()->create([
            'code' => 'BILL-NOVA-01',
            'partner_id' => $partner->id,
            'status' => SupplierBill::STATUS_DRAFT,
            'bill_date' => now()->toDateString(),
            'subtotal' => 100000,
            'tax_amount' => 0,
            'total' => 100000,
            'amount_paid' => 0,
        ]);
        $account = Account::query()->create([
            'code' => '1-NOVA',
            'name' => 'Nova Cash Account',
            'type' => Account::TYPE_ASSET,
            'normal_balance' => Account::NORMAL_DEBIT,
            'is_postable' => true,
            'is_active' => true,
        ]);
        DriverIncentiveRule::query()->create([
            'name' => 'Nova Top Driver Bonus',
            'period' => DriverIncentiveRule::PERIOD_MONTHLY,
            'min_score' => 80,
            'min_days' => 20,
            'reward_amount' => 500000,
            'reward_label' => 'Nova Bonus',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('module.search', ['q' => 'Nova']))
            ->assertOk();

        $types = collect($response->json('results'))->pluck('type')->unique()->values()->all();

        $this->assertContains('location', $types);
        $this->assertContains('sales_order', $types);
        $this->assertContains('supplier_bill', $types);
        $this->assertContains('account', $types);
        $this->assertContains('incentive_rule', $types);

        $locationHit = collect($response->json('results'))->firstWhere('type', 'location');
        $this->assertSame($location->name, $locationHit['title']);
        $this->assertStringContainsString('/partners/locations', $locationHit['url']);

        $soHit = collect($response->json('results'))->firstWhere('type', 'sales_order');
        $this->assertSame($salesOrder->so_number, $soHit['title']);
        $this->assertStringContainsString('/sales/sales-orders/', $soHit['url']);

        $billHit = collect($response->json('results'))->firstWhere('type', 'supplier_bill');
        $this->assertSame($bill->code, $billHit['title']);

        $accountHit = collect($response->json('results'))->firstWhere('type', 'account');
        $this->assertStringContainsString($account->code, $accountHit['title']);
    }
}
