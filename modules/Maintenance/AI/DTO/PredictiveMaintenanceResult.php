<?php

namespace Modules\Maintenance\AI\DTO;

use Illuminate\Contracts\Support\Arrayable;

/**
 * @implements Arrayable<string, mixed>
 */
class PredictiveMaintenanceResult implements Arrayable
{
    /**
     * @param  list<array{
     *     vehicle_id: int,
     *     vehicle_name: string,
     *     plate_number: string,
     *     rental_class: string|null,
     *     current_odometer_km: int,
     *     km_per_day_run_rate: float,
     *     next_service_type: string,
     *     target_odometer_km: int|null,
     *     predicted_due_date: string|null,
     *     days_remaining: int|null,
     *     urgency: string,
     *     reason: string,
     *     action_payload: array{
     *         action: string,
     *         vehicle_id: int,
     *         title: string,
     *         category_id?: int|null,
     *         scheduled_date: string,
     *         priority: string,
     *         estimated_hours?: float|null,
     *         odometer_at_service?: int|null
     *     }
     * }>  $serviceForecasts
     * @param  list<array{
     *     id: string,
     *     vehicle_id: int,
     *     vehicle_name: string,
     *     plate_number: string,
     *     anomaly_type: string,
     *     severity: string,
     *     title: string,
     *     description: string,
     *     recommendation: string
     * }>  $anomalies
     * @param  array<int, array{
     *     score: int,
     *     status: string,
     *     issues_count: int,
     *     primary_warning?: string|null
     * }>  $vehicleHealthScores
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public readonly float $fleetHealthScore,
        public readonly string $fleetRiskLevel,
        public readonly string $summary,
        public readonly int $vehiclesAnalyzedCount,
        public readonly int $criticalVehiclesCount,
        public readonly array $serviceForecasts,
        public readonly array $anomalies = [],
        public readonly array $vehicleHealthScores = [],
        public readonly array $rawResponse = [],
        public readonly string $generatedAt = '',
    ) {}

    /**
     * @return array{
     *     fleet_health_score: float,
     *     fleet_risk_level: string,
     *     summary: string,
     *     vehicles_analyzed_count: int,
     *     critical_vehicles_count: int,
     *     service_forecasts: list<array<string, mixed>>,
     *     anomalies: list<array<string, mixed>>,
     *     vehicle_health_scores: array<int, array<string, mixed>>,
     *     raw_response: array<string, mixed>,
     *     generated_at: string
     * }
     */
    public function toArray(): array
    {
        return [
            'fleet_health_score' => $this->fleetHealthScore,
            'fleet_risk_level' => $this->fleetRiskLevel,
            'summary' => $this->summary,
            'vehicles_analyzed_count' => $this->vehiclesAnalyzedCount,
            'critical_vehicles_count' => $this->criticalVehiclesCount,
            'service_forecasts' => $this->serviceForecasts,
            'anomalies' => $this->anomalies,
            'vehicle_health_scores' => $this->vehicleHealthScores,
            'raw_response' => $this->rawResponse,
            'generated_at' => $this->generatedAt !== '' ? $this->generatedAt : now()->toIso8601String(),
        ];
    }
}
