<?php

namespace Modules\Rental\AI\Services;

use App\Support\CentralAiSettings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Rental\AI\Contracts\RentalRateAiGeneratorServiceInterface;
use Throwable;

class GeminiRentalRateAiGeneratorService implements RentalRateAiGeneratorServiceInterface
{
    public function __construct(
        protected ?string $apiKey = null,
        protected string $model = 'gemini-1.5-flash',
        protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta',
    ) {
        $this->apiKey = $apiKey ?? (function_exists('app') && app()->has('config') ? (string) config('services.gemini.api_key', '') : '');
        $this->model = function_exists('app') && app()->has('config') ? (string) config('services.gemini.model', 'gemini-1.5-flash') : 'gemini-1.5-flash';
        $this->baseUrl = function_exists('app') && app()->has('config') ? (string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta') : 'https://generativelanguage.googleapis.com/v1beta';
    }

    /**
     * Parse unstructured prompt text and generate structured rental tariff data with tiered discounts.
     *
     * @param  array<int, array{id: int|string, name: string, plate_number?: string, type?: string}>  $availableVehicles
     * @param  array<int, array{value: string, label: string}>  $availableRentalClasses
     * @return array<string, mixed>
     */
    public function generateFromText(string $text, array $availableVehicles = [], array $availableRentalClasses = []): array
    {
        $text = trim($text);
        if ($text === '') {
            return [];
        }

        // If central AI is enabled and Gemini API key is configured, call Gemini API
        if (CentralAiSettings::isEnabled() && filled($this->apiKey)) {
            try {
                $geminiResult = $this->callGeminiApi($text, $availableVehicles, $availableRentalClasses);
                if (! empty($geminiResult)) {
                    return $this->sanitizeExtractedData($geminiResult, $availableVehicles, $availableRentalClasses);
                }
            } catch (Throwable $e) {
                Log::warning('GeminiRentalRateAiGeneratorService failed, falling back to heuristic parsing', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback: Smart heuristic & regex-based tariff spec parser
        return $this->parseHeuristically($text, $availableVehicles, $availableRentalClasses);
    }

    /**
     * Call Gemini API with structured prompt.
     *
     * @param  array<int, array{id: int|string, name: string, plate_number?: string, type?: string}>  $availableVehicles
     * @param  array<int, array{value: string, label: string}>  $availableRentalClasses
     * @return array<string, mixed>
     */
    protected function callGeminiApi(string $text, array $availableVehicles, array $availableRentalClasses): array
    {
        $vehiclesJson = json_encode(array_map(fn ($v) => [
            'id' => $v['id'] ?? null,
            'name' => $v['name'] ?? '',
            'plate_number' => $v['plate_number'] ?? '',
            'type' => $v['type'] ?? '',
        ], $availableVehicles), JSON_UNESCAPED_UNICODE);

        $classesJson = json_encode(array_map(fn ($c) => [
            'value' => $c['value'] ?? '',
            'label' => $c['label'] ?? '',
        ], $availableRentalClasses), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Anda adalah asisten AI spesialis penentuan tarif rental kendaraan (mobil, van, truk, motor, bus) di Indonesia.
Tugas Anda adalah membaca instruksi atau teks deskripsi bebas dari pengguna dan mengekstrak semua spesifikasi skema tarif sewa ke dalam format JSON yang terstruktur dan siap dimasukkan ke formulir sistem.

Daftar Armada Kendaraan yang tersedia di sistem:
{$vehiclesJson}

Daftar Kelas Rental yang tersedia:
{$classesJson}

Skema JSON Output Wajib (hanya kembalikan JSON murni):
{
  "name": string (Nama skema tarif, contoh: "Tarif Harian Avanza Veloz (Lepas Kunci)" atau "Paket Mingguan Innova Zenix"),
  "period_type": "daily" | "weekly" | "monthly",
  "rate_per_period": number (Harga sewa pokok dalam Rupiah angka integer murni, contoh: 450000),
  "deposit_amount": number (Nominal jaminan / deposit Rupiah, contoh: 500000) | 0,
  "km_limit_per_period": integer (Batas jarak tempuh KM per periode sewa, contoh: 200, 1500) | null,
  "excess_km_rate": number (Biaya kelebihan per KM dalam Rupiah, contoh: 2500) | 0,
  "late_fee_per_day": number (Denda keterlambatan pengembalian per hari/periode dalam Rupiah, contoh: 50000) | 0,
  "priority": integer (Prioritas skema tarif, default 0 atau 1-10 jika ada spesifik vehicle/promo),
  "vehicle_id": string|number (ID kendaraan yang paling cocok dari daftar kendaraan di atas jika spesifik untuk satu unit) | "",
  "rental_class": string (Value kelas rental yang cocok: "economy"|"mpv"|"suv"|"van"|"premium"|"truck"|"other") | "",
  "is_active": boolean (true),
  "tiers": [
    {
      "tier_type": "period_volume" | "loyalty_count",
      "min_threshold": integer (Contoh: 3 untuk sewa 3+ hari, atau 5 untuk customer yang sudah 5x rental),
      "max_threshold": integer | null (Contoh: 6 untuk rentang 3-6 hari, null jika tanpa batas atas / 7+ hari),
      "modifier_type": "percent_discount" | "flat_discount" | "fixed_rate",
      "modifier_value": number (Contoh: 10 untuk diskon 10%, 50000 untuk potongan flat Rp 50.000),
      "priority": integer (0),
      "is_active": boolean (true)
    }
  ],
  "explanation": string (Penjelasan singkat 1 kalimat hasil ekstraksi AI)
}

Teks Instruksi / Deskripsi Tarif dari Pengguna:
{$text}
PROMPT;

        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->timeout(25)->post($url, [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.1,
                'responseMimeType' => 'application/json',
            ],
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Gemini API request returned error status: '.$response->status().' '.$response->body());
        }

        $body = $response->json();
        $rawJsonText = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';

        if (empty($rawJsonText)) {
            return [];
        }

        $decoded = json_decode($rawJsonText, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Sanitize and format data extracted from Gemini.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int, array{id: int|string, name: string, plate_number?: string, type?: string}>  $availableVehicles
     * @param  array<int, array{value: string, label: string}>  $availableRentalClasses
     * @return array<string, mixed>
     */
    protected function sanitizeExtractedData(array $data, array $availableVehicles, array $availableRentalClasses): array
    {
        $periodType = strtolower((string) ($data['period_type'] ?? 'daily'));
        if (! in_array($periodType, ['daily', 'weekly', 'monthly'], true)) {
            $periodType = 'daily';
        }

        $ratePerPeriod = max(0, (float) ($data['rate_per_period'] ?? 0));
        $depositAmount = max(0, (float) ($data['deposit_amount'] ?? 0));
        $kmLimit = isset($data['km_limit_per_period']) && $data['km_limit_per_period'] !== '' && $data['km_limit_per_period'] !== null
            ? max(0, (int) $data['km_limit_per_period'])
            : null;
        $excessKmRate = max(0, (float) ($data['excess_km_rate'] ?? 0));
        $lateFee = max(0, (float) ($data['late_fee_per_day'] ?? 0));
        $priority = max(0, (int) ($data['priority'] ?? 0));

        // Vehicle ID matching
        $vehicleId = '';
        if (! empty($data['vehicle_id'])) {
            $matched = collect($availableVehicles)->first(fn ($v) => (string) $v['id'] === (string) $data['vehicle_id']);
            if ($matched) {
                $vehicleId = (string) $matched['id'];
            }
        }

        // Rental class matching
        $rentalClass = '';
        if (! empty($data['rental_class'])) {
            $matchedClass = collect($availableRentalClasses)->first(fn ($c) => strtolower((string) $c['value']) === strtolower((string) $data['rental_class']));
            if ($matchedClass) {
                $rentalClass = $matchedClass['value'];
            }
        }

        // Tier sanitize
        $tiers = [];
        if (! empty($data['tiers']) && is_array($data['tiers'])) {
            foreach ($data['tiers'] as $tier) {
                if (! is_array($tier)) {
                    continue;
                }
                $type = ($tier['tier_type'] ?? '') === 'loyalty_count' ? 'loyalty_count' : 'period_volume';
                $modifierType = in_array($tier['modifier_type'] ?? '', ['percent_discount', 'flat_discount', 'fixed_rate'], true)
                    ? $tier['modifier_type']
                    : 'percent_discount';
                $modifierValue = max(0, (float) ($tier['modifier_value'] ?? 0));
                $minThreshold = max(1, (int) ($tier['min_threshold'] ?? 1));
                $maxThreshold = isset($tier['max_threshold']) && $tier['max_threshold'] !== null && $tier['max_threshold'] !== ''
                    ? max($minThreshold, (int) $tier['max_threshold'])
                    : null;

                if ($modifierValue > 0) {
                    $tiers[] = [
                        'tier_type' => $type,
                        'min_threshold' => $minThreshold,
                        'max_threshold' => $maxThreshold,
                        'modifier_type' => $modifierType,
                        'modifier_value' => $modifierValue,
                        'priority' => (int) ($tier['priority'] ?? 0),
                        'is_active' => (bool) ($tier['is_active'] ?? true),
                    ];
                }
            }
        }

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            $name = 'Tarif '.ucfirst($periodType);
        }

        return [
            'name' => $name,
            'period_type' => $periodType,
            'rate_per_period' => $ratePerPeriod,
            'deposit_amount' => $depositAmount,
            'km_limit_per_period' => $kmLimit,
            'excess_km_rate' => $excessKmRate,
            'late_fee_per_day' => $lateFee,
            'priority' => $priority,
            'vehicle_id' => $vehicleId,
            'rental_class' => $rentalClass,
            'is_active' => true,
            'tiers' => $tiers,
            'explanation' => (string) ($data['explanation'] ?? 'Data tarif berhasil diekstrak dan disiapkan untuk formulir.'),
        ];
    }

    /**
     * Fallback heuristic parser for unstructured Indonesian tariff prompts.
     *
     * @param  array<int, array{id: int|string, name: string, plate_number?: string, type?: string}>  $availableVehicles
     * @param  array<int, array{value: string, label: string}>  $availableRentalClasses
     * @return array<string, mixed>
     */
    protected function parseHeuristically(string $text, array $availableVehicles, array $availableRentalClasses): array
    {
        $lower = strtolower($text);

        // 1. Period type
        $periodType = 'daily';
        if (preg_match('/(bulanan|bulan|monthly|per bulan|\/bln|\/bulan)/i', $lower)) {
            $periodType = 'monthly';
        } elseif (preg_match('/(mingguan|minggu|weekly|per minggu|\/mgg|\/minggu)/i', $lower)) {
            $periodType = 'weekly';
        }

        // 2. Base rate parsing
        $ratePerPeriod = 0;
        if (preg_match('/(?:tarif|harga|sewa|rate|pokok)?\s*(?:rp\.?|idr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:jt|juta)/i', $lower, $m)) {
            $ratePerPeriod = (float) $m[1] * 1000000;
        } elseif (preg_match('/(?:tarif|harga|sewa|rate|pokok)?\s*(?:rp\.?|idr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:rb|ribu|k)\b/i', $lower, $m)) {
            $ratePerPeriod = (float) $m[1] * 1000;
        } elseif (preg_match('/(?:rp\.?|idr)\s*([0-9]{1,3}(?:\.[0-9]{3})+)/i', $lower, $m)) {
            $ratePerPeriod = (float) str_replace('.', '', $m[1]);
        } elseif (preg_match('/\b([1-9][0-9]{4,8})\b/', $lower, $m)) {
            $ratePerPeriod = (float) $m[1];
        }

        // 3. Deposit parsing
        $depositAmount = 0;
        if (preg_match('/deposit\s*(?:sebesar|rp\.?|idr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:jt|juta)/i', $lower, $m)) {
            $depositAmount = (float) $m[1] * 1000000;
        } elseif (preg_match('/deposit\s*(?:sebesar|rp\.?|idr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:rb|ribu|k)\b/i', $lower, $m)) {
            $depositAmount = (float) $m[1] * 1000;
        } elseif (preg_match('/deposit\s*(?:sebesar|rp\.?|idr)?\s*([0-9]{1,3}(?:\.[0-9]{3})+)/i', $lower, $m)) {
            $depositAmount = (float) str_replace('.', '', $m[1]);
        }

        // 4. KM limit
        $kmLimit = null;
        if (preg_match('/(?:limit|batas|maks|max)\s*(?:jarak|km)?\s*([0-9]+)\s*km/i', $lower, $m)) {
            $kmLimit = (int) $m[1];
        } elseif (preg_match('/([0-9]+)\s*km\s*(?:\/|\s*per\s*)?(?:hari|periode|minggu|bulan)/i', $lower, $m)) {
            $kmLimit = (int) $m[1];
        }

        // 5. Excess KM rate
        $excessKmRate = 0;
        if (preg_match('/(?:kelebihan|denda\s*km|excess)\s*(?:rp\.?|idr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:rb|k|\/km)/i', $lower, $m)) {
            $excessKmRate = (float) $m[1] * (str_contains($m[1], 'k') || str_contains($m[0], 'rb') ? 1000 : 1);
        } elseif (preg_match('/(?:kelebihan|over\s*km)\s*(?:rp\.?|idr)?\s*([0-9]{3,6})/i', $lower, $m)) {
            $excessKmRate = (float) $m[1];
        }

        // 6. Late fee
        $lateFee = 0;
        if (preg_match('/(?:denda|telat|late\s*fee)\s*(?:rp\.?|idr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:rb|ribu|k)/i', $lower, $m)) {
            $lateFee = (float) $m[1] * 1000;
        }

        // 7. Vehicle matching
        $matchedVehicleId = '';
        foreach ($availableVehicles as $v) {
            $vName = strtolower($v['name']);
            $vPlate = strtolower(str_replace(' ', '', $v['plate_number'] ?? ''));
            if ((strlen($vName) > 2 && str_contains($lower, $vName)) || (strlen($vPlate) > 3 && str_contains(str_replace(' ', '', $lower), $vPlate))) {
                $matchedVehicleId = (string) $v['id'];
                break;
            }

            // Check name without common brand prefix
            $nameWithoutBrand = trim(preg_replace('/\b(toyota|daihatsu|mitsubishi|honda|suzuki|isuzu|hyundai|wuling|mercedes|bmw|nissan|mazda)\b/i', '', $vName));
            if (strlen($nameWithoutBrand) > 3 && str_contains($lower, $nameWithoutBrand)) {
                $matchedVehicleId = (string) $v['id'];
                break;
            }
        }

        // 8. Rental class matching
        $matchedClass = '';
        foreach ($availableRentalClasses as $c) {
            $cVal = strtolower($c['value']);
            $cLab = strtolower($c['label']);
            if (str_contains($lower, $cVal) || str_contains($lower, $cLab)) {
                $matchedClass = $c['value'];
                break;
            }
        }

        // 9. Tier volume & loyalty rules parsing
        $tiers = [];
        // Pattern: sewa 3+ hari diskon 10% or sewa 3-6 hari diskon 10%
        if (preg_match_all('/(?:sewa|durasi|volume)?\s*([0-9]+)(?:\s*-\s*([0-9]+)|\+)?\s*(?:hari|minggu|bulan|periode)?\s*(?:diskon|potongan|hemat)\s*([0-9]+)\s*%/i', $lower, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $min = (int) $match[1];
                $max = ! empty($match[2]) ? (int) $match[2] : null;
                $pct = (float) $match[3];
                if ($pct > 0 && $min > 0) {
                    $tiers[] = [
                        'tier_type' => 'period_volume',
                        'min_threshold' => $min,
                        'max_threshold' => $max,
                        'modifier_type' => 'percent_discount',
                        'modifier_value' => $pct,
                        'priority' => 0,
                        'is_active' => true,
                    ];
                }
            }
        }

        // Pattern: loyalty >5 kali diskon 15%
        if (preg_match('/(?:loyalty|langganan|repeat\s*order|pelanggan\s*loyal)\s*(?:minimal|min|>\s*|sejak)?\s*([0-9]+)\s*(?:x|kali|order)?\s*(?:diskon|potongan)\s*([0-9]+)\s*%/i', $lower, $m)) {
            $tiers[] = [
                'tier_type' => 'loyalty_count',
                'min_threshold' => (int) $m[1],
                'max_threshold' => null,
                'modifier_type' => 'percent_discount',
                'modifier_value' => (float) $m[2],
                'priority' => 0,
                'is_active' => true,
            ];
        }

        // Build Title
        $titlePrefix = 'Tarif '.ucfirst($periodType);
        $titleSuffix = '';
        if ($matchedVehicleId) {
            $veh = collect($availableVehicles)->first(fn ($v) => (string) $v['id'] === $matchedVehicleId);
            if ($veh) {
                $titleSuffix = ' '.$veh['name'];
            }
        } elseif ($matchedClass) {
            $titleSuffix = ' Kelas '.strtoupper($matchedClass);
        }

        return [
            'name' => trim($titlePrefix.$titleSuffix),
            'period_type' => $periodType,
            'rate_per_period' => $ratePerPeriod,
            'deposit_amount' => $depositAmount,
            'km_limit_per_period' => $kmLimit,
            'excess_km_rate' => $excessKmRate,
            'late_fee_per_day' => $lateFee,
            'priority' => 0,
            'vehicle_id' => $matchedVehicleId,
            'rental_class' => $matchedClass,
            'is_active' => true,
            'tiers' => $tiers,
            'explanation' => 'Data tarif berhasil diinterpretasikan secara otomatis dari teks inputan.',
        ];
    }
}
