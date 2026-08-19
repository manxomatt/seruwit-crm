<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Rental\AI\Contracts\DynamicPricingServiceInterface;
use Modules\Rental\Support\RentalGeneralSettings;
use Throwable;

class RentalAiPricingController extends Controller
{
    public function __construct(
        protected readonly DynamicPricingServiceInterface $pricingService,
    ) {}

    /**
     * Analyze fleet utilization metrics and generate dynamic pricing recommendations.
     */
    public function analyze(Request $request): JsonResponse
    {
        if (! \App\Support\CentralAiSettings::isEnabled() || ! RentalGeneralSettings::all()['ai_pricing_optimizer_enabled']) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur AI Smart Dynamic Pricing dinonaktifkan oleh administrator central atau pengaturan rental.',
            ], 403);
        }

        $request->validate([
            'lookback_days' => ['nullable', 'integer', 'min:7', 'max:180'],
            'forecast_days' => ['nullable', 'integer', 'min:7', 'max:180'],
        ]);

        $lookbackDays = (int) $request->input('lookback_days', 30);
        $forecastDays = (int) $request->input('forecast_days', 30);

        try {
            $result = $this->pricingService->generatePricingRecommendations($lookbackDays, $forecastDays);

            return response()->json([
                'success' => true,
                'result' => $result->toArray(),
                'message' => __('rental.ai.pricing_analysis_success'),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Apply a specific dynamic pricing recommendation directly to the rate structure.
     */
    public function apply(Request $request): JsonResponse
    {
        if (! \App\Support\CentralAiSettings::isEnabled() || ! RentalGeneralSettings::all()['ai_pricing_optimizer_enabled']) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur AI Smart Dynamic Pricing dinonaktifkan oleh administrator central atau pengaturan rental.',
            ], 403);
        }

        $request->validate([
            'action_payload' => ['required', 'array'],
            'action_payload.action' => ['required', 'string'],
            'action_payload.new_rate_per_period' => ['required', 'numeric', 'min:1'],
        ]);

        try {
            $response = $this->pricingService->applyRecommendation($request->input('action_payload'));

            return response()->json([
                'success' => true,
                'message' => $response['message'],
                'rate_id' => $response['rate_id'] ?? null,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
