<?php

namespace Modules\Shuttle\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttleSchedule;

class ScheduleDepartureGenerator
{
    /**
     * @return array{created: Collection<int, ShuttleDeparture>, skipped: list<array{date: string, reason: string}>}
     */
    public function generate(ShuttleSchedule $schedule, Carbon $from, Carbon $to): array
    {
        $schedule->loadMissing('corridor');

        $created = collect();
        $skipped = [];

        $rangeStart = $from->copy()->startOfDay();
        if ($schedule->starts_on && $schedule->starts_on->gt($rangeStart)) {
            $rangeStart = $schedule->starts_on->copy()->startOfDay();
        }

        $rangeEnd = $to->copy()->startOfDay();
        if ($schedule->ends_on && $schedule->ends_on->lt($rangeEnd)) {
            $rangeEnd = $schedule->ends_on->copy()->startOfDay();
        }

        if ($rangeStart->gt($rangeEnd)) {
            return ['created' => $created, 'skipped' => [['date' => $from->toDateString(), 'reason' => 'empty_range']]];
        }

        $days = collect($schedule->days_of_week ?? [])->map(fn ($d) => (int) $d)->all();
        $cursor = $rangeStart->copy();

        while ($cursor->lte($rangeEnd)) {
            // Carbon: 0 = Sunday … 6 = Saturday. Design uses 1=Mon…7=Sun — also accept 0–6.
            $dow = (int) $cursor->dayOfWeekIso; // 1–7 Mon–Sun

            if (! in_array($dow, $days, true) && ! in_array((int) $cursor->dayOfWeek, $days, true)) {
                $cursor->addDay();

                continue;
            }

            $exists = ShuttleDeparture::query()
                ->where('schedule_id', $schedule->id)
                ->whereDate('depart_date', $cursor->toDateString())
                ->exists();

            if ($exists) {
                $skipped[] = ['date' => $cursor->toDateString(), 'reason' => 'already_exists'];
                $cursor->addDay();

                continue;
            }

            $seatCapacity = $schedule->seat_capacity
                ?: ($schedule->vehicle?->capacity_seats ?: 7);

            $created->push(ShuttleDeparture::query()->create([
                'schedule_id' => $schedule->id,
                'corridor_id' => $schedule->corridor_id,
                'departure_number' => ShuttleDeparture::nextNumber(),
                'depart_date' => $cursor->toDateString(),
                'depart_time' => $schedule->departure_time,
                'vehicle_id' => $schedule->vehicle_id,
                'driver_id' => $schedule->driver_id,
                'seat_capacity' => $seatCapacity,
                'seats_booked' => 0,
                'status' => ShuttleDeparture::STATUS_OPEN,
                'origin_pool_id' => $schedule->corridor?->origin_location_id,
                'destination_pool_id' => $schedule->corridor?->destination_location_id,
            ]));

            $cursor->addDay();
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
