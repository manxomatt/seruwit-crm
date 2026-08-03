<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\TaxCode;
use Modules\Accounting\Models\TaxPolicy;

class TaxPolicyService
{
    /**
     * @param  list<array{channel: string, tax_code_id: int|null}>  $rows
     */
    public function sync(array $rows): void
    {
        if (! Schema::hasTable('tax_policies')) {
            return;
        }

        $allowed = TaxChannels::all();
        $ppnIds = TaxCode::query()
            ->whereIn('category', [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE])
            ->where('is_active', true)
            ->pluck('id')
            ->all();

        DB::transaction(function () use ($rows, $allowed, $ppnIds): void {
            foreach ($rows as $row) {
                $channel = (string) ($row['channel'] ?? '');

                if (! in_array($channel, $allowed, true)) {
                    throw ValidationException::withMessages([
                        'policies' => __('accounting.validation.tax_policy_channel_invalid', ['channel' => $channel]),
                    ]);
                }

                $taxCodeId = $row['tax_code_id'] ?? null;
                $taxCodeId = $taxCodeId !== null && $taxCodeId !== '' ? (int) $taxCodeId : null;

                if ($taxCodeId !== null && ! in_array($taxCodeId, $ppnIds, true)) {
                    throw ValidationException::withMessages([
                        'policies' => __('accounting.validation.tax_policy_code_invalid'),
                    ]);
                }

                if ($taxCodeId === null) {
                    TaxPolicy::query()->where('channel', $channel)->delete();

                    continue;
                }

                TaxPolicy::query()->updateOrCreate(
                    ['channel' => $channel],
                    [
                        'tax_code_id' => $taxCodeId,
                        'is_active' => true,
                    ],
                );
            }
        });
    }

    public function taxCodeIdFor(string $channel): ?int
    {
        if (! Schema::hasTable('tax_policies') || ! TaxChannels::isValid($channel)) {
            return null;
        }

        $policy = TaxPolicy::query()
            ->where('channel', $channel)
            ->where('is_active', true)
            ->first();

        if ($policy === null) {
            return null;
        }

        return $policy->tax_code_id !== null ? (int) $policy->tax_code_id : null;
    }
}
