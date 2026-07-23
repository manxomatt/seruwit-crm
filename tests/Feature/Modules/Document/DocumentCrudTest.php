<?php

namespace Tests\Feature\Modules\Document;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DocumentCrudTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    // ── Document Index (expired/expiring overview) ─────────────────────────

    public function test_guests_cannot_access_document_index(): void
    {
        $this->get(route('module.documents.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_documents(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.documents.index'))->assertForbidden();
    }

    public function test_document_index_shows_expired_and_expiring_summary(): void
    {
        $user = $this->createAdminUser();
        $type = DocumentType::factory()->forVehicle()->create();
        $vehicle = Vehicle::factory()->create();

        Document::factory()->expired()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);
        Document::factory()->expiringSoon(7)->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->actingAs($user)->get(route('module.documents.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Document/Index')
                ->where('summary.expired', 1)
                ->where('summary.expiring_week', 1)
            );
    }

    // ── Document Types CRUD ────────────────────────────────────────────────

    public function test_admin_can_list_document_types(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.documents.types.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Document/Types/Index'));
    }

    public function test_admin_can_create_document_type(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.documents.types.store'), [
            'entity_type' => 'vehicle',
            'key' => 'inspection_cert',
            'name' => 'Inspection Certificate',
            'is_required' => true,
            'has_expiry' => true,
            'typical_validity_days' => 365,
            'reminder_days' => [30, 14, 7],
            'sort_order' => 5,
        ])->assertRedirect();

        $this->assertDatabaseHas('document_types', ['key' => 'inspection_cert']);
    }

    public function test_document_type_key_must_be_unique(): void
    {
        $user = $this->createAdminUser();
        DocumentType::factory()->create(['key' => 'existing_key', 'entity_type' => 'vehicle']);

        $this->actingAs($user)->post(route('module.documents.types.store'), [
            'entity_type' => 'vehicle',
            'key' => 'existing_key',
            'name' => 'Duplicate',
            'reminder_days' => [],
            'sort_order' => 0,
        ])->assertSessionHasErrors('key');
    }

    public function test_admin_can_update_document_type(): void
    {
        $user = $this->createAdminUser();
        $type = DocumentType::factory()->forVehicle()->create();

        $this->actingAs($user)->patch(route('module.documents.types.update', $type), [
            'name' => 'Updated Name',
            'is_required' => false,
            'has_expiry' => true,
            'reminder_days' => [30],
            'sort_order' => 1,
        ])->assertRedirect();

        $this->assertEquals('Updated Name', $type->fresh()->name);
    }

    public function test_cannot_delete_document_type_with_existing_documents(): void
    {
        $user = $this->createAdminUser();
        $type = DocumentType::factory()->forVehicle()->create();
        $vehicle = Vehicle::factory()->create();

        Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->actingAs($user)->delete(route('module.documents.types.destroy', $type))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('document_types', ['id' => $type->id]);
    }

    public function test_can_delete_document_type_without_documents(): void
    {
        $user = $this->createAdminUser();
        $type = DocumentType::factory()->forVehicle()->create();

        $this->actingAs($user)->delete(route('module.documents.types.destroy', $type))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('document_types', ['id' => $type->id]);
    }

    // ── Vehicle Documents CRUD ─────────────────────────────────────────────

    public function test_admin_can_view_vehicle_documents(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($user)->get(route('module.fleet.vehicles.documents.index', $vehicle))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Document/Vehicle/Index')
                ->has('vehicle')
                ->has('types')
                ->has('documents')
                ->has('can')
            );
    }

    public function test_admin_can_create_vehicle_document(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();

        $this->actingAs($user)->post(route('module.fleet.vehicles.documents.store', $vehicle), [
            'document_type_id' => $type->id,
            'document_number' => 'DOC-001',
            'issued_at' => '2026-01-01',
            'expires_at' => '2027-01-01',
            'notes' => 'Test document',
        ])->assertRedirect();

        $this->assertDatabaseHas('documents', [
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'document_number' => 'DOC-001',
            'uploaded_by' => $user->id,
        ]);
    }

    public function test_store_supersedes_existing_document_of_same_type(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();

        $existing = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->actingAs($user)->post(route('module.fleet.vehicles.documents.store', $vehicle), [
            'document_type_id' => $type->id,
            'document_number' => 'DOC-NEW',
            'issued_at' => '2026-06-01',
            'expires_at' => '2027-06-01',
        ])->assertRedirect();

        $this->assertSoftDeleted('documents', ['id' => $existing->id]);
        $this->assertDatabaseHas('documents', [
            'document_number' => 'DOC-NEW',
            'deleted_at' => null,
        ]);
    }

    public function test_expires_at_must_be_after_or_equal_to_issued_at(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();

        $this->actingAs($user)->post(route('module.fleet.vehicles.documents.store', $vehicle), [
            'document_type_id' => $type->id,
            'issued_at' => '2026-12-01',
            'expires_at' => '2026-01-01',
        ])->assertSessionHasErrors('expires_at');
    }

    public function test_admin_can_view_vehicle_document_show(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();
        $document = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->actingAs($user)->get(route('module.fleet.vehicles.documents.show', [$vehicle, $document]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Document/Vehicle/Show')
                ->has('document')
                ->has('history')
            );
    }

    public function test_admin_can_update_vehicle_document(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();
        $document = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->actingAs($user)->patch(route('module.fleet.vehicles.documents.update', [$vehicle, $document]), [
            'document_number' => 'UPDATED-001',
            'issued_at' => '2026-03-01',
            'expires_at' => '2027-03-01',
        ])->assertRedirect();

        $this->assertEquals('UPDATED-001', $document->fresh()->document_number);
    }

    public function test_admin_can_delete_vehicle_document(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();
        $document = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->actingAs($user)->delete(route('module.fleet.vehicles.documents.destroy', [$vehicle, $document]))
            ->assertRedirect();

        $this->assertSoftDeleted('documents', ['id' => $document->id]);
    }

    public function test_admin_can_verify_vehicle_document(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();
        $document = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->assertFalse($document->isVerified());

        $this->actingAs($user)->post(route('module.fleet.vehicles.documents.verify', [$vehicle, $document]))
            ->assertRedirect();

        $document->refresh();
        $this->assertTrue($document->isVerified());
        $this->assertEquals($user->id, $document->verified_by);
    }

    // ── Read-only user permission checks ───────────────────────────────────

    public function test_read_only_user_cannot_create_document(): void
    {
        $user = $this->createUserWithRole();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($user)->get(route('module.fleet.vehicles.documents.create', $vehicle))
            ->assertForbidden();
    }

    public function test_read_only_user_cannot_verify_document(): void
    {
        $user = $this->createUserWithRole();
        $vehicle = Vehicle::factory()->create();
        $type = DocumentType::factory()->forVehicle()->create();
        $document = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->actingAs($user)->post(route('module.fleet.vehicles.documents.verify', [$vehicle, $document]))
            ->assertForbidden();
    }

    // ── Model scopes ───────────────────────────────────────────────────────

    public function test_expired_scope_returns_only_expired_documents(): void
    {
        $type = DocumentType::factory()->forVehicle()->create();
        $vehicle = Vehicle::factory()->create();

        Document::factory()->expired()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);
        Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'expires_at' => now()->addYear(),
        ]);
        Document::factory()->permanent()->create([
            'document_type_id' => DocumentType::factory()->forVehicle()->permanent()->create()->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);

        $this->assertEquals(1, Document::expired()->count());
    }

    public function test_expiring_soon_scope_respects_day_parameter(): void
    {
        $type = DocumentType::factory()->forVehicle()->create();
        $vehicle = Vehicle::factory()->create();

        Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'expires_at' => now()->addDays(5),
        ]);
        Document::factory()->create([
            'document_type_id' => DocumentType::factory()->forVehicle()->create()->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'expires_at' => now()->addDays(20),
        ]);

        $this->assertEquals(1, Document::expiringSoon(7)->count());
        $this->assertEquals(2, Document::expiringSoon(30)->count());
    }

    // ── Status accessor ────────────────────────────────────────────────────

    public function test_status_accessor_returns_correct_status(): void
    {
        $type = DocumentType::factory()->forVehicle()->create(['reminder_days' => [30]]);
        $vehicle = Vehicle::factory()->create();

        $expired = Document::factory()->expired()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);
        $this->assertEquals('expired', $expired->status);

        $permanent = Document::factory()->permanent()->create([
            'document_type_id' => DocumentType::factory()->forVehicle()->permanent()->create()->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
        ]);
        $this->assertEquals('permanent', $permanent->status);

        $valid = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'expires_at' => now()->addYear(),
        ]);
        $this->assertEquals('valid', $valid->status);

        $expiringSoon = Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'expires_at' => now()->addDays(10),
        ]);
        $this->assertEquals('expiring_soon', $expiringSoon->status);
    }

    // ── Observer sync ──────────────────────────────────────────────────────

    public function test_saving_stnk_document_syncs_vehicle_expiry(): void
    {
        $type = DocumentType::where('key', 'stnk')->first()
            ?? DocumentType::factory()->forVehicle()->create(['key' => 'stnk']);
        $vehicle = Vehicle::factory()->create();
        $expiresAt = now()->addYear()->toDateString();

        Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'expires_at' => $expiresAt,
        ]);

        $this->assertEquals($expiresAt, $vehicle->fresh()->stnk_expires_at?->toDateString());
    }

    public function test_saving_sim_document_syncs_driver_license_expiry(): void
    {
        $type = DocumentType::where('key', 'sim_a')->first()
            ?? DocumentType::factory()->forDriver()->create(['key' => 'sim_a']);
        $driver = Driver::factory()->create();
        $expiresAt = now()->addYear()->toDateString();

        Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'driver',
            'documentable_id' => $driver->id,
            'expires_at' => $expiresAt,
        ]);

        $this->assertEquals($expiresAt, $driver->fresh()->license_expires_at?->toDateString());
    }
}
