<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\JournalService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingJournalTest extends TestCase
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

    public function test_unbalanced_journal_can_be_drafted_but_not_posted(): void
    {
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $bank = Account::query()->where('code', '1110')->firstOrFail();

        $entry = app(JournalService::class)->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Unbalanced',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 100000, 'credit' => 0],
                ['account_id' => $bank->id, 'debit' => 0, 'credit' => 50000],
            ],
        ]);

        $this->assertSame(JournalEntry::STATUS_DRAFT, $entry->status);
        $this->assertFalse($entry->isBalanced());

        $this->expectException(ValidationException::class);

        app(JournalService::class)->post($entry->fresh(['lines.account', 'fiscalPeriod.fiscalYear']));
    }

    public function test_balanced_journal_can_be_posted(): void
    {
        $user = $this->createAdminUser();
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();

        $response = $this->actingAs($user)->post(route('module.accounting.journals.store'), [
            'entry_date' => now()->toDateString(),
            'memo' => 'Setoran modal',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 1000000, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 1000000],
            ],
        ]);

        $journal = JournalEntry::query()->first();
        $this->assertNotNull($journal);
        $response->assertRedirect(route('module.accounting.journals.show', $journal));
        $this->assertSame(JournalEntry::STATUS_DRAFT, $journal->status);

        $this->actingAs($user)
            ->post(route('module.accounting.journals.post', $journal))
            ->assertRedirect(route('module.accounting.journals.show', $journal));

        $this->assertSame(JournalEntry::STATUS_POSTED, $journal->fresh()->status);
    }

    public function test_hard_closed_period_rejects_posting(): void
    {
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();

        $entry = app(JournalService::class)->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Will fail post',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 25000, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 25000],
            ],
        ]);

        $period = FiscalPeriod::query()->findOrFail($entry->fiscal_period_id);
        $period->update(['status' => FiscalPeriod::STATUS_HARD_CLOSE]);

        $this->expectException(ValidationException::class);

        app(JournalService::class)->post($entry->fresh(['lines.account', 'fiscalPeriod.fiscalYear']));
    }
}
