<?php

namespace Modules\Fleet\AI\Services;

use App\Support\CentralAiSettings;
use App\Support\IndonesiaGeoData;
use App\Support\NominatimGeocoder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\Fleet\AI\Contracts\FleetBaseAiGeneratorServiceInterface;
use Throwable;

class GeminiFleetBaseAiGeneratorService implements FleetBaseAiGeneratorServiceInterface
{
    public function __construct(
        protected ?string $apiKey = null,
        protected string $model = 'gemini-3.6-flash',
        protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta',
        protected ?NominatimGeocoder $geocoder = null,
    ) {
        $this->apiKey = $apiKey ?? (string) config('services.gemini.api_key', '');
        $configuredModel = (string) config('services.gemini.model', 'gemini-3.6-flash');
        $this->model = ($configuredModel === 'gemini-1.5-flash' || blank($configuredModel)) ? 'gemini-3.6-flash' : str_replace('models/', '', $configuredModel);
        $this->baseUrl = (string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta');
        $this->geocoder = $geocoder ?? app(NominatimGeocoder::class);
    }

    /**
     * Parse and generate structured fleet base attributes from unstructured text.
     *
     * @param  array<int, array{id: int, name: string, email: string}>  $availableManagers
     * @return array<string, mixed>
     */
    public function generateFromText(string $text, array $availableManagers = []): array
    {
        $text = trim($text);
        if ($text === '') {
            return [];
        }

        if (CentralAiSettings::isEnabled() && filled($this->apiKey)) {
            try {
                $geminiResult = $this->callGeminiApi($text, $availableManagers);
                if (! empty($geminiResult)) {
                    return $this->sanitizeExtractedData($geminiResult, $availableManagers);
                }
            } catch (Throwable $e) {
                Log::warning('GeminiFleetBaseAiGeneratorService failed, falling back to heuristic parsing', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $this->parseHeuristically($text, $availableManagers);
    }

    /**
     * Call Gemini API with structured prompt.
     *
     * @param  array<int, array{id: int, name: string, email: string}>  $availableManagers
     * @return array<string, mixed>
     */
    protected function callGeminiApi(string $text, array $availableManagers): array
    {
        $managersJson = json_encode(array_map(fn ($m) => [
            'id' => $m['id'] ?? null,
            'name' => $m['name'] ?? '',
            'email' => $m['email'] ?? '',
        ], $availableManagers), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Anda adalah asisten AI spesialis manajemen pangkalan dan fasilitas pool/depot armada logistik & rental di Indonesia.
Tugas Anda adalah membaca teks input deskripsi bebas dari pengguna dan mengekstrak semua spesifikasi Pool & Base Armada ke dalam format JSON yang terstruktur.

Daftar Manajer / User yang tersedia di sistem:
{$managersJson}

Skema JSON Output Wajib (hanya kembalikan JSON murni):
{
  "code": string (Kode unik huruf kapital, contoh: "JKT-CKG-01", "BDG-PST-01", "SBY-RKT-02"),
  "name": string (Nama pangkalan, contoh: "Depot Utama Cakung Logistik" atau "Pool Satelit Bandara Soetta"),
  "kind": "depot" | "yard" | "satellite" | "workshop_base",
  "status": "active" | "inactive",
  "address": string (Alamat jalan lengkap),
  "city": string (Kota / Kabupaten di Indonesia, contoh: "Jakarta Timur", "Bandung", "Surabaya", "Tangerang"),
  "province": string (Provinsi di Indonesia, contoh: "DKI Jakarta", "Jawa Barat", "Jawa Timur", "Banten"),
  "zip": string (Kode pos 5 digit, contoh: "13910"),
  "latitude": string (Koordinat lintang desimal, contoh: "-6.18231"),
  "longitude": string (Koordinat bujur desimal, contoh: "106.94521"),
  "phone": string (Nomor telepon kantor / WA base),
  "email": string (Email resmi base),
  "opens_at": "HH:mm" (Jam buka operasional, contoh: "08:00" atau "00:00" jika 24 jam),
  "closes_at": "HH:mm" (Jam tutup operasional, contoh: "17:00" atau "23:59" jika 24 jam),
  "timezone": "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura",
  "vehicle_capacity": integer (Kapasitas jumlah unit kendaraan parkir, contoh: 50) | null,
  "allows_overnight": boolean (true jika boleh parkir inap / fasilitas 24 jam),
  "service_radius_km": number (Radius jangkauan layanan antar-jemput dalam KM, contoh: 35) | null,
  "manager_id": string (ID manajer yang paling cocok dari daftar manajer jika disebutkan namanya) | "",
  "notes": string (Petunjuk akses masuk, pos satpam 24 jam, fasilitas genset/bengkel, aturan SOP) | ""
}

Teks Deskripsi Base/Pool dari Pengguna:
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
            $cleaned = preg_replace('/^```(?:json)?\s+|\s+```$/m', '', trim($responseText));
            $decoded = json_decode($cleaned, true);
        }

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Smart Heuristic and Pattern-Matching Parser for Fleet Bases.
     *
     * @param  array<int, array{id: int, name: string, email: string}>  $availableManagers
     * @return array<string, mixed>
     */
    public function parseHeuristically(string $text, array $availableManagers = []): array
    {
        $lower = strtolower($text);

        // 1. Kind detection
        $kind = 'depot';
        if (preg_match('/\b(workshop|bengkel|servis|service|maintenance|perbaikan|mekanik)\b/i', $text)) {
            $kind = 'workshop_base';
        } elseif (preg_match('/\b(yard|parkir|lapangan|pool parkir|penyimpanan|inap)\b/i', $text)) {
            $kind = 'yard';
        } elseif (preg_match('/\b(satelit|satellite|cabang|pos|drop point|titik drop|transit)\b/i', $text)) {
            $kind = 'satellite';
        }

        // 2. Zip Code regex
        $zip = '';
        if (preg_match('/\b([1-9][0-9]{4})\b/', $text, $zipMatches)) {
            $zip = $zipMatches[1];
        }

        // 3. City & Province detection with known Indonesian coordinates
        $detectedCity = '';
        $detectedProvince = '';
        $latitude = '';
        $longitude = '';
        $timezone = 'Asia/Jakarta';

        // Check IndonesiaGeoData first
        $geo = IndonesiaGeoData::findLocation($text);
        if ($geo) {
            $detectedCity = $geo['city'];
            $detectedProvince = $geo['province'];
            $latitude = $geo['lat'];
            $longitude = $geo['lng'];
            $timezone = $geo['tz'];
        } elseif ($zip !== '') {
            $zipGeo = IndonesiaGeoData::findByPostalCode($zip);
            if ($zipGeo) {
                $detectedCity = $zipGeo['city'];
                $detectedProvince = $zipGeo['province'];
                $latitude = $zipGeo['lat'];
                $longitude = $zipGeo['lng'];
                $timezone = $zipGeo['tz'];
            }
        }

        // 4. Coordinates override if explicit in text (e.g. -6.1823, 106.9452)
        if (preg_match('/(-?\d{1,2}\.\d{4,8})\s*,\s*(\d{2,3}\.\d{4,8})/', $text, $coordMatches)) {
            $latitude = $coordMatches[1];
            $longitude = $coordMatches[2];
        }

        // 5. Code regex (e.g. JKT-CKG-01, BDG-PST-01, SBY-01, BDL-001)
        $code = '';
        if (preg_match('/(?:code|kode)\s*[:=]?\s*([A-Za-z0-9\-]+)/i', $text, $codePrefixMatches)) {
            $code = strtoupper(trim($codePrefixMatches[1]));
        } elseif (preg_match('/\b([A-Z]{2,4}-[A-Z0-9]{2,8}-\d{1,3}|[A-Z]{3,8}-\d{1,3})\b/', $text, $codeMatches)) {
            $code = strtoupper($codeMatches[1]);
        }

        // 6. Name extraction
        $name = '';
        if (preg_match('/(?:nama\s*(?:pool|base|pangkalan|cabang)?\s*[:=]\s*)([A-Za-z0-9\s\-]+?)(?=(?:,|\.|\n|kode|code|alamat|kapasitas|telp|buka|open|radius|$))/i', $text, $explicitName)) {
            $name = Str::title(trim($explicitName[1]));
        } elseif (preg_match('/(?:nama\s*(?:pool|base|pangkalan|cabang)?\s*[:=]?\s*|pool\s+|depot\s+|workshop\s+|cabang\s+)([A-Za-z0-9\s\-]+?)(?=(?:,|\.|\n|kode|code|alamat|kapasitas|telp|buka|open|radius|$))/i', $text, $nameMatches)) {
            $rawName = trim($nameMatches[1]);
            $lowerRaw = strtolower($rawName);

            $genericKeywords = ['utama', 'satelit', 'pusat', 'induk', 'parkir', 'bengkel', 'baru'];
            if (in_array($lowerRaw, $genericKeywords, true)) {
                $basePrefix = $kind === 'workshop_base' ? 'Workshop' : ($kind === 'satellite' ? 'Cabang Satelit' : ($kind === 'yard' ? 'Pool Parkir' : 'Depot Utama'));
                $name = $detectedCity !== '' ? "{$basePrefix} {$detectedCity}" : $basePrefix;
            } elseif (strlen($rawName) >= 3 && strlen($rawName) <= 60) {
                if (! preg_match('/^(pool|depot|workshop|cabang)/i', $rawName)) {
                    $prefix = $kind === 'workshop_base' ? 'Workshop ' : ($kind === 'satellite' ? 'Cabang Satelit ' : ($kind === 'yard' ? 'Pool Parkir ' : 'Depot Utama '));
                    $name = $prefix.Str::title($rawName);
                } else {
                    $name = Str::title($rawName);
                }
            }
        }

        if ($name === '') {
            $basePrefix = $kind === 'workshop_base' ? 'Workshop' : ($kind === 'satellite' ? 'Cabang Satelit' : ($kind === 'yard' ? 'Pool Parkir' : 'Depot Utama'));
            $name = $detectedCity !== '' ? "{$basePrefix} {$detectedCity}" : "{$basePrefix} Baru";
        }

        // Auto-generate code if empty
        if ($code === '') {
            $cityCode = $detectedCity !== '' ? strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $detectedCity), 0, 3)) : 'FLT';
            $code = "{$cityCode}-01";
        }

        // 7. Address extraction
        $address = '';
        if (preg_match('/(?:alamat\s*[:=]?\s*|(?:jl[n\.]?|jalan|kawasan|komplek|gedung|area)\s+)([A-Za-z0-9\s.,\-\/]+?)(?=(?:,|\n|kota|provinsi|telp|phone|hp|email|buka|open|operasional|jam|kapasitas|radius|kode|code|\b[1-9][0-9]{4}\b|$))/i', $text, $addrMatches)) {
            $rawAddr = trim($addrMatches[1], " \t\n\r\0\x0B,.-");
            if (strlen($rawAddr) >= 4) {
                $address = (! preg_match('/^(jl|jalan|kawasan|komplek|gedung|area)/i', $rawAddr) ? 'Jl. ' : '').Str::title($rawAddr);
            }
        }

        // Attempt forward geocoding refinement if address & city exist
        if ($this->geocoder && ($address !== '' || $detectedCity !== '')) {
            $searchQuery = trim("{$address}, {$detectedCity}, {$detectedProvince}", ' ,');
            $forwardResult = $this->geocoder->forward($searchQuery);
            if ($forwardResult) {
                if ($latitude === '' || $longitude === '') {
                    $latitude = (string) $forwardResult['latitude'];
                    $longitude = (string) $forwardResult['longitude'];
                }
                if ($detectedCity === '' && $forwardResult['city'] !== '') {
                    $detectedCity = $forwardResult['city'];
                }
                if ($detectedProvince === '' && $forwardResult['province'] !== '') {
                    $detectedProvince = $forwardResult['province'];
                }
                if ($zip === '' && $forwardResult['zip'] !== '') {
                    $zip = $forwardResult['zip'];
                }
            }
        }

        // 8. Phone regex
        $phone = '';
        if (preg_match('/\b((?:\+?62|0)(?:21|22|31|24|274|61|411|8[1-9])[\d\s-]{6,14})\b/', $text, $phoneMatches)) {
            $phone = preg_replace('/[^\d+]/', '', $phoneMatches[1]);
        }

        // 9. Email regex
        $email = '';
        if (preg_match('/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/', $text, $emailMatches)) {
            $email = strtolower($emailMatches[1]);
        }

        // 10. Vehicle Capacity
        $capacity = null;
        if (preg_match('/\b(?:kapasitas|daya tampung|tampung)\s*[:=]?\s*(\d+)\s*(?:unit|mobil|truk|kendaraan|armada|slot)?\b/i', $text, $capMatches)) {
            $capacity = (int) $capMatches[1];
        } elseif (preg_match('/\b(\d+)\s*(?:unit|mobil|truk|kendaraan|armada|slot)\b/i', $text, $capMatches2)) {
            $capacity = (int) $capMatches2[1];
        }

        // 11. Service radius
        $serviceRadius = null;
        if (preg_match('/\b(?:radius|jangkauan|layanan)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:km|kilometer)?\b/i', $text, $radMatches)) {
            $serviceRadius = (float) str_replace(',', '.', $radMatches[1]);
        } elseif (preg_match('/\b(\d+(?:[.,]\d+)?)\s*km\b/i', $text, $radMatches2)) {
            $serviceRadius = (float) str_replace(',', '.', $radMatches2[1]);
        }

        // 12. Operating Hours & Overnight
        $opensAt = '08:00';
        $closesAt = '17:00';
        $allowsOvernight = true;

        if (preg_match('/\b(24\s*jam|24h|buka\s*24\s*jam|nonstop|non-stop)\b/i', $text)) {
            $opensAt = '00:00';
            $closesAt = '23:59';
            $allowsOvernight = true;
        } elseif (preg_match('/\b(?:buka|open|operasional)\s*(\d{1,2})\s*jam\b/i', $text, $hrsMatch) || preg_match('/\b(\d{1,2})\s*jam\s*(?:operasional)?\b/i', $text, $hrsMatch)) {
            $hrs = (int) $hrsMatch[1];
            $opensAt = '08:00';
            $closesHour = min(23, 8 + $hrs);
            $closesAt = sprintf('%02d:00', $closesHour);
            if ($hrs < 24 && ! preg_match('/\b(inap|overnight)\b/i', $text)) {
                $allowsOvernight = false;
            }
        } else {
            if (preg_match('/\b(?:buka|jam|operasional)\s*[:=]?\s*(\d{1,2}[:.]\d{2})\s*(?:s\/?d|-|sampai|hingga)\s*(\d{1,2}[:.]\d{2})\b/i', $text, $timeMatches)) {
                $opensAt = str_replace('.', ':', str_pad($timeMatches[1], 5, '0', STR_PAD_LEFT));
                $closesAt = str_replace('.', ':', str_pad($timeMatches[2], 5, '0', STR_PAD_LEFT));
            }
            if (preg_match('/\b(tidak\s*(?:boleh|bisa)?\s*inap|dilarang\s*inap|tanpa\s*inap)\b/i', $text)) {
                $allowsOvernight = false;
            }
        }

        // 13. Manager matching
        $managerId = '';
        if (! empty($availableManagers)) {
            foreach ($availableManagers as $mgr) {
                $mgrName = strtolower($mgr['name'] ?? '');
                $mgrEmail = strtolower($mgr['email'] ?? '');
                if ($mgrName !== '' && stripos($lower, $mgrName) !== false) {
                    $managerId = (string) ($mgr['id'] ?? '');
                    break;
                }
                if ($mgrEmail !== '' && stripos($lower, $mgrEmail) !== false) {
                    $managerId = (string) ($mgr['id'] ?? '');
                    break;
                }
            }
            // If empty and prompt mentions person name after PIC/Manajer
            if ($managerId === '' && preg_match('/(?:pic|manajer|manager|penanggung\s*jawab|kepala\s*pool)\s*[:=]?\s*([A-Za-z\s]+)/i', $text, $mgrMatches)) {
                $matchedWord = strtolower(trim($mgrMatches[1]));
                foreach ($availableManagers as $mgr) {
                    if (stripos(strtolower($mgr['name'] ?? ''), $matchedWord) !== false || stripos($matchedWord, strtolower($mgr['name'] ?? '')) !== false) {
                        $managerId = (string) ($mgr['id'] ?? '');
                        break;
                    }
                }
            }
            if ($managerId === '' && isset($availableManagers[0]['id'])) {
                $managerId = (string) $availableManagers[0]['id'];
            }
        }

        return [
            'code' => $code,
            'name' => $name,
            'kind' => $kind,
            'status' => 'active',
            'address' => $address,
            'city' => $detectedCity,
            'province' => $detectedProvince,
            'zip' => $zip,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'phone' => $phone,
            'email' => $email,
            'opens_at' => $opensAt,
            'closes_at' => $closesAt,
            'timezone' => $timezone,
            'vehicle_capacity' => $capacity,
            'allows_overnight' => $allowsOvernight,
            'service_radius_km' => $serviceRadius,
            'manager_id' => $managerId,
            'notes' => '',
        ];
    }

    /**
     * Sanitize and format data returned by Gemini.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int, array{id: int, name: string, email: string}>  $availableManagers
     * @return array<string, mixed>
     */
    protected function sanitizeExtractedData(array $data, array $availableManagers): array
    {
        $allowedKinds = ['depot', 'yard', 'satellite', 'workshop_base'];
        $allowedStatuses = ['active', 'inactive'];
        $allowedTimezones = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];

        $kind = in_array($data['kind'] ?? '', $allowedKinds, true) ? $data['kind'] : 'depot';
        $status = in_array($data['status'] ?? '', $allowedStatuses, true) ? $data['status'] : 'active';
        $timezone = in_array($data['timezone'] ?? '', $allowedTimezones, true) ? $data['timezone'] : 'Asia/Jakarta';

        $managerId = (string) ($data['manager_id'] ?? '');
        $validManagerIds = array_map(fn ($m) => (string) ($m['id'] ?? ''), $availableManagers);
        if (! in_array($managerId, $validManagerIds, true)) {
            $managerId = isset($availableManagers[0]['id']) ? (string) $availableManagers[0]['id'] : '';
        }

        $code = strtoupper(trim((string) ($data['code'] ?? '')));
        $name = (string) ($data['name'] ?? '');
        $address = (string) ($data['address'] ?? '');
        $city = (string) ($data['city'] ?? '');
        $province = (string) ($data['province'] ?? '');
        $zip = (string) ($data['zip'] ?? '');
        $latitude = (string) ($data['latitude'] ?? '');
        $longitude = (string) ($data['longitude'] ?? '');

        // If coordinates missing, resolve using IndonesiaGeoData or geocoder
        if ($latitude === '' || $longitude === '' || $city === '' || $province === '') {
            $queryText = trim("{$address} {$city} {$province} {$zip}");
            $geo = IndonesiaGeoData::findLocation($queryText);
            if ($geo) {
                if ($latitude === '' || $longitude === '') {
                    $latitude = $geo['lat'];
                    $longitude = $geo['lng'];
                }
                if ($city === '') {
                    $city = $geo['city'];
                }
                if ($province === '') {
                    $province = $geo['province'];
                }
            } elseif ($zip !== '') {
                $zipGeo = IndonesiaGeoData::findByPostalCode($zip);
                if ($zipGeo) {
                    if ($latitude === '' || $longitude === '') {
                        $latitude = $zipGeo['lat'];
                        $longitude = $zipGeo['lng'];
                    }
                    if ($city === '') {
                        $city = $zipGeo['city'];
                    }
                    if ($province === '') {
                        $province = $zipGeo['province'];
                    }
                }
            }
        }

        return [
            'code' => $code,
            'name' => $name,
            'kind' => $kind,
            'status' => $status,
            'address' => $address,
            'city' => $city,
            'province' => $province,
            'zip' => $zip,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'phone' => (string) ($data['phone'] ?? ''),
            'email' => (string) ($data['email'] ?? ''),
            'opens_at' => (string) ($data['opens_at'] ?? '08:00'),
            'closes_at' => (string) ($data['closes_at'] ?? '17:00'),
            'timezone' => $timezone,
            'vehicle_capacity' => ! empty($data['vehicle_capacity']) ? (int) $data['vehicle_capacity'] : null,
            'allows_overnight' => isset($data['allows_overnight']) ? (bool) $data['allows_overnight'] : true,
            'service_radius_km' => ! empty($data['service_radius_km']) ? (float) $data['service_radius_km'] : null,
            'manager_id' => $managerId,
            'notes' => (string) ($data['notes'] ?? ''),
        ];
    }
}
