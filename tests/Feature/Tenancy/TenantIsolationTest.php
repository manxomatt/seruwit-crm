<?php

namespace Tests\Feature\Tenancy;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\CentralUser;
use App\Models\Media;
use App\Models\Page;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    /**
     * DatabaseMigrations (not RefreshDatabase) on purpose: tenant provisioning
     * issues DDL (CREATE/DROP SCHEMA) that must commit, which deadlocks inside
     * the transaction RefreshDatabase wraps around each test.
     */
    use DatabaseMigrations;

    protected function tearDown(): void
    {
        tenancy()->end();

        Tenant::query()->get()->each(function (Tenant $tenant): void {
            File::deleteDirectory(storage_path('tenant'.$tenant->id));
            $tenant->delete();
        });

        parent::tearDown();
    }

    private function provisionTenant(string $company, string $subdomain, string $ownerEmail): Tenant
    {
        User::factory()->create(['email' => $ownerEmail]);

        return app(CreateTenantAction::class)->execute(
            companyName: $company,
            subdomain: $subdomain,
            owner: CentralUser::query()->firstWhere('email', $ownerEmail),
        );
    }

    public function test_module_data_from_one_tenant_is_invisible_in_another(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $pageId = $tenantA->run(function (): int {
            $author = User::query()->firstWhere('email', 'admin@a.test');

            return Page::factory()->create([
                'title' => 'Rahasia Perusahaan A',
                'user_id' => $author->id,
            ])->id;
        });

        $adminB = $tenantB->run(fn (): User => User::query()->firstWhere('email', 'admin@b.test'));

        $index = $this->actingAs($adminB)->get('http://company-b.localhost/module/pages');
        $index->assertOk();
        $index->assertDontSee('Rahasia Perusahaan A');

        tenancy()->end();

        $this->actingAs($adminB)
            ->get("http://company-b.localhost/module/pages/{$pageId}/edit")
            ->assertNotFound();
    }

    public function test_uploaded_files_are_stored_per_tenant(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $tenantA->run(function (): void {
            Storage::disk('public')->put('isolation-probe.txt', 'milik A');
        });

        $this->assertFileExists(storage_path('tenant'.$tenantA->id.'/app/public/isolation-probe.txt'));
        $this->assertFileDoesNotExist(storage_path('app/public/isolation-probe.txt'));

        $existsInB = $tenantB->run(
            fn (): bool => Storage::disk('public')->exists('isolation-probe.txt'),
        );
        $this->assertFalse($existsInB);
    }

    public function test_media_urls_use_the_tenancy_asset_route_inside_tenants(): void
    {
        $tenant = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        $tenantUrl = $tenant->run(
            fn (): string => (new Media(['path' => 'images/foto.png']))->url,
        );

        $this->assertSame('/tenancy/assets/images/foto.png', $tenantUrl);

        tenancy()->end();

        $centralUrl = (new Media(['path' => 'images/foto.png']))->url;
        $this->assertSame('/storage/images/foto.png', $centralUrl);
    }

    public function test_route_cache_stays_free_of_duplicate_names(): void
    {
        $this->artisan('route:cache')->assertSuccessful();
        $this->artisan('route:clear')->assertSuccessful();
    }
}
