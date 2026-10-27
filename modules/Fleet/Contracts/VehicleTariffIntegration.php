<?php

namespace Modules\Fleet\Contracts;

use Modules\Fleet\Models\Vehicle;

/**
 * Downward integration contract allowing Vertical modules (such as Rental)
 * to expose tariff coverage checks and initial rate creation when onboarding
 * a vehicle in Fleet, keeping Fleet decoupled from Vertical implementations.
 */
interface VehicleTariffIntegration
{
    /**
     * @return array{
     *     has_global_rate: bool,
     *     covered_rental_classes: list<string>,
     *     covered_vehicle_types: list<string>,
     *     sample_rates: array<string, array{name: string, rate_per_period: float, period_type: string}>
     * }
     */
    public function coverageSummary(): array;

    /**
     * Determine whether the given rental class or vehicle type already has an active tariff.
     */
    public function checkCovered(?string $rentalClass, ?string $vehicleType): bool;

    /**
     * Create an initial tariff rate record for a newly created vehicle.
     *
     * @param  array<string, mixed>  $rateInput
     */
    public function createInitialRateForVehicle(Vehicle $vehicle, array $rateInput): void;
}
