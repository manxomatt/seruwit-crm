<?php

namespace Modules\Accounting\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\TaxCode;

/**
 * Soft-depend tax snapshot for operational modules.
 * Prefer default tax code; fall back to legacy ecommerce.tax_* settings.
 */
class TaxSettings
{
    /**
     * @return array{
     *     enabled: bool,
     *     rate: float,
     *     calculation: string,
     *     tax_code_id: int|null,
     *     tax_code: string|null
     * }
     */
    public static function snapshot(?string $preferCode = null, ?int $taxCodeId = null): array
    {
        // Legacy force-off still honored during gradual migration from ecommerce.tax_*.
        if (Setting::getValue('ecommerce.tax_enabled', '1') !== '1') {
            return [
                'enabled' => false,
                'rate' => 0.0,
                'calculation' => TaxCode::CALC_EXCLUSIVE,
                'tax_code_id' => null,
                'tax_code' => 'NONTAX',
            ];
        }

        if (Schema::hasTable('tax_codes')) {
            $code = null;

            if ($taxCodeId !== null) {
                $code = TaxCode::query()
                    ->whereKey($taxCodeId)
                    ->where('is_active', true)
                    ->whereIn('category', [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE])
                    ->first();
            }

            if ($code === null && $preferCode !== null) {
                $code = TaxCode::query()
                    ->where('code', $preferCode)
                    ->where('is_active', true)
                    ->whereIn('category', [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE])
                    ->first();
            }

            $code ??= TaxCode::query()
                ->where('is_default', true)
                ->where('is_active', true)
                ->whereIn('category', [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE])
                ->orderBy('id')
                ->first();

            $code ??= TaxCode::query()
                ->where('is_active', true)
                ->where('category', TaxCode::CATEGORY_PPN)
                ->orderBy('code')
                ->first();

            if ($code !== null) {
                return [
                    'enabled' => $code->isTaxable(),
                    'rate' => (float) $code->rate,
                    'calculation' => $code->calculation === TaxCode::CALC_NONE
                        ? TaxCode::CALC_EXCLUSIVE
                        : (string) $code->calculation,
                    'tax_code_id' => (int) $code->id,
                    'tax_code' => (string) $code->code,
                ];
            }
        }

        $enabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
        $rate = (float) Setting::getValue('ecommerce.tax_rate', '11');

        return [
            'enabled' => $enabled,
            'rate' => $enabled ? $rate : 0.0,
            'calculation' => TaxCode::CALC_EXCLUSIVE,
            'tax_code_id' => null,
            'tax_code' => null,
        ];
    }

    /**
     * Attributes to stamp onto invoices / supplier bills.
     *
     * @return array{
     *     tax_enabled: bool,
     *     tax_rate: float,
     *     tax_code_id: int|null,
     *     tax_code: string|null,
     *     tax_calculation: string
     * }
     */
    public static function documentAttributes(?int $taxCodeId = null): array
    {
        $snap = self::snapshot(taxCodeId: $taxCodeId);

        return [
            'tax_enabled' => $snap['enabled'],
            'tax_rate' => $snap['enabled'] ? $snap['rate'] : 0.0,
            'tax_code_id' => $snap['tax_code_id'],
            'tax_code' => $snap['tax_code'],
            'tax_calculation' => $snap['calculation'],
        ];
    }

    /**
     * @return array{0: bool, 1: float}
     */
    public static function enabledAndRate(): array
    {
        $snap = self::snapshot();

        return [$snap['enabled'], $snap['enabled'] ? $snap['rate'] : 0.0];
    }
}
