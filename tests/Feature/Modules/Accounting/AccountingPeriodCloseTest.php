<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingPoster;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\SourceEvent;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingPeriodCloseTest extends TestCase
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

    public function test_soft_close_blocks_auto_posting_but_allows_manual_journal(): void
    {
        $user = $this->createAdminUser();
        $period = app(FiscalCalendarService::class)->periodForDate(now());

        $this->actingAs($user)
            ->post(route('module.accounting.periods.soft-close', $period))
            ->assertRedirect();

        $this->assertSame(FiscalPeriod::STATUS_SOFT_CLOSE, $period->fresh()->status);

        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 10000,
            'tax_amount' => 0,
            'total' => 10000,
            'issue_date' => now()->toDateString(),
        ]);

        try {
            app(AccountingPoster::class)->post(new SourceEvent(
                key: 'invoice.issued',
                sourceType: $invoice->getMorphClass(),
                sourceId: (int) $invoice->id,
                occurredAt: now()->toDateString(),
                amounts: ['net' => 10000, 'tax' => 0, 'total' => 10000],
                partnerId: (int) $partner->id,
            ));
            $this->fail('Expected ValidationException for soft-closed period');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('accounting', $e->errors());
        }

        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();
        $journals = app(JournalService::class);

        $entry = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Adjusting entry',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 1000, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 1000],
            ],
        ]);

        $posted = $journals->post($entry, $user->id);
        $this->assertSame(JournalEntry::STATUS_POSTED, $posted->status);
    }

    public function test_hard_close_requires_balanced_trial_balance_and_blocks_manual_post(): void
    {
        $user = $this->createAdminUser();
        $period = app(FiscalCalendarService::class)->periodForDate(now());
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();
        $journals = app(JournalService::class);

        $entry = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Seed',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 5000, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 5000],
            ],
        ]);
        $journals->post($entry);

        $this->actingAs($user)
            ->post(route('module.accounting.periods.hard-close', $period))
            ->assertRedirect();

        $this->assertSame(FiscalPeriod::STATUS_HARD_CLOSE, $period->fresh()->status);

        $draft = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Should fail',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 100, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 100],
            ],
        ]);

        $this->expectException(ValidationException::class);
        $journals->post($draft, $user->id);
    }

    public function test_admin_can_reopen_period(): void
    {
        $user = $this->createAdminUser();
        $period = app(FiscalCalendarService::class)->periodForDate(now());
        $calendar = app(FiscalCalendarService::class);
        $calendar->softClose($period);

        $this->actingAs($user)
            ->post(route('module.accounting.periods.reopen', $period))
            ->assertRedirect();

        $this->assertSame(FiscalPeriod::STATUS_OPEN, $period->fresh()->status);
    }
}
