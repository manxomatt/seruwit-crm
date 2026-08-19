<?php

namespace Modules\Rental\AI\DTO;

readonly class KycDocumentResult
{
    /**
     * @param  array{
     *     nik: ?string,
     *     name: ?string,
     *     birth_date: ?string,
     *     address: ?string,
     *     religion: ?string,
     *     occupation: ?string,
     *     confidence: float
     * }|null  $ktp
     * @param  array{
     *     license_number: ?string,
     *     license_type: ?string,
     *     name: ?string,
     *     expires_at: ?string,
     *     is_expired: bool,
     *     confidence: float
     * }|null  $sim
     * @param  array{
     *     name_match_score: float,
     *     sim_valid_for_rental: bool,
     *     is_blacklisted: bool,
     *     issues: list<string>
     * }  $checks
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public string $status,
        public string $riskLevel,
        public int $riskScore,
        public string $summary,
        public ?array $ktp = null,
        public ?array $sim = null,
        public array $checks = [
            'name_match_score' => 1.0,
            'sim_valid_for_rental' => true,
            'is_blacklisted' => false,
            'issues' => [],
        ],
        public array $rawResponse = [],
        public ?string $scannedAt = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'risk_level' => $this->riskLevel,
            'risk_score' => $this->riskScore,
            'summary' => $this->summary,
            'ktp' => $this->ktp,
            'sim' => $this->sim,
            'checks' => $this->checks,
            'raw_response' => $this->rawResponse,
            'scanned_at' => $this->scannedAt ?? now()->toIso8601String(),
        ];
    }
}
