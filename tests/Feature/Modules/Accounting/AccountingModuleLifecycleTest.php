<?php

namespace Tests\Feature\Modules\Accounting;

use App\Models\InstalledModule;
use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingPoster;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class AccountingModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_accounting_is_core_on_new_tenants(): void
    {
        $tenant = $this->provisionTenant('Accounting Core Co', 'accounting-core-co', 'owner@accounting-core.test');

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('partners'));
            $this->assertTrue(Schema::hasTable('accounts'));
            $this->assertTrue(Schema::hasTable('fiscal_years'));
            $this->assertTrue(Schema::hasTable('fiscal_periods'));
            $this->assertTrue(Schema::hasTable('journal_entries'));
            $this->assertTrue(Schema::hasTable('journal_lines'));
            $this->assertTrue(Schema::hasTable('accounting_posting_rules'));

            $this->assertTrue(Permission::query()->where('module', 'accounting')->where('action', 'view')->exists());
            $this->assertTrue(Permission::query()->where('module', 'accounting')->where('action', 'manage_coa')->exists());
            $this->assertTrue(Permission::query()->where('module', 'partners')->where('action', 'view')->exists());
            $this->assertTrue(Menu::query()->where('slug', 'accounting')->where('is_active', true)->exists());
            $this->assertTrue(Menu::query()->where('slug', 'partners')->where('is_active', true)->exists());

            $this->assertFalse(InstalledModule::query()->where('key', 'accounting')->exists());
            $this->assertFalse(InstalledModule::query()->where('key', 'partners')->exists());

            $this->assertTrue(AccountingPoster::isReady());

            $this->assertTrue(Schema::hasTable('company_bank_accounts'));
            $this->assertDatabaseHas('company_bank_accounts', ['name' => 'Kas Tunai', 'kind' => 'cash']);

            $this->assertGreaterThanOrEqual(16, Account::query()->count());
            $this->assertDatabaseHas('accounts', ['code' => '1100', 'system_role' => 'cash']);

            $year = FiscalYear::query()->where('year', (int) now()->format('Y'))->first();
            $this->assertNotNull($year);
            $this->assertSame(12, FiscalPeriod::query()->where('fiscal_year_id', $year->id)->count());

            $opening = JournalEntry::query()
                ->where('type', JournalEntry::TYPE_OPENING)
                ->where('event', 'year.opening')
                ->where('source_id', $year->id)
                ->where('status', JournalEntry::STATUS_POSTED)
                ->first();
            $this->assertNotNull($opening);
            $this->assertEqualsWithDelta(0.0, $opening->totalDebit(), 0.001);
            $this->assertEqualsWithDelta(0.0, $opening->totalCredit(), 0.001);
        });
    }
}
