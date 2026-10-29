<?php

namespace Modules\Fleet\Http\Controllers;

use Modules\FleetSettlement\Http\Controllers\VehicleSettlementController as BaseVehicleSettlementController;

/**
 * Backward compatibility proxy for VehicleSettlementController.
 * The core domain logic now lives in Modules\FleetSettlement\Http\Controllers\VehicleSettlementController.
 */
class VehicleSettlementController extends BaseVehicleSettlementController {}
