<?php

namespace Modules\Pos\Support;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Inventory\Support\WarehouseKind;
use Modules\Pos\Models\PosPayment;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosSaleItem;
use Modules\Pos\Models\PosShift;
use Modules\Product\Models\Product;
use RuntimeException;

class PosSaleService
{
    /**
     * @param  array{
     *     items: list<array{product_id: int, quantity: float|int|string, unit_price?: float|int|string|null}>,
     *     payment_method: string,
     *     amount_tendered?: float|int|string|null,
     *     payment_reference?: string|null,
     *     partner_id?: int|null,
     *     notes?: string|null
     * }  $payload
     */
    public function complete(PosShift $shift, User $cashier, array $payload): PosSale
    {
        if (! $shift->isOpen()) {
            throw new RuntimeException(__('pos.messages.shift_is_closed'));
        }

        $warehouse = Warehouse::query()->findOrFail($shift->warehouse_id);

        if (($warehouse->kind ?? WarehouseKind::default()) !== WarehouseKind::Store) {
            throw new RuntimeException(__('pos.messages.warehouse_not_store'));
        }

        if ($warehouse->acceptsSalesOutbound() === false) {
            throw new RuntimeException(__('pos.messages.warehouse_cannot_sell'));
        }

        $items = $payload['items'] ?? [];

        if ($items === []) {
            throw new RuntimeException(__('pos.messages.cart_empty'));
        }

        return DB::transaction(function () use ($shift, $cashier, $payload, $warehouse, $items) {
            $built = $this->buildLines($items, (int) $warehouse->id);
            $totals = $this->totalsFromLines($built['lines']);

            $method = $payload['payment_method'];
            $amountTendered = isset($payload['amount_tendered']) ? (float) $payload['amount_tendered'] : null;
            $changeDue = null;

            if ($method === PosPayment::METHOD_CASH) {
                if ($amountTendered === null || $amountTendered + 0.009 < $totals['grand_total']) {
                    throw new RuntimeException(__('pos.messages.insufficient_tender'));
                }
                $changeDue = round($amountTendered - $totals['grand_total'], 2);
            } else {
                $amountTendered = $totals['grand_total'];
                $changeDue = 0;
            }

            $sale = PosSale::query()->create([
                'code' => PosSale::nextCode(),
                'pos_shift_id' => $shift->id,
                'warehouse_id' => $warehouse->id,
                'cashier_id' => $cashier->id,
                'partner_id' => $payload['partner_id'] ?? null,
                'status' => PosSale::STATUS_COMPLETED,
                'subtotal' => $totals['subtotal'],
                'discount_total' => 0,
                'tax_total' => $totals['tax_total'],
                'grand_total' => $totals['grand_total'],
                'amount_tendered' => $amountTendered,
                'change_due' => $changeDue,
                'sold_at' => now(),
                'notes' => $payload['notes'] ?? null,
            ]);

            foreach ($built['lines'] as $line) {
                PosSaleItem::query()->create([
                    'pos_sale_id' => $sale->id,
                    ...$line,
                ]);
            }

            PosPayment::query()->create([
                'pos_sale_id' => $sale->id,
                'method' => $method,
                'amount' => $method === PosPayment::METHOD_CASH ? $amountTendered : $totals['grand_total'],
                'reference' => $payload['payment_reference'] ?? null,
            ]);

            $locationId = $this->resolveStockLocationId((int) $warehouse->id);

            foreach ($built['lines'] as $line) {
                /** @var Product $product */
                $product = $built['products'][$line['product_id']];

                if ($product->isService()) {
                    continue;
                }

                StockMovementRecorder::record([
                    'product_id' => $line['product_id'],
                    'warehouse_id' => $warehouse->id,
                    'location_id' => $locationId,
                    'type' => 'out',
                    'quantity' => $line['qty_base'],
                    'source_type' => 'pos_sale',
                    'source_id' => $sale->id,
                    'reference_code' => $sale->code,
                    'recorded_by' => $cashier->id,
                    'recorded_at' => now(),
                ]);
            }

            return $sale->fresh(['items.product', 'payments', 'cashier', 'warehouse']);
        });
    }

    public function void(PosSale $sale, User $actor, ?string $reason = null): PosSale
    {
        if (! $sale->isCompleted()) {
            throw new RuntimeException(__('pos.messages.sale_not_voidable'));
        }

        return DB::transaction(function () use ($sale, $actor, $reason) {
            $sale->loadMissing('items.product');
            $locationId = $this->resolveStockLocationId((int) $sale->warehouse_id);

            foreach ($sale->items as $item) {
                if ($item->product?->isService()) {
                    continue;
                }

                StockMovementRecorder::record([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $sale->warehouse_id,
                    'location_id' => $locationId,
                    'type' => 'in',
                    'quantity' => $item->qty_base,
                    'source_type' => 'pos_sale_void',
                    'source_id' => $sale->id,
                    'reference_code' => $sale->code,
                    'allocate' => false,
                    'recorded_by' => $actor->id,
                    'recorded_at' => now(),
                ]);
            }

            $sale->update([
                'status' => PosSale::STATUS_VOIDED,
                'voided_at' => now(),
                'voided_by' => $actor->id,
                'void_reason' => $reason,
            ]);

            return $sale->fresh(['items.product', 'payments', 'cashier', 'voider']);
        });
    }

    public function expectedCashForShift(PosShift $shift): float
    {
        $sales = PosSale::query()
            ->where('pos_shift_id', $shift->id)
            ->where('status', PosSale::STATUS_COMPLETED)
            ->with('payments')
            ->get();

        $cashIn = 0.0;

        foreach ($sales as $sale) {
            foreach ($sale->payments as $payment) {
                if ($payment->method !== PosPayment::METHOD_CASH) {
                    continue;
                }

                $tendered = (float) ($sale->amount_tendered ?? $payment->amount);
                $change = (float) ($sale->change_due ?? 0);
                $cashIn += $tendered - $change;
            }
        }

        return round((float) $shift->opening_float + $cashIn, 2);
    }

    public function resolveStockLocationId(int $warehouseId): ?int
    {
        $locationId = WarehouseLocation::query()
            ->where('warehouse_id', $warehouseId)
            ->where('code', 'STOCK')
            ->value('id');

        if ($locationId) {
            return (int) $locationId;
        }

        $warehouse = Warehouse::query()->find($warehouseId);
        $warehouse?->createDefaultLocations();

        $locationId = WarehouseLocation::query()
            ->where('warehouse_id', $warehouseId)
            ->where('code', 'STOCK')
            ->value('id');

        return $locationId ? (int) $locationId : null;
    }

    /**
     * @param  list<array{product_id: int, quantity: float|int|string, unit_price?: float|int|string|null}>  $items
     * @return array{lines: list<array<string, mixed>>, products: array<int, Product>}
     */
    protected function buildLines(array $items, int $warehouseId): array
    {
        $lines = [];
        $products = [];

        foreach ($items as $row) {
            $productId = (int) $row['product_id'];
            $qty = round((float) $row['quantity'], 3);

            if ($qty <= 0) {
                throw new RuntimeException(__('pos.messages.invalid_quantity'));
            }

            $product = Product::query()->findOrFail($productId);
            $products[$productId] = $product;

            if ($product->status !== 'active') {
                throw new RuntimeException(__('pos.messages.product_inactive', ['name' => $product->name]));
            }

            $unitPrice = array_key_exists('unit_price', $row) && $row['unit_price'] !== null
                ? round((float) $row['unit_price'], 2)
                : round((float) ($product->price ?? 0), 2);

            if (! $product->isService()) {
                $available = (float) StockMovementRecorder::availableOnHand($productId, $warehouseId);

                if ($qty > $available) {
                    throw new RuntimeException(__('pos.messages.insufficient_stock', [
                        'name' => $product->name,
                        'available' => $available,
                    ]));
                }
            }

            $lineTotal = round($qty * $unitPrice, 2);

            $lines[] = [
                'product_id' => $productId,
                'product_packaging_id' => null,
                'quantity' => $qty,
                'qty_base' => $qty,
                'unit_price' => $unitPrice,
                'line_discount' => 0,
                'tax_amount' => 0,
                'line_total' => $lineTotal,
                'unit' => $product->unit,
            ];
        }

        return ['lines' => $lines, 'products' => $products];
    }

    /**
     * @param  list<array<string, mixed>>  $lines
     * @return array{subtotal: float, tax_total: float, grand_total: float}
     */
    protected function totalsFromLines(array $lines): array
    {
        $merchandise = round(collect($lines)->sum(fn (array $line): float => (float) $line['line_total']), 2);

        $taxEnabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
        $taxRate = (float) Setting::getValue('ecommerce.tax_rate', '11');

        // Retail prices are treated as tax-inclusive.
        if ($taxEnabled && $taxRate > 0) {
            $taxTotal = round($merchandise * $taxRate / (100 + $taxRate), 2);
            $subtotal = round($merchandise - $taxTotal, 2);
        } else {
            $taxTotal = 0.0;
            $subtotal = $merchandise;
        }

        return [
            'subtotal' => $subtotal,
            'tax_total' => $taxTotal,
            'grand_total' => $merchandise,
        ];
    }
}
