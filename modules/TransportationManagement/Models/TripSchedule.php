<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Modules\Customer\Models\Customer;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
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
        'customer_id',
        'origin',
        'destination',
        'cargo_notes',
        'distance_km',
        'days_of_week',
        'time_of_day',
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
            'starts_on' => 'date',
            'ends_on' => 'date',
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
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
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
     * same-date vehicle/driver conflict is skipped rather than raised.
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

        for ($date = $rangeStart->copy(); $date->lte($rangeEnd); $date->addDay()) {
            if (! in_array($date->dayOfWeek, $this->days_of_week, false)) {
                continue;
            }

            $dateString = $date->toDateString();

            if ($this->trips()->whereDate('scheduled_at', $dateString)->exists()) {
                $skipped[] = ['date' => $dateString, 'reason' => 'A trip for this date was already generated.'];

                continue;
            }

            if (Trip::hasActiveTripOn('vehicle_id', $this->vehicle_id, $dateString)
                || Trip::hasActiveTripOn('driver_id', $this->driver_id, $dateString)) {
                $skipped[] = ['date' => $dateString, 'reason' => 'The vehicle or driver already has an active trip that day.'];

                continue;
            }

            $created->push(Trip::create([
                'code' => Trip::nextCode(),
                'trip_schedule_id' => $this->id,
                'vehicle_id' => $this->vehicle_id,
                'driver_id' => $this->driver_id,
                'customer_id' => $this->customer_id,
                'origin' => $this->origin,
                'destination' => $this->destination,
                'cargo_notes' => $this->cargo_notes,
                'distance_km' => $this->distance_km,
                'scheduled_at' => Carbon::parse($dateString.' '.$this->time_of_day),
                'status' => Trip::STATUS_SCHEDULED,
            ]));
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
