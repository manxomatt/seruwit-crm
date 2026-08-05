<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerBatchTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_batch_update_partner_status(): void
    {
        $user = $this->createAdminUser();
        $first = Partner::factory()->create(['status' => 'active']);
        $second = Partner::factory()->create(['status' => 'active']);

        $this->actingAs($user)
            ->patch(route('module.partners.batch-status'), [
                'ids' => [$first->id, $second->id],
                'status' => 'inactive',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('partners', ['id' => $first->id, 'status' => 'inactive']);
        $this->assertDatabaseHas('partners', ['id' => $second->id, 'status' => 'inactive']);
    }

    public function test_batch_status_update_requires_valid_status_and_ids(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();

        $this->actingAs($user)
            ->patch(route('module.partners.batch-status'), [
                'ids' => [$partner->id],
                'status' => 'not-a-status',
            ])
            ->assertSessionHasErrors('status');

        $this->actingAs($user)
            ->patch(route('module.partners.batch-status'), [
                'ids' => [],
                'status' => 'active',
            ])
            ->assertSessionHasErrors('ids');
    }

    public function test_admin_can_batch_delete_partners(): void
    {
        $user = $this->createAdminUser();
        $first = Partner::factory()->create();
        $second = Partner::factory()->create();

        $this->actingAs($user)
            ->post(route('module.partners.batch-destroy'), [
                'ids' => [$first->id, $second->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSoftDeleted('partners', ['id' => $first->id]);
        $this->assertSoftDeleted('partners', ['id' => $second->id]);
    }

    public function test_user_without_delete_permission_cannot_batch_delete(): void
    {
        $user = $this->createUserWithRole();
        $partner = Partner::factory()->create();

        $this->actingAs($user)
            ->post(route('module.partners.batch-destroy'), [
                'ids' => [$partner->id],
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('partners', ['id' => $partner->id]);
    }

    public function test_user_without_update_permission_cannot_batch_update_status(): void
    {
        $user = $this->createUserWithRole();
        $partner = Partner::factory()->create(['status' => 'active']);

        $this->actingAs($user)
            ->patch(route('module.partners.batch-status'), [
                'ids' => [$partner->id],
                'status' => 'inactive',
            ])
            ->assertForbidden();
    }
}
