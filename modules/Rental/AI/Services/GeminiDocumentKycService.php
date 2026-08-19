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

class GeminiDocumentKycService implements DocumentKycServiceInterface
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
     * Analyze uploaded KTP & SIM documents for a rental.
     */
    public function analyzeRentalKyc(Rental $rental): KycDocumentResult
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.');
        }

        $ktpPath = $rental->passenger_ktp_path;
        $simPath = $rental->passenger_sim_path;

        if (blank($ktpPath) && blank($simPath)) {
            throw new RuntimeException('Dokumen KTP atau SIM belum diunggah untuk rental ini.');
        }

        $parts = [];
        $rental->loadMissing('partner');
        $partnerName = $rental->partner?->name ?? 'Pelanggan';
        $startDate = $rental->start_date?->format('Y-m-d') ?? now()->format('Y-m-d');
        $endDate = $rental->end_date?->format('Y-m-d') ?? now()->addDays(1)->format('Y-m-d');

        $prompt = <<<PROMPT
Anda adalah asisten verifikasi identitas (KYC Document Auditor) profesional untuk sistem rental kendaraan di Indonesia.
Tugas Anda adalah memeriksa foto dokumen KTP dan/atau SIM yang diunggah oleh pelanggan.

Konteks Sewa:
- Nama Pelanggan di Sistem: {$partnerName}
- Tanggal Mulai Sewa: {$startDate}
- Tanggal Akhir Sewa: {$endDate}

Instruksi Analisis:
1. Periksa foto KTP jika ada:
   - Ekstrak NIK (16 digit), Nama Lengkap, Tanggal Lahir (YYYY-MM-DD), Alamat, Agama, Pekerjaan.
   - Evaluasi keaslian/kejelasan dokumen (skor keyakinan 0.0 - 1.0).
2. Periksa foto SIM jika ada:
   - Ekstrak Nomor SIM, Golongan SIM (contoh: "SIM A", "SIM B1", "SIM C"), Nama Lengkap, Masa Berlaku / Expires At (YYYY-MM-DD).
   - Tentukan apakah SIM sudah kedaluwarsa (is_expired).
3. Evaluasi Kesesuaian:
   - Hitung kesamaan nama di dokumen dengan Nama Pelanggan di Sistem ({$partnerName}).
   - Periksa apakah SIM masih berlaku sampai tanggal akhir sewa ({$endDate}).
   - Buat daftar temuan/masalah (issues) jika ada.
4. Buat kesimpulan ringkas dalam bahasa Indonesia pada field `summary`.

Format Output WAJIB JSON:
{
  "status": "verified" | "flagged" | "rejected" | "unclear",
  "summary": "KTP dan SIM valid. Masa berlaku SIM aktif hingga 2028-11-15.",
  "ktp": {
    "nik": "3271012345670001",
    "name": "NAMA DI KTP",
    "birth_date": "1990-05-12",
    "address": "Alamat KTP",
    "religion": "Islam",
    "occupation": "Karyawan Swasta",
    "confidence": 0.95
  },
  "sim": {
    "license_number": "900512345678",
    "license_type": "SIM A",
    "name": "NAMA DI SIM",
    "expires_at": "2028-11-15",
    "is_expired": false,
    "confidence": 0.94
  },
  "checks": {
    "name_match_score": 0.98,
    "issues": []
  }
}
PROMPT;

        $parts[] = ['text' => $prompt];

        if (filled($ktpPath)) {
            $ktpPart = $this->resolveImagePart($ktpPath);
            if ($ktpPart !== null) {
                $parts[] = ['text' => '[DOKUMEN KTP]'];
                $parts[] = $ktpPart;
            }
        }

        if (filled($simPath)) {
            $simPart = $this->resolveImagePart($simPath);
            if ($simPart !== null) {
                $parts[] = ['text' => '[DOKUMEN SIM]'];
                $parts[] = $simPart;
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
                'temperature' => 0.1,
            ],
        ];

        $response = Http::timeout(45)->post($url, $payload);

        if (! $response->successful()) {
            Log::error('Gemini KYC API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException('Gagal menghubungi AI KYC API: '.($response->json('error.message') ?? $response->body()));
        }

        $rawJson = $response->json();
        $text = $rawJson['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        $parsed = json_decode($text, true) ?: [];

        $result = $this->evaluateKycRisk($parsed, $rental, $rawJson);

        // Save assessment to rental
        $rental->forceFill([
            'ai_kyc_assessment' => $result->toArray(),
        ])->save();

        return $result;
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
            throw new RuntimeException('Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.');
        }

        $imagePart = $this->resolveImagePart($imageSource);
        if ($imagePart === null) {
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

        $url = sprintf('%s/models/%s:generateContent?key=%s', $this->baseUrl, $this->model, $this->apiKey);

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                        $imagePart,
                    ],
                ],
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
                'temperature' => 0.1,
            ],
        ];

        $response = Http::timeout(35)->post($url, $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Gagal melakukan OCR dokumen: '.($response->json('error.message') ?? $response->body()));
        }

        $rawJson = $response->json();
        $text = $rawJson['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        $parsed = json_decode($text, true) ?: [];

        return [
            'doc_type' => (string) ($parsed['doc_type'] ?? 'unknown'),
            'confidence' => (float) ($parsed['confidence'] ?? 0.85),
            'data' => (array) ($parsed['data'] ?? []),
            'raw' => $rawJson,
        ];
    }

    /**
     * @param  array<string, mixed>  $parsed
     * @param  array<string, mixed>  $rawJson
     */
    protected function evaluateKycRisk(array $parsed, Rental $rental, array $rawJson): KycDocumentResult
    {
        $ktp = isset($parsed['ktp']) && is_array($parsed['ktp']) ? $parsed['ktp'] : null;
        $sim = isset($parsed['sim']) && is_array($parsed['sim']) ? $parsed['sim'] : null;

        $issues = [];
        $riskScore = 100;
        $simValidForRental = true;
        $isBlacklisted = (bool) ($rental->partner?->is_blacklisted ?? false);

        if ($isBlacklisted) {
            $issues[] = '⚠️ Pelanggan terdaftar dalam daftar blacklist tenant (Alasan: '.($rental->partner?->blacklist_reason ?? 'Tidak tercatat').').';
            $riskScore -= 50;
        }

        // Validate SIM Expiry vs Rental End Date
        if ($sim !== null && ! empty($sim['expires_at'])) {
            try {
                $simExpiry = Carbon::parse($sim['expires_at'])->startOfDay();
                $rentalEnd = $rental->end_date ? Carbon::parse($rental->end_date)->startOfDay() : now()->startOfDay();

                if ($simExpiry->isPast()) {
                    $simValidForRental = false;
                    $sim['is_expired'] = true;
                    $issues[] = sprintf('❌ SIM sudah kedaluwarsa pada tanggal %s.', $sim['expires_at']);
                    $riskScore -= 40;
                } elseif ($simExpiry->lessThan($rentalEnd)) {
                    $simValidForRental = false;
                    $issues[] = sprintf('⚠️ Masa berlaku SIM (%s) berakhir sebelum jadwal sewa selesai (%s).', $sim['expires_at'], $rentalEnd->format('Y-m-d'));
                    $riskScore -= 25;
                } elseif ($simExpiry->diffInDays(now()) <= 30) {
                    $issues[] = sprintf('ℹ️ Masa berlaku SIM (%s) akan segera berakhir dalam 30 hari.', $sim['expires_at']);
                    $riskScore -= 10;
                }
            } catch (\Throwable) {
                // Ignore parse errors
            }
        }

        // Validate Name Match
        $nameMatchScore = (float) ($parsed['checks']['name_match_score'] ?? 1.0);
        if ($nameMatchScore < 0.70) {
            $issues[] = sprintf('⚠️ Nama pada dokumen memiliki kesamaan rendah (%.0f%%) dengan nama pemesan.', $nameMatchScore * 100);
            $riskScore -= 20;
        }

        if (isset($parsed['checks']['issues']) && is_array($parsed['checks']['issues'])) {
            foreach ($parsed['checks']['issues'] as $aiIssue) {
                if (is_string($aiIssue) && ! in_array($aiIssue, $issues, true)) {
                    $issues[] = $aiIssue;
                }
            }
        }

        $riskScore = max(0, min(100, $riskScore));

        if ($riskScore >= 80) {
            $riskLevel = 'low';
            $status = 'verified';
        } elseif ($riskScore >= 50) {
            $riskLevel = 'medium';
            $status = 'flagged';
        } else {
            $riskLevel = 'high';
            $status = 'rejected';
        }

        $summary = (string) ($parsed['summary'] ?? ($riskLevel === 'low' ? 'Dokumen KTP dan SIM valid dan aman.' : 'Ditemukan catatan risiko pada verifikasi dokumen.'));

        return new KycDocumentResult(
            status: $status,
            riskLevel: $riskLevel,
            riskScore: $riskScore,
            summary: $summary,
            ktp: $ktp,
            sim: $sim,
            checks: [
                'name_match_score' => $nameMatchScore,
                'sim_valid_for_rental' => $simValidForRental,
                'is_blacklisted' => $isBlacklisted,
                'issues' => $issues,
            ],
            rawResponse: $rawJson,
            scannedAt: now()->toIso8601String(),
        );
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
}
