<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerImportExportTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_export_partners(): void
    {
        $this->get(route('module.partners.export', [
            'format' => 'csv',
            'columns' => ['code', 'name'],
        ]))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_export_or_import(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)
            ->get(route('module.partners.export', [
                'format' => 'csv',
                'columns' => ['code', 'name'],
            ]))
            ->assertForbidden();

        $this->actingAs($user)
            ->get(route('module.partners.import.template'))
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('module.partners.import'), [
                'csv' => UploadedFile::fake()->create('partners.csv', 10, 'text/csv'),
            ])
            ->assertForbidden();
    }

    public function test_can_export_partners_as_csv_with_selected_columns(): void
    {
        Partner::factory()->create([
            'code' => 'PART-100001',
            'name' => 'Export Co',
            'email' => 'export@example.com',
            'status' => 'active',
        ]);

        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->get(route('module.partners.export', [
            'format' => 'csv',
            'columns' => ['code', 'name', 'email'],
        ]));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('code,name,email', $content);
        $this->assertStringContainsString('PART-100001', $content);
        $this->assertStringContainsString('Export Co', $content);
        $this->assertStringContainsString('export@example.com', $content);
    }

    public function test_can_export_partners_as_xlsx(): void
    {
        Partner::factory()->create(['name' => 'Excel Partner']);

        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->get(route('module.partners.export', [
            'format' => 'xlsx',
            'columns' => ['code', 'name'],
        ]));

        $response->assertOk();
        $response->assertHeader(
            'content-type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        $this->assertNotEmpty($response->getContent());
        $this->assertStringStartsWith('PK', $response->getContent());
    }

    public function test_export_respects_status_filter(): void
    {
        Partner::factory()->create(['name' => 'Active One', 'status' => 'active']);
        Partner::factory()->inactive()->create(['name' => 'Inactive One']);

        $user = $this->createAdminUser();

        $content = $this->actingAs($user)->get(route('module.partners.export', [
            'format' => 'csv',
            'columns' => ['name', 'status'],
            'status' => 'active',
        ]))->streamedContent();

        $this->assertStringContainsString('Active One', $content);
        $this->assertStringNotContainsString('Inactive One', $content);
    }

    public function test_can_download_import_template(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->get(route('module.partners.import.template'));

        $response->assertOk();
        $content = $response->streamedContent();
        $this->assertStringContainsString('name', $content);
        $this->assertStringContainsString('account_type', $content);
        $this->assertStringContainsString('status', $content);
        $this->assertStringContainsString('Acme Indonesia', $content);
    }

    public function test_can_import_partners_from_csv(): void
    {
        $csv = implode("\n", [
            'code,name,account_type,email,is_customer,is_supplier,status,tags',
            'PART-IMP001,Import Co,company,import@example.com,1,0,active,VIP|Retail',
            ',Fresh Partner,individual,,0,1,active,',
        ]);

        $file = UploadedFile::fake()->createWithContent('partners.csv', $csv);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->post(route('module.partners.import'), ['csv' => $file])
            ->assertRedirect(route('module.partners.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('partners', [
            'code' => 'PART-IMP001',
            'name' => 'Import Co',
            'email' => 'import@example.com',
            'customer_rank' => 1,
            'supplier_rank' => 0,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('partners', [
            'name' => 'Fresh Partner',
            'account_type' => 'individual',
            'supplier_rank' => 1,
        ]);

        $imported = Partner::query()->where('code', 'PART-IMP001')->first();
        $this->assertNotNull($imported);
        $this->assertEqualsCanonicalizing(['VIP', 'Retail'], $imported->tags->pluck('name')->all());
    }

    public function test_import_updates_existing_partner_by_code(): void
    {
        Partner::factory()->create([
            'code' => 'PART-UPD001',
            'name' => 'Old Name',
            'email' => 'old@example.com',
        ]);

        $csv = implode("\n", [
            'code,name,account_type,email,status',
            'PART-UPD001,New Name,company,new@example.com,active',
        ]);

        $file = UploadedFile::fake()->createWithContent('partners.csv', $csv);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->post(route('module.partners.import'), ['csv' => $file])
            ->assertRedirect(route('module.partners.index'));

        $this->assertDatabaseHas('partners', [
            'code' => 'PART-UPD001',
            'name' => 'New Name',
            'email' => 'new@example.com',
        ]);
        $this->assertSame(1, Partner::query()->where('code', 'PART-UPD001')->count());
    }

    public function test_import_rejects_csv_without_required_headers(): void
    {
        $csv = "code,email\nPART-X,test@example.com\n";
        $file = UploadedFile::fake()->createWithContent('partners.csv', $csv);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->from(route('module.partners.index'))
            ->post(route('module.partners.import'), ['csv' => $file])
            ->assertRedirect(route('module.partners.index'))
            ->assertSessionHasErrors('csv');
    }

    public function test_partners_index_includes_export_columns(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.partners.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Partners/Index')
                ->has('exportColumns')
                ->where('can.export', true)
                ->where('can.import', true)
            );
    }
}
