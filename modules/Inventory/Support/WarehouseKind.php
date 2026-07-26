<?php

namespace Modules\Inventory\Support;

enum WarehouseKind: string
{
    case Warehouse = 'warehouse';
    case Store = 'store';
    case Showroom = 'showroom';

    public static function default(): self
    {
        return self::Warehouse;
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function acceptsPurchaseInbound(): bool
    {
        return $this !== self::Showroom;
    }

    public function acceptsSalesOutbound(): bool
    {
        return $this !== self::Showroom;
    }

    public function labelKey(): string
    {
        return 'inventory.warehouse_kinds.'.$this->value;
    }
}
