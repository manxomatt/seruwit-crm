<?php

namespace Tests\Feature\Modules\Accounting;

use App\Modules\ModuleInstaller;
use Modules\Accounting\AccountingModule;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Support\AccountingReadinessService;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class AccountingReadinessTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_fresh_install_is_core_ready_with_opening_warning(): void
    {
        $tenant = $this->provisionTenant('Ready Co', 'ready-co', 'owner@ready-co.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new AccountingModule);

        $tenant->run(function (): void {
            $assessment = app(AccountingReadinessService::class)->assess();

            $this->assertTrue($assessment['ready']);
            $this->assertSame('pending', $assessment['summary']['opening_status']);
            $this->assertTrue(collect($assessment['blocking'])->every(fn (array $c): bool => $c['ok']));
            $this->assertFalse(collect($assessment['warnings'])->firstWhere('key', 'opening_balance')['ok']);
        });
    }

    public function test_dashboard_includes_readiness_payload(): void
    {
        $tenant = $this->provisionTenant('Dash Ready Co', 'dash-ready-co', 'owner@dash-ready.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new AccountingModule);

        $tenant->run(function (): void {
            $this->withoutVite();
            $this->setUpRoles();
            $user = $this->createAdminUser();

            $this->actingAs($user)
                ->get(route('module.accounting.dashboard'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Modules/Accounting/Dashboard')
                    ->has('readiness.blocking')
                    ->has('readiness.warnings')
                    ->where('readiness.ready', true)
                    ->where('readiness.opening_status', 'pending'));
        });
    }

    public function test_missing_system_role_blocks_readiness(): void
    {
        $tenant = $this->provisionTenant('Blocked Co', 'blocked-co', 'owner@blocked-co.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new AccountingModule);

        $tenant->run(function (): void {
            Account::query()->where('system_role', 'ar_control')->update(['system_role' => null]);

            $assessment = app(AccountingReadinessService::class)->assess();

            $this->assertFalse($assessment['ready']);
            $coa = collect($assessment['blocking'])->firstWhere('key', 'coa_roles');
            $this->assertFalse($coa['ok']);
            $this->assertStringContainsString('ar_control', (string) $coa['detail']);
        });
    }

    public function test_preflight_command_reports_tenant_status(): void
    {
        $tenant = $this->provisionTenant('Preflight Co', 'preflight-co', 'owner@preflight.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new AccountingModule);

        $this->artisan('accounting:preflight', ['--tenant' => $tenant->id])
            ->assertFailed();
    }
}
