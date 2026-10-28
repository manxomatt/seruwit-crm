<?php

namespace Modules\Fleet\Support;

if (! class_exists(FleetBaseKind::class, false)) {
    class_alias(\Modules\FleetBase\Support\FleetBaseKind::class, FleetBaseKind::class);
}
