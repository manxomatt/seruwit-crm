<?php

namespace Modules\Rental\AI\DTO;

use Illuminate\Contracts\Support\Arrayable;

/**
 * @implements Arrayable<string, mixed>
 */
class DynamicPricingRecommendationResult implements Arrayable
{
    /**
     * @param  array{
     *     total_vehicles: int,
     *     active_fleet_count: int,
     *     booked_vehicles_count: int,
     *     overall_utilization_percent: float,
     *     weekday_utilization_percent: float,
     *     weekend_utilization_percent: float,
     *     class_breakdown: array<string, array{
     *         label: string,
     *         total_units: int,
     *         utilization_percent: float,
     *         avg_daily_rate: float
     *     }>
     * }  $metrics
     * @param  list<array{
     *     id: string,
     *     type: string,
     *     target_type: string,
     *     target_identifier: string,
     *     target_label: string,
     *     current_rate: float,
     *     suggested_rate: float,
     *     adjustment_percent: float,
     *     confidence: float,
     *     title: string,
     *     reason: string,
     *     action_payload: array{
     *         action: string,
     *         rental_rate_id?: int|null,
     *         rental_class?: string|null,
     *         vehicle_id?: int|null,
     *         new_rate_per_period: float,
     *         tier_type?: string|null,
     *         discount_percent?: float|null,
     *         min_threshold?: int|null
     *     }
     * }>  $recommendations
     * @param  list<array{
     *     vehicle_id: int,
     *     name: string,
     *     plate_number: string,
     *     rental_class: string|null,
     *     days_idle: int,
     *     suggested_promo_rate: float
     * }>  $idleVehicles
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public readonly float $fleetUtilizationPercent,
        public readonly float $estimatedRevenueUpliftPercent,
        public readonly string $summary,
        public readonly array $metrics,
        public readonly array $recommendations,
        public readonly array $idleVehicles = [],
        public readonly array $rawResponse = [],
        public readonly string $generatedAt = '',
    ) {}

    /**
     * @return array{
     *     fleet_utilization_percent: float,
     *     estimated_revenue_uplift_percent: float,
     *     summary: string,
     *     metrics: array{
     *         total_vehicles: int,
     *         active_fleet_count: int,
     *         booked_vehicles_count: int,
     *         overall_utilization_percent: float,
     *         weekday_utilization_percent: float,
     *         weekend_utilization_percent: float,
     *         class_breakdown: array<string, array{
     *             label: string,
     *             total_units: int,
     *             utilization_percent: float,
     *             avg_daily_rate: float
     *         }>
     *     },
     *     recommendations: list<array{
     *         id: string,
     *         type: string,
     *         target_type: string,
     *         target_identifier: string,
     *         target_label: string,
     *         current_rate: float,
     *         suggested_rate: float,
     *         adjustment_percent: float,
     *         confidence: float,
     *         title: string,
     *         reason: string,
     *         action_payload: array<string, mixed>
     *     }>,
     *     idle_vehicles: list<array{
     *         vehicle_id: int,
     *         name: string,
     *         plate_number: string,
     *         rental_class: string|null,
     *         days_idle: int,
     *         suggested_promo_rate: float
     *     }>,
     *     raw_response: array<string, mixed>,
     *     generated_at: string
     * }
     */
    public function toArray(): array
    {
        return [
            'fleet_utilization_percent' => $this->fleetUtilizationPercent,
            'estimated_revenue_uplift_percent' => $this->estimatedRevenueUpliftPercent,
            'summary' => $this->summary,
            'metrics' => $this->metrics,
            'recommendations' => $this->recommendations,
            'idle_vehicles' => $this->idleVehicles,
            'raw_response' => $this->rawResponse,
            'generated_at' => $this->generatedAt !== '' ? $this->generatedAt : now()->toIso8601String(),
        ];
    }
}
