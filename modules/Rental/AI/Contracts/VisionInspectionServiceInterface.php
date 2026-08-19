<?php

namespace Modules\Rental\AI\Contracts;

use Modules\Rental\AI\DTO\HandoverInspectionResult;

interface VisionInspectionServiceInterface
{
    /**
     * Inspect checkout photos vs return photos.
     *
     * @param  list<string>  $checkoutPhotos  Paths or data URLs of checkout photos
     * @param  list<string>  $returnPhotos  Paths or data URLs of return photos
     * @param  array<string, mixed>  $context  Additional metadata (vehicle make/model, start odometer, etc.)
     */
    public function inspectHandover(
        array $checkoutPhotos,
        array $returnPhotos,
        array $context = [],
    ): HandoverInspectionResult;
}
