<?php

namespace Modules\Fleet\AI\Services;

use App\Support\CentralAiSettings;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Fleet\AI\Contracts\VehicleAiGeneratorServiceInterface;
use Throwable;

class GeminiVehicleAiGeneratorService implements VehicleAiGeneratorServiceInterface
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
     * Parse and generate structured vehicle attributes from unstructured text.
     *
     * @param  array<int, array{id: int, name: string, code: string}>  $availableBases
     * @return array<string, mixed>
     */
    public function generateFromText(string $text, array $availableBases = []): array
    {
        $text = trim($text);
        if ($text === '') {
            return [];
        }

        // If central AI is enabled and Gemini API key is configured, call Gemini API
        if (CentralAiSettings::isEnabled() && filled($this->apiKey)) {
            try {
                $geminiResult = $this->callGeminiApi($text, $availableBases);
                if (! empty($geminiResult)) {
                    return $this->sanitizeExtractedData($geminiResult, $availableBases);
                }
            } catch (Throwable $e) {
                Log::warning('GeminiVehicleAiGeneratorService failed, falling back to heuristic parsing', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback: Smart heuristic & regex-based car spec parser
        return $this->parseHeuristically($text, $availableBases);
    }

    /**
     * Call Gemini API with structured prompt.
     *
     * @param  array<int, array{id: int, name: string, code: string}>  $availableBases
     * @return array<string, mixed>
     */
    protected function callGeminiApi(string $text, array $availableBases): array
    {
        $basesJson = json_encode(array_map(fn ($b) => [
            'id' => $b['id'] ?? null,
            'name' => $b['name'] ?? '',
            'code' => $b['code'] ?? '',
        ], $availableBases), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Anda adalah asisten AI spesialis otomotif dan manajemen armada rental/transportasi di Indonesia.
Tugas Anda adalah membaca teks input deskripsi bebas dari pengguna dan mengekstrak semua spesifikasi kendaraan ke dalam format JSON yang terstruktur.

Daftar Home Base / Pool yang tersedia di sistem:
{$basesJson}

Skema JSON Output Wajib (hanya kembalikan JSON murni):
{
  "name": string (Nama lengkap unit, contoh: "Toyota Innova Reborn 2.4 G Diesel MT" atau "Mitsubishi Canter HDX Box"),
  "brand": string (Merk pabrikan, contoh: "Toyota", "Daihatsu", "Mitsubishi", "Isuzu", "Hino", "Honda", "Suzuki", "Wuling", "Hyundai", "Mercedes-Benz", dll),
  "plate_number": string (Nomor polisi format rapi dengan spasi huruf kapital, contoh: "B 1234 ABC"),
  "type": "car" | "van" | "truck" | "bus" | "motorcycle",
  "rental_class": "" | "economy" | "mpv" | "suv" | "van" | "premium" | "truck" | "other",
  "model_year": integer (tahun pembuatan 1980 - 2030, contoh: 2023) | null,
  "color": string (Warna kendaraan, contoh: "Hitam Metalik", "Putih", "Silver", "Abu-abu", "Kuning"),
  "capacity_seats": integer (Kapasitas tempat duduk penumpang, contoh: 7 untuk MPV, 5 untuk Sedan/Hatchback, 14 untuk HiAce, 30 untuk Bus) | null,
  "capacity_kg": number (Kapasitas beban muatan berat dalam KG, contoh: 1500, 5000) | null,
  "capacity": string (Ringkasan kapasitas teks bebas, contoh: "7 Kursi Penumpang + Bagasi Luas") | null,
  "fuel_type": "petrol" | "diesel" | "electric" | "hybrid",
  "tank_capacity_liters": number (Kapasitas tangki BBM liter, contoh: 45, 55, 65, 100) | null,
  "expected_km_per_liter": number (Estimasi efisiensi konsumsi BBM km/liter, contoh: 12.5) | null,
  "cost_per_km": number (Estimasi biaya operasional rupiah per km, contoh: 1850) | null,
  "odometer_km": integer (Jarak tempuh saat ini dalam KM) | null,
  "status": "active" | "maintenance" | "out_of_service" | "retired",
  "home_base_id": string (ID pool yang paling cocok dari daftar pool di atas jika disebutkan) | "",
  "stnk_expires_at": "YYYY-MM-DD" | null,
  "kir_expires_at": "YYYY-MM-DD" | null,
  "notes": string (Catatan khusus unit, perlengkapan, kondisi bodi atau modifikasi) | ""
}

Teks Deskripsi Kendaraan dari Pengguna:
"""
{$text}
"""
PROMPT;

        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(15)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, [
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
            throw new \RuntimeException('Gemini API request failed with status '.$response->status().': '.$response->body());
        }

        $rawBody = $response->json();
        $responseText = $rawBody['candidates'][0]['content']['parts'][0]['text'] ?? '';

        if (blank($responseText)) {
            return [];
        }

        $decoded = json_decode($responseText, true);
        if (! is_array($decoded)) {
            // Clean possible markdown code fences
            $cleaned = preg_replace('/^```(?:json)?\s+|\s+```$/m', '', trim($responseText));
            $decoded = json_decode($cleaned, true);
        }

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Smart Heuristic and Pattern-Matching Parser.
     *
     * @param  array<int, array{id: int, name: string, code: string}>  $availableBases
     * @return array<string, mixed>
     */
    public function parseHeuristically(string $text, array $availableBases = []): array
    {
        $lower = strtolower($text);

        // 1. Detect Brand & Name
        $knownBrands = [
            'Toyota' => ['avanza', 'veloz', 'innova', 'zenix', 'reborn', 'fortuner', 'alphard', 'vellfire', 'hiace', 'premio', 'commuter', 'calya', 'rush', 'yaris', 'agya', 'raize', 'corolla', 'camry', 'hilux', 'vios'],
            'Daihatsu' => ['xenia', 'terios', 'sigra', 'ayla', 'gran max', 'grand max', 'luxio', 'rocky', 'sirion', 'blind van', 'blindvan', 'pickup'],
            'Honda' => ['brio', 'mobilio', 'hr-v', 'hrv', 'cr-v', 'crv', 'br-v', 'brv', 'wr-v', 'wrv', 'jazz', 'city', 'civic', 'accord', 'freed'],
            'Mitsubishi' => ['xpander', 'pajero', 'pajero sport', 'canter', 'colt diesel', 'fuso', 'l300', 'triton', 'outlander', 'destinator'],
            'Suzuki' => ['ertiga', 'xl7', 'carry', 'baleno', 'ignis', 'jimny', 'karimun', 'apv', 'spresso', 'grand vitara'],
            'Isuzu' => ['panther', 'mu-x', 'mux', 'd-max', 'dmax', 'elf', 'giga', 'traga'],
            'Hino' => ['dutro', 'ranger', 'profia', '500', '300'],
            'Wuling' => ['confero', 'cortez', 'almaz', 'alvez', 'air ev', 'binguo', 'formo'],
            'Hyundai' => ['stargazer', 'creta', 'palisade', 'santa fe', 'ioniq', 'ioniq 5', 'staria', 'h-1', 'h1', 'tucson'],
            'Mercedes-Benz' => ['mercedes', 'mercy', 'sprinter', 'v-class', 'vclass', 'c-class', 'e-class', 's-class', 'g-class'],
            'BMW' => ['bmw', 'x1', 'x3', 'x5', 'x7', 'seri 3', 'seri 5', 'seri 7'],
            'Nissan' => ['grand livina', 'livina', 'serena', 'terra', 'x-trail', 'xtrail', 'magnite', 'kicks', 'navara'],
            'Fuso' => ['fuso', 'canter', 'fighter'],
            'Chery' => ['omoda', 'tiggo'],
            'BYD' => ['byd', 'seal', 'atto', 'dolphin', 'm6'],
        ];

        $detectedBrand = '';
        $matchedModel = '';

        foreach ($knownBrands as $brand => $models) {
            if (stripos($text, $brand) !== false) {
                $detectedBrand = $brand;
            }
            foreach ($models as $model) {
                if (stripos($text, $model) !== false) {
                    $matchedModel = ucwords($model);
                    if ($detectedBrand === '') {
                        $detectedBrand = $brand;
                    }
                    break 2;
                }
            }
        }

        // 2. Plate Number regex: e.g. B 1234 XYZ or B1234XYZ
        $plateNumber = '';
        if (preg_match('/\b([A-Z]{1,2})\s*([0-9]{1,4})\s*([A-Z]{1,3})\b/i', $text, $matches)) {
            $plateNumber = strtoupper(trim($matches[1]).' '.trim($matches[2]).' '.trim($matches[3]));
        }

        // 3. Model Year (1980 - 2030)
        $modelYear = null;
        if (preg_match('/\b(19[89]\d|20[0-3]\d)\b/', $text, $yearMatches)) {
            $modelYear = (int) $yearMatches[1];
        }

        // 4. Vehicle Type
        $type = 'car';
        if (preg_match('/\b(truk|truck|canter|giga|dutro|fuso|dump|engkel|tronton|wingbox|box|kargo)\b/i', $text)) {
            $type = 'truck';
        } elseif (preg_match('/\b(bus|bis|medium bus|big bus|microbus)\b/i', $text)) {
            $type = 'bus';
        } elseif (preg_match('/\b(van|minibus|hiace|elf|luxio|blindvan|blind van|gran max|travel)\b/i', $text)) {
            $type = 'van';
        } elseif (preg_match('/\b(motor|motorcycle|nmax|pcx|beat|vario|aerox)\b/i', $text)) {
            $type = 'motorcycle';
        }

        // 5. Fuel Type
        $fuelType = 'petrol';
        if (preg_match('/\b(diesel|solar|dexlite|biosolar|pertamina dex)\b/i', $text)) {
            $fuelType = 'diesel';
        } elseif (preg_match('/\b(listrik|ev|electric|bev)\b/i', $text)) {
            $fuelType = 'electric';
        } elseif (preg_match('/\b(hybrid|hev|phev)\b/i', $text)) {
            $fuelType = 'hybrid';
        }

        // 6. Rental Class
        $rentalClass = '';
        if (preg_match('/\b(alphard|vellfire|mercedes|mercy|bmw|lexus|luxury|vip|palisade|staria)\b/i', $text)) {
            $rentalClass = 'premium';
        } elseif (preg_match('/\b(fortuner|pajero|crv|cr-v|hrv|hr-v|terios|rush|creta|suv)\b/i', $text)) {
            $rentalClass = 'suv';
        } elseif (preg_match('/\b(avanza|xenia|innova|ertiga|stargazer|mobilio|calya|sigra|mpv)\b/i', $text)) {
            $rentalClass = 'mpv';
        } elseif (preg_match('/\b(hiace|elf|van|minibus)\b/i', $text)) {
            $rentalClass = 'van';
        } elseif (preg_match('/\b(brio|agya|ayla|yaris|jazz|city car|hatchback|economy)\b/i', $text)) {
            $rentalClass = 'economy';
        } elseif ($type === 'truck') {
            $rentalClass = 'truck';
        }

        // 7. Capacity Seats
        $capacitySeats = null;
        if (preg_match('/\b(\d{1,2})\s*(?:kursi|seat|seater|penumpang|orang|passengers?)\b/i', $text, $seatMatches)) {
            $capacitySeats = (int) $seatMatches[1];
        } else {
            if ($type === 'van') {
                $capacitySeats = stripos($lower, 'premio') !== false ? 10 : 14;
            } elseif ($rentalClass === 'mpv' || $rentalClass === 'suv') {
                $capacitySeats = 7;
            } elseif ($rentalClass === 'economy') {
                $capacitySeats = 5;
            } elseif ($type === 'truck') {
                $capacitySeats = 3;
            } elseif ($type === 'bus') {
                $capacitySeats = 30;
            }
        }

        // 8. Capacity KG
        $capacityKg = null;
        if (preg_match('/\b(\d+(?:[.,]\d+)?)\s*(?:kg|kilogram)\b/i', $text, $kgMatches)) {
            $capacityKg = (float) str_replace(',', '.', $kgMatches[1]);
        } elseif (preg_match('/\b(\d+(?:[.,]\d+)?)\s*(?:ton|tonnes?)\b/i', $text, $tonMatches)) {
            $capacityKg = (float) str_replace(',', '.', $tonMatches[1]) * 1000;
        }

        // 9. Color
        $color = '';
        $knownColors = [
            'Hitam Metalik' => 'hitam metalik',
            'Hitam' => 'hitam',
            'Putih Mutiara' => 'putih mutiara|pearl white',
            'Putih' => 'putih|white',
            'Silver Metalik' => 'silver metalik',
            'Silver' => 'silver|perak',
            'Abu-abu' => 'abu-abu|abu abu|grey|gray',
            'Merah' => 'merah|red',
            'Biru' => 'biru|blue',
            'Kuning' => 'kuning|yellow',
            'Coklat' => 'coklat|brown',
            'Hijau' => 'hijau|green',
            'Orange' => 'orange|oranye',
        ];
        foreach ($knownColors as $colorName => $pattern) {
            if (preg_match('/\b('.$pattern.')\b/i', $text)) {
                $color = $colorName;
                break;
            }
        }

        // 10. Odometer
        $odometerKm = null;
        if (preg_match('/\b(?:km|odometer|odo)\s*[:=]?\s*(\d{1,3}(?:[.,]\d{3})*|\d+)\b/i', $text, $odoMatches)) {
            $cleanedOdo = preg_replace('/[^\d]/', '', $odoMatches[1]);
            $odometerKm = (int) $cleanedOdo;
        } elseif (preg_match('/\b(\d{1,3}(?:[.,]\d{3})+|\d{4,6})\s*km\b/i', $text, $odoMatches2)) {
            $cleanedOdo = preg_replace('/[^\d]/', '', $odoMatches2[1]);
            $odometerKm = (int) $cleanedOdo;
        }

        // 11. Tank Capacity & Expected KM/L
        $tankCapacity = null;
        if (preg_match('/\b(?:tangki|tank)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:l|liter|litres?)?\b/i', $text, $tankMatches)) {
            $tankCapacity = (float) str_replace(',', '.', $tankMatches[1]);
        } else {
            if ($type === 'truck') {
                $tankCapacity = 100;
            } elseif ($type === 'van') {
                $tankCapacity = 70;
            } elseif ($fuelType === 'diesel') {
                $tankCapacity = 55;
            } elseif ($type === 'car') {
                $tankCapacity = 45;
            }
        }

        $expectedKmLiter = null;
        if (preg_match('/\b(\d+(?:[.,]\d+)?)\s*(?:km\/l|km\/liter|kml)\b/i', $text, $effMatches)) {
            $expectedKmLiter = (float) str_replace(',', '.', $effMatches[1]);
        } else {
            if ($fuelType === 'diesel') {
                $expectedKmLiter = 13.0;
            } elseif ($fuelType === 'hybrid') {
                $expectedKmLiter = 20.0;
            } elseif ($type === 'truck') {
                $expectedKmLiter = 7.5;
            } else {
                $expectedKmLiter = 12.0;
            }
        }

        // 12. Cost per KM
        $costPerKm = null;
        if (preg_match('/\b(?:biaya|cost|operasional)\s*[:=]?\s*(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*|\d+)(?:\/km|\s*per\s*km)?\b/i', $text, $costMatches)) {
            $cleanedCost = preg_replace('/[^\d]/', '', $costMatches[1]);
            $costPerKm = (float) $cleanedCost;
        } else {
            $costPerKm = $fuelType === 'diesel' ? 1750 : ($fuelType === 'electric' ? 750 : 1950);
        }

        // 13. Home Base matching
        $homeBaseId = '';
        if (! empty($availableBases)) {
            foreach ($availableBases as $base) {
                $baseName = strtolower($base['name'] ?? '');
                $baseCode = strtolower($base['code'] ?? '');
                if (($baseName !== '' && stripos($lower, $baseName) !== false) ||
                    ($baseCode !== '' && stripos($lower, $baseCode) !== false)) {
                    $homeBaseId = (string) ($base['id'] ?? '');
                    break;
                }
            }
            // If still empty and text mentions "pusat" or "utama", try finding base with "pusat"
            if ($homeBaseId === '' && preg_match('/\b(pusat|utama|hq|headquarters|pool\s*1)\b/i', $text)) {
                foreach ($availableBases as $base) {
                    if (stripos(strtolower($base['name'] ?? ''), 'pusat') !== false || stripos(strtolower($base['name'] ?? ''), 'utama') !== false) {
                        $homeBaseId = (string) ($base['id'] ?? '');
                        break;
                    }
                }
            }
        }

        // 14. Dates (STNK & KIR)
        $stnkExpiresAt = null;
        $kirExpiresAt = null;

        if (preg_match('/\b(?:stnk|pajak)\s*(?:s\/?d|sampai|hingga|berlaku|exp|expires?)?\s*[:=]?\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/i', $text, $stnkMatches)) {
            try {
                $stnkExpiresAt = Carbon::parse(str_replace('/', '-', $stnkMatches[1]))->format('Y-m-d');
            } catch (Throwable) {
                // Ignore parse errors
            }
        }

        if (preg_match('/\b(?:kir|uji kir)\s*(?:s\/?d|sampai|hingga|berlaku|exp|expires?)?\s*[:=]?\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/i', $text, $kirMatches)) {
            try {
                $kirExpiresAt = Carbon::parse(str_replace('/', '-', $kirMatches[1]))->format('Y-m-d');
            } catch (Throwable) {
                // Ignore parse errors
            }
        }

        // Build composite Name if needed
        $composedName = '';
        if ($detectedBrand !== '' || $matchedModel !== '') {
            $nameParts = array_filter([$detectedBrand, $matchedModel, $modelYear]);
            $composedName = trim(implode(' ', $nameParts));
        }

        // Build Capacity Summary
        $capacitySummary = '';
        if ($capacitySeats) {
            $capacitySummary = "{$capacitySeats} Kursi Penumpang";
            if ($capacityKg) {
                $capacitySummary .= " + Muatan {$capacityKg} KG";
            }
        } elseif ($capacityKg) {
            $capacitySummary = "Kapasitas Angkut {$capacityKg} KG";
        }

        return [
            'name' => $composedName,
            'brand' => $detectedBrand,
            'plate_number' => $plateNumber,
            'type' => $type,
            'rental_class' => $rentalClass,
            'model_year' => $modelYear,
            'color' => $color,
            'capacity_seats' => $capacitySeats,
            'capacity_kg' => $capacityKg,
            'capacity' => $capacitySummary,
            'fuel_type' => $fuelType,
            'tank_capacity_liters' => $tankCapacity,
            'expected_km_per_liter' => $expectedKmLiter,
            'cost_per_km' => $costPerKm,
            'odometer_km' => $odometerKm ?? 0,
            'status' => 'active',
            'home_base_id' => $homeBaseId,
            'stnk_expires_at' => $stnkExpiresAt,
            'kir_expires_at' => $kirExpiresAt,
            'notes' => '',
        ];
    }

    /**
     * Sanitize and format data returned by Gemini.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int, array{id: int, name: string, code: string}>  $availableBases
     * @return array<string, mixed>
     */
    protected function sanitizeExtractedData(array $data, array $availableBases): array
    {
        $allowedTypes = ['car', 'van', 'truck', 'bus', 'motorcycle'];
        $allowedFuels = ['petrol', 'diesel', 'electric', 'hybrid'];
        $allowedStatuses = ['active', 'maintenance', 'out_of_service', 'retired'];
        $allowedRentalClasses = ['', 'economy', 'mpv', 'suv', 'van', 'premium', 'truck', 'other'];

        $type = in_array($data['type'] ?? '', $allowedTypes, true) ? $data['type'] : 'car';
        $fuelType = in_array($data['fuel_type'] ?? '', $allowedFuels, true) ? $data['fuel_type'] : 'petrol';
        $status = in_array($data['status'] ?? '', $allowedStatuses, true) ? $data['status'] : 'active';
        $rentalClass = in_array($data['rental_class'] ?? '', $allowedRentalClasses, true) ? $data['rental_class'] : '';

        $homeBaseId = (string) ($data['home_base_id'] ?? '');
        $validBaseIds = array_map(fn ($b) => (string) ($b['id'] ?? ''), $availableBases);
        if (! in_array($homeBaseId, $validBaseIds, true)) {
            $homeBaseId = '';
        }

        // Format dates
        $stnk = null;
        if (! empty($data['stnk_expires_at'])) {
            try {
                $stnk = Carbon::parse($data['stnk_expires_at'])->format('Y-m-d');
            } catch (Throwable) {
                $stnk = null;
            }
        }

        $kir = null;
        if (! empty($data['kir_expires_at'])) {
            try {
                $kir = Carbon::parse($data['kir_expires_at'])->format('Y-m-d');
            } catch (Throwable) {
                $kir = null;
            }
        }

        return [
            'name' => (string) ($data['name'] ?? ''),
            'brand' => (string) ($data['brand'] ?? ''),
            'plate_number' => strtoupper(trim((string) ($data['plate_number'] ?? ''))),
            'type' => $type,
            'rental_class' => $rentalClass,
            'model_year' => ! empty($data['model_year']) ? (int) $data['model_year'] : null,
            'color' => (string) ($data['color'] ?? ''),
            'capacity_seats' => ! empty($data['capacity_seats']) ? (int) $data['capacity_seats'] : null,
            'capacity_kg' => ! empty($data['capacity_kg']) ? (float) $data['capacity_kg'] : null,
            'capacity' => (string) ($data['capacity'] ?? ''),
            'fuel_type' => $fuelType,
            'tank_capacity_liters' => ! empty($data['tank_capacity_liters']) ? (float) $data['tank_capacity_liters'] : null,
            'expected_km_per_liter' => ! empty($data['expected_km_per_liter']) ? (float) $data['expected_km_per_liter'] : null,
            'cost_per_km' => ! empty($data['cost_per_km']) ? (float) $data['cost_per_km'] : null,
            'odometer_km' => ! empty($data['odometer_km']) ? (int) $data['odometer_km'] : 0,
            'status' => $status,
            'home_base_id' => $homeBaseId,
            'stnk_expires_at' => $stnk,
            'kir_expires_at' => $kir,
            'notes' => (string) ($data['notes'] ?? ''),
        ];
    }
}
