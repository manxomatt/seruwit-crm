<?php

namespace Modules\Inventory\Support;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;

class StockMovementRecorder
{
    public static function record(array $data): StockMovement
    {
        return DB::transaction(function () use ($data) {
            $movement = StockMovement::create($data);

            self::updateStockLevel(
                $data['product_id'],
                $data['warehouse_id'],
                $data['type'],
                $data['quantity']
            );

            return $movement;
        });
    }

    private static function updateStockLevel(int $productId, int $warehouseId, string $type, string|int|float $quantity): void
    {
        $level = StockLevel::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $warehouseId],
            ['on_hand' => 0, 'reserved' => 0]
        );

        match ($type) {
            'in' => $level->increment('on_hand', $quantity),
            'out' => $level->decrement('on_hand', $quantity),
            'adjustment' => $level->update(['on_hand' => $quantity]),
            'transfer' => null,
        };
    }
}
