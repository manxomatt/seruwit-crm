<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\TaxCode;
use Modules\Accounting\Models\TaxPolicy;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\TaxChannels;
use Modules\Accounting\Support\TaxSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingTaxPolicyTest extends TestCase
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

    public function test_missing_policy_uses_workspace_default(): void
    {
        $attrs = TaxSettings::documentAttributesFor(TaxChannels::RENTAL_CHARGE);

        $this->assertTrue($attrs['tax_enabled']);
        $this->assertEqualsWithDelta(11.0, $attrs['tax_rate'], 0.001);
        $this->assertSame('PPN11', $attrs['tax_code']);
    }

    public function test_channel_policy_overrides_default_for_that_channel_only(): void
    {
        $nontax = TaxCode::query()->where('code', 'NONTAX')->firstOrFail();

        TaxPolicy::query()->create([
            'channel' => TaxChannels::RENTAL_CHARGE,
            'tax_code_id' => $nontax->id,
            'is_active' => true,
        ]);

        $rental = TaxSettings::documentAttributesFor(TaxChannels::RENTAL_CHARGE);
        $addon = TaxSettings::documentAttributesFor(TaxChannels::RENTAL_ADDON);

        $this->assertFalse($rental['tax_enabled']);
        $this->assertSame(0.0, $rental['tax_rate']);
        $this->assertSame('NONTAX', $rental['tax_code']);

        $this->assertTrue($addon['tax_enabled']);
        $this->assertEqualsWithDelta(11.0, $addon['tax_rate'], 0.001);
        $this->assertSame('PPN11', $addon['tax_code']);
    }

    public function test_explicit_tax_code_id_overrides_channel_policy(): void
    {
        $nontax = TaxCode::query()->where('code', 'NONTAX')->firstOrFail();
        $ppn11 = TaxCode::query()->where('code', 'PPN11')->firstOrFail();

        TaxPolicy::query()->create([
            'channel' => TaxChannels::INVOICING_MANUAL,
            'tax_code_id' => $nontax->id,
            'is_active' => true,
        ]);

        $attrs = TaxSettings::documentAttributesFor(TaxChannels::INVOICING_MANUAL, $ppn11->id);

        $this->assertTrue($attrs['tax_enabled']);
        $this->assertEqualsWithDelta(11.0, $attrs['tax_rate'], 0.001);
        $this->assertSame('PPN11', $attrs['tax_code']);
    }

    public function test_admin_can_view_and_update_tax_policies(): void
    {
        $user = $this->createAdminUser();
        $nontax = TaxCode::query()->where('code', 'NONTAX')->firstOrFail();

        $this->actingAs($user)
            ->get(route('module.accounting.tax-policies.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/TaxPolicies/Index')
                ->has('policies')
                ->has('taxCodes')
                ->has('workspaceDefault'));

        $this->actingAs($user)->put(route('module.accounting.tax-policies.update'), [
            'policies' => [
                [
                    'channel' => TaxChannels::PAYABLES_PURCHASE_BILL,
                    'tax_code_id' => $nontax->id,
                ],
                [
                    'channel' => TaxChannels::INVOICING_MANUAL,
                    'tax_code_id' => null,
                ],
            ],
        ])->assertRedirect(route('module.accounting.tax-policies.index'));

        $this->assertDatabaseHas('tax_policies', [
            'channel' => TaxChannels::PAYABLES_PURCHASE_BILL,
            'tax_code_id' => $nontax->id,
        ]);
        $this->assertDatabaseMissing('tax_policies', [
            'channel' => TaxChannels::INVOICING_MANUAL,
        ]);

        $bill = TaxSettings::documentAttributesFor(TaxChannels::PAYABLES_PURCHASE_BILL);
        $this->assertFalse($bill['tax_enabled']);
        $this->assertSame('NONTAX', $bill['tax_code']);
    }

    public function test_resetting_channel_to_default_deletes_policy_row(): void
    {
        $user = $this->createAdminUser();
        $nontax = TaxCode::query()->where('code', 'NONTAX')->firstOrFail();

        TaxPolicy::query()->create([
            'channel' => TaxChannels::POS_SALE,
            'tax_code_id' => $nontax->id,
            'is_active' => true,
        ]);

        $this->actingAs($user)->put(route('module.accounting.tax-policies.update'), [
            'policies' => [
                [
                    'channel' => TaxChannels::POS_SALE,
                    'tax_code_id' => null,
                ],
            ],
        ])->assertRedirect(route('module.accounting.tax-policies.index'));

        $this->assertDatabaseMissing('tax_policies', [
            'channel' => TaxChannels::POS_SALE,
        ]);

        $snap = TaxSettings::snapshot(channel: TaxChannels::POS_SALE);
        $this->assertTrue($snap['enabled']);
        $this->assertSame('PPN11', $snap['tax_code']);
    }
}
