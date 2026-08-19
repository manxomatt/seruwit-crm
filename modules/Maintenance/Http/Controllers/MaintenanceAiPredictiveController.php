<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\AI\Contracts\PredictiveMaintenanceServiceInterface;
use Modules\Maintenance\Support\MaintenanceSettings;
use Throwable;

class MaintenanceAiPredictiveController extends Controller
{
    public function __construct(
        protected readonly PredictiveMaintenanceServiceInterface $predictiveService,
    ) {}

    /**
     * Analyze fleet telemetry, run rates, service thresholds, and anomalies.
     */
    public function analyze(Request $request): JsonResponse
    {
        if (! \App\Support\CentralAiSettings::isEnabled() || ! MaintenanceSettings::aiPredictiveMaintenanceEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur AI Predictive Fleet Maintenance dinonaktifkan oleh administrator central atau pengaturan maintenance.',
            ], 403);
        }

        $request->validate([
            'lookback_days' => ['nullable', 'integer', 'min:7', 'max:180'],
            'forecast_days' => ['nullable', 'integer', 'min:7', 'max:180'],
        ]);

        $lookbackDays = (int) $request->input('lookback_days', 60);
        $forecastDays = (int) $request->input('forecast_days', 30);

        try {
            $result = $this->predictiveService->analyzeFleetHealth($lookbackDays, $forecastDays);

            return response()->json([
                'success' => true,
                'result' => $result->toArray(),
                'message' => __('maintenance.ai.analysis_success'),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Deep diagnostic analysis on a specific vehicle.
     */
    public function diagnoseVehicle(Request $request, Vehicle $vehicle): JsonResponse
    {
        if (! \App\Support\CentralAiSettings::isEnabled() || ! MaintenanceSettings::aiPredictiveMaintenanceEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur AI Predictive Fleet Maintenance dinonaktifkan oleh administrator central atau pengaturan maintenance.',
            ], 403);
        }

        try {
            $diagnosis = $this->predictiveService->analyzeVehicleHealth($vehicle);

            return response()->json([
                'success' => true,
                'result' => $diagnosis,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * 1-Click creation of Work Order from predictive maintenance recommendation.
     */
    public function createWorkOrder(Request $request): JsonResponse
    {
        if (! \App\Support\CentralAiSettings::isEnabled() || ! MaintenanceSettings::aiPredictiveMaintenanceEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur AI Predictive Fleet Maintenance dinonaktifkan oleh administrator central atau pengaturan maintenance.',
            ], 403);
        }

        $request->validate([
            'action_payload' => ['required', 'array'],
            'action_payload.vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'action_payload.title' => ['required', 'string', 'max:255'],
            'action_payload.scheduled_date' => ['required', 'date'],
            'action_payload.priority' => ['nullable', 'string'],
        ]);

        try {
            $response = $this->predictiveService->createWorkOrderFromRecommendation($request->input('action_payload'));

            return response()->json([
                'success' => $response['success'],
                'message' => $response['message'],
                'work_order_id' => $response['work_order_id'] ?? null,
            ], $response['success'] ? 200 : 422);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
