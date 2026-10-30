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
        if (Schema::hasTable('rental_maintenance_blackouts')) {
            self::ensurePreventRentalsColumn();

            $query = static::query()
                ->where('vehicle_id', $vehicleId)
                ->whereIn('status', self::blockingStatuses())
                ->where('start_date', '<=', $end)
                ->where('end_date', '>=', $start)
                ->when($excludingId, fn (Builder $q) => $q->where('id', '!=', $excludingId));

            if (Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
                $query->where('prevent_rentals', true);
            }

            $blackout = $query->first();
            if ($blackout) {
                return $blackout;
            }
        }

        // Bridge active WorkOrders from Maintenance module if Maintenance is installed
        if (class_exists(WorkOrder::class) && Schema::hasTable('work_orders')) {
            $wo = WorkOrder::query()
                ->where('vehicle_id', $vehicleId)
                ->whereIn('status', [WorkOrder::STATUS_APPROVED, WorkOrder::STATUS_IN_PROGRESS])
                ->where(function (Builder $q) use ($start, $end) {
                    $q->where(function (Builder $sq) use ($start, $end) {
                        $sq->whereNotNull('scheduled_date')
                            ->where('scheduled_date', '<=', $end)
                            ->where('scheduled_date', '>=', $start);
                    })->orWhere('status', WorkOrder::STATUS_IN_PROGRESS);
                })
                ->first();

            if ($wo) {
                $stub = new static;
                $stub->id = 0;
                $stub->code = $wo->reference_number;
                $stub->vehicle_id = $wo->vehicle_id;
                $stub->reason = "Work Order [{$wo->reference_number}]: {$wo->title}";
                $stub->start_date = $wo->started_at?->toDateString() ?? $wo->scheduled_date ?? $start;
                $stub->end_date = $wo->completed_at?->toDateString() ?? $end;
                $stub->status = $wo->status === WorkOrder::STATUS_IN_PROGRESS ? self::STATUS_IN_PROGRESS : self::STATUS_SCHEDULED;
                $stub->work_order_id = $wo->id;

                return $stub;
            }
        }

        return null;
    }

    /**
     * Active maintenance blackouts overlapping [$start, $end] grouped by vehicle_id.
     *
     * @return Collection<int, Collection<int, self>>
     */
    public static function activeBlackoutsBetween(string $start, string $end): Collection
    {
        $result = collect();

        if (Schema::hasTable('rental_maintenance_blackouts')) {
            self::ensurePreventRentalsColumn();

            $query = static::query()
                ->whereIn('status', self::blockingStatuses())
                ->where('start_date', '<=', $end)
                ->where('end_date', '>=', $start)
                ->with(['vehicle:id,name,plate_number', 'vendorPartner:id,name'])
                ->orderBy('start_date');

            if (Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
                $query->where('prevent_rentals', true);
            }

            $result = $query->get()->groupBy('vehicle_id');
        }

        // Bridge active WorkOrders from Maintenance module if not already represented in blackouts
        if (class_exists(WorkOrder::class) && Schema::hasTable('work_orders')) {
            $knownWoIds = $result->flatten()->pluck('work_order_id')->filter()->all();

            $workOrders = WorkOrder::query()
                ->with(['vehicle:id,name,plate_number'])
                ->whereIn('status', [WorkOrder::STATUS_APPROVED, WorkOrder::STATUS_IN_PROGRESS])
                ->when($knownWoIds !== [], fn (Builder $q) => $q->whereNotIn('id', $knownWoIds))
                ->where(function (Builder $q) use ($start, $end) {
                    $q->where(function (Builder $sq) use ($start, $end) {
                        $sq->whereNotNull('scheduled_date')
                            ->where('scheduled_date', '<=', $end)
                            ->where('scheduled_date', '>=', $start);
                    })->orWhere('status', WorkOrder::STATUS_IN_PROGRESS);
                })
                ->get();

            foreach ($workOrders as $wo) {
                $stub = new static;
                $stub->id = 0;
                $stub->code = $wo->reference_number;
                $stub->vehicle_id = $wo->vehicle_id;
                $stub->reason = "Work Order [{$wo->reference_number}]: {$wo->title}";
                $stub->start_date = $wo->started_at?->toDateString() ?? $wo->scheduled_date ?? $start;
                $stub->end_date = $wo->completed_at?->toDateString() ?? $end;
                $stub->status = $wo->status === WorkOrder::STATUS_IN_PROGRESS ? self::STATUS_IN_PROGRESS : self::STATUS_SCHEDULED;
                $stub->work_order_id = $wo->id;
                $stub->setRelation('vehicle', $wo->vehicle);

                if (! $result->has($wo->vehicle_id)) {
                    $result->put($wo->vehicle_id, collect([$stub]));
                } else {
                    $result->get($wo->vehicle_id)->push($stub);
                }
            }
        }

        return $result;
    }

    /**
     * Self-heal missing columns if an existing table was created with a partial schema.
     */
    public static function ensurePreventRentalsColumn(): void
    {
        try {
            if (Schema::hasTable('rental_maintenance_blackouts') && ! Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
                Schema::table('rental_maintenance_blackouts', function (\Illuminate\Database\Schema\Blueprint $table) {
                    if (! Schema::hasColumn('rental_maintenance_blackouts', 'type')) {
                        $table->string('type', 40)->default('preventive_service')->after('code');
                    }
                    if (! Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
                        $table->boolean('prevent_rentals')->default(true)->after('status');
                    }
                    if (! Schema::hasColumn('rental_maintenance_blackouts', 'completed_at')) {
                        $table->timestamp('completed_at')->nullable()->after('created_by');
                    }
                });
            }
        } catch (\Throwable) {
            // Silently allow fallback query
        }
    }
}
