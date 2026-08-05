<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerType;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerTypeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_default_contact_types_are_seeded(): void
    {
        $this->assertNotNull(PartnerType::findByCode('customer'));
        $this->assertNotNull(PartnerType::findByCode('supplier'));
        $this->assertNotNull(PartnerType::findByCode('guarantor'));
        $this->assertGreaterThanOrEqual(8, PartnerType::query()->count());
    }

    public function test_admin_can_manage_contact_types(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.partners.types.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Partners/Types/Index'));

        $this->actingAs($user)
            ->post(route('module.partners.types.store'), [
                'code' => 'broker',
                'name' => ['id' => 'Broker', 'en' => 'Broker'],
                'description' => ['id' => 'Broker asuransi', 'en' => 'Insurance broker'],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
                'is_active' => true,
            ])
            ->assertRedirect(route('module.partners.types.index'));

        $type = PartnerType::findByCode('broker');
        $this->assertNotNull($type);
        $this->assertSame('Broker', $type->label);

        $this->actingAs($user)
            ->patch(route('module.partners.types.update', $type), [
                'code' => 'broker',
                'name' => ['id' => 'Broker Asuransi', 'en' => 'Insurance Broker'],
                'description' => ['id' => 'Broker asuransi', 'en' => 'Insurance broker'],
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
                'is_active' => true,
            ])
            ->assertRedirect(route('module.partners.types.index'));

        $this->assertSame('Broker Asuransi', $type->fresh()->label);

        $this->actingAs($user)
            ->delete(route('module.partners.types.destroy', $type))
            ->assertRedirect(route('module.partners.types.index'));

        $this->assertDatabaseMissing('partner_types', ['id' => $type->id]);
    }

    public function test_contact_type_with_customer_flag_sets_customer_rank(): void
    {
        $user = $this->createAdminUser();
        $guarantor = PartnerType::findByCode('guarantor');

        $this->actingAs($user)->post(route('module.partners.store'), [
            'account_type' => 'individual',
            'name' => 'Penjamin Utama',
            'type_ids' => [$guarantor->id, PartnerType::findByCode('customer')->id],
            'status' => 'active',
        ])->assertRedirect();

        $partner = Partner::where('name', 'Penjamin Utama')->first();
        $this->assertTrue($partner->isCustomer());
        $this->assertCount(2, $partner->types);
    }

    public function test_cannot_delete_type_assigned_to_contact(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $customer = PartnerType::findByCode('customer');
        $partner->types()->sync([$customer->id]);

        $this->actingAs($user)
            ->delete(route('module.partners.types.destroy', $customer))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('partner_types', ['id' => $customer->id]);
    }
}
