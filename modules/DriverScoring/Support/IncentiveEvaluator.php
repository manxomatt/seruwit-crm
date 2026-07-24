<?php

namespace Modules\DriverScoring\Support;

use Illuminate\Support\Carbon;
use Modules\DriverScoring\Models\DriverDailyScore;
use Modules\DriverScoring\Models\DriverIncentiveAward;
use Modules\DriverScoring\Models\DriverIncentiveRule;
use Modules\Fleet\Models\Driver;

final class IncentiveEvaluator
{
    /**
     * Evaluate active rules for the given period window and create pending awards.
     *
     * @return list<DriverIncentiveAward>
     */
    public function evaluate(?Carbon $asOf = null): array
    {
        $asOf ??= now();
        $awards = [];

        $rules = DriverIncentiveRule::query()->where('is_active', true)->get();

        foreach ($rules as $rule) {
            [$start, $end] = $this->periodBounds($rule->period, $asOf);

            $rows = DriverDailyScore::query()
                ->selectRaw('driver_id, avg(score) as average_score, count(*) as scored_days')
                ->whereBetween('score_date', [$start->toDateString(), $end->toDateString()])
                ->groupBy('driver_id')
                ->havingRaw('avg(score) >= ?', [$rule->min_score])
                ->havingRaw('count(*) >= ?', [$rule->min_days])
                ->get();

            foreach ($rows as $row) {
                if (! Driver::query()->whereKey($row->driver_id)->exists()) {
                    continue;
                }

                $award = DriverIncentiveAward::query()->firstOrCreate(
                    [
                        'driver_incentive_rule_id' => $rule->id,
                        'driver_id' => $row->driver_id,
                        'period_start' => $start->toDateString(),
                        'period_end' => $end->toDateString(),
                    ],
                    [
                        'average_score' => round((float) $row->average_score, 2),
                        'scored_days' => (int) $row->scored_days,
                        'reward_amount' => $rule->reward_amount,
                        'status' => DriverIncentiveAward::STATUS_PENDING,
                        'awarded_at' => now(),
                    ],
                );

                if ($award->wasRecentlyCreated) {
                    $awards[] = $award;
                }
            }
        }

        return $awards;
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function periodBounds(string $period, Carbon $asOf): array
    {
        if ($period === DriverIncentiveRule::PERIOD_MONTHLY) {
            return [$asOf->copy()->startOfMonth(), $asOf->copy()->endOfMonth()];
        }

        return [$asOf->copy()->startOfWeek(), $asOf->copy()->endOfWeek()];
    }
}
