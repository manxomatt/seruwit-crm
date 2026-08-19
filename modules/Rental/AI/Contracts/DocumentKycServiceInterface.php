<?php

namespace Modules\Rental\AI\Contracts;

use Modules\Rental\AI\DTO\KycDocumentResult;
use Modules\Rental\Models\Rental;

interface DocumentKycServiceInterface
{
    /**
     * Analyze uploaded KTP & SIM documents for a rental, validating expiry dates,
     * name consistency, and assessing customer risk profile.
     */
    public function analyzeRentalKyc(Rental $rental): KycDocumentResult;

    /**
     * Scan a single document (KTP or SIM) from base64 data-URL or storage path,
     * returning extracted metadata for walk-in form auto-fill.
     *
     * @return array{
     *     doc_type: 'ktp'|'sim'|'unknown',
     *     data: array<string, mixed>,
     *     confidence: float,
     *     raw: array<string, mixed>
     * }
     */
    public function scanSingleDocument(string $imageSource, string $docType = 'auto'): array;
}
