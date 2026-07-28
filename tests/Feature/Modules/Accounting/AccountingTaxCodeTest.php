<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\TaxCode;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\TaxSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingTaxCodeTest extends TestCase
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

    public function test_seeded_tax_codes_and_settings_snapshot(): void
    {
        $this->assertDatabaseHas('tax_codes', ['code' => 'PPN11']);
        $this->assertDatabaseHas('tax_codes', ['code' => 'PPN12']);
        $this->assertDatabaseHas('tax_codes', ['code' => 'NONTAX']);
        $this->assertDatabaseHas('tax_codes', ['code' => 'PPH23_2']);
        $this->assertDatabaseHas('accounts', ['code' => '2210', 'system_role' => 'wht_payable']);

        $snap = TaxSettings::snapshot();
        $this->assertTrue($snap['enabled']);
        $this->assertEqualsWithDelta(11.0, $snap['rate'], 0.001);
        $this->assertNotNull($snap['tax_code_id']);
    }

    public function test_admin_can_create_and_update_tax_code(): void
    {
        $user = $this->createAdminUser();
        $output = Account::query()->where('system_role', 'tax_output')->firstOrFail();
        $input = Account::query()->where('system_role', 'tax_input')->firstOrFail();

        $this->actingAs($user)->post(route('module.accounting.tax-codes.store'), [
            'code' => 'PPN10',
            'name' => 'PPN 10%',
            'category' => TaxCode::CATEGORY_PPN,
            'rate' => 10,
            'calculation' => TaxCode::CALC_EXCLUSIVE,
            'direction' => TaxCode::DIRECTION_BOTH,
            'output_account_id' => $output->id,
            'input_account_id' => $input->id,
            'is_default' => true,
            'is_active' => true,
        ])->assertRedirect(route('module.accounting.tax-codes.index'));

        $code = TaxCode::query()->where('code', 'PPN10')->firstOrFail();
        $this->assertTrue($code->is_default);
        $this->assertEquals(0, TaxCode::query()->where('code', 'PPN11')->where('is_default', true)->count());

        $snap = TaxSettings::snapshot();
        $this->assertEqualsWithDelta(10.0, $snap['rate'], 0.001);

        $this->actingAs($user)->patch(route('module.accounting.tax-codes.update', $code), [
            'code' => 'PPN10',
            'name' => 'PPN 10% updated',
            'category' => TaxCode::CATEGORY_PPN,
            'rate' => 10,
            'calculation' => TaxCode::CALC_INCLUSIVE,
            'direction' => TaxCode::DIRECTION_BOTH,
            'output_account_id' => $output->id,
            'input_account_id' => $input->id,
            'is_default' => true,
            'is_active' => true,
        ])->assertRedirect(route('module.accounting.tax-codes.index'));

        $this->assertSame(TaxCode::CALC_INCLUSIVE, $code->fresh()->calculation);
    }

    public function test_tax_codes_index_loads(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.accounting.tax-codes.index'))
            ->assertOk();
    }
}
