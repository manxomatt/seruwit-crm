<?php

namespace Modules\Rental\AI\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\AI\DTO\KycDocumentResult;
use Modules\Rental\Models\Rental;
use RuntimeException;
use Throwable;

class GroqDocumentKycService implements DocumentKycServiceInterface
{
    protected string $apiKey;

    protected string $model;

    protected string $baseUrl;

    public function __construct(
        ?string $apiKey = null,
        ?string $model = null,
        ?string $baseUrl = null,
    ) {
        $this->apiKey = $apiKey ?? (function_exists('config') ? (string) config('services.groq.api_key', '') : '');
        $this->model = $model ?? (function_exists('config') ? (string) config('services.groq.model', 'llama-3.2-11b-vision-preview') : 'llama-3.2-11b-vision-preview');
        $this->baseUrl = $baseUrl ?? (function_exists('config') ? (string) config('services.groq.base_url', 'https://api.groq.com/openai/v1') : 'https://api.groq.com/openai/v1');
    }

    public function getModel(): string
    {
        return $this->model;
    }

    /**
     * Analyze uploaded KTP & SIM documents for a rental.
     */
    public function analyzeRentalKyc(Rental $rental): KycDocumentResult
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('Groq API key belum dikonfigurasi. Silakan atur GROQ_API_KEY di file .env. Dapatkan API key gratis di https://console.groq.com/keys');
        }

        $ktpPath = $rental->passenger_ktp_path;
        $simPath = $rental->passenger_sim_path;

        if (blank($ktpPath) && blank($simPath)) {
            throw new RuntimeException('Dokumen KTP atau SIM belum diunggah untuk rental ini.');
        }

        $rental->loadMissing('partner');
        $partnerName = $rental->partner?->name ?? 'Pelanggan';
        $startDate = $rental->start_date?->format('Y-m-d') ?? now()->format('Y-m-d');
        $endDate = $rental->end_date?->format('Y-m-d') ?? now()->addDays(1)->format('Y-m-d');

        $prompt = <<<PROMPT
Anda adalah asisten verifikasi identitas (KYC Document Auditor) profesional untuk sistem rental kendaraan di Indonesia.
Tugas Anda adalah memvalidasi foto dokumen identitas (KTP dan/atau SIM) pelanggan berikut dan mengevaluasi kelayakannya untuk sewa rental mobil.

Data Reservasi Sistem:
- Nama Pelanggan: {$partnerName}
- Tanggal Mulai Sewa: {$startDate}
- Tanggal Selesai Sewa: {$endDate}

Tugas Evaluasi:
1. Ekstrak data teks dari KTP (NIK, Nama Lengkap, Tanggal Lahir, Alamat, Agama, Pekerjaan).
2. Ekstrak data teks dari SIM (Nomor SIM, Golongan SIM, Nama Lengkap, Tanggal Kadaluarsa).
3. Verifikasi apakah nama di KTP dan/atau SIM cocok/konsisten dengan nama pelanggan sistem ({$partnerName}).
4. Verifikasi apakah masa berlaku SIM masih aktif hingga akhir masa sewa ({$endDate}).
5. Hitung `name_match_score` (0.00 hingga 1.00) dan tentukan tingkat risiko fraud/kelayakan:
   - status: "verified" (dokumen valid, nama cocok, SIM aktif), "review_needed" (ada ketidakcocokan ringan / foto kurang tajam), atau "rejected" (SIM kedaluwarsa, nama beda total, atau dokumen palsu).
   - risk_level: "low", "medium", atau "high".
   - risk_score: 0 - 100 (semakin tinggi semakin berisiko).

Format Output WAJIB JSON murni:
{
  "status": "verified" | "review_needed" | "rejected",
  "risk_level": "low" | "medium" | "high",
  "risk_score": 10,
  "summary": "Ringkasan hasil audit KYC dokumen dalam Bahasa Indonesia",
  "ktp": {
    "nik": "3271012345670001",
    "name": "NAMA DI KTP",
    "birth_date": "YYYY-MM-DD",
    "address": "Alamat KTP lengkap",
    "religion": "Islam",
    "occupation": "Karyawan Swasta",
    "confidence": 0.95
  },
  "sim": {
    "license_number": "123456789012",
    "license_type": "SIM A",
    "name": "NAMA DI SIM",
    "expires_at": "YYYY-MM-DD",
    "is_expired": false,
    "confidence": 0.95
  },
  "checks": {
    "name_match_score": 1.0,
    "sim_valid_for_rental": true,
    "is_blacklisted": false,
    "issues": []
  }
}
PROMPT;

        $content = [
            ['type' => 'text', 'text' => $prompt],
        ];

        if (filled($ktpPath)) {
            $ktpDataUrl = $this->resolveDataUrl($ktpPath);
            if ($ktpDataUrl) {
                $content[] = [
                    'type' => 'image_url',
                    'image_url' => ['url' => $ktpDataUrl],
                ];
            }
        }

        if (filled($simPath)) {
            $simDataUrl = $this->resolveDataUrl($simPath);
            if ($simDataUrl) {
                $content[] = [
                    'type' => 'image_url',
                    'image_url' => ['url' => $simDataUrl],
                ];
            }
        }

        $rawJson = $this->callGroqApi($content, 45, 'Analisis KYC');
        $text = $rawJson['choices'][0]['message']['content'] ?? '{}';
        $parsed = json_decode($text, true) ?: [];

        return new KycDocumentResult(
            status: (string) ($parsed['status'] ?? 'review_needed'),
            riskLevel: (string) ($parsed['risk_level'] ?? 'medium'),
            riskScore: (int) ($parsed['risk_score'] ?? 50),
            summary: (string) ($parsed['summary'] ?? 'Audit dokumen berhasil diproses via Groq AI.'),
            ktp: isset($parsed['ktp']) && is_array($parsed['ktp']) ? $parsed['ktp'] : null,
            sim: isset($parsed['sim']) && is_array($parsed['sim']) ? $parsed['sim'] : null,
            checks: isset($parsed['checks']) && is_array($parsed['checks']) ? $parsed['checks'] : [
                'name_match_score' => 0.8,
                'sim_valid_for_rental' => true,
                'is_blacklisted' => false,
                'issues' => [],
            ],
            rawResponse: $rawJson,
            scannedAt: Carbon::now()->toIso8601String(),
        );
    }

    /**
     * Scan a single document (KTP or SIM) from base64 data-URL or storage path.
     *
     * @return array{
     *     doc_type: 'ktp'|'sim'|'unknown',
     *     data: array<string, mixed>,
     *     confidence: float,
     *     raw: array<string, mixed>
     * }
     */
    public function scanSingleDocument(string $imageSource, string $docType = 'auto'): array
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('Groq API key belum dikonfigurasi. Silakan pasang GROQ_API_KEY di file .env. Dapatkan API key gratis di https://console.groq.com/keys');
        }

        $dataUrl = $this->resolveDataUrl($imageSource);
        if ($dataUrl === null) {
            throw new RuntimeException('Format gambar dokumen tidak valid atau tidak ditemukan.');
        }

        $prompt = <<<'PROMPT'
Anda adalah OCR Scanner dokumen identitas Indonesia (KTP dan SIM).
Tugas Anda adalah membaca foto dokumen identitas dan mengekstrak data secara akurat.

Petunjuk:
1. Tentukan apakah ini foto "ktp", "sim", atau "unknown".
2. Jika KTP: Ekstrak `nik` (16 digit), `name` (Nama lengkap), `birth_date` (YYYY-MM-DD), `address` (Alamat lengkap), `religion`, `occupation`.
3. Jika SIM: Ekstrak `license_number`, `license_type` (contoh: "SIM A"), `name`, `birth_date`, `address`, `expires_at` (YYYY-MM-DD).

Format Output WAJIB JSON:
{
  "doc_type": "ktp" | "sim" | "unknown",
  "confidence": 0.95,
  "data": {
    "name": "BUDI SANTOSO",
    "nik": "3271012345670001",
    "birth_date": "1990-05-12",
    "address": "Jl. Merdeka No. 10, Jakarta",
    "license_number": "900512345678",
    "license_type": "SIM A",
    "expires_at": "2028-05-12"
  }
}
PROMPT;

        $content = [
            ['type' => 'text', 'text' => $prompt],
            [
                'type' => 'image_url',
                'image_url' => ['url' => $dataUrl],
            ],
        ];

        $rawJson = $this->callGroqApi($content, 35, 'OCR dokumen');
        $text = $rawJson['choices'][0]['message']['content'] ?? '{}';
        $parsed = json_decode($text, true) ?: [];

        return [
            'doc_type' => (string) ($parsed['doc_type'] ?? 'unknown'),
            'confidence' => (float) ($parsed['confidence'] ?? 0.85),
            'data' => (array) ($parsed['data'] ?? []),
            'raw' => $rawJson,
        ];
    }

    /**
     * Call Groq API with candidate model fallbacks and friendly error handling.
     *
     * @param  list<array<string, mixed>>  $content
     * @return array<string, mixed>
     */
    protected function callGroqApi(array $content, int $timeout = 35, string $operationDesc = 'OCR dokumen'): array
    {
        $candidateModels = array_values(array_unique([
            $this->model,
            'llama-3.2-11b-vision-preview',
            'llama-3.2-90b-vision-preview',
        ]));

        $lastResponse = null;

        foreach ($candidateModels as $candidateModel) {
            $endpoint = rtrim($this->baseUrl, '/').'/chat/completions';

            $payload = [
                'model' => $candidateModel,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $content,
                    ],
                ],
                'response_format' => ['type' => 'json_object'],
                'temperature' => 0.1,
            ];

            try {
                $response = Http::timeout($timeout)
                    ->withToken($this->apiKey)
                    ->post($endpoint, $payload);
            } catch (Throwable $netEx) {
                Log::warning("[GroqDocumentKyc] Network error on model {$candidateModel}: ".$netEx->getMessage());
                $lastResponse = null;

                continue;
            }

            if ($response->successful()) {
                $json = $response->json();
                if (is_array($json) && ! empty($json['choices'][0]['message']['content'])) {
                    return $json;
                }
            }

            $lastResponse = $response;
            $statusCode = $response->status();
            $errorBody = $response->json('error') ?? [];
            $errorMessage = $errorBody['message'] ?? $response->body();

            Log::warning("[GroqDocumentKyc] Groq API returned {$statusCode} for model {$candidateModel}: {$errorMessage}");

            if ($statusCode === 401) {
                throw new RuntimeException('Groq API Key tidak valid. Harap periksa kembali GROQ_API_KEY di file .env Anda.');
            }

            if ($statusCode === 429) {
                throw new RuntimeException('Batas kuota penggunaan Groq API tercapai (Rate Limit). Silakan coba lagi beberapa saat.');
            }
        }

        $status = $lastResponse ? $lastResponse->status() : 'Unknown';
        $errorMsg = $lastResponse ? ($lastResponse->json('error.message') ?? $lastResponse->body()) : 'Koneksi ke Groq API gagal';

        throw new RuntimeException("Gagal melakukan {$operationDesc} dengan Groq AI ({$status}): {$errorMsg}");
    }

    /**
     * Resolve image source (base64 data-URL or relative storage path) to data URI.
     */
    protected function resolveDataUrl(string $source): ?string
    {
        $trimmed = trim($source);

        if (str_starts_with($trimmed, 'data:image/')) {
            return $trimmed;
        }

        $disk = Storage::disk('public');
        if ($disk->exists($trimmed)) {
            $binary = $disk->get($trimmed);
            $mime = $disk->mimeType($trimmed) ?: 'image/jpeg';

            return 'data:'.$mime.';base64,'.base64_encode($binary);
        }

        if (file_exists($trimmed) && is_readable($trimmed)) {
            $binary = (string) file_get_contents($trimmed);
            $mime = mime_content_type($trimmed) ?: 'image/jpeg';

            return 'data:'.$mime.';base64,'.base64_encode($binary);
        }

        return null;
    }
}
