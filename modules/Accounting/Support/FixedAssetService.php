<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FixedAsset;
use Modules\Accounting\Models\JournalEntry;

class FixedAssetService
{
    public function __construct(private readonly JournalService $journals) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId = null): FixedAsset
    {
        return DB::transaction(function () use ($data, $userId): FixedAsset {
            $asset = FixedAsset::query()->create([
                'code' => strtoupper((string) $data['code']),
                'name' => (string) $data['name'],
                'category' => $data['category'] ?? null,
                'acquisition_date' => $data['acquisition_date'],
                'acquisition_cost' => round((float) $data['acquisition_cost'], 2),
                'salvage_value' => round((float) ($data['salvage_value'] ?? 0), 2),
                'useful_life_months' => (int) $data['useful_life_months'],
                'method' => $data['method'] ?? FixedAsset::METHOD_STRAIGHT_LINE,
                'asset_account_id' => (int) $data['asset_account_id'],
                'accum_depr_account_id' => (int) $data['accum_depr_account_id'],
                'expense_account_id' => (int) $data['expense_account_id'],
                'vehicle_id' => $data['vehicle_id'] ?? null,
                'status' => FixedAsset::STATUS_ACTIVE,
                'accumulated_depreciation' => 0,
                'notes' => $data['notes'] ?? null,
            ]);

            if (! empty($data['post_acquisition']) && ! empty($data['funding_account_id'])) {
                $entry = $this->journals->createDraft([
                    'entry_date' => $asset->acquisition_date->toDateString(),
                    'type' => JournalEntry::TYPE_AUTO,
                    'memo' => __('accounting.messages.fa_acquisition', ['code' => $asset->code]),
                    'lines' => [
                        [
                            'account_id' => $asset->asset_account_id,
                            'debit' => (float) $asset->acquisition_cost,
                            'credit' => 0,
                        ],
                        [
                            'account_id' => (int) $data['funding_account_id'],
                            'debit' => 0,
                            'credit' => (float) $asset->acquisition_cost,
                        ],
                    ],
                ], $userId ?? Auth::id());

                $entry->update([
                    'source_type' => $asset->getMorphClass(),
                    'source_id' => (int) $asset->id,
                    'event' => 'fixed_asset.acquired',
                ]);

                $this->journals->post($entry, $userId ?? Auth::id());
            }

            return $asset->fresh();
        });
    }

    public function depreciateForPeriod(FixedAsset $asset, FiscalPeriod $period, ?int $userId = null): ?JournalEntry
    {
        if ($asset->status !== FixedAsset::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'asset' => __('accounting.validation.fa_not_active'),
            ]);
        }

        $remaining = $asset->remainingDepreciable();
        if ($remaining < 0.005) {
            return null;
        }

        if ($asset->last_depreciated_on !== null && $asset->last_depreciated_on->gte($period->ends_on)) {
            throw ValidationException::withMessages([
                'asset' => __('accounting.validation.fa_already_depreciated'),
            ]);
        }

        $amount = min($asset->monthlyDepreciation(), $remaining);
        if ($amount < 0.005) {
            return null;
        }

        $existing = JournalEntry::query()
            ->where('source_type', $asset->getMorphClass())
            ->where('source_id', (int) $asset->id)
            ->where('event', 'fixed_asset.depreciated.'.$period->id)
            ->where('status', JournalEntry::STATUS_POSTED)
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'asset' => __('accounting.validation.fa_already_depreciated'),
            ]);
        }

        return DB::transaction(function () use ($asset, $period, $amount, $userId): JournalEntry {
            $entry = $this->journals->createDraft([
                'entry_date' => $period->ends_on->toDateString(),
                'type' => JournalEntry::TYPE_AUTO,
                'memo' => __('accounting.messages.fa_depreciation', [
                    'code' => $asset->code,
                    'period' => $period->name,
                ]),
                'lines' => [
                    [
                        'account_id' => $asset->expense_account_id,
                        'debit' => $amount,
                        'credit' => 0,
                    ],
                    [
                        'account_id' => $asset->accum_depr_account_id,
                        'debit' => 0,
                        'credit' => $amount,
                    ],
                ],
            ], $userId ?? Auth::id());

            $entry->update([
                'source_type' => $asset->getMorphClass(),
                'source_id' => (int) $asset->id,
                'event' => 'fixed_asset.depreciated.'.$period->id,
            ]);

            $posted = $this->journals->post($entry, $userId ?? Auth::id());

            $asset->update([
                'accumulated_depreciation' => round((float) $asset->accumulated_depreciation + $amount, 2),
                'last_depreciated_on' => $period->ends_on->toDateString(),
            ]);

            return $posted;
        });
    }

    public function depreciateAllForPeriod(FiscalPeriod $period, ?int $userId = null): int
    {
        $count = 0;

        FixedAsset::query()
            ->where('status', FixedAsset::STATUS_ACTIVE)
            ->orderBy('code')
            ->each(function (FixedAsset $asset) use ($period, $userId, &$count): void {
                try {
                    $posted = $this->depreciateForPeriod($asset, $period, $userId);
                    if ($posted !== null) {
                        $count++;
                    }
                } catch (ValidationException) {
                    // Skip already depreciated assets in bulk run.
                }
            });

        return $count;
    }
}
