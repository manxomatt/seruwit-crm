<?php

namespace Modules\Rental\Support;

use Modules\Partners\Models\Partner;

/**
 * Creates or reuses a Partners customer from the rental create walk-in form.
 */
class WalkInCustomerCreator
{
    /**
     * @param  array{name: string, phone: string, email?: string|null, id_number?: string|null}  $input
     * @return array{partner: Partner, created: bool}
     */
    public function createOrReuse(array $input): array
    {
        $phone = $this->normalizePhone($input['phone']);
        $local = $this->toLocalFormat($phone);
        $variants = array_values(array_unique(array_filter([$phone, $local])));

        $existing = Partner::query()
            ->where(function ($query) use ($variants): void {
                $query->whereIn('phone', $variants)
                    ->orWhereIn('mobile', $variants);
            })
            ->orderByDesc('customer_rank')
            ->orderBy('id')
            ->first();

        if ($existing !== null) {
            $updates = [];

            if (blank($existing->phone)) {
                $updates['phone'] = $phone;
            }

            if (blank($existing->mobile)) {
                $updates['mobile'] = $phone;
            }

            if ($existing->customer_rank < 1) {
                $updates['customer_rank'] = 1;
            }

            if ($existing->status !== 'active') {
                $updates['status'] = 'active';
            }

            if ($updates !== []) {
                $existing->forceFill($updates)->save();
            }

            return ['partner' => $existing->fresh(), 'created' => false];
        }

        $partner = Partner::query()->create([
            'code' => Partner::nextCode(),
            'account_type' => 'individual',
            'sub_type' => 'customer',
            'name' => $input['name'],
            'phone' => $phone,
            'mobile' => $phone,
            'email' => $input['email'] ?? null,
            'id_number' => $input['id_number'] ?? null,
            'customer_rank' => 1,
            'supplier_rank' => 0,
            'status' => 'active',
        ]);

        return ['partner' => $partner, 'created' => true];
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return trim($phone);
        }

        if (str_starts_with($digits, '0') && strlen($digits) > 1) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        return $digits;
    }

    private function toLocalFormat(string $normalized): string
    {
        if (str_starts_with($normalized, '62') && strlen($normalized) > 2) {
            return '0'.substr($normalized, 2);
        }

        return $normalized;
    }
}
