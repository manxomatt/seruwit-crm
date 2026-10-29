<?php

namespace Modules\Fleet\Models;

use Modules\FleetSettlement\Models\VehicleSettlement as BaseVehicleSettlement;

/**
 * Backward compatibility proxy for VehicleSettlement model.
 * The core domain logic now lives in Modules\FleetSettlement\Models\VehicleSettlement.
 */
class VehicleSettlement extends BaseVehicleSettlement
{
    protected $table = 'vehicle_settlements';
}
