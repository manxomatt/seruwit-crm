<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantActivityLog;
use App\Models\User;

class TenantActivityLogger
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public static function log(
        Tenant $tenant,
        string $action,
        string $description,
        ?User $actor = null,
        array $meta = [],
    ): void {
        TenantActivityLog::create([
            'tenant_id' => $tenant->getTenantKey(),
            'action' => $action,
            'description' => $description,
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
            'meta' => empty($meta) ? null : $meta,
        ]);
    }
}
