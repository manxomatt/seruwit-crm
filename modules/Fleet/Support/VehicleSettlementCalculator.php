<?php

namespace Modules\Fleet\Support;

use Modules\FleetSettlement\Support\VehicleSettlementCalculator as BaseVehicleSettlementCalculator;

/**
 * Backward compatibility proxy for VehicleSettlementCalculator.
 * The core domain logic now lives in Modules\FleetSettlement\Support\VehicleSettlementCalculator.
 */
class VehicleSettlementCalculator extends BaseVehicleSettlementCalculator {}
