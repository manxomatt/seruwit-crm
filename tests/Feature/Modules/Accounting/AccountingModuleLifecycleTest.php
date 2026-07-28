<?php

namespace Tests\Feature\Modules\Accounting;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\AccountingModule;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class AccountingModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_accounting_tables_and_seed_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Accounting Install Co', 'accounting-install-co', 'owner@accounting-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new AccountingModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('accounts'));
            $this->assertTrue(Schema::hasTable('fiscal_years'));
            $this->assertTrue(Schema::hasTable('fiscal_periods'));
            $this->assertTrue(Schema::hasTable('journal_entries'));
            $this->assertTrue(Schema::hasTable('journal_lines'));
            $this->assertTrue(Schema::hasTable('accounting_posting_rules'));

            $this->assertDatabaseHas('permissions', ['module' => 'accounting', 'action' => 'view']);
            $this->assertDatabaseHas('permissions', ['module' => 'accounting', 'action' => 'manage_coa']);
            $this->assertDatabaseHas('permissions', ['module' => 'accounting', 'action' => 'journal']);
            $this->assertDatabaseHas('permissions', ['module' => 'accounting', 'action' => 'post']);
            $this->assertDatabaseHas('permissions', ['module' => 'accounting', 'action' => 'period']);
            $this->assertDatabaseHas('permissions', ['module' => 'accounting', 'action' => 'bank']);
            $this->assertDatabaseHas('menus', ['slug' => 'accounting']);

            $this->assertTrue(Schema::hasTable('company_bank_accounts'));
            $this->assertTrue(Schema::hasTable('payment_method_account_maps'));
            $this->assertDatabaseHas('company_bank_accounts', ['name' => 'Kas Tunai', 'kind' => 'cash']);
            $this->assertDatabaseHas('company_bank_accounts', ['name' => 'Bank Operasional', 'kind' => 'bank']);

            $this->assertGreaterThanOrEqual(16, Account::query()->count());
            $this->assertDatabaseHas('accounts', ['code' => '1100', 'system_role' => 'cash']);
            $this->assertDatabaseHas('accounts', ['code' => '1200', 'system_role' => 'ar_control']);

            $year = FiscalYear::query()->where('year', (int) now()->format('Y'))->first();
            $this->assertNotNull($year);
            $this->assertSame(12, FiscalPeriod::query()->where('fiscal_year_id', $year->id)->count());
        });
    }
}
