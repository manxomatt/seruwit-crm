<?php

namespace Modules\Inventory\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\WarehouseLocation;
use RuntimeException;

/**
 * Same-warehouse putaway: typically INPUT (or QC) → STOCK.
 */
class PutawayService
{
    /**
     * @param  array{
     *     product_id: int,
     *     warehouse_id: int,
     *     from_location_id: int,
     *     to_location_id: int,
     *     quantity: float|int|string,
     *     batch_number?: string|null,
     *     expiry_date?: string|null,
     *     notes?: string|null
     * }  $data
     * @return array{out: \Modules\Inventory\Models\StockMovement, in: \Modules\Inventory\Models\StockMovement}
     */
    public static function relocate(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $warehouseId = (int) $data['warehouse_id'];
            $fromLocationId = (int) $data['from_location_id'];
            $toLocationId = (int) $data['to_location_id'];
            $productId = (int) $data['product_id'];
            $quantity = round((float) $data['quantity'], 2);
            $batch = StockMovementRecorder::normalizeBatch($data['batch_number'] ?? null);

            if ($quantity <= 0) {
                throw new RuntimeException(__('inventory.messages.putaway_invalid_qty'));
            }

            if ($fromLocationId === $toLocationId) {
                throw new RuntimeException(__('inventory.messages.putaway_same_location'));
            }

            $from = WarehouseLocation::query()
                ->where('warehouse_id', $warehouseId)
                ->whereKey($fromLocationId)
                ->firstOrFail();

            $to = WarehouseLocation::query()
                ->where('warehouse_id', $warehouseId)
                ->whereKey($toLocationId)
                ->firstOrFail();

            if (! in_array($from->type, ['input', 'quality_control', 'output'], true)) {
                throw new RuntimeException(__('inventory.messages.putaway_from_hold_only'));
            }

            if ($to->type !== 'internal') {
                throw new RuntimeException(__('inventory.messages.putaway_to_stock_only'));
            }

            $levelQuery = StockLevel::query()
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->where('location_id', $fromLocationId)
                ->where('batch_number', $batch)
                ->lockForUpdate();

            $level = $levelQuery->first();
            $available = $level ? round((float) $level->on_hand - (float) $level->reserved, 2) : 0.0;

            if ($quantity > $available + 0.009) {
                throw new RuntimeException(__('inventory.messages.putaway_insufficient', [
                    'available' => $available,
                ]));
            }

            $reference = self::nextPutawayCode();
            $recordedAt = now();
            $recordedBy = Auth::id();
            $expiry = $data['expiry_date'] ?? $level?->expiry_date?->toDateString();
            $notes = $data['notes'] ?? null;

            $out = StockMovementRecorder::record([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'location_id' => $fromLocationId,
                'type' => 'out',
                'quantity' => $quantity,
                'batch_number' => $batch !== '' ? $batch : null,
                'expiry_date' => $expiry,
                'source_type' => 'putaway',
                'source_id' => null,
                'reference_code' => $reference,
                'notes' => $notes,
                'recorded_by' => $recordedBy,
                'recorded_at' => $recordedAt,
                'allocate' => false,
            ]);

            $in = StockMovementRecorder::record([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'location_id' => $toLocationId,
                'type' => 'in',
                'quantity' => $quantity,
                'batch_number' => $batch !== '' ? $batch : null,
                'expiry_date' => $expiry,
                'source_type' => 'putaway',
                'source_id' => $out->id,
                'reference_code' => $reference,
                'notes' => $notes,
                'recorded_by' => $recordedBy,
                'recorded_at' => $recordedAt,
                'allocate' => false,
            ]);

            $out->update(['source_id' => $in->id]);

            return ['out' => $out->fresh(), 'in' => $in->fresh()];
        });
    }

    public static function nextPutawayCode(): string
    {
        $year = now()->format('Y');
        $prefix = "PUT-{$year}-";

        $last = \Modules\Inventory\Models\StockMovement::query()
            ->where('source_type', 'putaway')
            ->where('reference_code', 'like', $prefix.'%')
            ->orderByDesc('reference_code')
            ->value('reference_code');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }
}
