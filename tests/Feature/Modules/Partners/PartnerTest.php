<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerAddress;
use Modules\Partners\Models\PartnerBankAccount;
use Modules\Partners\Models\PartnerTag;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_partners(): void
    {
        $this->get(route('module.partners.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_partners(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.partners.index'))->assertForbidden();
    }

    public function test_read_only_user_sees_index(): void
    {
        $user = $this->createUserWithRole();
        Partner::factory()->create();

        $this->actingAs($user)->get(route('module.partners.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Partners/Index')
                ->where('can.create', false)
                ->where('can.update', false)
                ->where('can.delete', false)
            );
    }

    public function test_admin_can_create_partner(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.partners.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Partners/Create'));

        $this->actingAs($user)->post(route('module.partners.store'), [
            'account_type' => 'company',
            'sub_type' => 'customer',
            'name' => 'PT Test Partner',
            'email' => 'test@partner.com',
            'phone' => '081234567890',
            'is_customer' => true,
            'is_supplier' => false,
            'status' => 'active',
        ])->assertRedirect();

        $partner = Partner::where('name', 'PT Test Partner')->first();
        $this->assertNotNull($partner);
        $this->assertEquals(1, $partner->customer_rank);
        $this->assertEquals(0, $partner->supplier_rank);
        $this->assertStringStartsWith('PART-', $partner->code);
    }

    public function test_admin_can_create_supplier(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.partners.store'), [
            'account_type' => 'company',
            'name' => 'CV Supplier Utama',
            'is_customer' => false,
            'is_supplier' => true,
            'status' => 'active',
        ])->assertRedirect();

        $partner = Partner::where('name', 'CV Supplier Utama')->first();
        $this->assertEquals(0, $partner->customer_rank);
        $this->assertEquals(1, $partner->supplier_rank);
    }

    public function test_admin_can_create_dual_role_partner(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.partners.store'), [
            'account_type' => 'company',
            'name' => 'PT Dual Role',
            'is_customer' => true,
            'is_supplier' => true,
            'status' => 'active',
        ])->assertRedirect();

        $partner = Partner::where('name', 'PT Dual Role')->first();
        $this->assertTrue($partner->isCustomer());
        $this->assertTrue($partner->isSupplier());
    }

    public function test_admin_can_update_partner(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)->patch(route('module.partners.update', $partner), [
            'name' => 'New Name',
            'is_customer' => true,
            'is_supplier' => true,
            'status' => 'active',
        ])->assertRedirect();

        $partner->refresh();
        $this->assertEquals('New Name', $partner->name);
        $this->assertTrue($partner->isSupplier());
    }

    public function test_admin_can_view_partner_show(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();

        $this->actingAs($user)->get(route('module.partners.show', $partner))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Partners/Show')
                ->has('partner')
            );
    }

    public function test_admin_can_delete_partner(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();

        $this->actingAs($user)->delete(route('module.partners.destroy', $partner))
            ->assertRedirect();

        $this->assertSoftDeleted('partners', ['id' => $partner->id]);
    }

    public function test_partner_with_tags(): void
    {
        $user = $this->createAdminUser();
        $tag = PartnerTag::factory()->create(['name' => 'VIP']);

        $this->actingAs($user)->post(route('module.partners.store'), [
            'account_type' => 'company',
            'name' => 'PT Tagged',
            'is_customer' => true,
            'is_supplier' => false,
            'status' => 'active',
            'tag_ids' => [$tag->id],
        ])->assertRedirect();

        $partner = Partner::where('name', 'PT Tagged')->first();
        $this->assertCount(1, $partner->tags);
        $this->assertEquals('VIP', $partner->tags->first()->name);
    }

    public function test_admin_can_add_address(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();

        $this->actingAs($user)->post(route('module.partners.addresses.store', $partner), [
            'type' => 'shipping',
            'street' => 'Jl. Sudirman No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'zip' => '10210',
            'country' => 'Indonesia',
            'is_default' => true,
        ])->assertRedirect();

        $this->assertCount(1, $partner->fresh()->addresses);
    }

    public function test_admin_can_delete_address(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $address = PartnerAddress::factory()->create(['partner_id' => $partner->id]);

        $this->actingAs($user)
            ->delete(route('module.partners.addresses.destroy', [$partner, $address]))
            ->assertRedirect();

        $this->assertDatabaseMissing('partner_addresses', ['id' => $address->id]);
    }

    public function test_admin_can_add_bank_account(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();

        $this->actingAs($user)->post(route('module.partners.bank-accounts.store', $partner), [
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_holder_name' => 'PT Test',
        ])->assertRedirect();

        $this->assertCount(1, $partner->fresh()->bankAccounts);
    }

    public function test_admin_can_delete_bank_account(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $bank = PartnerBankAccount::factory()->create(['partner_id' => $partner->id]);

        $this->actingAs($user)
            ->delete(route('module.partners.bank-accounts.destroy', [$partner, $bank]))
            ->assertRedirect();

        $this->assertDatabaseMissing('partner_bank_accounts', ['id' => $bank->id]);
    }

    public function test_individual_partner_with_parent(): void
    {
        $user = $this->createAdminUser();
        $company = Partner::factory()->create(['account_type' => 'company']);

        $this->actingAs($user)->post(route('module.partners.store'), [
            'account_type' => 'individual',
            'name' => 'John Doe',
            'parent_id' => $company->id,
            'job_title' => 'Director',
            'is_customer' => true,
            'is_supplier' => false,
            'status' => 'active',
        ])->assertRedirect();

        $individual = Partner::where('name', 'John Doe')->first();
        $this->assertEquals('individual', $individual->account_type);
        $this->assertEquals($company->id, $individual->parent_id);
        $this->assertEquals('Director', $individual->job_title);
        $this->assertCount(1, $company->fresh()->children);
    }

    public function test_filter_by_role(): void
    {
        $user = $this->createUserWithRole();
        Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);
        Partner::factory()->create(['customer_rank' => 0, 'supplier_rank' => 1]);
        Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 1]);

        $this->actingAs($user)
            ->get(route('module.partners.index', ['role' => 'customer']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('partners.data', 2));

        $this->actingAs($user)
            ->get(route('module.partners.index', ['role' => 'supplier']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('partners.data', 2));
    }

    public function test_validation_rejects_invalid_account_type(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.partners.store'), [
            'account_type' => 'invalid',
            'name' => 'Test',
            'status' => 'active',
        ])->assertSessionHasErrors('account_type');
    }
}
