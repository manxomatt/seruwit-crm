<?php

namespace Modules\Maintenance\AI\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\AI\Contracts\PredictiveMaintenanceServiceInterface;
use Modules\Maintenance\AI\DTO\PredictiveMaintenanceResult;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDamage;
use Throwable;

class GeminiPredictiveMaintenanceService implements PredictiveMaintenanceServiceInterface
{
    protected string $apiKey;

    protected string $model;

    public function __construct()
    {
        $this->apiKey = (string) (config('services.gemini.api_key') ?? env('GEMINI_API_KEY', ''));
        $this->model = (string) (config('services.gemini.model') ?? 'gemini-1.5-flash');
    }

    public function analyzeFleetHealth(int $lookbackDays = 60, int $forecastDays = 30): PredictiveMaintenanceResult
    {
        $telemetry = $this->aggregateFleetTelemetry($lookbackDays, $forecastDays);

        if (empty($this->apiKey)) {
            Log::info('[GeminiPredictiveMaintenance] No Gemini API key configured. Using algorithmic predictive engine.');

            return $this->generateAlgorithmicPrediction($telemetry);
        }

        try {
            $prompt = $this->buildFleetAnalysisPrompt($telemetry);

            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

            $response = Http::timeout(25)->post($endpoint, [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.2,
                ],
            ]);

            if (! $response->successful()) {
                Log::warning('[GeminiPredictiveMaintenance] API returned error: '.$response->body());

                return $this->generateAlgorithmicPrediction($telemetry);
            }

            $body = $response->json();
            $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $json = json_decode($text, true);

            if (! is_array($json) || ! isset($json['fleet_health_score'])) {
                Log::warning('[GeminiPredictiveMaintenance] Invalid JSON returned: '.$text);

                return $this->generateAlgorithmicPrediction($telemetry);
            }

            return new PredictiveMaintenanceResult(
                fleetHealthScore: (float) ($json['fleet_health_score'] ?? 85.0),
                fleetRiskLevel: (string) ($json['fleet_risk_level'] ?? 'low'),
                summary: (string) ($json['summary'] ?? 'Analisis kesehatan armada selesai.'),
                vehiclesAnalyzedCount: count($telemetry['vehicles']),
                criticalVehiclesCount: (int) ($json['critical_vehicles_count'] ?? 0),
                serviceForecasts: (array) ($json['service_forecasts'] ?? []),
                anomalies: (array) ($json['anomalies'] ?? []),
                vehicleHealthScores: (array) ($json['vehicle_health_scores'] ?? []),
                rawResponse: $json,
                generatedAt: now()->toIso8601String(),
            );
        } catch (Throwable $e) {
            Log::error('[GeminiPredictiveMaintenance] Exception during AI analysis: '.$e->getMessage());

            return $this->generateAlgorithmicPrediction($telemetry);
        }
    }

    public function analyzeVehicleHealth(Vehicle $vehicle): array
    {
        $lookbackSince = Carbon::now()->subDays(60);

        // Odometer velocity
        $startOdo = $vehicle->odometer_km;
        $totalDistance = 0;
        $activeDays = 0;

        if (class_exists(Rental::class)) {
            $rentals = Rental::query()
                ->where('vehicle_id', $vehicle->id)
                ->where('status', Rental::STATUS_RETURNED)
                ->where('created_at', '>=', $lookbackSince)
                ->get();

            foreach ($rentals as $rental) {
                if ($rental->end_odometer && $rental->start_odometer && $rental->end_odometer > $rental->start_odometer) {
                    $totalDistance += ($rental->end_odometer - $rental->start_odometer);
                    $days = max(1, Carbon::parse($rental->start_date)->diffInDays(Carbon::parse($rental->end_date)) ?: 1);
                    $activeDays += $days;
                }
            }
        }

        $kmPerDay = $activeDays > 0 ? round($totalDistance / $activeDays, 1) : 45.0;

        // Pending schedules
        $schedules = MaintenanceSchedule::query()
            ->where('vehicle_id', $vehicle->id)
            ->where('is_active', true)
            ->with('category')
            ->get();

        $scheduleInsights = [];
        foreach ($schedules as $s) {
            if ($s->interval_type === MaintenanceSchedule::INTERVAL_MILEAGE && $s->next_service_odometer) {
                $kmRemaining = max(0, $s->next_service_odometer - $vehicle->odometer_km);
                $daysToDue = $kmPerDay > 0 ? (int) round($kmRemaining / $kmPerDay) : 30;
                $scheduleInsights[] = [
                    'schedule_id' => $s->id,
                    'name' => $s->name,
                    'category' => $s->category?->name,
                    'km_remaining' => $kmRemaining,
                    'days_to_due' => $daysToDue,
                    'is_overdue' => $vehicle->odometer_km >= $s->next_service_odometer,
                ];
            }
        }

        // Damages
        $damagesCount = 0;
        if (class_exists(RentalDamage::class)) {
            $damagesCount = RentalDamage::query()
                ->whereHas('rental', fn ($q) => $q->where('vehicle_id', $vehicle->id))
                ->where('created_at', '>=', $lookbackSince)
                ->count();
        }

        $score = 100;
        if ($damagesCount > 2) {
            $score -= 15;
        }
        foreach ($scheduleInsights as $si) {
            if ($si['is_overdue']) {
                $score -= 25;
            } elseif ($si['days_to_due'] <= 7) {
                $score -= 10;
            }
        }
        $score = max(20, min(100, $score));

        return [
            'vehicle_id' => $vehicle->id,
            'name' => $vehicle->name,
            'plate_number' => $vehicle->plate_number,
            'health_score' => $score,
            'status' => $score >= 80 ? 'good' : ($score >= 60 ? 'warning' : 'critical'),
            'km_per_day_run_rate' => $kmPerDay,
            'current_odometer_km' => $vehicle->odometer_km,
            'schedule_insights' => $scheduleInsights,
            'damages_last_60_days' => $damagesCount,
        ];
    }

    public function createWorkOrderFromRecommendation(array $actionPayload): array
    {
        $vehicleId = (int) ($actionPayload['vehicle_id'] ?? 0);
        $vehicle = Vehicle::query()->find($vehicleId);

        if (! $vehicle) {
            return [
                'success' => false,
                'message' => 'Kendaraan tidak ditemukan.',
            ];
        }

        $title = (string) ($actionPayload['title'] ?? "Servis Prediktif AI - {$vehicle->name}");
        $scheduledDate = (string) ($actionPayload['scheduled_date'] ?? now()->addDays(2)->toDateString());
        $priority = in_array($actionPayload['priority'] ?? '', [WorkOrder::PRIORITY_LOW, WorkOrder::PRIORITY_NORMAL, WorkOrder::PRIORITY_HIGH, WorkOrder::PRIORITY_URGENT], true)
            ? $actionPayload['priority']
            : WorkOrder::PRIORITY_HIGH;

        $categoryId = isset($actionPayload['category_id']) && $actionPayload['category_id']
            ? (int) $actionPayload['category_id']
            : MaintenanceCategory::query()->orderBy('sort_order')->value('id');

        $userId = Auth::id() ?? User::query()->value('id');

        $workOrder = DB::transaction(function () use ($vehicle, $title, $scheduledDate, $priority, $categoryId, $userId, $actionPayload) {
            return WorkOrder::create([
                'vehicle_id' => $vehicle->id,
                'category_id' => $categoryId,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'title' => $title,
                'description' => 'Dibuat otomatis dari rekomendasi AI Predictive Fleet Maintenance.',
                'status' => WorkOrder::STATUS_PENDING,
                'priority' => $priority,
                'type' => WorkOrder::TYPE_PREVENTIVE,
                'service_location' => WorkOrder::LOCATION_IN_HOUSE,
                'odometer_at_service' => $actionPayload['odometer_at_service'] ?? $vehicle->odometer_km,
                'scheduled_date' => $scheduledDate,
                'estimated_hours' => $actionPayload['estimated_hours'] ?? 2.0,
                'created_by' => $userId,
            ]);
        });

        return [
            'success' => true,
            'message' => "Work Order #{$workOrder->reference_number} berhasil dibuat untuk {$vehicle->name}.",
            'work_order_id' => $workOrder->id,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function aggregateFleetTelemetry(int $lookbackDays, int $forecastDays): array
    {
        $lookbackSince = Carbon::now()->subDays($lookbackDays);
        $vehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->with(['homeBase:id,name'])
            ->get();

        $vehicleData = [];
        $totalOdoVelocity = 0;
        $totalCount = $vehicles->count();

        foreach ($vehicles as $v) {
            // Calculate KM per day from Rentals
            $rentalDist = 0;
            $rentalDays = 0;

            if (class_exists(Rental::class)) {
                $rentals = Rental::query()
                    ->where('vehicle_id', $v->id)
                    ->where('status', Rental::STATUS_RETURNED)
                    ->where('created_at', '>=', $lookbackSince)
                    ->get();

                foreach ($rentals as $r) {
                    if ($r->end_odometer && $r->start_odometer && $r->end_odometer > $r->start_odometer) {
                        $rentalDist += ($r->end_odometer - $r->start_odometer);
                        $d = max(1, Carbon::parse($r->start_date)->diffInDays(Carbon::parse($r->end_date)) ?: 1);
                        $rentalDays += $d;
                    }
                }
            }

            $kmPerDay = $rentalDays > 0 ? round($rentalDist / $rentalDays, 1) : 48.0;
            $totalOdoVelocity += $kmPerDay;

            // Maintenance schedules
            $schedules = MaintenanceSchedule::query()
                ->where('vehicle_id', $v->id)
                ->where('is_active', true)
                ->with('category:id,name')
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'category_id' => $s->category_id,
                    'category_name' => $s->category?->name,
                    'interval_type' => $s->interval_type,
                    'interval_value' => $s->interval_value,
                    'next_service_odometer' => $s->next_service_odometer,
                    'next_service_date' => $s->next_service_date?->toDateString(),
                ])
                ->all();

            // Recent damages
            $recentDamagesCount = 0;
            if (class_exists(RentalDamage::class)) {
                $recentDamagesCount = RentalDamage::query()
                    ->whereHas('rental', fn ($q) => $q->where('vehicle_id', $v->id))
                    ->where('created_at', '>=', $lookbackSince)
                    ->count();
            }

            // Fuel log anomalies
            $fuelAnomalyCount = 0;
            if (class_exists(FuelLog::class)) {
                $fuelAnomalyCount = FuelLog::query()
                    ->where('vehicle_id', $v->id)
                    ->where('filled_at', '>=', $lookbackSince)
                    ->whereNotNull('anomaly_flags')
                    ->count();
            }

            $vehicleData[] = [
                'id' => $v->id,
                'name' => $v->name,
                'plate_number' => $v->plate_number,
                'rental_class' => $v->rental_class,
                'current_odometer_km' => $v->odometer_km,
                'km_per_day_run_rate' => $kmPerDay,
                'stnk_expires_at' => $v->stnk_expires_at?->toDateString(),
                'kir_expires_at' => $v->kir_expires_at?->toDateString(),
                'schedules' => $schedules,
                'recent_damages_count' => $recentDamagesCount,
                'fuel_anomalies_count' => $fuelAnomalyCount,
            ];
        }

        return [
            'lookback_days' => $lookbackDays,
            'forecast_days' => $forecastDays,
            'vehicles' => $vehicleData,
            'avg_fleet_velocity_km_per_day' => $totalCount > 0 ? round($totalOdoVelocity / $totalCount, 1) : 48.0,
        ];
    }

    /**
     * @param  array<string, mixed>  $telemetry
     */
    protected function buildFleetAnalysisPrompt(array $telemetry): string
    {
        $jsonPayload = json_encode($telemetry, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
Anda adalah Lead Automotive Reliability & AI Fleet Telemetry Engineer untuk sistem persewaan dan armada transportasi profesional.
Tugas Anda adalah menganalisis data operasional armada, laju penambahan jarak tempuh (KM/hari run rate), interval servis aktif, riwayat kerusakan, dan mendeteksi anomali.

DATA OPERASIONAL ARMADA:
{$jsonPayload}

INSTRUKSI ANALISIS:
1. Hitung skor kesehatan armada secara keseluruhan ('fleet_health_score' dari 0 sampai 100, misal 86.5) dan 'fleet_risk_level' ('low', 'medium', atau 'high').
2. Berikan 'summary' dalam Bahasa Indonesia yang profesional dan tajam, merangkum kondisi armada serta prioritas tindakan mekanik.
3. Buat daftar prediksi servis yang akan jatuh tempo dalam rentang hari ke depan ('service_forecasts'):
   - Hitung sisa KM dan sisa hari berdasarkan laju 'km_per_day_run_rate'.
   - Urgensi: 'due_now' (sudah lewat/kurang 3 hari), 'due_soon' (4-14 hari), atau 'normal'.
   - Sertakan 'action_payload' berisi field untuk membuat Work Order: 'action' ('create_work_order'), 'vehicle_id', 'title', 'category_id', 'scheduled_date' (format YYYY-MM-DD), 'priority' ('urgent'/'high'/'normal'), 'estimated_hours', 'odometer_at_service'.
4. Identifikasi anomali ('anomalies'):
   - Anomali lonjakan KM (run rate > 120 km/hari untuk kelas reguler).
   - Anomali kerusakan berulang (recent_damages_count >= 2).
   - Dokumen STNK / KIR yang hampir kadaluarsa atau sudah lewat.
   - Anomali BBM.
5. Buat pemetaan skor per unit ('vehicle_health_scores') untuk setiap vehicle ID.

KEMBALIKAN OUTPUT DALAM FORMAT JSON BERIKUT (TANPA MARKDOWN TAMBAHAN):
{
  "fleet_health_score": 85.0,
  "fleet_risk_level": "low",
  "summary": "Armada beroperasi dengan performa stabil...",
  "critical_vehicles_count": 1,
  "service_forecasts": [
    {
      "vehicle_id": 1,
      "vehicle_name": "Avanza G 2023",
      "plate_number": "B 1234 CD",
      "rental_class": "mpv",
      "current_odometer_km": 42100,
      "km_per_day_run_rate": 55.0,
      "next_service_type": "Ganti Oli Mesin & Filter 45.000 KM",
      "target_odometer_km": 45000,
      "predicted_due_date": "2026-09-05",
      "days_remaining": 17,
      "urgency": "due_soon",
      "reason": "Berdasarkan laju 55 KM/hari, unit akan mencapai batas 45.000 KM dalam 17 hari.",
      "action_payload": {
        "action": "create_work_order",
        "vehicle_id": 1,
        "title": "Ganti Oli Mesin & Filter Berkala",
        "category_id": 1,
        "scheduled_date": "2026-09-05",
        "priority": "high",
        "estimated_hours": 1.5,
        "odometer_at_service": 45000
      }
    }
  ],
  "anomalies": [
    {
      "id": "anom_1",
      "vehicle_id": 1,
      "vehicle_name": "Avanza G 2023",
      "plate_number": "B 1234 CD",
      "anomaly_type": "mileage_spike",
      "severity": "warning",
      "title": "Laju Kilometer Di Atas Rata-rata",
      "description": "Penggunaan 110 KM/hari tercatat dalam 30 hari terakhir.",
      "recommendation": "Lakukan rotasi armada untuk menjaga pemerataan umur pakai komponen."
    }
  ],
  "vehicle_health_scores": {
    "1": {
      "score": 88,
      "status": "good",
      "issues_count": 0,
      "primary_warning": null
    }
  }
}
PROMPT;
    }

    /**
     * Algorithmic predictive engine fallback when AI API is unavailable.
     *
     * @param  array<string, mixed>  $telemetry
     */
    protected function generateAlgorithmicPrediction(array $telemetry): PredictiveMaintenanceResult
    {
        $forecasts = [];
        $anomalies = [];
        $healthScores = [];
        $criticalCount = 0;
        $totalScore = 0;
        $vehicles = $telemetry['vehicles'] ?? [];

        foreach ($vehicles as $v) {
            $score = 100;
            $issues = 0;
            $primaryWarning = null;
            $kmPerDay = max(10, (float) ($v['km_per_day_run_rate'] ?? 45.0));
            $currentOdo = (int) ($v['current_odometer_km'] ?? 0);

            // Check schedules
            foreach ($v['schedules'] ?? [] as $sched) {
                if ($sched['interval_type'] === MaintenanceSchedule::INTERVAL_MILEAGE && ! empty($sched['next_service_odometer'])) {
                    $targetOdo = (int) $sched['next_service_odometer'];
                    $kmRemaining = $targetOdo - $currentOdo;
                    $daysRemaining = (int) round($kmRemaining / $kmPerDay);
                    $predictedDate = now()->addDays(max(0, $daysRemaining))->toDateString();

                    $urgency = 'normal';
                    if ($kmRemaining <= 0 || $daysRemaining <= 3) {
                        $urgency = 'due_now';
                        $score -= 25;
                        $issues++;
                        $primaryWarning = "Servis {$sched['name']} telah jatuh tempo!";
                    } elseif ($daysRemaining <= 14) {
                        $urgency = 'due_soon';
                        $score -= 10;
                        $issues++;
                        if (! $primaryWarning) {
                            $primaryWarning = "Servis {$sched['name']} dalam {$daysRemaining} hari.";
                        }
                    }

                    $forecasts[] = [
                        'vehicle_id' => $v['id'],
                        'vehicle_name' => $v['name'],
                        'plate_number' => $v['plate_number'],
                        'rental_class' => $v['rental_class'],
                        'current_odometer_km' => $currentOdo,
                        'km_per_day_run_rate' => $kmPerDay,
                        'next_service_type' => $sched['name'],
                        'target_odometer_km' => $targetOdo,
                        'predicted_due_date' => $predictedDate,
                        'days_remaining' => $daysRemaining,
                        'urgency' => $urgency,
                        'reason' => "Berdasarkan laju {$kmPerDay} KM/hari, unit diperkirakan mencapai {$targetOdo} KM pada {$predictedDate}.",
                        'action_payload' => [
                            'action' => 'create_work_order',
                            'vehicle_id' => $v['id'],
                            'title' => "Servis {$sched['name']} ({$v['name']})",
                            'category_id' => $sched['category_id'] ?? null,
                            'scheduled_date' => $predictedDate,
                            'priority' => $urgency === 'due_now' ? 'urgent' : ($urgency === 'due_soon' ? 'high' : 'normal'),
                            'estimated_hours' => 2.0,
                            'odometer_at_service' => $targetOdo,
                        ],
                    ];
                }
            }

            // Anomaly: high mileage velocity
            if ($kmPerDay >= 120) {
                $anomalies[] = [
                    'id' => 'anom_vel_'.$v['id'],
                    'vehicle_id' => $v['id'],
                    'vehicle_name' => $v['name'],
                    'plate_number' => $v['plate_number'],
                    'anomaly_type' => 'mileage_spike',
                    'severity' => 'warning',
                    'title' => 'Laju Pemakaian Sangat Tinggi',
                    'description' => "Rata-rata jarak tempuh {$kmPerDay} KM/hari melebihi batas wajar armada.",
                    'recommendation' => 'Pertimbangkan rotasi jadwal sewa agar unit mendapatkan jeda pendinginan.',
                ];
                $score -= 10;
                $issues++;
            }

            // Anomaly: frequent damage
            if (($v['recent_damages_count'] ?? 0) >= 2) {
                $anomalies[] = [
                    'id' => 'anom_dmg_'.$v['id'],
                    'vehicle_id' => $v['id'],
                    'vehicle_name' => $v['name'],
                    'plate_number' => $v['plate_number'],
                    'anomaly_type' => 'frequent_breakdown',
                    'severity' => 'danger',
                    'title' => 'Frekuensi Kerusakan Bodi & Panel Tinggi',
                    'description' => "Tercatat {$v['recent_damages_count']} laporan kerusakan dalam 60 hari terakhir.",
                    'recommendation' => 'Lakukan inspeksi visual menyeluruh pada sistem suspensi, kaki-kaki, dan bodi.',
                ];
                $score -= 15;
                $issues++;
            }

            $score = max(20, min(100, $score));
            if ($score < 60) {
                $criticalCount++;
            }

            $totalScore += $score;
            $healthScores[$v['id']] = [
                'score' => $score,
                'status' => $score >= 80 ? 'good' : ($score >= 60 ? 'warning' : 'critical'),
                'issues_count' => $issues,
                'primary_warning' => $primaryWarning,
            ];
        }

        $avgScore = count($vehicles) > 0 ? round($totalScore / count($vehicles), 1) : 90.0;
        $riskLevel = $avgScore >= 80 ? 'low' : ($avgScore >= 60 ? 'medium' : 'high');

        return new PredictiveMaintenanceResult(
            fleetHealthScore: $avgScore,
            fleetRiskLevel: $riskLevel,
            summary: "Kesehatan armada berada pada level {$riskLevel} (Skor {$avgScore}/100) dengan {$criticalCount} unit membutuhkan perhatian segera.",
            vehiclesAnalyzedCount: count($vehicles),
            criticalVehiclesCount: $criticalCount,
            serviceForecasts: $forecasts,
            anomalies: $anomalies,
            vehicleHealthScores: $healthScores,
            rawResponse: ['status' => 'algorithmic_computed'],
            generatedAt: now()->toIso8601String(),
        );
    }
}
