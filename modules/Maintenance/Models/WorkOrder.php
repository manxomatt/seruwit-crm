<?php

namespace Modules\Maintenance\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Fleet\Models\Vehicle;

class WorkOrder extends Model
{
    /** @use HasFactory<\Modules\Maintenance\Database\Factories\WorkOrderFactory> */
    use HasFactory;

    use SoftDeletes;

    protected static function newFactory(): Factory
    {
        return \Modules\Maintenance\Database\Factories\WorkOrderFactory::new();
    }

    // ── Status constants ────────────────────────────────────────────────────
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    // ── Priority constants ──────────────────────────────────────────────────
    public const PRIORITY_LOW = 'low';

    public const PRIORITY_NORMAL = 'normal';

    public const PRIORITY_HIGH = 'high';

    public const PRIORITY_URGENT = 'urgent';

    // ── Type constants ──────────────────────────────────────────────────────
    public const TYPE_SCHEDULED = 'scheduled';

    public const TYPE_CORRECTIVE = 'corrective';

    public const TYPE_PREVENTIVE = 'preventive';

    public const TYPE_EMERGENCY = 'emergency';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'category_id',
        'reference_number',
        'title',
        'description',
        'status',
        'priority',
        'type',
        'odometer_at_service',
        'scheduled_date',
        'started_at',
        'completed_at',
        'stock_deducted_at',
        'vendor_name',
        'mechanic_name',
        'invoice_number',
        'estimated_cost',
        'actual_labor_cost',
        'actual_parts_cost',
        'notes',
        'resolution_notes',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'stock_deducted_at' => 'datetime',
            'approved_at' => 'datetime',
            'estimated_cost' => 'decimal:2',
            'actual_labor_cost' => 'decimal:2',
            'actual_parts_cost' => 'decimal:2',
            'odometer_at_service' => 'integer',
        ];
    }

    // ── Relationships ───────────────────────────────────────────────────────

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<MaintenanceCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MaintenanceCategory::class, 'category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return HasMany<WorkOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(WorkOrderItem::class);
    }

    // ── Computed attributes ─────────────────────────────────────────────────

    /**
     * Total actual cost = labor + parts. Returns null when both are null.
     */
    public function getActualTotalCostAttribute(): ?float
    {
        $labor = (float) ($this->actual_labor_cost ?? 0);
        $parts = (float) ($this->actual_parts_cost ?? 0);

        if ($this->actual_labor_cost === null && $this->actual_parts_cost === null) {
            return null;
        }

        return $labor + $parts;
    }

    // ── Query scopes ────────────────────────────────────────────────────────

    /**
     * @param  Builder<WorkOrder>  $query
     * @return Builder<WorkOrder>
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNotIn('status', [self::STATUS_COMPLETED, self::STATUS_CANCELLED]);
    }

    /**
     * @param  Builder<WorkOrder>  $query
     * @return Builder<WorkOrder>
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->whereNotIn('status', [self::STATUS_COMPLETED, self::STATUS_CANCELLED])
            ->whereNotNull('scheduled_date')
            ->where('scheduled_date', '<', now()->toDateString());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Generate the next reference number in the format WO-YYYY-NNNN.
     */
    public static function generateReferenceNumber(): string
    {
        $year = now()->year;
        $prefix = "WO-{$year}-";

        $latest = static::withTrashed()
            ->where('reference_number', 'like', "{$prefix}%")
            ->orderByDesc('reference_number')
            ->value('reference_number');

        $sequence = $latest ? ((int) substr($latest, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
