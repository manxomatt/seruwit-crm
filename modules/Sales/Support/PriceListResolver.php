<?php

namespace Modules\Sales\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Product\Models\Product;
use Modules\Sales\Models\PriceList;
use Modules\Sales\Models\PriceListItem;

class PriceListResolver
{
    public static function tablesReady(): bool
    {
        return Schema::hasTable('price_lists') && Schema::hasTable('price_list_items');
    }

    public static function resolveUnitPrice(?int $priceListId, int $productId): ?float
    {
        if (! self::tablesReady() || ! $priceListId || $productId <= 0) {
            return null;
        }

        $price = PriceListItem::query()
            ->where('price_list_id', $priceListId)
            ->where('product_id', $productId)
            ->whereHas('priceList', fn ($q) => $q->where('is_active', true))
            ->value('unit_price');

        return $price !== null ? round((float) $price, 2) : null;
    }

    public static function fallbackProductPrice(Product|int $product): float
    {
        $model = $product instanceof Product
            ? $product
            : Product::query()->find($product);

        if (! $model) {
            return 0.0;
        }

        if ($model->price !== null && (float) $model->price > 0) {
            return round((float) $model->price, 2);
        }

        return round((float) ($model->cost ?? 0), 2);
    }

    /**
     * @return array<int, array<int, float>> price_list_id => [product_id => unit_price]
     */
    public static function activePriceMaps(): array
    {
        if (! self::tablesReady()) {
            return [];
        }

        $maps = [];

        PriceList::query()
            ->where('is_active', true)
            ->with(['items:id,price_list_id,product_id,unit_price'])
            ->get(['id'])
            ->each(function (PriceList $list) use (&$maps): void {
                $maps[$list->id] = $list->items
                    ->mapWithKeys(fn (PriceListItem $item): array => [
                        (int) $item->product_id => round((float) $item->unit_price, 2),
                    ])
                    ->all();
            });

        return $maps;
    }
}
