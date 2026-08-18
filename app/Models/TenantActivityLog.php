<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantActivityLog extends Model
{
    const UPDATED_AT = null;

    /**
     * Pinned to the central connection, like every other central-only model
     * (Plan, Subscription, PaymentOrder, ...). Without this, a log write that
     * happens to run while the default connection is still pointed at a
     * tenant schema (e.g. right after the provisioning pipeline runs tenant
     * migrations) fails with "relation does not exist" instead of writing to
     * the central `tenant_activity_logs` table.
     */
    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    protected $fillable = [
        'tenant_id',
        'action',
        'description',
        'actor_id',
        'actor_name',
        'meta',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
