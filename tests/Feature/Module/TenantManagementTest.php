<?php

namespace Tests\Feature\Module;

use App\Jobs\Tenancy\FinalizeTenantSetupJob;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantActivityLog;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class TenantManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PlanSeeder::class);
        Role::factory()->admin()->create();
        $this->admin = User::factory()->admin()->create();

        // Bypass model events to prevent tenancy DDL pipeline from running
        // inside RefreshDatabase's transaction (which would deadlock).
        $this->tenant = Tenant::withoutEvents(function (): Tenant {
            return Tenant::create([
                'name' => 'Test Company',
                'provision' => ['owner_global_id' => fake()->uuid(), 'vertical' => 'crm'],
            ]);
        });
        $this->tenant->domains()->create(['domain' => 'test.seruwit.test']);
    }

    public function test_retry_setup_dispatches_finalize_job(): void
    {
        Queue::fake();

        $this->actingAs($this->admin)
            ->post(route('module.tenants.retry-setup', $this->tenant->id))
            ->assertRedirect();

        Queue::assertPushed(FinalizeTenantSetupJob::class, function (FinalizeTenantSetupJob $job): bool {
            return $job->tenant->id === $this->tenant->id;
        });
    }

    public function test_retry_setup_creates_activity_log(): void
    {
        Queue::fake();

        $this->actingAs($this->admin)
            ->post(route('module.tenants.retry-setup', $this->tenant->id));

        $this->assertDatabaseHas('tenant_activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'setup_retried',
            'actor_name' => $this->admin->name,
        ]);
    }

    public function test_retry_setup_returns_error_when_no_provision_data(): void
    {
        Queue::fake();

        $noProvisionTenant = Tenant::withoutEvents(fn (): Tenant => Tenant::create(['name' => 'No Provision']));

        $this->actingAs($this->admin)
            ->post(route('module.tenants.retry-setup', $noProvisionTenant->id))
            ->assertSessionHas('error');

        Queue::assertNothingPushed();
    }

    public function test_update_creates_activity_log(): void
    {
        $this->actingAs($this->admin)
            ->patch(route('module.tenants.update', $this->tenant->id), [
                'name' => 'Updated Company',
                'subdomain' => 'test',
                'status' => 'active',
                'plan' => 'free',
            ]);

        $this->assertDatabaseHas('tenant_activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'updated',
            'actor_name' => $this->admin->name,
        ]);
    }

    public function test_toggle_status_creates_activity_log(): void
    {
        $this->actingAs($this->admin)
            ->patch(route('module.tenants.toggle-status', $this->tenant->id));

        $this->assertDatabaseHas('tenant_activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'status_changed',
            'actor_name' => $this->admin->name,
        ]);
    }

    public function test_activity_log_records_status_change_meta(): void
    {
        $this->actingAs($this->admin)
            ->patch(route('module.tenants.toggle-status', $this->tenant->id));

        $log = TenantActivityLog::where('tenant_id', $this->tenant->id)
            ->where('action', 'status_changed')
            ->firstOrFail();

        $this->assertArrayHasKey('from', $log->meta);
        $this->assertArrayHasKey('to', $log->meta);
    }
}
