<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Support\FiscalCalendarService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingCoaTest extends TestCase
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

    public function test_seeded_coa_is_listed(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.accounting.accounts.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Accounts/Index')
                ->has('accounts.data')
                ->where('accounts.total', Account::query()->count())
                ->has('filters')
                ->has('types'));
    }

    public function test_accounts_can_be_filtered_and_paginated(): void
    {
        $user = $this->createAdminUser();

        $expected = Account::query()
            ->where('type', Account::TYPE_ASSET)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->where(function ($q): void {
                $q->where('code', 'ilike', '%Kas%')
                    ->orWhere('name', 'ilike', '%Kas%')
                    ->orWhere('system_role', 'ilike', '%Kas%');
            })
            ->count();

        $this->actingAs($user)
            ->get(route('module.accounting.accounts.index', [
                'search' => 'Kas',
                'type' => Account::TYPE_ASSET,
                'status' => 'active',
                'postable' => '1',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Accounts/Index')
                ->where('filters.search', 'Kas')
                ->where('filters.type', Account::TYPE_ASSET)
                ->where('filters.status', 'active')
                ->where('filters.postable', '1')
                ->where('accounts.per_page', 20)
                ->where('accounts.total', $expected)
                ->has('accounts.data', min(20, $expected)));
    }

    public function test_admin_can_create_account(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->post(route('module.accounting.accounts.store'), [
                'code' => '1150',
                'name' => 'Kas Kecil',
                'type' => Account::TYPE_ASSET,
                'is_postable' => true,
                'is_active' => true,
            ])
            ->assertRedirect(route('module.accounting.accounts.index'));

        $this->assertDatabaseHas('accounts', [
            'code' => '1150',
            'name' => 'Kas Kecil',
            'normal_balance' => Account::NORMAL_DEBIT,
        ]);
    }

    public function test_user_without_manage_coa_cannot_create_account(): void
    {
        $user = $this->createUserWithRole();

        $this->actingAs($user)
            ->post(route('module.accounting.accounts.store'), [
                'code' => '1151',
                'name' => 'Forbidden',
                'type' => Account::TYPE_ASSET,
            ])
            ->assertForbidden();
    }
}
