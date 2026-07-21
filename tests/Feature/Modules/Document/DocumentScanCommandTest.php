<?php

namespace Tests\Feature\Modules\Document;

use App\Models\Tenant;
use App\Modules\ModuleInstaller;
use Modules\Document\DocumentModule;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentReminder;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * The per-tenant expiry scanner. Needs real tenant schemas because the whole
 * point is that it walks every tenant.
 */
class DocumentScanCommandTest extends TestCase
{
    use WithTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function documentTenant(string $name, string $subdomain, string $email): Tenant
    {
        $tenant = $this->provisionTenant($name, $subdomain, $email);
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, app(DocumentModule::class));
        tenancy()->end();

        return $tenant;
    }

    private function expiringDocument(int $daysToExpiry): Document
    {
        $type = DocumentType::factory()->create(['reminder_days' => [30, 14, 7]]);
        $vehicle = Vehicle::factory()->create();

        return Document::factory()->create([
            'document_type_id' => $type->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'expires_at' => now()->addDays($daysToExpiry),
        ]);
    }

    public function test_it_raises_reminders_for_every_crossed_threshold(): void
    {
        $tenant = $this->documentTenant('Doc Co', 'doc-co', 'owner@doc-co.test');

        $document = $tenant->run(fn () => $this->expiringDocument(7)->id);

        $this->artisan('document:scan-expiring', ['--tenant' => $tenant->id])->assertSuccessful();

        // 7 days out: the 30, 14 and 7-day thresholds have all been crossed.
        $tenant->run(function () use ($document) {
            $reminders = DocumentReminder::where('document_id', $document)->pluck('days_before')->sort()->values()->all();
            $this->assertSame([7, 14, 30], $reminders);
        });
    }

    public function test_re_running_raises_no_new_reminders(): void
    {
        $tenant = $this->documentTenant('Doc Idem Co', 'doc-idem-co', 'owner@doc-idem.test');
        $tenant->run(fn () => $this->expiringDocument(7));

        $this->artisan('document:scan-expiring', ['--tenant' => $tenant->id]);
        $this->artisan('document:scan-expiring', ['--tenant' => $tenant->id]);

        $tenant->run(fn () => $this->assertSame(3, DocumentReminder::count()));
    }

    public function test_a_document_far_from_expiry_raises_nothing(): void
    {
        $tenant = $this->documentTenant('Doc Far Co', 'doc-far-co', 'owner@doc-far.test');
        $tenant->run(fn () => $this->expiringDocument(90));

        $this->artisan('document:scan-expiring', ['--tenant' => $tenant->id]);

        $tenant->run(fn () => $this->assertSame(0, DocumentReminder::count()));
    }

    public function test_it_notifies_a_document_viewer(): void
    {
        $tenant = $this->documentTenant('Doc Notify Co', 'doc-notify-co', 'owner@doc-notify.test');

        $tenant->run(fn () => $this->expiringDocument(7));

        $this->artisan('document:scan-expiring', ['--tenant' => $tenant->id]);

        // The provisioned owner is an admin, so they receive the alerts.
        $tenant->run(function () {
            $owner = \App\Models\User::firstWhere('email', 'owner@doc-notify.test');
            $this->assertGreaterThan(0, $owner->notifications()->count());
        });
    }
}
