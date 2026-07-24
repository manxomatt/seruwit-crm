<?php

namespace Modules\Inventory\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use RuntimeException;

class StockMovementRecorder
{
    public static function record(array $data, ?StockPickingStrategy $strategy = null): StockMovement
    {
        return DB::transaction(function () use ($data, $strategy) {
            $type = $data['type'];
            $batch = self::normalizeBatch($data['batch_number'] ?? null);

            if ($type === 'out' && $batch === '' && ($data['allocate'] ?? true) !== false) {
                $movements = self::recordAllocatedOut($data, $strategy ?? StockPickingStrategy::default());

                return $movements[0];
            }

            return self::recordWithinTransaction($data);
        });
    }

    /**
     * @param  array{
     *     product_id: int,
     *     from_warehouse_id: int,
     *     to_warehouse_id: int,
     *     quantity: string|int|float,
     *     from_location_id?: int|null,
     *     to_location_id?: int|null,
     *     batch_number?: string|null,
     *     expiry_date?: string|null,
     *     reference_code?: string|null,
     *     notes?: string|null,
     *     recorded_by?: int|null,
     *     recorded_at?: \DateTimeInterface|string|null
     * }  $data
     * @return array{out: list<StockMovement>, in: list<StockMovement>, reference_code: string}
     */
    public static function transfer(array $data, ?StockPickingStrategy $strategy = null): array
    {
        return DB::transaction(function () use ($data, $strategy) {
            $fromWarehouseId = (int) $data['from_warehouse_id'];
            $toWarehouseId = (int) $data['to_warehouse_id'];

            if ($fromWarehouseId === $toWarehouseId) {
                throw new RuntimeException('Source and destination warehouses must be different.');
            }

            $quantity = (float) $data['quantity'];
            $productId = (int) $data['product_id'];
            $fromLocationId = $data['from_location_id'] ?? null;
            $batch = self::normalizeBatch($data['batch_number'] ?? null);

            $available = (float) self::availableOnHand($productId, $fromWarehouseId, $fromLocationId, $batch !== '' ? $batch : null);

            if ($quantity > $available) {
                throw new RuntimeException("Insufficient stock at source. Available: {$available}.");
            }

            $reference = $data['reference_code'] ?: self::nextTransferCode();
            $recordedAt = $data['recorded_at'] ?? now();
            $recordedBy = $data['recorded_by'] ?? null;
            $notes = $data['notes'] ?? null;
            $toLocationId = $data['to_location_id'] ?? null;

            $outBase = [
                'product_id' => $productId,
                'warehouse_id' => $fromWarehouseId,
                'location_id' => $fromLocationId,
                'type' => 'out',
                'source_type' => 'transfer',
                'source_id' => null,
                'reference_code' => $reference,
                'notes' => $notes,
                'recorded_by' => $recordedBy,
                'recorded_at' => $recordedAt,
            ];

            if ($batch !== '') {
                $outs = [self::recordWithinTransaction(array_merge($outBase, [
                    'quantity' => $quantity,
                    'batch_number' => $batch,
                    'expiry_date' => $data['expiry_date'] ?? null,
                ]))];
            } else {
                $outs = self::recordAllocatedOut(array_merge($outBase, [
                    'quantity' => $quantity,
                ]), $strategy ?? StockPickingStrategy::default());
            }

            $ins = [];
            foreach ($outs as $out) {
                $in = self::recordWithinTransaction([
                    'product_id' => $productId,
                    'warehouse_id' => $toWarehouseId,
                    'location_id' => $toLocationId,
                    'type' => 'in',
                    'quantity' => $out->quantity,
                    'source_type' => 'transfer',
                    'source_id' => $out->id,
                    'reference_code' => $reference,
                    'batch_number' => $out->batch_number,
                    'expiry_date' => $out->expiry_date?->toDateString(),
                    'notes' => $notes,
                    'recorded_by' => $recordedBy,
                    'recorded_at' => $recordedAt,
                ]);
                $out->update(['source_id' => $in->id]);
                $ins[] = $in->fresh();
            }

            return [
                'out' => array_map(fn (StockMovement $m) => $m->fresh(), $outs),
                'in' => $ins,
                'reference_code' => $reference,
            ];
        });
    }

    public static function nextTransferCode(): string
    {
        $year = now()->format('Y');
        $prefix = "TRF-{$year}-";

        $last = StockMovement::query()
            ->where('source_type', 'transfer')
            ->where('reference_code', 'like', $prefix.'%')
            ->orderByDesc('reference_code')
            ->value('reference_code');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }

    public static function availableOnHand(int $productId, int $warehouseId, ?int $locationId = null, ?string $batchNumber = null): string
    {
        $query = self::levelsQuery($productId, $warehouseId, $locationId);

        if ($batchNumber !== null) {
            $query->where('batch_number', self::normalizeBatch($batchNumber));
            $level = $query->first(['on_hand', 'reserved']);

            if (! $level) {
                return '0';
            }

            return (string) max(0, (float) $level->on_hand - (float) $level->reserved);
        }

        return (string) max(0, (float) $query->sum(DB::raw('on_hand - reserved')));
    }

    public static function normalizeBatch(?string $batchNumber): string
    {
        return trim((string) $batchNumber);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<StockMovement>
     */
    private static function recordAllocatedOut(array $data, StockPickingStrategy $strategy): array
    {
        $remaining = (float) $data['quantity'];
        $productId = (int) $data['product_id'];
        $warehouseId = (int) $data['warehouse_id'];
        $locationId = $data['location_id'] ?? null;

        $levels = self::levelsQuery($productId, $warehouseId, $locationId)
            ->where('on_hand', '>', 0)
            ->tap(fn (Builder $query) => self::applyPickingOrder($query, $strategy))
            ->lockForUpdate()
            ->get();

        $movements = [];

        foreach ($levels as $level) {
            if ($remaining <= 0) {
                break;
            }

            $available = (float) $level->on_hand - (float) $level->reserved;
            if ($available <= 0) {
                continue;
            }

            $take = min($remaining, $available);

            $movements[] = self::recordWithinTransaction(array_merge($data, [
                'quantity' => $take,
                'batch_number' => $level->batch_number !== '' ? $level->batch_number : null,
                'expiry_date' => $level->expiry_date?->toDateString(),
                'type' => 'out',
            ]));

            $remaining = round($remaining - $take, 2);
        }

        if ($remaining > 0) {
            throw new RuntimeException("Insufficient stock to allocate. Short by {$remaining}.");
        }

        if ($movements === []) {
            throw new RuntimeException('No stock available to allocate.');
        }

        return $movements;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function recordWithinTransaction(array $data): StockMovement
    {
        $batch = self::normalizeBatch($data['batch_number'] ?? null);
        $data['batch_number'] = $batch !== '' ? $batch : null;

        $movement = StockMovement::create($data);

        self::updateStockLevel(
            (int) $data['product_id'],
            (int) $data['warehouse_id'],
            $data['location_id'] ?? null,
            $batch,
            $data['expiry_date'] ?? null,
            $data['type'],
            $data['quantity']
        );

        return $movement;
    }

    private static function updateStockLevel(
        int $productId,
        int $warehouseId,
        ?int $locationId,
        string $batchNumber,
        mixed $expiryDate,
        string $type,
        string|int|float $quantity,
    ): void {
        $level = StockLevel::query()->firstOrCreate(
            [
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'location_id' => $locationId,
                'batch_number' => $batchNumber,
            ],
            [
                'on_hand' => 0,
                'reserved' => 0,
                'expiry_date' => $expiryDate,
            ]
        );

        if ($expiryDate && ($level->expiry_date === null || $type === 'in')) {
            $level->expiry_date = $expiryDate;
            $level->save();
        }

        match ($type) {
            'in' => $level->increment('on_hand', $quantity),
            'out' => $level->decrement('on_hand', $quantity),
            'adjustment' => $level->update(['on_hand' => $quantity]),
            'transfer' => null,
        };
    }

    /**
     * @return Builder<StockLevel>
     */
    private static function levelsQuery(int $productId, int $warehouseId, ?int $locationId): Builder
    {
        $query = StockLevel::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId);

        if ($locationId === null) {
            $query->whereNull('location_id');
        } else {
            $query->where('location_id', $locationId);
        }

        return $query;
    }

    /**
     * @param  Builder<StockLevel>  $query
     */
    private static function applyPickingOrder(Builder $query, StockPickingStrategy $strategy): void
    {
        match ($strategy) {
            StockPickingStrategy::Fefo => $query
                ->orderByRaw('expiry_date is null')
                ->orderBy('expiry_date')
                ->orderBy('id'),
            StockPickingStrategy::Fifo => $query->orderBy('id'),
        };
    }
}
