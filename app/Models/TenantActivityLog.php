<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantActivityLog extends Model
{
    const UPDATED_AT = null;

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
