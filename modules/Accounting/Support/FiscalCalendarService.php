<?php

namespace Modules\Accounting\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;

class FiscalCalendarService
{
    /**
     * Ensure a calendar year and its 12 monthly periods exist.
     */
    public function ensureYear(int $year): FiscalYear
    {
        return DB::transaction(function () use ($year): FiscalYear {
            $fiscalYear = FiscalYear::query()->firstOrCreate(
                ['year' => $year],
                [
                    'starts_on' => sprintf('%d-01-01', $year),
                    'ends_on' => sprintf('%d-12-31', $year),
                    'is_closed' => false,
                ],
            );

            if ($fiscalYear->periods()->count() >= 12) {
                return $fiscalYear->load('periods');
            }

            $months = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
            ];

            foreach ($months as $index => $label) {
                $startsOn = sprintf('%d-%02d-01', $year, $index);
                $endsOn = date('Y-m-t', strtotime($startsOn));

                FiscalPeriod::query()->firstOrCreate(
                    [
                        'fiscal_year_id' => $fiscalYear->id,
                        'period_index' => $index,
                    ],
                    [
                        'name' => "{$label} {$year}",
                        'starts_on' => $startsOn,
                        'ends_on' => $endsOn,
                        'status' => FiscalPeriod::STATUS_OPEN,
                    ],
                );
            }

            return $fiscalYear->load('periods');
        });
    }

    public function periodForDate(CarbonInterface|string $date): FiscalPeriod
    {
        $carbon = $date instanceof CarbonInterface ? $date : \Carbon\Carbon::parse($date);

        $this->ensureYear((int) $carbon->format('Y'));

        $period = FiscalPeriod::query()
            ->whereDate('starts_on', '<=', $carbon->toDateString())
            ->whereDate('ends_on', '>=', $carbon->toDateString())
            ->first();

        if ($period === null) {
            throw ValidationException::withMessages([
                'entry_date' => __('accounting.validation.period_not_found'),
            ]);
        }

        return $period;
    }

    public function reopen(FiscalPeriod $period): FiscalPeriod
    {
        $period->loadMissing('fiscalYear');

        if ($period->fiscalYear?->is_closed) {
            throw ValidationException::withMessages([
                'period' => __('accounting.validation.year_closed'),
            ]);
        }

        $period->update(['status' => FiscalPeriod::STATUS_OPEN]);

        return $period->fresh();
    }

    public function softClose(FiscalPeriod $period): FiscalPeriod
    {
        $period->loadMissing('fiscalYear');

        if ($period->fiscalYear?->is_closed) {
            throw ValidationException::withMessages([
                'period' => __('accounting.validation.year_closed'),
            ]);
        }

        if ($period->status === FiscalPeriod::STATUS_HARD_CLOSE) {
            throw ValidationException::withMessages([
                'period' => __('accounting.validation.period_hard_closed'),
            ]);
        }

        $period->update(['status' => FiscalPeriod::STATUS_SOFT_CLOSE]);

        return $period->fresh();
    }

    public function hardClose(FiscalPeriod $period): FiscalPeriod
    {
        $period->loadMissing('fiscalYear');

        if ($period->fiscalYear?->is_closed) {
            throw ValidationException::withMessages([
                'period' => __('accounting.validation.year_closed'),
            ]);
        }

        if ($period->isHardClosed()) {
            return $period;
        }

        $tb = app(TrialBalanceService::class)->forPeriod($period);
        if (! $tb['is_balanced']) {
            throw ValidationException::withMessages([
                'period' => __('accounting.validation.period_tb_unbalanced'),
            ]);
        }

        $period->update(['status' => FiscalPeriod::STATUS_HARD_CLOSE]);

        return $period->fresh();
    }
}
