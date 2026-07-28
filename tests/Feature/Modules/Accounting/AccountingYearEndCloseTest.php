<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\YearEndCloseService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingYearEndCloseTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_year_end_close_moves_pnl_to_retained_earnings_and_locks_year(): void
    {
        $user = $this->createAdminUser();
        $year = app(FiscalCalendarService::class)->ensureYear(2028);
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $revenue = Account::query()->where('code', '4100')->firstOrFail();
        $cogs = Account::query()->where('code', '5100')->firstOrFail();
        $retained = Account::query()->where('system_role', 'retained_earnings')->firstOrFail();
        $journals = app(JournalService::class);

        $sales = $journals->createDraft([
            'entry_date' => '2028-06-15',
            'memo' => 'Sales',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 10000, 'credit' => 0],
                ['account_id' => $revenue->id, 'debit' => 0, 'credit' => 10000],
            ],
        ], $user->id);
        $journals->post($sales, $user->id);

        $cost = $journals->createDraft([
            'entry_date' => '2028-06-20',
            'memo' => 'COGS',
            'lines' => [
                ['account_id' => $cogs->id, 'debit' => 3000, 'credit' => 0],
                ['account_id' => $cash->id, 'debit' => 0, 'credit' => 3000],
            ],
        ], $user->id);
        $journals->post($cost, $user->id);

        $this->actingAs($user)
            ->post(route('module.accounting.years.close'), ['year' => 2028])
            ->assertRedirect(route('module.accounting.periods.index', ['year' => 2028]));

        $year->refresh();
        $this->assertTrue($year->is_closed);

        $closing = JournalEntry::query()
            ->where('type', JournalEntry::TYPE_CLOSING)
            ->where('event', 'year.closed')
            ->where('source_id', $year->id)
            ->first();

        $this->assertNotNull($closing);
        $this->assertSame(JournalEntry::STATUS_POSTED, $closing->status);

        $closing->load('lines.account');
        $reLine = $closing->lines->first(
            fn ($line) => (int) $line->account_id === (int) $retained->id
        );
        $this->assertNotNull($reLine);
        $this->assertEqualsWithDelta(7000.0, (float) $reLine->credit, 0.01);

        $this->assertTrue(
            FiscalYear::query()->where('year', 2029)->exists()
        );

        foreach ($year->periods()->get() as $period) {
            $this->assertSame(FiscalPeriod::STATUS_HARD_CLOSE, $period->status);
        }
    }

    public function test_year_reopen_voids_closing_and_unlocks_year(): void
    {
        $user = $this->createAdminUser();
        $year = app(FiscalCalendarService::class)->ensureYear(2027);
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $revenue = Account::query()->where('code', '4100')->firstOrFail();
        $journals = app(JournalService::class);

        $sales = $journals->createDraft([
            'entry_date' => '2027-03-10',
            'memo' => 'Sales',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 5000, 'credit' => 0],
                ['account_id' => $revenue->id, 'debit' => 0, 'credit' => 5000],
            ],
        ], $user->id);
        $journals->post($sales, $user->id);

        app(YearEndCloseService::class)->close($year, $user->id);
        $this->assertTrue($year->fresh()->is_closed);

        $this->actingAs($user)
            ->post(route('module.accounting.years.reopen'), ['year' => 2027])
            ->assertRedirect(route('module.accounting.periods.index', ['year' => 2027]));

        $year->refresh();
        $this->assertFalse($year->is_closed);

        $closing = JournalEntry::query()
            ->where('event', 'year.closed')
            ->where('source_id', $year->id)
            ->first();
        $this->assertSame(JournalEntry::STATUS_VOID, $closing?->status);

        $reversal = JournalEntry::query()
            ->where('event', 'year.reopened')
            ->where('source_id', $year->id)
            ->where('status', JournalEntry::STATUS_POSTED)
            ->first();
        $this->assertNotNull($reversal);

        $december = $year->periods()->where('period_index', 12)->firstOrFail();
        $this->assertSame(FiscalPeriod::STATUS_SOFT_CLOSE, $december->status);
    }

    public function test_closed_year_rejects_period_reopen(): void
    {
        $user = $this->createAdminUser();
        $year = app(FiscalCalendarService::class)->ensureYear(2026);
        app(YearEndCloseService::class)->close($year, $user->id);

        $period = $year->periods()->where('period_index', 12)->firstOrFail();

        $this->expectException(ValidationException::class);
        app(FiscalCalendarService::class)->reopen($period);
    }
}
