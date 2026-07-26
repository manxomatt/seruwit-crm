<?php

namespace Modules\Inventory\Support;

use Illuminate\Database\Eloquent\Builder;
use Modules\Inventory\Models\StockLevel;

/**
 * Sellable stock = internal (STOCK) bins that are not expired.
 * INPUT / OUTPUT / QC holds and expired lots are excluded from reservation & FEFO allocate.
 */
class SellableStock
{
    /**
     * @param  Builder<StockLevel>  $query
     * @return Builder<StockLevel>
     */
    public static function constrain(Builder $query, ?string $asOfDate = null): Builder
    {
        $today = $asOfDate ?? now()->toDateString();

        return $query
            ->where(function (Builder $locationQuery): void {
                $locationQuery
                    ->whereNull('location_id')
                    ->orWhereHas('location', fn (Builder $q) => $q->where('type', 'internal'));
            })
            ->where(function (Builder $expiryQuery) use ($today): void {
                $expiryQuery
                    ->whereNull('expiry_date')
                    ->orWhereDate('expiry_date', '>=', $today);
            });
    }

    /**
     * @return Builder<StockLevel>
     */
    public static function query(): Builder
    {
        return self::constrain(StockLevel::query());
    }
}
