<?php

namespace Modules\Rental\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Partners\Models\Partner;

class RentalMaintenanceBlackout extends Model
{
    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const TYPE_PREVENTIVE = 'preventive_service';

    public const TYPE_MILEAGE = 'mileage_interval';

    public const TYPE_CORRECTIVE = 'corrective_repair';

    public const TYPE_BODY_PAINT = 'body_paint';

    public const TYPE_COMPLIANCE = 'compliance_inspection';

    public const TYPE_OTHER = 'other';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'work_order_id',
        'code',
        'type',
        'reason',
        'start_date',
        'end_date',
        'vendor_workshop_name',
        'workshop_name',
        'vendor_partner_id',
        'estimated_cost',
        'actual_cost',
        'status',
        'prevent_rentals',
        'notes',
        'created_by',
        'completed_at',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'workshop_name',
    ];

    public function getWorkshopNameAttribute(): ?string
    {
        return $this->attributes['vendor_workshop_name'] ?? null;
    }

    public function setWorkshopNameAttribute(?string $value): void
    {
        $this->attributes['vendor_workshop_name'] = $value;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'vehicle_id' => 'integer',
            'work_order_id' => 'integer',
            'vendor_partner_id' => 'integer',
            'created_by' => 'integer',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'estimated_cost' => 'decimal:2',
            'actual_cost' => 'decimal:2',
            'prevent_rentals' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<WorkOrder, $this>
     */
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function vendorPartner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'vendor_partner_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return list<string>
     */
    public static function blockingStatuses(): array
    {
        return [
            self::STATUS_SCHEDULED,
            self::STATUS_IN_PROGRESS,
        ];
    }

    public static function generateCode(): string
    {
        $prefix = 'MNT-'.now()->format('Ym').'-';
        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('code');

        $sequence = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $sequence = (int) $matches[1] + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Check if a vehicle has an active maintenance blackout overlapping [$start, $end].
     */
    public static function findOverlappingBlackout(int $vehicleId, string $start, string $end, ?int $excludingId = null): ?self
    {
        if (! Schema::hasTable('rental_maintenance_blackouts')) {
            return null;
        }

        return static::query()
            ->where('vehicle_id', $vehicleId)
            ->where('prevent_rentals', true)
            ->whereIn('status', self::blockingStatuses())
            ->where('start_date', '<=', $end)
            ->where('end_date', '>=', $start)
            ->when($excludingId, fn (Builder $q) => $q->where('id', '!=', $excludingId))
            ->first();
    }

    /**
     * Active maintenance blackouts overlapping [$start, $end] grouped by vehicle_id.
     *
     * @return Collection<int, Collection<int, self>>
     */
    public static function activeBlackoutsBetween(string $start, string $end): Collection
    {
        if (! Schema::hasTable('rental_maintenance_blackouts')) {
            return collect();
        }

        return static::query()
            ->where('prevent_rentals', true)
            ->whereIn('status', self::blockingStatuses())
            ->where('start_date', '<=', $end)
            ->where('end_date', '>=', $start)
            ->with(['vehicle:id,name,plate_number', 'vendorPartner:id,name'])
            ->orderBy('start_date')
            ->get()
            ->groupBy('vehicle_id');
    }
}
