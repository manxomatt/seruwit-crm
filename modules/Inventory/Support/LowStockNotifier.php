<?php

namespace Modules\Inventory\Support;

use App\Models\Notification;
use App\Models\User;
use Modules\Inventory\Models\StockLevel;

class LowStockNotifier
{
    public static function checkAndNotify(): void
    {
        $lowStockLevels = StockLevel::query()
            ->with(['product', 'warehouse'])
            ->whereHas('product')
            ->get()
            ->filter(fn (StockLevel $level) => $level->isLowStock());

        foreach ($lowStockLevels as $level) {
            self::notifyInventoryStaff($level);
        }
    }

    private static function notifyInventoryStaff(StockLevel $level): void
    {
        $product = $level->product;
        $warehouse = $level->warehouse;

        $recipients = User::query()
            ->whereHas('roles.permissions', function ($query) {
                $query->where('module', 'inventory')
                    ->where('action', 'view');
            })
            ->pluck('id')
            ->all();

        if (empty($recipients)) {
            return;
        }

        $availableQty = $level->getAvailableAttribute();

        foreach ($recipients as $userId) {
            Notification::query()->create([
                'user_id' => $userId,
                'title' => "Low Stock: {$product->name}",
                'message' => "Available qty in {$warehouse->name}: {$availableQty} (threshold: {$product->reorder_threshold})",
                'type' => 'inventory_low_stock',
                'data' => [
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'available_qty' => $availableQty,
                    'threshold' => $product->reorder_threshold,
                ],
            ]);
        }
    }
}
