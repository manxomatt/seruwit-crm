<?php

namespace Modules\Rental\AI\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Rental\AI\Contracts\VisionInspectionServiceInterface;
use Modules\Rental\AI\DTO\DetectedDamageItem;
use Modules\Rental\AI\DTO\HandoverInspectionResult;
use RuntimeException;

class GeminiVisionInspectionService implements VisionInspectionServiceInterface
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
     * Inspect checkout photos vs return photos.
     *
     * @param  list<string>  $checkoutPhotos
     * @param  list<string>  $returnPhotos
     * @param  array<string, mixed>  $context
     */
    public function inspectHandover(
        array $checkoutPhotos,
        array $returnPhotos,
        array $context = [],
    ): HandoverInspectionResult {
        if ($this->apiKey === '') {
            throw new RuntimeException('Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.');
        }

        if ($returnPhotos === []) {
            throw new RuntimeException('Return photos are required for AI visual inspection.');
        }

        $parts = [];
        $prompt = $this->buildPrompt($context, count($checkoutPhotos), count($returnPhotos));
        $parts[] = ['text' => $prompt];

        // Attach Checkout photos
        foreach ($checkoutPhotos as $idx => $photo) {
            $imagePart = $this->resolveImagePart($photo);
            if ($imagePart !== null) {
                $parts[] = ['text' => sprintf('[FOTO CHECKOUT AWAL #%d]', $idx + 1)];
                $parts[] = $imagePart;
            }
        }

        // Attach Return photos
        foreach ($returnPhotos as $idx => $photo) {
            $imagePart = $this->resolveImagePart($photo);
            if ($imagePart !== null) {
                $parts[] = ['text' => sprintf('[FOTO RETURN/PENGEMBALIAN #%d]', $idx + 1)];
                $parts[] = $imagePart;
            }
        }

        $url = sprintf('%s/models/%s:generateContent?key=%s', $this->baseUrl, $this->model, $this->apiKey);

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => $parts,
                ],
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
                'temperature' => 0.2,
            ],
        ];

        $response = Http::timeout(45)->post($url, $payload);

        if (! $response->successful()) {
            Log::error('Gemini Vision API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException('Failed to communicate with AI Vision API: '.($response->json('error.message') ?? $response->body()));
        }

        $rawJson = $response->json();
        $text = $rawJson['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        $parsed = json_decode($text, true) ?: [];

        return $this->parseResult($parsed, $rawJson);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    protected function buildPrompt(array $context, int $checkoutCount, int $returnCount): string
    {
        $vehicleInfo = $context['vehicle_info'] ?? 'Kendaraan Rental';
        $startOdo = $context['start_odometer'] ?? null;
        $startFuel = $context['start_fuel_level'] ?? null;

        return <<<PROMPT
Anda adalah asisten ahli inspeksi kendaraan rental profesional (Vehicle Damage & Handover Inspector).
Tugas Anda adalah memeriksa foto serah terima kendaraan rental.

Konteks Kendaraan:
- Unit: {$vehicleInfo}
- Odometer Awal (Checkout): {$startOdo} km
- BBM Awal (Checkout): {$startFuel}
- Jumlah Foto Checkout Awal: {$checkoutCount}
- Jumlah Foto Return Pengembalian: {$returnCount}

Instruksi Analisis:
1. Periksa foto dashboard jika ada:
   - Ekstrak angka odometer total (KM) jika terlihat jelas.
   - Ekstrak level indikator BBM (pilih salah satu: "empty", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "full").
2. Bandingkan foto kondisi bodi pada saat CHECKOUT AWAL vs RETURN PENGEMBALIAN:
   - Identifikasi kerusakan BARU yang terjadi selama masa sewa (misal goresan/scratches, penyok/dents, retak mika lampu, baret velg).
   - Abaikan kotoran/debu biasa atau kerusakan yang memang sudah ada sejak checkout awal.
   - Tentukan panel yang terkena (contoh: "front_bumper", "rear_bumper", "left_front_door", "right_rear_fender", "windshield", "hood", "roof", "wheels", dll).
   - Tentukan tingkat keparahan: "minor" (baret tipis), "moderate" (penyok/baret dalam cat), "severe" (pecah/rusak berat).
   - Berikan estimasi biaya perbaikan wajar di bengkel Indonesia (IDR/Rupiah), misal baret per panel Rp 250.000 - Rp 500.000, perbaikan penyok PDR Rp 300.000 - Rp 600.000, ganti mika Rp 700.000+.
3. Tentukan overall_status: "clean" jika tidak ada kerusakan baru, "minor_damage" jika ada kerusakan ringan-sedang, atau "severe_damage" jika ada kerusakan berat.
4. Buat ringkasan ramah dalam bahasa Indonesia pada field `condition_summary`.

Format Output WAJIB dalam JSON valid berikut:
{
  "extracted_odometer": 45120, // integer atau null jika tidak ada foto dashboard
  "extracted_fuel_level": "3/4", // string atau null
  "overall_status": "clean" | "minor_damage" | "severe_damage",
  "condition_summary": "Kondisi unit bersih. Ditemukan 1 goresan baru pada bumper depan kiri.",
  "damages": [
    {
      "panel": "front_bumper_left",
      "damage_type": "scratch",
      "severity": "minor",
      "description": "Goresan vertikal sekitar 10cm pada bagian sudut bumper depan kiri",
      "confidence_score": 0.92,
      "photo_index": 1,
      "suggested_repair_cost": 350000,
      "is_new_damage": true
    }
  ]
}
PROMPT;
    }

    /**
     * @return array{inline_data: array{mime_type: string, data: string}}|null
     */
    protected function resolveImagePart(string $photo): ?array
    {
        if (str_starts_with($photo, 'data:image/')) {
            $commaPos = strpos($photo, ',');
            if ($commaPos === false) {
                return null;
            }

            $meta = substr($photo, 5, $commaPos - 5);
            $mimeType = explode(';', $meta)[0] ?: 'image/jpeg';
            $data = substr($photo, $commaPos + 1);

            return [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data' => $data,
                ],
            ];
        }

        // It is a storage path (e.g. rental/handover-photos/xxx.jpg)
        if (Storage::disk('public')->exists($photo)) {
            $bytes = Storage::disk('public')->get($photo);
            $mimeType = Storage::disk('public')->mimeType($photo) ?: 'image/jpeg';

            return [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data' => base64_encode($bytes),
                ],
            ];
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $parsed
     * @param  array<string, mixed>  $rawJson
     */
    protected function parseResult(array $parsed, array $rawJson): HandoverInspectionResult
    {
        $damages = [];
        if (isset($parsed['damages']) && is_array($parsed['damages'])) {
            foreach ($parsed['damages'] as $damageData) {
                if (is_array($damageData)) {
                    $damages[] = DetectedDamageItem::fromArray($damageData);
                }
            }
        }

        $overallStatus = (string) ($parsed['overall_status'] ?? HandoverInspectionResult::STATUS_CLEAN ?? 'clean');
        if (! in_array($overallStatus, ['clean', 'minor_damage', 'severe_damage'], true)) {
            $overallStatus = count($damages) > 0 ? 'minor_damage' : 'clean';
        }

        return new HandoverInspectionResult(
            extractedOdometer: isset($parsed['extracted_odometer']) ? (int) $parsed['extracted_odometer'] : null,
            extractedFuelLevel: isset($parsed['extracted_fuel_level']) ? (string) $parsed['extracted_fuel_level'] : null,
            conditionSummary: (string) ($parsed['condition_summary'] ?? 'Inspeksi AI selesai.'),
            overallStatus: $overallStatus,
            damages: $damages,
            rawResponse: $rawJson,
            modelUsed: $this->model,
        );
    }
}
