<?php

namespace App\Jobs\Tenancy;

use App\Models\CentralUser;
use App\Models\OnboardingSession;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use Database\Seeders\CreateBintangKejoraAlternativePagesSeeder;
use Database\Seeders\TenantDefaultPageSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class FinalizeTenantSetupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public int $tries = 1;

    public Tenant $tenant;

    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
    }

    public function handle(ModuleInstaller $installer): void
    {
        /** @var array{owner_global_id?: string, vertical?: string, module_keys?: list<string>, pack_keys?: list<string>, session_id?: int|null} $setup */
        $setup = $this->tenant->provision ?? [];
        $ownerGlobalId = $setup['owner_global_id'] ?? null;
        $vertical = $setup['vertical'] ?? 'rental';
        $moduleKeys = $setup['module_keys'] ?? [];
        $packKeys = $setup['pack_keys'] ?? [];
        $sessionId = $setup['session_id'] ?? null;

        // Attach owner to the tenant (fires SyncedResourceSaved → UpdateSyncedResource,
        // which creates the user row in the tenant schema). Must happen before
        // $tenant->run() so the user exists when we assign the admin role.
        if ($ownerGlobalId !== null) {
            $owner = CentralUser::query()->where('global_id', $ownerGlobalId)->firstOrFail();
            $owner->tenants()->syncWithoutDetaching([$this->tenant->getTenantKey()]);
        }

        $this->tenant->run(function () use ($ownerGlobalId): void {
            if ($ownerGlobalId !== null) {
                $user = User::query()->firstWhere('global_id', $ownerGlobalId);

                if ($user === null) {
                    throw new \RuntimeException(
                        "Owner [{$ownerGlobalId}] was not synced into tenant [{$this->tenant->getTenantKey()}].",
                    );
                }

                if ($user->email_verified_at === null) {
                    $user->forceFill(['email_verified_at' => now()])->save();
                }

                $user->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());
            }
        });

        // Install pages first — it is the core content module. Its table must
        // exist before the page seeders run, and it must be ready before any
        // vertical pack is installed.
        $pagesModule = Modules::find('pages');
        if ($pagesModule !== null) {
            $installer->install($this->tenant, $pagesModule);
        }

        $this->tenant->run(function () use ($vertical): void {
            app(TenantDefaultPageSeeder::class)->run($vertical);
            app(CreateBintangKejoraAlternativePagesSeeder::class)->run();
        });

        // Install remaining content modules (pages already handled above).
        foreach ($moduleKeys as $moduleKey) {
            if ($moduleKey === 'pages') {
                continue;
            }
            $module = Modules::find($moduleKey);
            if ($module === null) {
                continue;
            }
            $installer->install($this->tenant, $module);
        }

        // Install vertical packs last. A failing pack (e.g. plan does not cover
        // a pack module) is logged and skipped so core content is never blocked.
        foreach ($packKeys as $packKey) {
            try {
                $installer->installPack($this->tenant, $packKey, withDemoSeeders: false);
            } catch (Throwable $e) {
                Log::warning('FinalizeTenantSetupJob: pack installation skipped.', [
                    'tenant_id' => $this->tenant->getTenantKey(),
                    'pack' => $packKey,
                    'reason' => $e->getMessage(),
                ]);
            }
        }

        if ($sessionId !== null) {
            OnboardingSession::query()->find($sessionId)?->update([
                'status' => OnboardingSession::STATUS_READY,
                'error_message' => null,
            ]);
        }
    }

    public function failed(Throwable $e): void
    {
        Log::error('FinalizeTenantSetupJob failed.', [
            'tenant_id' => $this->tenant->getTenantKey(),
            'exception' => $e->getMessage(),
        ]);

        $setup = $this->tenant->provision ?? [];
        $sessionId = $setup['session_id'] ?? null;

        if ($sessionId !== null) {
            OnboardingSession::query()->find($sessionId)?->update([
                'status' => OnboardingSession::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
