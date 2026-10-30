<?php

namespace Modules\Rental\Models;

use Modules\RentalAi\Models\RentalAiInspection as BaseRentalAiInspection;

/**
 * Backward compatibility alias for RentalAiInspection.
 * Core model implementation has moved to Modules\RentalAi\Models\RentalAiInspection.
 */
class RentalAiInspection extends BaseRentalAiInspection
{
    protected $table = 'rental_ai_inspections';
}
