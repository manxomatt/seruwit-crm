<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\TransportationManagement\Database\Factories\TripScheduleFactory;

/**
 * A recurring trip template. Generating trips from it is an explicit,
 * dispatcher-triggered action (see generateTripsBetween()) rather than an
 * automatic background job.
 */
class TripSchedule extends Model
{
    /** @use HasFactory<TripScheduleFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return TripScheduleFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'driver_id',
        'partner_id',
        'origin',
        'destination',
        'cargo_notes',
        'distance_km',
        'days_of_week',
        'time_of_day',
        'duration_minutes',
        'starts_on',
        'ends_on',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'days_of_week' => 'array',
            'distance_km' => 'decimal:2',
            'duration_minutes' => 'integer',
            'starts_on' => 'date:Y-m-d',
            'ends_on' => 'date:Y-m-d',
            'is_active' => 'boolean',
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
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return HasMany<Trip, $this>
     */
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    /**
     * Creates a real Trip for every date in [$from, $to] that matches this
     * template's days of week and falls within its own active window
     * (starts_on/ends_on). Idempotent: re-running over an overlapping range
     * never creates a second trip for a date already generated, and a
     * time-window vehicle/driver conflict is skipped rather than raised.
     *
     * @return array{created: \Illuminate\Support\Collection<int, Trip>, skipped: list<array{date: string, reason: string}>}
     */
    public function generateTripsBetween(Carbon $from, Carbon $to): array
    {
        $created = collect();
        $skipped = [];

        $rangeStart = $from->copy();
        if ($this->starts_on && $this->starts_on->gt($rangeStart)) {
            $rangeStart = $this->starts_on->copy();
        }

        $rangeEnd = $to->copy();
        if ($this->ends_on && $this->ends_on->lt($rangeEnd)) {
            $rangeEnd = $this->ends_on->copy();
        }

        if (! $this->is_active || $rangeStart->gt($rangeEnd)) {
            return ['created' => $created, 'skipped' => $skipped];
        }

        $durationMinutes = max(1, (int) ($this->duration_minutes ?: Trip::DEFAULT_DURATION_MINUTES));
        $distance = $this->distance_km !== null ? (float) $this->distance_km : null;

        for ($date = $rangeStart->copy(); $date->lte($rangeEnd); $date->addDay()) {
            if (! in_array((int) $date->dayOfWeek, array_map('intval', $this->days_of_week ?? []), true)) {
                continue;
            }

            $dateString = $date->toDateString();

            if ($this->trips()->whereDate('scheduled_at', $dateString)->exists()) {
                $skipped[] = ['date' => $dateString, 'reason' => __('transportation.messages.already_generated')];

                continue;
            }

            $startsAt = Carbon::parse($dateString.' '.$this->time_of_day);
            $endsAt = $startsAt->copy()->addMinutes($durationMinutes);

            $reasons = array_merge(
                $this->vehicle ? Trip::vehicleDispatchReasons($this->vehicle, $startsAt, $endsAt, null, $distance, $durationMinutes) : [],
                $this->driver ? Trip::driverDispatchReasons($this->driver, $startsAt, $endsAt, null, $distance, $durationMinutes) : [],
            );

            if ($reasons !== []) {
                $skipped[] = ['date' => $dateString, 'reason' => implode(' ', $reasons)];

                continue;
            }

            $created->push(Trip::create([
                'code' => Trip::nextCode(),
                'trip_schedule_id' => $this->id,
                'vehicle_id' => $this->vehicle_id,
                'driver_id' => $this->driver_id,
                'partner_id' => $this->partner_id,
                'origin' => $this->origin,
                'destination' => $this->destination,
                'cargo_notes' => $this->cargo_notes,
                'distance_km' => $this->distance_km,
                'scheduled_at' => $startsAt,
                'scheduled_end_at' => $endsAt,
                'status' => Trip::STATUS_SCHEDULED,
            ]));
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
