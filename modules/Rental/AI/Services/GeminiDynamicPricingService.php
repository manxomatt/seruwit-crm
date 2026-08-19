<?php

namespace Modules\Rental\AI\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\AI\Contracts\DynamicPricingServiceInterface;
use Modules\Rental\AI\DTO\DynamicPricingRecommendationResult;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use RuntimeException;

class GeminiDynamicPricingService implements DynamicPricingServiceInterface
{
    public function __construct(
        protected ?string $apiKey = null,
        protected string $model = 'gemini-1.5-flash',
        protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta',
    ) {
        $this->apiKey = $apiKey ?? (string) config('services.gemini.api_key', '');
        $this->model = (string) config('services.gemini.model', 'gemini-1.5-flash');
        $this->baseUrl = (string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta');
    }

    /**
     * Generate dynamic pricing and fleet utilization recommendations.
     */
    public function generatePricingRecommendations(int $lookbackDays = 30, int $forecastDays = 30): DynamicPricingRecommendationResult
    {
        $metrics = $this->aggregateFleetMetrics($lookbackDays, $forecastDays);

        if ($this->apiKey === '') {
            return $this->buildFallbackRecommendations($metrics);
        }

        try {
            return $this->callGeminiForRecommendations($metrics);
        } catch (\Throwable $e) {
            Log::warning('Gemini Dynamic Pricing API failed, using algorithmic fallback: '.$e->getMessage());

            return $this->buildFallbackRecommendations($metrics);
        }
    }

    /**
     * Aggregate actual operational metrics from vehicles and rentals database.
     *
     * @return array<string, mixed>
     */
    public function aggregateFleetMetrics(int $lookbackDays = 30, int $forecastDays = 30): array
    {
        $startDate = now()->subDays($lookbackDays)->startOfDay();
        $endDate = now()->addDays($forecastDays)->endOfDay();
        $totalDays = $lookbackDays + $forecastDays;

        $vehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->get(['id', 'name', 'plate_number', 'type', 'rental_class']);

        $totalVehicles = $vehicles->count();
        if ($totalVehicles === 0) {
            return [
                'total_vehicles' => 0,
                'active_fleet_count' => 0,
                'booked_vehicles_count' => 0,
                'overall_utilization_percent' => 0.0,
                'weekday_utilization_percent' => 0.0,
                'weekend_utilization_percent' => 0.0,
                'class_breakdown' => [],
                'idle_vehicles' => [],
                'existing_rates' => [],
            ];
        }

        $rentals = Rental::query()
            ->whereIn('status', [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_COMPLETED,
                Rental::STATUS_RETURNED,
            ])
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->get(['id', 'vehicle_id', 'start_date', 'end_date', 'total_periods', 'rate_per_period']);

        $rates = RentalRate::query()
            ->where('is_active', true)
            ->with('tiers')
            ->get();

        $ratesByClass = $rates->whereNull('vehicle_id')->keyBy('rental_class');
        $ratesByVehicle = $rates->whereNotNull('vehicle_id')->keyBy('vehicle_id');

        $vehicleBookings = $rentals->groupBy('vehicle_id');

        $totalVehicleDays = $totalVehicles * $totalDays;
        $totalBookedDays = 0;
        $weekdayBookedDays = 0;
        $weekendBookedDays = 0;
        $weekdayTotalDays = 0;
        $weekendTotalDays = 0;

        // Iterate through date window to compute weekday vs weekend breakdown
        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $isWeekend = $cursor->isWeekend() || $cursor->isFriday();
            if ($isWeekend) {
                $weekendTotalDays += $totalVehicles;
            } else {
                $weekdayTotalDays += $totalVehicles;
            }
            $cursor->addDay();
        }

        $classGroups = $vehicles->groupBy(fn (Vehicle $v) => $v->rental_class ?: ($v->type ?: 'standard'));
        $classBreakdown = [];
        $idleVehicles = [];

        foreach ($classGroups as $classKey => $classVehicles) {
            $classVehicleCount = $classVehicles->count();
            $classBookedDays = 0;
            $classRates = [];

            foreach ($classVehicles as $vehicle) {
                /** @var Collection<int, Rental> $vRentals */
                $vRentals = $vehicleBookings->get($vehicle->id, collect());
                $vDays = 0;

                foreach ($vRentals as $rental) {
                    $rStart = max($startDate, Carbon::parse($rental->start_date));
                    $rEnd = min($endDate, Carbon::parse($rental->end_date));
                    if ($rEnd->gte($rStart)) {
                        $days = $rStart->diffInDays($rEnd) + 1;
                        $vDays += $days;
                        $totalBookedDays += $days;

                        // Weekend calculation
                        $rCur = $rStart->copy();
                        while ($rCur->lte($rEnd)) {
                            if ($rCur->isWeekend() || $rCur->isFriday()) {
                                $weekendBookedDays++;
                            } else {
                                $weekdayBookedDays++;
                            }
                            $rCur->addDay();
                        }
                    }
                }

                $classBookedDays += $vDays;

                // Check if vehicle has been idle for the last 14 days
                $recentRentals = $vRentals->filter(fn (Rental $r) => Carbon::parse($r->end_date)->gte(now()->subDays(14)));
                if ($recentRentals->isEmpty()) {
                    $currentRate = (float) ($ratesByVehicle->get($vehicle->id)?->rate_per_period
                        ?? $ratesByClass->get($classKey)?->rate_per_period
                        ?? 350000);

                    $idleVehicles[] = [
                        'vehicle_id' => $vehicle->id,
                        'name' => $vehicle->name,
                        'plate_number' => $vehicle->plate_number,
                        'rental_class' => $classKey,
                        'days_idle' => 14,
                        'suggested_promo_rate' => round($currentRate * 0.85, -3),
                    ];
                }
            }

            $classTotalAvailable = $classVehicleCount * $totalDays;
            $classUtilPercent = $classTotalAvailable > 0
                ? round(($classBookedDays / $classTotalAvailable) * 100, 1)
                : 0.0;

            $classBaseRate = (float) ($ratesByClass->get($classKey)?->rate_per_period ?? 350000);

            $classBreakdown[$classKey] = [
                'label' => VehicleRentalClass::label($classKey),
                'total_units' => $classVehicleCount,
                'utilization_percent' => $classUtilPercent,
                'avg_daily_rate' => $classBaseRate,
                'rental_rate_id' => $ratesByClass->get($classKey)?->id,
            ];
        }

        $overallUtil = $totalVehicleDays > 0 ? round(($totalBookedDays / $totalVehicleDays) * 100, 1) : 0.0;
        $weekdayUtil = $weekdayTotalDays > 0 ? round(($weekdayBookedDays / $weekdayTotalDays) * 100, 1) : 0.0;
        $weekendUtil = $weekendTotalDays > 0 ? round(($weekendBookedDays / $weekendTotalDays) * 100, 1) : 0.0;

        return [
            'total_vehicles' => $totalVehicles,
            'active_fleet_count' => $totalVehicles,
            'booked_vehicles_count' => $vehicleBookings->count(),
            'overall_utilization_percent' => $overallUtil,
            'weekday_utilization_percent' => $weekdayUtil,
            'weekend_utilization_percent' => $weekendUtil,
            'class_breakdown' => $classBreakdown,
            'idle_vehicles' => $idleVehicles,
            'existing_rates' => $rates->map(fn (RentalRate $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'rental_class' => $r->rental_class,
                'vehicle_id' => $r->vehicle_id,
                'rate_per_period' => (float) $r->rate_per_period,
                'period_type' => $r->period_type,
            ])->all(),
        ];
    }

    /**
     * Call Gemini 1.5 Flash with fleet metrics to generate pricing strategies.
     *
     * @param  array<string, mixed>  $metrics
     */
    protected function callGeminiForRecommendations(array $metrics): DynamicPricingRecommendationResult
    {
        $metricsJson = json_encode($metrics, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        $prompt = <<<PROMPT
Anda adalah ahli strategi Revenue Management & Dynamic Pricing untuk industri rental kendaraan di Indonesia.
Berdasarkan data operasional utilisasi armada rental berikut:

{$metricsJson}

Tugas Anda:
1. Analisis performa armada: Identifikasi kelas kendaraan dengan utilisasi tinggi (misal >70% atau lonjakan weekend) dan kelas/unit yang menganggur (<40% atau idle >10 hari).
2. Berikan estimasi kenaikan omzet (estimated_revenue_uplift_percent) yang realistis (antara 8% s/d 25%).
3. Susun 2-4 rekomendasi harga konkret dalam format JSON:
   - "surge": Kenaikan tarif untuk kelas yang permintaannya tinggi / akhir pekan (+10% s/d +20%).
   - "discount_promo": Penurunan tarif promo untuk unit idle / hari kerja (-10% s/d -15%) untuk menaikkan okupansi.
   - "duration_rule": Rekomendasi durasi minimum sewa (misal min 2 hari di akhir pekan) untuk menghindari jeda kosong 1 hari.
4. Buat narasi ringkasan strategi bisnis dalam bahasa Indonesia di field `summary`.

Format Output WAJIB JSON persis seperti schema ini:
{
  "fleet_utilization_percent": {$metrics['overall_utilization_percent']},
  "estimated_revenue_uplift_percent": 15.5,
  "summary": "Permintaan kelas MPV pada akhir pekan sangat tinggi (utilisasi >85%), sedangkan unit City Car mengalami idle di hari kerja. Direkomendasikan penyesuaian tarif dinamis untuk memaksimalkan margin akhir pekan dan promo hari kerja.",
  "recommendations": [
    {
      "id": "rec_surge_mpv",
      "type": "surge",
      "target_type": "rental_class",
      "target_identifier": "mpv",
      "target_label": "Kelas MPV",
      "current_rate": 350000,
      "suggested_rate": 400000,
      "adjustment_percent": 14.3,
      "confidence": 0.92,
      "title": "Kenaikan Tarif Weekend Kelas MPV",
      "reason": "Okupansi akhir pekan mencapai 88%. Menaikkan tarif dasar sebesar Rp 50.000 berpotensi menambah omzet tanpa menurunkan volume sewa.",
      "action_payload": {
        "action": "update_class_rate",
        "rental_class": "mpv",
        "new_rate_per_period": 400000
      }
    }
  ]
}
PROMPT;

        $response = Http::timeout(30)
            ->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'responseMimeType' => 'application/json',
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Gemini API call failed: '.$response->body());
        }

        $rawText = (string) $response->json('candidates.0.content.parts.0.text');
        $json = json_decode($rawText, true);

        if (! is_array($json)) {
            throw new RuntimeException('Invalid JSON returned by Gemini: '.$rawText);
        }

        $recommendations = [];
        foreach ($json['recommendations'] ?? [] as $rec) {
            $recommendations[] = [
                'id' => (string) ($rec['id'] ?? uniqid('rec_')),
                'type' => (string) ($rec['type'] ?? 'surge'),
                'target_type' => (string) ($rec['target_type'] ?? 'rental_class'),
                'target_identifier' => (string) ($rec['target_identifier'] ?? 'general'),
                'target_label' => (string) ($rec['target_label'] ?? 'Armada'),
                'current_rate' => (float) ($rec['current_rate'] ?? 350000),
                'suggested_rate' => (float) ($rec['suggested_rate'] ?? 350000),
                'adjustment_percent' => (float) ($rec['adjustment_percent'] ?? 0.0),
                'confidence' => (float) ($rec['confidence'] ?? 0.90),
                'title' => (string) ($rec['title'] ?? 'Penyesuaian Tarif'),
                'reason' => (string) ($rec['reason'] ?? ''),
                'action_payload' => (array) ($rec['action_payload'] ?? [
                    'action' => 'update_class_rate',
                    'new_rate_per_period' => (float) ($rec['suggested_rate'] ?? 350000),
                ]),
            ];
        }

        return new DynamicPricingRecommendationResult(
            fleetUtilizationPercent: (float) ($json['fleet_utilization_percent'] ?? $metrics['overall_utilization_percent']),
            estimatedRevenueUpliftPercent: (float) ($json['estimated_revenue_uplift_percent'] ?? 12.0),
            summary: (string) ($json['summary'] ?? 'Analisis utilisasi armada selesai.'),
            metrics: $metrics,
            recommendations: $recommendations,
            idleVehicles: $metrics['idle_vehicles'] ?? [],
            rawResponse: $json,
            generatedAt: now()->toIso8601String(),
        );
    }

    /**
     * Algorithmic fallback if Gemini API is unavailable.
     *
     * @param  array<string, mixed>  $metrics
     */
    protected function buildFallbackRecommendations(array $metrics): DynamicPricingRecommendationResult
    {
        $recommendations = [];
        $overallUtil = $metrics['overall_utilization_percent'] ?? 0.0;
        $uplift = 10.0;

        foreach ($metrics['class_breakdown'] ?? [] as $classKey => $classData) {
            $util = $classData['utilization_percent'] ?? 0.0;
            $currentRate = (float) ($classData['avg_daily_rate'] ?? 350000);
            $label = $classData['label'] ?? ucfirst($classKey);
            $rateId = $classData['rental_rate_id'] ?? null;

            if ($util >= 60.0) {
                $suggested = round($currentRate * 1.15, -3);
                $recommendations[] = [
                    'id' => 'rec_surge_'.$classKey,
                    'type' => 'surge',
                    'target_type' => 'rental_class',
                    'target_identifier' => $classKey,
                    'target_label' => $label,
                    'current_rate' => $currentRate,
                    'suggested_rate' => $suggested,
                    'adjustment_percent' => 15.0,
                    'confidence' => 0.88,
                    'title' => "Surge Tarif {$label}",
                    'reason' => "Utilisasi kelas {$label} mencapai {$util}%. Menaikkan tarif dasar sebesar 15% dapat memaksimalkan margin tanpa menurunkan permintaan.",
                    'action_payload' => [
                        'action' => 'update_rate',
                        'rental_rate_id' => $rateId,
                        'rental_class' => $classKey,
                        'new_rate_per_period' => $suggested,
                    ],
                ];
                $uplift += 4.0;
            } elseif ($util < 40.0 && $currentRate > 0) {
                $suggested = round($currentRate * 0.90, -3);
                $recommendations[] = [
                    'id' => 'rec_discount_'.$classKey,
                    'type' => 'discount_promo',
                    'target_type' => 'rental_class',
                    'target_identifier' => $classKey,
                    'target_label' => $label,
                    'current_rate' => $currentRate,
                    'suggested_rate' => $suggested,
                    'adjustment_percent' => -10.0,
                    'confidence' => 0.85,
                    'title' => "Promo Diskon {$label}",
                    'reason' => "Tingkat okupansi kelas {$label} masih di angka {$util}%. Promo harga dinamis -10% direkomendasikan untuk menstimulasi booking.",
                    'action_payload' => [
                        'action' => 'update_rate',
                        'rental_rate_id' => $rateId,
                        'rental_class' => $classKey,
                        'new_rate_per_period' => $suggested,
                    ],
                ];
            }
        }

        $summary = "Tingkat utilisasi armada tercatat {$overallUtil}%. Ditemukan peluang optimasi margin pada unit dengan okupansi tinggi dan paket promosi untuk unit menganggur.";

        return new DynamicPricingRecommendationResult(
            fleetUtilizationPercent: $overallUtil,
            estimatedRevenueUpliftPercent: min(25.0, $uplift),
            summary: $summary,
            metrics: $metrics,
            recommendations: $recommendations,
            idleVehicles: $metrics['idle_vehicles'] ?? [],
            rawResponse: ['mode' => 'fallback'],
            generatedAt: now()->toIso8601String(),
        );
    }

    /**
     * Apply a pricing recommendation action directly to the database.
     *
     * @param  array<string, mixed>  $actionPayload
     * @return array{success: bool, message: string, rate_id?: int|null}
     */
    public function applyRecommendation(array $actionPayload): array
    {
        $action = (string) ($actionPayload['action'] ?? '');
        $newRate = (float) ($actionPayload['new_rate_per_period'] ?? 0);

        if ($newRate <= 0) {
            throw new RuntimeException('Nominal tarif baru tidak valid.');
        }

        return DB::transaction(function () use ($actionPayload, $action, $newRate): array {
            if ($action === 'update_rate' && ! empty($actionPayload['rental_rate_id'])) {
                $rate = RentalRate::query()->find($actionPayload['rental_rate_id']);
                if ($rate) {
                    $rate->update(['rate_per_period' => $newRate]);

                    return [
                        'success' => true,
                        'message' => "Tarif {$rate->name} berhasil diperbarui menjadi Rp ".number_format($newRate, 0, ',', '.'),
                        'rate_id' => $rate->id,
                    ];
                }
            }

            if (! empty($actionPayload['rental_class'])) {
                $class = (string) $actionPayload['rental_class'];
                $existing = RentalRate::query()
                    ->where('rental_class', $class)
                    ->where('period_type', RentalRate::PERIOD_DAILY)
                    ->where('is_active', true)
                    ->whereNull('vehicle_id')
                    ->first();

                if ($existing) {
                    $existing->update(['rate_per_period' => $newRate]);

                    return [
                        'success' => true,
                        'message' => "Tarif kelas {$class} berhasil disesuaikan menjadi Rp ".number_format($newRate, 0, ',', '.'),
                        'rate_id' => $existing->id,
                    ];
                }

                $created = RentalRate::create([
                    'rental_class' => $class,
                    'name' => 'Tarif Harian '.VehicleRentalClass::label($class),
                    'period_type' => RentalRate::PERIOD_DAILY,
                    'rate_per_period' => $newRate,
                    'deposit_amount' => 500000,
                    'is_active' => true,
                    'priority' => 1,
                ]);

                return [
                    'success' => true,
                    'message' => "Skema tarif baru kelas {$class} berhasil dibuat sebesar Rp ".number_format($newRate, 0, ',', '.'),
                    'rate_id' => $created->id,
                ];
            }

            if (! empty($actionPayload['vehicle_id'])) {
                $vehicleId = (int) $actionPayload['vehicle_id'];
                $vehicle = Vehicle::find($vehicleId);
                $existing = RentalRate::query()
                    ->where('vehicle_id', $vehicleId)
                    ->where('period_type', RentalRate::PERIOD_DAILY)
                    ->where('is_active', true)
                    ->first();

                if ($existing) {
                    $existing->update(['rate_per_period' => $newRate]);

                    return [
                        'success' => true,
                        'message' => "Tarif untuk unit {$vehicle?->name} berhasil disesuaikan.",
                        'rate_id' => $existing->id,
                    ];
                }

                $created = RentalRate::create([
                    'vehicle_id' => $vehicleId,
                    'name' => 'Tarif Khusus '.($vehicle?->name ?? 'Kendaraan'),
                    'period_type' => RentalRate::PERIOD_DAILY,
                    'rate_per_period' => $newRate,
                    'deposit_amount' => 500000,
                    'is_active' => true,
                    'priority' => 10,
                ]);

                return [
                    'success' => true,
                    'message' => "Tarif khusus untuk unit {$vehicle?->name} berhasil dibuat.",
                    'rate_id' => $created->id,
                ];
            }

            throw new RuntimeException('Target penyesuaian tarif tidak ditemukan.');
        });
    }
}
