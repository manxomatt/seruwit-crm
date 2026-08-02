<?php

namespace Modules\Rental\Support;

use Modules\Partners\Models\Partner;
use Modules\Shuttle\Support\PassengerOtpService;

/**
 * Maps a mobile OTP phone identity onto a Partners customer record.
 */
class MobilePassengerPartnerResolver
{
    public function __construct(private readonly PassengerOtpService $otp) {}

    public function resolve(string $phone, ?string $name = null): Partner
    {
        $normalized = $this->otp->normalize($phone);
        $local = $this->toLocalFormat($normalized);
        $variants = array_values(array_unique(array_filter([$normalized, $local])));

        $partner = Partner::query()
            ->where(function ($query) use ($variants): void {
                $query->whereIn('phone', $variants)
                    ->orWhereIn('mobile', $variants);
            })
            ->orderByDesc('customer_rank')
            ->orderBy('id')
            ->first();

        if ($partner !== null) {
            if ($partner->phone === null || $partner->phone === '') {
                $partner->forceFill(['phone' => $normalized])->save();
            }

            return $partner->fresh();
        }

        return Partner::query()->create([
            'code' => Partner::nextCode(),
            'account_type' => 'individual',
            'sub_type' => 'customer',
            'name' => filled($name) ? $name : 'Customer '.$normalized,
            'phone' => $normalized,
            'mobile' => $normalized,
            'customer_rank' => 1,
            'supplier_rank' => 0,
            'status' => 'active',
        ]);
    }

    public function findByPhone(string $phone): ?Partner
    {
        $normalized = $this->otp->normalize($phone);
        $local = $this->toLocalFormat($normalized);
        $variants = array_values(array_unique(array_filter([$normalized, $local])));

        return Partner::query()
            ->where(function ($query) use ($variants): void {
                $query->whereIn('phone', $variants)
                    ->orWhereIn('mobile', $variants);
            })
            ->orderByDesc('customer_rank')
            ->orderBy('id')
            ->first();
    }

    private function toLocalFormat(string $normalized): string
    {
        if (str_starts_with($normalized, '62') && strlen($normalized) > 2) {
            return '0'.substr($normalized, 2);
        }

        return $normalized;
    }
}
