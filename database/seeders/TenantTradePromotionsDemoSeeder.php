<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Modules\TradePromotions\Models\TradePromoAward;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Models\TradePromoRealization;
use Modules\TradePromotions\Models\TradePromoRebateRule;

/**
 * Seeds 30 demo trade promotion programs (+ tiers/rebates/realizations/awards).
 *
 *   php artisan tenants:seed --class=TenantTradePromotionsDemoSeeder --tenants={id}
 */
class TenantTradePromotionsDemoSeeder extends Seeder
{
    public const TAG = '[PROMOTIONS-DEMO]';

    public const PROGRAM_COUNT = 30;

    /**
     * @var list<string>
     */
    private const PROGRAM_NAMES = [
        'Diskon Volume Q1',
        'Free Goods Ramadan',
        'Rebate Outlet Prima',
        'Volume Boost Maret',
        'Bundling Hemat April',
        'Rabat Unit Mei',
        'Promo Dispencer Juni',
        'Target Distributor Juli',
        'Free Goods Lebaran',
        'Volume Tier Emas',
        'Rebate Channel Modern',
        'Diskon Staffel Q2',
        'Promo Back to School',
        'Free Goods Nataru',
        'Rebate Principal Alpha',
        'Volume Push Agustus',
        'Diskon Multi Pack',
        'Free Goods Sample Kit',
        'Rebate Per Karton',
        'Target Value September',
        'Volume Discount Oktober',
        'Promo Anniversary Brand',
        'Free Goods Twin Pack',
        'Rebate Quarterly Close',
        'Diskon Early Bird',
        'Volume Challenge November',
        'Free Goods Display',
        'Rebate Year End',
        'Target Volume Desember',
        'Promo Closing Tahun',
    ];

    public function run(): void
    {
        if (! class_exists(TradePromoProgram::class) || ! Schema::hasTable('trade_promo_programs')) {
            $this->command?->warn('Trade Promotions tables missing. Install the promotions module first.');

            return;
        }

        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            $this->command?->warn('Partners table missing.');

            return;
        }

        $partners = $this->ensurePartners();
        $products = $this->ensureProducts();
        $principal = $this->ensurePrincipal();

        if ($this->demoProgramsExist()) {
            $this->command?->info('Trade Promotions demo programs already present — skipping create.');
        } else {
            $this->seedPrograms($partners, $products, $principal);
        }

        $programCount = TradePromoProgram::query()->where('notes', 'like', '%'.self::TAG.'%')->count();
        $realizationCount = TradePromoRealization::query()
            ->whereHas('program', fn ($q) => $q->where('notes', 'like', '%'.self::TAG.'%'))
            ->count();
        $awardCount = TradePromoAward::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->count();

        $this->command?->info(sprintf(
            'Trade Promotions demo ready: %d programs, %d realizations, %d awards.',
            $programCount,
            $realizationCount,
            $awardCount,
        ));
        $this->command?->info('Open /module/promotions/programs and /module/promotions/realizations');
    }

    /**
     * @return \Illuminate\Support\Collection<int, Partner>
     */
    protected function ensurePartners()
    {
        $partners = Partner::query()
            ->where('customer_rank', '>', 0)
            ->orderBy('id')
            ->limit(8)
            ->get();

        $names = [
            'Toko Promo Demo Sejahtera',
            'CV Promo Demo Makmur',
            'UD Promo Demo Abadi',
            'PT Promo Demo Nusantara',
            'Toko Promo Demo Sentosa',
            'CV Promo Demo Prima',
            'UD Promo Demo Jaya',
            'PT Promo Demo Global',
        ];

        while ($partners->count() < 5) {
            $index = $partners->count();
            $code = sprintf('CUS-PROMO-%02d', $index + 1);

            $partner = Partner::query()->firstOrCreate(
                ['code' => $code],
                [
                    'account_type' => 'company',
                    'sub_type' => 'customer',
                    'name' => $names[$index] ?? fake()->company(),
                    'customer_rank' => 1,
                    'supplier_rank' => 0,
                    'status' => 'active',
                    'notes' => self::TAG.' Demo distributor.',
                ],
            );

            $partners->push($partner);
        }

        return $partners->values();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Product>
     */
    protected function ensureProducts()
    {
        if (! class_exists(Product::class) || ! Schema::hasTable('products')) {
            return collect();
        }

        $products = Product::query()->orderBy('id')->limit(8)->get();

        while ($products->count() < 3) {
            $index = $products->count();
            $code = sprintf('PRD-PROMO-%02d', $index + 1);

            $product = Product::query()->firstOrCreate(
                ['code' => $code],
                [
                    'sku' => $code,
                    'name' => 'Produk Promo Demo '.($index + 1),
                    'unit' => 'pcs',
                    'price' => 10000 + ($index * 2500),
                    'status' => 'active',
                ],
            );

            $products->push($product);
        }

        return $products->values();
    }

    protected function ensurePrincipal(): ?Principal
    {
        if (! class_exists(Principal::class) || ! Schema::hasTable('principals')) {
            return null;
        }

        return Principal::query()->firstOrCreate(
            ['code' => 'PRN-PROMO'],
            [
                'name' => 'Principal Promo Demo',
                'status' => 'active',
            ],
        );
    }

    protected function demoProgramsExist(): bool
    {
        return TradePromoProgram::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->count() >= self::PROGRAM_COUNT;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Partner>  $partners
     * @param  \Illuminate\Support\Collection<int, Product>  $products
     */
    protected function seedPrograms($partners, $products, ?Principal $principal): void
    {
        $types = [
            TradePromoProgram::TYPE_VOLUME_DISCOUNT,
            TradePromoProgram::TYPE_FREE_GOODS,
            TradePromoProgram::TYPE_REBATE,
        ];
        $statuses = [
            TradePromoProgram::STATUS_DRAFT,
            TradePromoProgram::STATUS_ACTIVE,
            TradePromoProgram::STATUS_ACTIVE,
            TradePromoProgram::STATUS_PAUSED,
            TradePromoProgram::STATUS_CLOSED,
        ];
        $metrics = [
            TradePromoProgram::METRIC_VOLUME,
            TradePromoProgram::METRIC_VALUE,
        ];

        foreach (range(1, self::PROGRAM_COUNT) as $i) {
            $type = $types[($i - 1) % count($types)];
            $status = $statuses[($i - 1) % count($statuses)];
            $metric = $metrics[($i - 1) % count($metrics)];
            $startsAt = now()->subMonths(2)->addDays($i * 2)->startOfDay();
            $endsAt = (clone $startsAt)->addMonths(3)->endOfDay();
            $targetAmount = $metric === TradePromoProgram::METRIC_VOLUME
                ? 100 + ($i * 25)
                : 5_000_000 + ($i * 250_000);

            $program = TradePromoProgram::query()->create([
                'code' => sprintf('TP-DEMO-%03d', $i),
                'name' => self::PROGRAM_NAMES[$i - 1] ?? "Program Demo {$i}",
                'description' => self::TAG.' Sample trade promotion program #'.$i,
                'type' => $type,
                'status' => $status,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'principal_id' => $principal?->id,
                'target_metric' => $metric,
                'target_amount' => $targetAmount,
                'notes' => self::TAG.' Seeded for UI pagination demo.',
            ]);

            $partnerIds = $partners->random(min(3, $partners->count()))->pluck('id')->all();
            $program->partners()->sync($partnerIds);

            if ($products->isNotEmpty()) {
                $productIds = $products->random(min(2, $products->count()))->pluck('id')->all();
                $program->products()->sync($productIds);
            }

            if ($type === TradePromoProgram::TYPE_VOLUME_DISCOUNT) {
                $program->tiers()->create([
                    'sort_order' => 1,
                    'min_qty' => 50,
                    'discount_percent' => 5,
                ]);
                $program->tiers()->create([
                    'sort_order' => 2,
                    'min_qty' => 150,
                    'discount_percent' => 10,
                ]);
            }

            if ($type === TradePromoProgram::TYPE_FREE_GOODS) {
                $freeProductId = $products->isNotEmpty() ? $products->first()->id : null;
                $program->tiers()->create([
                    'sort_order' => 1,
                    'min_qty' => 100,
                    'free_product_id' => $freeProductId,
                    'free_qty' => 5,
                ]);
            }

            if ($type === TradePromoProgram::TYPE_REBATE) {
                $program->rebateRule()->create([
                    'rebate_per_unit' => 250 + ($i * 10),
                    'rebate_percent' => null,
                    'calc_basis' => TradePromoRebateRule::BASIS_QTY,
                ]);
            }

            if (in_array($status, [TradePromoProgram::STATUS_ACTIVE, TradePromoProgram::STATUS_CLOSED, TradePromoProgram::STATUS_PAUSED], true)) {
                $this->seedRealizationAndAward($program, $partners->random(), $targetAmount, $type, $i);
            }
        }
    }

    protected function seedRealizationAndAward(
        TradePromoProgram $program,
        Partner $partner,
        float|int $targetAmount,
        string $type,
        int $index,
    ): void {
        $realizedQty = max(10, (int) round($targetAmount * (0.4 + (($index % 6) * 0.1))));
        if ($program->target_metric === TradePromoProgram::METRIC_VALUE) {
            $realizedQty = 20 + ($index * 3);
        }

        $unitPrice = 10000;
        $realizedValue = $realizedQty * $unitPrice;
        $achievementBase = $program->target_metric === TradePromoProgram::METRIC_VOLUME
            ? $realizedQty
            : $realizedValue;
        $achievementPercent = $targetAmount > 0
            ? round(min(150, ($achievementBase / $targetAmount) * 100), 2)
            : 0;

        $realization = TradePromoRealization::query()->create([
            'trade_promo_program_id' => $program->id,
            'partner_id' => $partner->id,
            'realized_qty' => $realizedQty,
            'realized_value' => $realizedValue,
            'target_qty' => $program->target_metric === TradePromoProgram::METRIC_VOLUME ? $targetAmount : null,
            'target_value' => $program->target_metric === TradePromoProgram::METRIC_VALUE ? $targetAmount : null,
            'achievement_percent' => $achievementPercent,
            'status' => $achievementPercent >= 100
                ? TradePromoRealization::STATUS_ACHIEVED
                : TradePromoRealization::STATUS_OPEN,
            'last_synced_at' => now()->subHours($index),
        ]);

        $awardType = match ($type) {
            TradePromoProgram::TYPE_FREE_GOODS => TradePromoAward::TYPE_FREE_GOODS,
            TradePromoProgram::TYPE_REBATE => TradePromoAward::TYPE_REBATE,
            default => TradePromoAward::TYPE_DISCOUNT,
        };

        TradePromoAward::query()->create([
            'trade_promo_program_id' => $program->id,
            'trade_promo_realization_id' => $realization->id,
            'partner_id' => $partner->id,
            'award_type' => $awardType,
            'amount' => $awardType === TradePromoAward::TYPE_FREE_GOODS ? null : round($realizedValue * 0.05, 2),
            'free_qty' => $awardType === TradePromoAward::TYPE_FREE_GOODS ? 5 : null,
            'status' => $index % 4 === 0 ? TradePromoAward::STATUS_SETTLED : TradePromoAward::STATUS_ACCRUED,
            'settled_at' => $index % 4 === 0 ? now()->subDays($index % 10) : null,
            'notes' => self::TAG.' Demo award.',
        ]);
    }
}
