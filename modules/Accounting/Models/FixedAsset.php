<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FixedAsset extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_DISPOSED = 'disposed';

    public const METHOD_STRAIGHT_LINE = 'straight_line';

    protected $fillable = [
        'code',
        'name',
        'category',
        'acquisition_date',
        'acquisition_cost',
        'salvage_value',
        'useful_life_months',
        'method',
        'asset_account_id',
        'accum_depr_account_id',
        'expense_account_id',
        'vehicle_id',
        'status',
        'accumulated_depreciation',
        'last_depreciated_on',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'acquisition_date' => 'date:Y-m-d',
            'acquisition_cost' => 'decimal:2',
            'salvage_value' => 'decimal:2',
            'useful_life_months' => 'integer',
            'asset_account_id' => 'integer',
            'accum_depr_account_id' => 'integer',
            'expense_account_id' => 'integer',
            'vehicle_id' => 'integer',
            'accumulated_depreciation' => 'decimal:2',
            'last_depreciated_on' => 'date:Y-m-d',
        ];
    }

    public function assetAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'asset_account_id');
    }

    public function accumDeprAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'accum_depr_account_id');
    }

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
    }

    public function bookValue(): float
    {
        return round((float) $this->acquisition_cost - (float) $this->accumulated_depreciation, 2);
    }

    public function monthlyDepreciation(): float
    {
        $months = max(1, (int) $this->useful_life_months);
        $depreciable = max(0, (float) $this->acquisition_cost - (float) $this->salvage_value);

        return round($depreciable / $months, 2);
    }

    public function remainingDepreciable(): float
    {
        return round(max(0, (float) $this->acquisition_cost - (float) $this->salvage_value - (float) $this->accumulated_depreciation), 2);
    }
}
