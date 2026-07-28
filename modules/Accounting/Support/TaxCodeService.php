<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\TaxCode;

class TaxCodeService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): TaxCode
    {
        return DB::transaction(function () use ($data): TaxCode {
            $payload = $this->normalize($data);

            if ($payload['is_default'] && in_array($payload['category'], [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE], true)) {
                $this->clearDefaultPpn();
            }

            return TaxCode::query()->create($payload);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(TaxCode $taxCode, array $data): TaxCode
    {
        return DB::transaction(function () use ($taxCode, $data): TaxCode {
            $payload = $this->normalize($data, $taxCode);

            if ($payload['is_default'] && in_array($payload['category'], [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE], true)) {
                $this->clearDefaultPpn($taxCode->id);
            }

            $taxCode->update($payload);

            return $taxCode->fresh();
        });
    }

    public function whtOptions(): array
    {
        return TaxCode::query()
            ->where('category', TaxCode::CATEGORY_WHT)
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'rate'])
            ->map(fn (TaxCode $code): array => [
                'id' => $code->id,
                'code' => $code->code,
                'name' => $code->name,
                'rate' => (float) $code->rate,
            ])
            ->all();
    }

    public function computeWht(float $baseAmount, ?TaxCode $code, ?float $overrideAmount = null): float
    {
        if ($overrideAmount !== null) {
            return round(max(0, $overrideAmount), 2);
        }

        if ($code === null || ! $code->isWht() || ! $code->is_active) {
            return 0.0;
        }

        return round($baseAmount * ((float) $code->rate) / 100, 2);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data, ?TaxCode $existing = null): array
    {
        $category = (string) ($data['category'] ?? $existing?->category ?? TaxCode::CATEGORY_PPN);
        $calculation = (string) ($data['calculation'] ?? $existing?->calculation ?? TaxCode::CALC_EXCLUSIVE);
        $direction = (string) ($data['direction'] ?? $existing?->direction ?? TaxCode::DIRECTION_BOTH);
        $rate = round((float) ($data['rate'] ?? $existing?->rate ?? 0), 4);

        if ($category === TaxCode::CATEGORY_NONE) {
            $rate = 0.0;
            $calculation = TaxCode::CALC_NONE;
        }

        if ($category === TaxCode::CATEGORY_WHT && $direction !== TaxCode::DIRECTION_PAYABLE) {
            $direction = TaxCode::DIRECTION_PAYABLE;
        }

        if ($category === TaxCode::CATEGORY_WHT && empty($data['wht_account_id']) && $existing?->wht_account_id === null) {
            throw ValidationException::withMessages([
                'wht_account_id' => __('accounting.validation.tax_wht_account_required'),
            ]);
        }

        return [
            'code' => strtoupper((string) ($data['code'] ?? $existing?->code)),
            'name' => (string) ($data['name'] ?? $existing?->name),
            'category' => $category,
            'rate' => $rate,
            'calculation' => $calculation,
            'direction' => $direction,
            'output_account_id' => $this->nullableId($data['output_account_id'] ?? $existing?->output_account_id),
            'input_account_id' => $this->nullableId($data['input_account_id'] ?? $existing?->input_account_id),
            'wht_account_id' => $this->nullableId($data['wht_account_id'] ?? $existing?->wht_account_id),
            'is_default' => (bool) ($data['is_default'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'notes' => $data['notes'] ?? $existing?->notes,
        ];
    }

    private function nullableId(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function clearDefaultPpn(?int $exceptId = null): void
    {
        TaxCode::query()
            ->whereIn('category', [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE])
            ->when($exceptId !== null, fn ($q) => $q->where('id', '!=', $exceptId))
            ->update(['is_default' => false]);
    }
}
