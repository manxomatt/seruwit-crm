<?php

namespace Modules\Shuttle\Support;

use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttlePassenger;

/**
 * Assigns simple seat labels (A1, A2, … B1, …) to passengers on confirm.
 */
final class SeatLabelAssigner
{
    public function assign(ShuttleBooking $booking, int $seatOffset = 0): void
    {
        $booking->loadMissing('passengers');

        $index = $seatOffset;
        foreach ($booking->passengers as $passenger) {
            /** @var ShuttlePassenger $passenger */
            if (filled($passenger->seat_label)) {
                $index++;

                continue;
            }

            $passenger->update(['seat_label' => $this->labelFor($index)]);
            $index++;
        }
    }

    public function labelFor(int $zeroBasedIndex): string
    {
        $row = intdiv($zeroBasedIndex, 4);
        $seat = ($zeroBasedIndex % 4) + 1;
        $letter = chr(ord('A') + $row);

        return $letter.$seat;
    }
}
