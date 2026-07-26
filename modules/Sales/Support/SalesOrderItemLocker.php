<?php

namespace Modules\Sales\Support;

use Modules\Sales\Models\SalesOrderItem;

class SalesOrderItemLocker
{
    /**
     * @param  list<int|string>  $itemIds
     * @return \Illuminate\Support\Collection<int, SalesOrderItem>
     */
    public static function lockItems(array $itemIds)
    {
        $ids = collect($itemIds)->filter()->map(fn ($id) => (int) $id)->unique()->sort()->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        return SalesOrderItem::query()
            ->whereIn('id', $ids)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }
}
