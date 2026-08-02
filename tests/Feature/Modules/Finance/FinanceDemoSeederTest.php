<?php

namespace Tests\Feature\Modules\Finance;

use Database\Seeders\TenantFinanceDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Billing\Models\Tariff;
use Modules\Invoicing\Models\Invoice;
use Modules\Receivables\Models\Payment;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FinanceDemoSeederTest extends TestCase
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

    public function test_seeds_finance_demo_data(): void
    {
        $this->seed(TenantFinanceDemoSeeder::class);

        $this->assertSame(
            TenantFinanceDemoSeeder::INVOICE_COUNT,
            Invoice::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count(),
        );
        $this->assertGreaterThan(0, Payment::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count());
        $this->assertSame(
            TenantFinanceDemoSeeder::TARIFF_COUNT,
            Tariff::query()->where('origin', 'like', 'FIN-DEMO %')->count(),
        );
        $this->assertSame(
            TenantFinanceDemoSeeder::JOURNAL_COUNT,
            JournalEntry::query()->where('memo', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantFinanceDemoSeeder::class);
        $invoiceCount = Invoice::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count();

        $this->seed(TenantFinanceDemoSeeder::class);

        $this->assertSame(
            $invoiceCount,
            Invoice::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count(),
        );
    }

    public function test_uninstall_removes_tagged_demo_data(): void
    {
        $this->seed(TenantFinanceDemoSeeder::class);

        app(TenantFinanceDemoSeeder::class)->uninstall();

        $this->assertSame(0, Invoice::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count());
        $this->assertSame(0, Payment::query()->where('notes', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count());
        $this->assertSame(0, Tariff::query()->where('origin', 'like', 'FIN-DEMO %')->count());
        $this->assertSame(0, JournalEntry::query()->where('memo', 'like', '%'.TenantFinanceDemoSeeder::TAG.'%')->count());
    }
}
