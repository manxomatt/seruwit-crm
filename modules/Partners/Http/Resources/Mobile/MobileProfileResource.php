<?php

namespace Modules\Partners\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Modules\Partners\Models\Partner;

/**
 * @mixin Partner
 */
class MobileProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Partner $partner */
        $partner = $this->resource;

        return [
            'id' => $partner->id,
            'code' => $partner->code,
            'name' => $partner->name,
            'phone' => $partner->phone ?? $partner->mobile,
            'email' => $partner->email,
            'address' => $partner->address,
            'avatar_url' => $this->resolveAvatarUrl($partner->picture_url),
            'kyc_status' => $partner->kyc_status ?? Partner::KYC_STATUS_UNVERIFIED,
            'is_kyc_verified' => $partner->isKycVerified(),
            'is_kyc_pending' => $partner->isKycPending(),
            'emergency_contact' => [
                'name' => $partner->emergency_contact_name,
                'phone' => $partner->emergency_contact_phone,
                'relationship' => $partner->emergency_contact_relationship,
            ],
            'created_at' => $partner->created_at?->toIso8601String(),
        ];
    }

    private function resolveAvatarUrl(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        return Storage::disk('public')->url($url);
    }
}
