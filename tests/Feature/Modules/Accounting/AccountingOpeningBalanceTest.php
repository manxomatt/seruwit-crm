<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\OpeningBalanceService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingOpeningBalanceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_post_opening_balances_for_empty_year(): void
    {
        $user = $this->createAdminUser();
        $year = app(FiscalCalendarService::class)->ensureYear(2030);
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();

        $response = $this->actingAs($user)->post(route('module.accounting.opening-balances.store'), [
            'year' => 2030,
            'entry_date' => $year->starts_on->toDateString(),
            'memo' => 'Go-live opening',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 5000000, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 5000000],
            ],
        ]);

        $entry = JournalEntry::query()
            ->where('type', JournalEntry::TYPE_OPENING)
            ->where('event', 'year.opening')
            ->first();

        $this->assertNotNull($entry);
        $response->assertRedirect(route('module.accounting.journals.show', $entry));
        $this->assertSame(JournalEntry::STATUS_POSTED, $entry->status);
        $this->assertSame((int) $year->id, (int) $entry->source_id);
    }

    public function test_opening_rejects_duplicate_and_pl_accounts(): void
    {
        $user = $this->createAdminUser();
        $year = app(FiscalCalendarService::class)->ensureYear(2031);
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();
        $revenue = Account::query()->where('code', '4100')->firstOrFail();
        $openings = app(OpeningBalanceService::class);

        $openings->post($year, [
            ['account_id' => $cash->id, 'debit' => 1000, 'credit' => 0],
            ['account_id' => $modal->id, 'debit' => 0, 'credit' => 1000],
        ], $year->starts_on->toDateString(), null, $user->id);

        try {
            $openings->post($year, [
                ['account_id' => $cash->id, 'debit' => 100, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 100],
            ], $year->starts_on->toDateString(), null, $user->id);
            $this->fail('Expected ValidationException for duplicate opening');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('year', $e->errors());
        }

        $freshYear = app(FiscalCalendarService::class)->ensureYear(2032);

        try {
            $openings->post($freshYear, [
                ['account_id' => $cash->id, 'debit' => 1000, 'credit' => 0],
                ['account_id' => $revenue->id, 'debit' => 0, 'credit' => 1000],
            ], $freshYear->starts_on->toDateString(), null, $user->id);
            $this->fail('Expected ValidationException for P&L account');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('lines', $e->errors());
        }
    }

    public function test_opening_rejects_when_year_already_has_posted_activity(): void
    {
        $user = $this->createAdminUser();
        $year = app(FiscalCalendarService::class)->ensureYear(2033);
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();

        $entry = app(JournalService::class)->createDraft([
            'entry_date' => $year->starts_on->toDateString(),
            'memo' => 'Prior activity',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 2500, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 2500],
            ],
        ], $user->id);
        app(JournalService::class)->post($entry, $user->id);

        $this->expectException(ValidationException::class);

        app(OpeningBalanceService::class)->post($year->fresh(), [
            ['account_id' => $cash->id, 'debit' => 1000, 'credit' => 0],
            ['account_id' => $modal->id, 'debit' => 0, 'credit' => 1000],
        ], $year->starts_on->toDateString(), null, $user->id);
    }

    public function test_opening_create_page_loads(): void
    {
        $user = $this->createAdminUser();
        app(FiscalCalendarService::class)->ensureYear(2030);

        $this->actingAs($user)
            ->get(route('module.accounting.opening-balances.create', ['year' => 2030]))
            ->assertOk();
    }
}
