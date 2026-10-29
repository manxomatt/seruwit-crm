<?php

namespace Modules\Fleet\Http\Controllers;

use Modules\FleetCompliance\Http\Controllers\FleetComplianceController as BaseFleetComplianceController;

/**
 * Backward compatibility proxy for Modules\FleetCompliance\Http\Controllers\FleetComplianceController.
 */
class FleetComplianceController extends BaseFleetComplianceController
{
    // Inherits index, renew, and syncDocumentRecord
}
