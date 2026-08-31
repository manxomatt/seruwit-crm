<?php

namespace Modules\Partners\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Modules\Partners\Models\Partner;

/**
 * @mixin Partner
 */
class MobileKycResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Partner $partner */
        $partner = $this->resource;

        return [
            'status' => $partner->kyc_status ?? Partner::KYC_STATUS_UNVERIFIED,
            'is_verified' => $partner->isKycVerified(),
            'is_pending' => $partner->isKycPending(),
            'submitted_at' => $partner->kyc_submitted_at?->toIso8601String(),
            'verified_at' => $partner->kyc_verified_at?->toIso8601String(),
            'rejected_reason' => $partner->kyc_rejected_reason,
            'id_number' => $this->maskSensitiveNumber($partner->id_number),
            'license_number' => $this->maskSensitiveNumber($partner->license_number),
            'license_expires_at' => $partner->license_expires_at?->toDateString(),
            'id_card_photo_url' => $this->resolvePhotoUrl($partner->id_card_photo_path),
            'driver_license_photo_url' => $this->resolvePhotoUrl($partner->driver_license_photo_path),
            'selfie_photo_url' => $this->resolvePhotoUrl($partner->selfie_photo_path),
            'emergency_contact' => [
                'name' => $partner->emergency_contact_name,
                'phone' => $partner->emergency_contact_phone,
                'relationship' => $partner->emergency_contact_relationship,
            ],
        ];
    }

    private function resolvePhotoUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }

    private function maskSensitiveNumber(?string $number): ?string
    {
        if ($number === null || $number === '') {
            return null;
        }

        $len = strlen($number);
        if ($len <= 4) {
            return $number;
        }

        return substr($number, 0, 4).str_repeat('*', max(0, $len - 8)).substr($number, -4);
    }
}
