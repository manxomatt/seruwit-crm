<?php

namespace Modules\Inventory\Support;

use App\Models\User;
use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
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

        if ($product === null || $warehouse === null) {
            return;
        }

        $recipients = NotificationRecipients::forPermission('inventory', 'view');

        if ($recipients->isEmpty()) {
            return;
        }

        $availableQty = $level->getAvailableAttribute();
        $threshold = $product->reorder_threshold ?? 10;

        foreach ($recipients as $user) {
            /** @var User $user */
            $user->notify(new GenericNotification(
                title: "Low Stock: {$product->name}",
                body: "Available qty in {$warehouse->name}: {$availableQty} (threshold: {$threshold})",
                url: null,
                icon: 'archive',
                type: 'inventory_low_stock',
            ));
        }
    }
}
