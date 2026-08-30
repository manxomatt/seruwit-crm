<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantCapacityTransaction extends Model
{
    public const TYPE_PURCHASE = 'purchase';

    public const TYPE_ACTIVATION = 'activation';

    public const TYPE_RENEWAL = 'renewal';

    public const TYPE_ADMIN_ADJUSTMENT = 'admin_adjustment';

    public const TYPE_BONUS = 'bonus';

    public const TYPE_CORRECTION = 'correction';

    public const TYPE_REFUND = 'refund';

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'amount',
        'balance_after',
        'type',
        'description',
        'reference_id',
        'created_by_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'balance_after' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return BelongsTo<CentralUser, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(CentralUser::class, 'created_by_id', 'global_id');
    }
}
