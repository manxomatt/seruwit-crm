<?php

namespace Modules\Rental\Support;

use Modules\Rental\Models\Rental;

/**
 * Post-confirm lifecycle steps (6–10) shown on the rental Show page.
 *
 * 6 Payments → 7 Pickup → 8 Contract → 9 Return → 10 Changes
 */
class RentalPostConfirmProgress
{
    public const STEP_PAYMENTS = 6;

    public const STEP_PICKUP = 7;

    public const STEP_CONTRACT = 8;

    public const STEP_RETURN = 9;

    public const STEP_CHANGES = 10;

    /** @var list<int> */
    public const STEPS = [
        self::STEP_PAYMENTS,
        self::STEP_PICKUP,
        self::STEP_CONTRACT,
        self::STEP_RETURN,
        self::STEP_CHANGES,
    ];

    /**
     * @return array{
     *     visible: bool,
     *     current_step: int|null,
     *     steps: list<array{id: int, done: bool, available: bool}>
     * }
     */
    public function for(Rental $rental): array
    {
        if (! $this->isVisible($rental)) {
            return [
                'visible' => false,
                'current_step' => null,
                'steps' => [],
            ];
        }

        $paymentsDone = $this->isPaymentsDone($rental);
        $pickupDone = $this->isPickupDone($rental);
        $returnDone = $this->isReturnDone($rental);

        $done = [
            self::STEP_PAYMENTS => $paymentsDone,
            self::STEP_PICKUP => $pickupDone,
            self::STEP_CONTRACT => $pickupDone,
            self::STEP_RETURN => $returnDone,
            self::STEP_CHANGES => $returnDone,
        ];

        $available = [
            self::STEP_PAYMENTS => true,
            self::STEP_PICKUP => $paymentsDone || $pickupDone,
            self::STEP_CONTRACT => true,
            self::STEP_RETURN => $pickupDone,
            self::STEP_CHANGES => $pickupDone,
        ];

        $steps = [];
        foreach (self::STEPS as $id) {
            $steps[] = [
                'id' => $id,
                'done' => $done[$id],
                'available' => $available[$id],
            ];
        }

        return [
            'visible' => true,
            'current_step' => $this->resolveCurrentStep($done, $rental),
            'steps' => $steps,
        ];
    }

    public function isVisible(Rental $rental): bool
    {
        return in_array($rental->status, [
            Rental::STATUS_CONFIRMED,
            Rental::STATUS_ACTIVE,
            Rental::STATUS_RETURNED,
            Rental::STATUS_COMPLETED,
        ], true);
    }

    public function isPaymentsDone(Rental $rental): bool
    {
        if ((float) $rental->deposit_amount <= 0) {
            return true;
        }

        if ($rental->deposit_received_at !== null) {
            return true;
        }

        return $rental->deposit_status === Rental::DEPOSIT_SETTLED;
    }

    public function isPickupDone(Rental $rental): bool
    {
        if ($rental->checked_out_at !== null) {
            return true;
        }

        return in_array($rental->status, [
            Rental::STATUS_ACTIVE,
            Rental::STATUS_RETURNED,
            Rental::STATUS_COMPLETED,
        ], true);
    }

    public function isReturnDone(Rental $rental): bool
    {
        if ($rental->returned_at !== null) {
            return true;
        }

        return in_array($rental->status, [
            Rental::STATUS_RETURNED,
            Rental::STATUS_COMPLETED,
        ], true);
    }

    /**
     * @param  array<int, bool>  $done
     */
    private function resolveCurrentStep(array $done, Rental $rental): int
    {
        if ($rental->status === Rental::STATUS_ACTIVE) {
            return self::STEP_CHANGES;
        }

        if ($rental->status === Rental::STATUS_RETURNED) {
            return self::STEP_RETURN;
        }

        if ($rental->status === Rental::STATUS_COMPLETED) {
            return self::STEP_CHANGES;
        }

        foreach (self::STEPS as $id) {
            if (! $done[$id]) {
                return $id;
            }
        }

        return self::STEP_CHANGES;
    }
}
