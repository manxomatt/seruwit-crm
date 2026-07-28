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
                ->has('accounts', Account::query()->count()));
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
