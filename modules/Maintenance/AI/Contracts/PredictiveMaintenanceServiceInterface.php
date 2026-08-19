<?php

namespace Modules\Maintenance\AI\Contracts;

use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\AI\DTO\PredictiveMaintenanceResult;

interface PredictiveMaintenanceServiceInterface
{
    /**
     * Analyze fleet-wide telemetry, run rates, service thresholds, and anomalies.
     */
    public function analyzeFleetHealth(int $lookbackDays = 60, int $forecastDays = 30): PredictiveMaintenanceResult;

    /**
     * Perform deep AI diagnostic analysis on a single vehicle.
     *
     * @return array<string, mixed>
     */
    public function analyzeVehicleHealth(Vehicle $vehicle): array;

    /**
     * Create or schedule a WorkOrder directly from an AI recommendation action payload.
     *
     * @param  array<string, mixed>  $actionPayload
     * @return array{
     *     success: bool,
     *     message: string,
     *     work_order_id?: int|null
     * }
     */
    public function createWorkOrderFromRecommendation(array $actionPayload): array;
}
