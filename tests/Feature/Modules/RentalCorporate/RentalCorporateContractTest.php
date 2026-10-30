<?php

namespace Tests\Feature\Modules\RentalCorporate;

use App\Modules\Facades\Modules;
use App\Support\SystemRolePermissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\RentalCorporate\Models\RentalCorporateContract;
use Modules\RentalCorporate\RentalCorporateModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalCorporateContractTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('rental-corporate');
        SystemRolePermissions::syncAllSystemRoles();
    }

    public function test_module_is_registered_with_correct_properties(): void
    {
        $module = Modules::find('rental-corporate');

        $this->assertNotNull($module);
        $this->assertInstanceOf(RentalCorporateModule::class, $module);
        $this->assertSame('rental-corporate', $module->key());
        $this->assertSame('Kontrak Korporat B2B', $module->label());
        $this->assertEquals(['rental', 'partners', 'invoicing'], $module->requires());
        $this->assertContains('view', $module->permissions());
        $this->assertContains('bookings', $module->permissions());
        $this->assertContains('finance', $module->permissions());
    }

    public function test_guests_cannot_access_corporate_contracts(): void
    {
        $this->get(route('module.rental.corporate.index'))->assertRedirect(route('login'));
        $this->get(route('module.rental-corporate.contracts.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_access_corporate_contracts_index(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.rental.corporate.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/RentalCorporate/Index')
                ->has('contracts')
                ->has('kpis')
                ->has('partners')
            );

        $this->actingAs($user)->get(route('module.rental-corporate.contracts.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/RentalCorporate/Index')
            );
    }

    public function test_user_can_create_corporate_contract(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::query()->create([
            'code' => 'PTN-CORP-01',
            'name' => 'PT Surya Mega Abadi',
            'account_type' => 'company',
            'status' => 'active',
        ]);

        $payload = [
            'partner_id' => $partner->id,
            'title' => 'Kontrak Sewa Operasional 2026',
            'po_number' => 'PO/2026/001',
            'pic_name' => 'Budi Santoso',
            'pic_phone' => '081234567890',
            'pic_email' => 'budi@suryamega.co.id',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'billing_cycle' => 'monthly',
            'payment_term_days' => 30,
            'credit_limit' => 50000000,
            'discount_pct' => 5.0,
            'tax_included' => true,
            'withholding_tax_pct' => 2.0,
            'sla_replacement_hours' => 4,
            'status' => 'active',
            'notes' => 'Catatan kontrak sewa tahunan.',
        ];

        $response = $this->actingAs($user)->post(route('module.rental.corporate.store'), $payload);

        $contract = RentalCorporateContract::query()->where('title', 'Kontrak Sewa Operasional 2026')->first();
        $this->assertNotNull($contract);
        $this->assertSame($partner->id, $contract->partner_id);
        $this->assertStringStartsWith('B2B-', $contract->code);

        $response->assertRedirect(route('module.rental.corporate.show', $contract->id));
    }

    public function test_corporate_contract_code_generation_is_sequential(): void
    {
        $code1 = RentalCorporateContract::generateCode();
        $this->assertStringStartsWith('B2B-'.now()->format('Ym'), $code1);
        $this->assertStringEndsWith('-0001', $code1);
    }

    public function test_backward_compatible_model_alias_works(): void
    {
        $contract = new \Modules\Rental\Models\RentalCorporateContract;
        $this->assertInstanceOf(RentalCorporateContract::class, $contract);
    }
}
