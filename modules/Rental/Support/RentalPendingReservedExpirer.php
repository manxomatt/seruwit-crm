<?php

namespace Modules\Rental\Support;

use Modules\Rental\Models\Rental;

/**
 * Drops expired Pending Reserved holds to Pending (vehicle no longer reserved).
 */
class RentalPendingReservedExpirer
{
    public function expire(): int
    {
        $expired = Rental::query()
            ->where('status', Rental::STATUS_PENDING_RESERVED)
            ->whereNotNull('reserved_until')
            ->where('reserved_until', '<', now())
            ->get();

        foreach ($expired as $rental) {
            $rental->update([
                'status' => Rental::STATUS_PENDING,
                'reserved_until' => null,
            ]);
        }

        return $expired->count();
    }
}
