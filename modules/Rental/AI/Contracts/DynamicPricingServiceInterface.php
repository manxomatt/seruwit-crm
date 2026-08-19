<?php

namespace Modules\Rental\AI\Contracts;

use Modules\Rental\AI\DTO\DynamicPricingRecommendationResult;

interface DynamicPricingServiceInterface
{
    /**
     * Generate dynamic pricing and fleet utilization recommendations using AI.
     */
    public function generatePricingRecommendations(int $lookbackDays = 30, int $forecastDays = 30): DynamicPricingRecommendationResult;

    /**
     * Apply a pricing recommendation action directly to the rental rates database.
     *
     * @param  array<string, mixed>  $actionPayload
     * @return array{success: bool, message: string, rate_id?: int|null}
     */
    public function applyRecommendation(array $actionPayload): array;
}
