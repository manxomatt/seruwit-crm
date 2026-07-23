<?php

namespace Modules\Canvassing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Canvassing\Database\Factories\CanvassingPlanFactory;

class CanvassingPlan extends Model
{
    /** @use HasFactory<CanvassingPlanFactory> */
    use HasFactory;

    public const STATUS_PLANNED = 'planned';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected static function newFactory(): Factory
    {
        return CanvassingPlanFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'salesperson_id',
        'plan_date',
        'notes',
        'status',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'plan_date' => 'date',
        ];
    }

    /** @return BelongsTo<Salesperson, $this> */
    public function salesperson(): BelongsTo
    {
        return $this->belongsTo(Salesperson::class);
    }

    /** @return HasMany<CanvassingVisit, $this> */
    public function visits(): HasMany
    {
        return $this->hasMany(CanvassingVisit::class, 'plan_id');
    }
}
