<?php

namespace Tests\Support;

trait WithRentalHandoverEvidence
{
    /**
     * Minimal 1x1 PNG data-URL for checkout/return photo & signature payloads.
     */
    protected function rentalEvidencePayload(array $extra = []): array
    {
        $pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        return array_merge([
            'checkout_photos' => [$pixel],
            'checkout_signature' => $pixel,
            'return_photos' => [$pixel],
            'return_signature' => $pixel,
        ], $extra);
    }

    protected function rentalCheckoutPayload(array $extra = []): array
    {
        $pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        return array_merge([
            'checkout_photos' => [$pixel],
            'checkout_signature' => $pixel,
        ], $extra);
    }

    protected function rentalReturnPayload(array $extra = []): array
    {
        $pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        return array_merge([
            'return_photos' => [$pixel],
            'return_signature' => $pixel,
        ], $extra);
    }
}
