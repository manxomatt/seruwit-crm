<?php

namespace Modules\Routing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoutePlan extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_OPTIMIZED = 'optimized';

    public const STATUS_APPLIED = 'applied';

    public const STATUS_CANCELLED = 'cancelled';

    public const OBJECTIVE_DISTANCE = 'distance';

    public const OBJECTIVE_FUEL_COST = 'fuel_cost';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'status',
        'objective',
        'planned_date',
        'depot_address',
        'depot_lat',
        'depot_lng',
        'params',
        'total_distance_km',
        'total_cost',
        'unassigned_count',
        'created_by',
        'optimized_at',
        'applied_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'planned_date' => 'date',
            'depot_lat' => 'decimal:7',
            'depot_lng' => 'decimal:7',
            'params' => 'array',
            'total_distance_km' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'unassigned_count' => 'integer',
            'optimized_at' => 'datetime',
            'applied_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<RoutePlanRoute, $this>
     */
    public function routes(): HasMany
    {
        return $this->hasMany(RoutePlanRoute::class)->orderBy('sequence');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()->orderByDesc('id')->value('id');

        return sprintf('RP-%06d', $lastNumber + 1);
    }
}
