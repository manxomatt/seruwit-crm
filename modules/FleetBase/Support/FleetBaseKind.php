<?php

namespace Modules\FleetBase\Support;

enum FleetBaseKind: string
{
    case Depot = 'depot';
    case Yard = 'yard';
    case Satellite = 'satellite';
    case WorkshopBase = 'workshop_base';

    public static function default(): self
    {
        return self::Depot;
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function labelKey(): string
    {
        return 'fleet_base.kinds.'.$this->value;
    }
}
