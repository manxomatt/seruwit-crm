<?php

namespace Modules\Inventory\Support;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use RuntimeException;

class StockMovementRecorder
{
    public static function record(array $data): StockMovement
    {
        return DB::transaction(fn () => self::recordWithinTransaction($data));
    }

    /**
     * Two-legged warehouse transfer: stock out at source + stock in at destination,
     * sharing one reference_code and source_type=transfer.
     *
     * @param  array{
     *     product_id: int,
     *     from_warehouse_id: int,
     *     to_warehouse_id: int,
     *     quantity: string|int|float,
     *     from_location_id?: int|null,
     *     to_location_id?: int|null,
     *     reference_code?: string|null,
     *     notes?: string|null,
     *     recorded_by?: int|null,
     *     recorded_at?: \DateTimeInterface|string|null
     * }  $data
     * @return array{out: StockMovement, in: StockMovement, reference_code: string}
     */
    public static function transfer(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $fromWarehouseId = (int) $data['from_warehouse_id'];
            $toWarehouseId = (int) $data['to_warehouse_id'];

            if ($fromWarehouseId === $toWarehouseId) {
                throw new RuntimeException('Source and destination warehouses must be different.');
            }

            $quantity = $data['quantity'];
            $productId = (int) $data['product_id'];
            $fromLocationId = $data['from_location_id'] ?? null;
            $available = self::availableOnHand($productId, $fromWarehouseId, $fromLocationId);

            if ((float) $quantity > (float) $available) {
                throw new RuntimeException("Insufficient stock at source. Available: {$available}.");
            }

            $reference = $data['reference_code'] ?: self::nextTransferCode();
            $recordedAt = $data['recorded_at'] ?? now();
            $recordedBy = $data['recorded_by'] ?? null;
            $notes = $data['notes'] ?? null;

            $out = self::recordWithinTransaction([
                'product_id' => $productId,
                'warehouse_id' => $fromWarehouseId,
                'location_id' => $fromLocationId,
                'type' => 'out',
                'quantity' => $quantity,
                'source_type' => 'transfer',
                'source_id' => null,
                'reference_code' => $reference,
                'notes' => $notes,
                'recorded_by' => $recordedBy,
                'recorded_at' => $recordedAt,
            ]);

            $in = self::recordWithinTransaction([
                'product_id' => $productId,
                'warehouse_id' => $toWarehouseId,
                'location_id' => $data['to_location_id'] ?? null,
                'type' => 'in',
                'quantity' => $quantity,
                'source_type' => 'transfer',
                'source_id' => $out->id,
                'reference_code' => $reference,
                'notes' => $notes,
                'recorded_by' => $recordedBy,
                'recorded_at' => $recordedAt,
            ]);

            $out->update(['source_id' => $in->id]);

            return [
                'out' => $out->fresh(),
                'in' => $in->fresh(),
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

    public static function availableOnHand(int $productId, int $warehouseId, ?int $locationId = null): string
    {
        $query = StockLevel::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId);

        if ($locationId === null) {
            $query->whereNull('location_id');
        } else {
            $query->where('location_id', $locationId);
        }

        return (string) ($query->value('on_hand') ?? 0);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function recordWithinTransaction(array $data): StockMovement
    {
        $movement = StockMovement::create($data);

        self::updateStockLevel(
            (int) $data['product_id'],
            (int) $data['warehouse_id'],
            $data['location_id'] ?? null,
            $data['type'],
            $data['quantity']
        );

        return $movement;
    }

    private static function updateStockLevel(int $productId, int $warehouseId, ?int $locationId, string $type, string|int|float $quantity): void
    {
        $level = StockLevel::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $warehouseId, 'location_id' => $locationId],
            ['on_hand' => 0, 'reserved' => 0]
        );

        match ($type) {
            'in' => $level->increment('on_hand', $quantity),
            'out' => $level->decrement('on_hand', $quantity),
            'adjustment' => $level->update(['on_hand' => $quantity]),
            'transfer' => null,
        };
    }
}
