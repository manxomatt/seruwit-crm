<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\TravelRevenueReportService;
use Modules\Shuttle\Models\ShuttleBooking;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TravelRevenueReportTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_travel_revenue_report_page_loads(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.accounting.reports.travel-revenue', [
                'from' => now()->startOfMonth()->toDateString(),
                'to' => now()->toDateString(),
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Reports/TravelRevenue')
                ->has('from')
                ->has('to')
                ->has('account')
                ->has('rows')
                ->has('totals')
                ->has('by_event'));
    }

    public function test_travel_revenue_report_aggregates_shuttle_revenue_lines(): void
    {
        $account = Account::query()->where('system_role', 'shuttle_revenue')->firstOrFail();
        $booking = ShuttleBooking::factory()->walkIn()->create(['total_fare' => 250000]);

        $period = app(FiscalCalendarService::class)->periodForDate(now());

        $entry = JournalEntry::query()->create([
            'number' => 'JE-TRV-1',
            'entry_date' => now()->toDateString(),
            'memo' => 'Travel sale test',
            'type' => JournalEntry::TYPE_AUTO,
            'status' => JournalEntry::STATUS_POSTED,
            'event' => 'shuttle_sale.completed',
            'source_type' => $booking->getMorphClass(),
            'source_id' => $booking->id,
            'fiscal_period_id' => $period->id,
            'posted_at' => now(),
        ]);

        $entry->lines()->create([
            'account_id' => $account->id,
            'debit' => 0,
            'credit' => 250000,
            'memo' => null,
        ]);

        $cash = Account::query()->where('system_role', 'cash')->firstOrFail();
        $entry->lines()->create([
            'account_id' => $cash->id,
            'debit' => 250000,
            'credit' => 0,
            'memo' => null,
        ]);

        $report = app(TravelRevenueReportService::class)->report(
            now()->startOfMonth()->startOfDay(),
            now()->endOfDay(),
        );

        $this->assertNotNull($report['account']);
        $this->assertSame('4130', $report['account']['code']);
        $this->assertSame(250000.0, $report['totals']['credit']);
        $this->assertSame(250000.0, $report['totals']['net']);
        $this->assertCount(1, $report['rows']);
        $this->assertSame('shuttle_sale.completed', $report['by_event'][0]['event']);
    }
}
