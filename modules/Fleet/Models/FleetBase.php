<?php

namespace Modules\Fleet\Models;

use Modules\FleetBase\Models\FleetBase as BaseFleetBase;

/**
 * Backward-compatibility wrapper for {@see BaseFleetBase}.
 *
 * @deprecated Use {@see \Modules\FleetBase\Models\FleetBase} directly.
 */
class FleetBase extends BaseFleetBase
{
    // Inherits all behavior, relations, scopes, and properties from BaseFleetBase
}
