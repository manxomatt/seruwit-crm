<?php

namespace Modules\Inventory\Support;

enum StockPickingStrategy: string
{
    case Fefo = 'fefo';
    case Fifo = 'fifo';

    public static function default(): self
    {
        return self::Fefo;
    }
}
