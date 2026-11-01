<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalLine;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\FleetProfitabilityService;
use Modules\Accounting\Support\JournalService;
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Support\ExpenseSchemaInitializer;
use Modules\Expenses\Support\ExpenseService;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetBase\Models\FleetBase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetProfitabilityReportTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function beforeRefreshingDatabase(): void
    {
        if (Schema::hasTable('accounts') && Schema::hasTable('bank_transactions')) {
            ExpenseSchemaInitializer::ensureReady();
            RefreshDatabaseState::$migrated = true;
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->withoutMiddleware([
            \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
            \Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
            \App\Http\Middleware\EnsureTenantIsActive::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            \App\Http\Middleware\RedirectUnfinishedSignup::class,
            \App\Http\Middleware\EnsureCentralUserCanAccessModule::class,
        ]);

        \App\Models\Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Full system access']
        );

        ExpenseSchemaInitializer::ensureReady();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_journal_lines_carry_vehicle_and_fleet_base_dimensions(): void
    {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $pool = FleetBase::query()->create([
            'code' => 'POOL-JKT',
            'name' => 'Pool Jakarta Selatan',
            'city' => 'Jakarta Selatan',
            'manager_id' => $user->id,
        ]);

        $vehicle = Vehicle::factory()->create([
            'plate_number' => 'B 1234 DIM',
            'home_base_id' => $pool->id,
            'status' => 'available',
        ]);

        $revenueAccount = Account::findByCode('4110') ?? Account::query()->where('system_role', 'rental_revenue')->firstOrFail();
        $cashAccount = Account::findByCode('1110') ?? Account::query()->where('system_role', 'cash')->firstOrFail();

        $journal = app(JournalService::class)->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Pendapatan sewa unit B 1234 DIM',
            'lines' => [
                [
                    'account_id' => $cashAccount->id,
                    'debit' => 1200000,
                    'credit' => 0,
                    'vehicle_id' => $vehicle->id,
                    'fleet_base_id' => $pool->id,
                ],
                [
                    'account_id' => $revenueAccount->id,
                    'debit' => 0,
                    'credit' => 1200000,
                    'vehicle_id' => $vehicle->id,
                    'fleet_base_id' => $pool->id,
                ],
            ],
        ], $user->id);

        app(JournalService::class)->post($journal, $user->id);

        $postedLine = JournalLine::query()
            ->where('journal_entry_id', $journal->id)
            ->where('account_id', $revenueAccount->id)
            ->first();

        $this->assertNotNull($postedLine);
        $this->assertSame((int) $vehicle->id, (int) $postedLine->vehicle_id);
        $this->assertSame((int) $pool->id, (int) $postedLine->fleet_base_id);
        $this->assertInstanceOf(Vehicle::class, $postedLine->vehicle);
        $this->assertInstanceOf(FleetBase::class, $postedLine->fleetBase);
    }

    public function test_fleet_profitability_service_aggregates_revenue_and_expenses_accurately(): void
    {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $pool = FleetBase::query()->create([
            'code' => 'POOL-BDG',
            'name' => 'Pool Bandung Pasteur',
            'city' => 'Bandung',
            'manager_id' => $user->id,
        ]);

        $vehicle = Vehicle::factory()->create([
            'plate_number' => 'D 5555 SRW',
            'name' => 'Innova Zenix 2024',
            'home_base_id' => $pool->id,
            'status' => 'available',
        ]);

        $revenueAccount = Account::findByCode('4110') ?? Account::query()->where('system_role', 'rental_revenue')->firstOrFail();
        $cashAccount = Account::findByCode('1110') ?? Account::query()->where('system_role', 'cash')->firstOrFail();

        // 1. Post Revenue: Rp 5.000.000
        $revJournal = app(JournalService::class)->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Pendapatan sewa mingguan D 5555 SRW',
            'lines' => [
                [
                    'account_id' => $cashAccount->id,
                    'debit' => 5000000,
                    'credit' => 0,
                    'vehicle_id' => $vehicle->id,
                    'fleet_base_id' => $pool->id,
                ],
                [
                    'account_id' => $revenueAccount->id,
                    'debit' => 0,
                    'credit' => 5000000,
                    'vehicle_id' => $vehicle->id,
                    'fleet_base_id' => $pool->id,
                ],
            ],
        ], $user->id);
        app(JournalService::class)->post($revJournal, $user->id);

        // 2. Post Expense Claim 1: BBM Rp 600.000
        $fuelCat = ExpenseCategory::query()->where('code', ExpenseCategory::CODE_FUEL)->firstOrFail();
        app(ExpenseService::class)->create([
            'expense_date' => now()->toDateString(),
            'type' => ExpenseClaim::TYPE_DIRECT,
            'title' => 'BBM Solar Dexlite D 5555 SRW',
            'vehicle_id' => $vehicle->id,
            'payment_method' => 'cash',
            'post_immediately' => true,
            'lines' => [
                [
                    'expense_category_id' => $fuelCat->id,
                    'account_id' => $fuelCat->account_id,
                    'vehicle_id' => $vehicle->id,
                    'description' => 'Solar Dexlite 40L',
                    'amount' => 600000,
                ],
            ],
        ], $user->id);

        // 3. Post Expense Claim 2: Servis & Sparepart Rp 400.000
        $maintCat = ExpenseCategory::query()->where('code', ExpenseCategory::CODE_MAINTENANCE)->firstOrFail();
        app(ExpenseService::class)->create([
            'expense_date' => now()->toDateString(),
            'type' => ExpenseClaim::TYPE_DIRECT,
            'title' => 'Ganti Oli Mesin D 5555 SRW',
            'vehicle_id' => $vehicle->id,
            'payment_method' => 'cash',
            'post_immediately' => true,
            'lines' => [
                [
                    'expense_category_id' => $maintCat->id,
                    'account_id' => $maintCat->account_id,
                    'vehicle_id' => $vehicle->id,
                    'description' => 'Oli TMO 4 Liter',
                    'amount' => 400000,
                ],
            ],
        ], $user->id);

        // Calculate Profitability for this vehicle
        $service = app(FleetProfitabilityService::class);
        $pnl = $service->vehicleProfitability($vehicle);

        $this->assertEquals(5000000.0, $pnl['revenues']['total']);
        $this->assertEquals(5000000.0, $pnl['revenues']['rental']);
        $this->assertEquals(1000000.0, $pnl['expenses']['total']);
        $this->assertEquals(600000.0, $pnl['expenses']['fuel']);
        $this->assertEquals(400000.0, $pnl['expenses']['maintenance']);
        $this->assertEquals(4000000.0, $pnl['net_profit']);
        $this->assertEquals(80.0, $pnl['margin_pct']);
        $this->assertNotEmpty($pnl['transactions']);

        // Fleet summary
        $summary = $service->fleetSummary();
        $this->assertGreaterThanOrEqual(5000000.0, $summary['kpi']['total_revenue']);
        $this->assertGreaterThanOrEqual(1000000.0, $summary['kpi']['total_expense']);
        $this->assertGreaterThanOrEqual(1, $summary['kpi']['profitable_count']);

        // Pool profitability
        $poolPnl = $service->poolProfitability();
        $this->assertNotEmpty($poolPnl['pools']);
        $bdgPool = collect($poolPnl['pools'])->firstWhere('code', 'POOL-BDG');
        $this->assertNotNull($bdgPool);
        $this->assertEquals(5000000.0, $bdgPool['revenue']);
        $this->assertEquals(1000000.0, $bdgPool['expense']);
        $this->assertEquals(4000000.0, $bdgPool['net_profit']);
    }

    public function test_fleet_profitability_report_controllers_render_inertia_views(): void
    {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        // 1. Vehicle Profitability Report page
        $this->get(route('module.accounting.reports.vehicle-profitability'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Reports/VehicleProfitability')
                ->has('filters')
                ->has('kpi')
                ->has('rows')
                ->has('vehicles')
                ->has('bases')
            );

        // 2. Pool / Branch Profitability Report page
        $this->get(route('module.accounting.reports.pool-profitability'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Reports/PoolProfitability')
                ->has('filters')
                ->has('totals')
                ->has('pools')
            );
    }
}
