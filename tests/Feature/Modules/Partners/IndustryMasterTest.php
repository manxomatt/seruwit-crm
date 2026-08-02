<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class IndustryMasterTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_industries(): void
    {
        $this->get(route('module.partners.industries.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_manage_industries(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)
            ->get(route('module.partners.industries.index'))
            ->assertForbidden();
    }

    public function test_industries_index_renders_and_industry_can_be_created(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.partners.industries.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Partners/Industries/Index')
                ->where('can.create', true)
            );

        $this->actingAs($user)
            ->post(route('module.partners.industries.store'), [
                'name' => [
                    'id' => 'Logistik',
                    'en' => 'Logistics',
                ],
                'description' => [
                    'id' => 'Pengiriman barang',
                    'en' => 'Freight shipping',
                ],
                'is_active' => true,
            ])
            ->assertRedirect(route('module.partners.industries.index'))
            ->assertSessionHas('success');

        $industry = PartnerIndustry::query()->where('name->id', 'Logistik')->first();
        $this->assertNotNull($industry);
        $this->assertSame('Logistics', $industry->name['en']);
        $this->assertTrue($industry->is_active);
    }

    public function test_industry_name_must_be_unique_per_locale(): void
    {
        PartnerIndustry::factory()->create([
            'name' => ['id' => 'Ritel', 'en' => 'Retail'],
        ]);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->from(route('module.partners.industries.index'))
            ->post(route('module.partners.industries.store'), [
                'name' => ['id' => 'Ritel', 'en' => 'Retail Store'],
                'is_active' => true,
            ])
            ->assertRedirect(route('module.partners.industries.index'))
            ->assertSessionHasErrors('name.id');
    }

    public function test_admin_can_update_industry(): void
    {
        $industry = PartnerIndustry::factory()->create([
            'name' => ['id' => 'Lama', 'en' => 'Old'],
            'is_active' => true,
        ]);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->patch(route('module.partners.industries.update', $industry), [
                'name' => ['id' => 'Baru', 'en' => 'New'],
                'description' => ['id' => 'Diperbarui', 'en' => 'Updated'],
                'is_active' => false,
            ])
            ->assertRedirect(route('module.partners.industries.index'));

        $industry->refresh();
        $this->assertSame('Baru', $industry->name['id']);
        $this->assertSame('New', $industry->name['en']);
        $this->assertFalse($industry->is_active);
    }

    public function test_admin_can_delete_unused_industry(): void
    {
        $industry = PartnerIndustry::factory()->create([
            'name' => ['id' => 'Tidak Dipakai', 'en' => 'Unused'],
        ]);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->delete(route('module.partners.industries.destroy', $industry))
            ->assertRedirect(route('module.partners.industries.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('partner_industries', ['id' => $industry->id]);
    }

    public function test_cannot_delete_industry_assigned_to_partners(): void
    {
        $industry = PartnerIndustry::factory()->create([
            'name' => ['id' => 'Dipakai', 'en' => 'In Use'],
        ]);
        Partner::factory()->create(['industry_id' => $industry->id]);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->from(route('module.partners.industries.index'))
            ->delete(route('module.partners.industries.destroy', $industry))
            ->assertRedirect(route('module.partners.industries.index'))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('partner_industries', ['id' => $industry->id]);
    }
}
