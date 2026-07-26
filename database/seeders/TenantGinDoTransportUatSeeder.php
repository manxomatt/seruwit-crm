<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\PodItem;
use Modules\Orders\Models\ProofOfDelivery;
use Modules\Orders\Support\DeliveryOrderFromGinService;
use Modules\Orders\Support\DeliveryOrderStock;
use Modules\Orders\Support\DeliveryOrderTripAssignment;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\Sales\Support\GinConfirmationService;
use Modules\Sales\Support\SalesOrderConfirmationService;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

/**
 * UAT seed for GIN → DO → Transport (T0–T2). Leaves inspectable records tagged in notes.
 *
 *   php artisan tenants:seed --class=TenantGinDoTransportUatSeeder --tenants={id}
 */
class TenantGinDoTransportUatSeeder extends Seeder
{
    public const TAG = '[UAT-GIN-DO-TRANSPORT-20260726]';

    public function run(): void
    {
        $user = User::query()->orderBy('id')->first();
        if ($user) {
            Auth::login($user);
        }

        Setting::query()->updateOrCreate(
            ['key' => 'orders.auto_confirm_do_from_gin'],
            [
                'group' => 'orders',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Auto-confirm DO from GIN',
                'is_public' => false,
                'sort_order' => 1,
            ]
        );
        Setting::query()->updateOrCreate(
            ['key' => 'orders.require_pod_before_trip_complete'],
            [
                'group' => 'orders',
                'value' => 'off',
                'type' => 'text',
                'label' => 'Require POD before trip complete',
                'description' => 'off | from_gin | all',
                'is_public' => false,
                'sort_order' => 2,
            ]
        );

        $warehouse = Warehouse::query()->orderBy('id')->firstOrFail();
        $warehouse->update([
            'latitude' => -5.3971400,
            'longitude' => 105.2667900,
        ]);
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $customer = Partner::query()->where('customer_rank', '>', 0)->orderBy('id')->firstOrFail();
        $product = Product::query()
            ->where('status', 'active')
            ->where('category', 'merchandise')
            ->orderBy('id')
            ->firstOrFail();

        if (! $product->warehouse_id) {
            $product->update(['warehouse_id' => $warehouse->id]);
        }

        $existing = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('location_id', $stockLocation->id)
            ->orderBy('id')
            ->first();

        if ($existing) {
            $existing->update([
                'on_hand' => max(500, (float) $existing->on_hand),
                'reserved' => 0,
            ]);
        } else {
            StockLevel::query()->create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'location_id' => $stockLocation->id,
                'batch_number' => 'LOT-UAT-STOCK',
                'on_hand' => 500,
                'reserved' => 0,
            ]);
        }

        $vehicle = Vehicle::query()->firstOrCreate(
            ['plate_number' => 'BE 1001 UAT'],
            [
                'name' => 'Truck UAT Seruwit',
                'type' => 'truck',
                'brand' => 'Hino',
                'model_year' => 2022,
                'capacity' => '5000 kg',
                'capacity_kg' => 5000,
                'cost_per_km' => 3500,
                'tank_capacity_liters' => 120,
                'expected_km_per_liter' => 6.5,
                'fuel_type' => 'diesel',
                'status' => Vehicle::STATUS_ACTIVE,
                'odometer_km' => 42000,
                'stnk_expires_at' => now()->addYear(),
                'kir_expires_at' => now()->addMonths(8),
                'notes' => self::TAG.' fleet untuk UAT GIN→DO→Trip',
            ]
        );

        $driver = Driver::query()->firstOrCreate(
            ['license_number' => 'SIM-UAT-20260726'],
            [
                'name' => 'Sopir UAT Bandarlampung',
                'license_type' => 'B2',
                'license_expires_at' => now()->addYears(2),
                'phone' => '081234567890',
                'email' => 'sopir.uat@example.test',
                'status' => Driver::STATUS_AVAILABLE,
                'notes' => self::TAG.' driver untuk UAT',
            ]
        );

        $doService = app(DeliveryOrderFromGinService::class);
        $assignment = app(DeliveryOrderTripAssignment::class);

        // A: draft DO (setelah GIN)
        $ginA = $this->issueGin($customer, $warehouse, $stockLocation, $product, $user?->id, 20, 'A-draft-do');
        $doA = $doService->createFromConfirmedGin($ginA);

        // B: confirmed DO, siap dijadwalkan
        $ginB = $this->issueGin($customer, $warehouse, $stockLocation, $product, $user?->id, 15, 'B-ready-queue');
        $doB = $doService->createFromConfirmedGin($ginB);
        $this->confirmDo($doB);

        // C + D: batch assign ke trip scheduled
        $ginC = $this->issueGin($customer, $warehouse, $stockLocation, $product, $user?->id, 10, 'C-batch');
        $ginD = $this->issueGin($customer, $warehouse, $stockLocation, $product, $user?->id, 12, 'D-batch');
        $doC = $doService->createFromConfirmedGin($ginC);
        $doD = $doService->createFromConfirmedGin($ginD);
        $this->confirmDo($doC);
        $this->confirmDo($doD);

        $tripBatch = Trip::query()->create([
            'code' => Trip::nextCode(),
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'origin' => $warehouse->location,
            'destination' => 'Rute multi-drop UAT Bandar Lampung',
            'cargo_notes' => self::TAG.' trip batch assign C+D',
            'scheduled_at' => now()->setTime(8, 0),
            'status' => Trip::STATUS_SCHEDULED,
        ]);

        DB::transaction(function () use ($assignment, $doC, $doD, $tripBatch): void {
            $assignment->assign($doC->fresh(), $tripBatch);
            $assignment->assign($doD->fresh(), $tripBatch);
        });

        // E: full path → in_transit → POD dengan returned qty
        $ginE = $this->issueGin($customer, $warehouse, $stockLocation, $product, $user?->id, 18, 'E-pod-return');
        $doE = $doService->createFromConfirmedGin($ginE);
        $this->confirmDo($doE);

        $tripPod = Trip::query()->create([
            'code' => Trip::nextCode(),
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'origin' => $warehouse->location,
            'destination' => $customer->name,
            'cargo_notes' => self::TAG.' trip POD partial return',
            'scheduled_at' => now()->setTime(9, 0),
            'status' => Trip::STATUS_SCHEDULED,
        ]);

        DB::transaction(function () use ($assignment, $doE, $tripPod): void {
            $assignment->assign($doE->fresh(), $tripPod);
        });

        $tripPod->update([
            'status' => Trip::STATUS_IN_PROGRESS,
            'started_at' => now()->subHour(),
        ]);

        $doE->refresh();
        // TripObserver may have advanced DO to in_transit on status change
        if ($doE->status === DeliveryOrder::STATUS_ASSIGNED) {
            $doE->update(['status' => DeliveryOrder::STATUS_IN_TRANSIT]);
        }

        $dropoff = TripStop::query()
            ->where('delivery_order_id', $doE->id)
            ->where('type', TripStop::TYPE_DROPOFF)
            ->first();

        $doE->load('items');
        $line = $doE->items->first();
        $qty = (float) $line->quantity;

        $pod = ProofOfDelivery::query()->create([
            'delivery_order_id' => $doE->id,
            'trip_stop_id' => $dropoff?->id,
            'recipient_name' => 'Toko Penerima UAT',
            'signature_path' => null,
            'notes' => self::TAG.' POD dengan 2 unit returned (stock in)',
            'latitude' => -5.4290000,
            'longitude' => 105.2610000,
            'delivered_at' => now(),
            'submitted_by' => $user?->id,
        ]);

        PodItem::query()->create([
            'proof_of_delivery_id' => $pod->id,
            'delivery_order_item_id' => $line->id,
            'accepted_quantity' => max(0, $qty - 2),
            'rejected_quantity' => 0,
            'returned_quantity' => min(2, $qty),
            'reason' => 'Kemasan rusak — dikembalikan ke gudang',
        ]);

        if ($dropoff && $dropoff->status !== TripStop::STATUS_COMPLETED) {
            $dropoff->update([
                'status' => TripStop::STATUS_COMPLETED,
                'completed_at' => now(),
            ]);
        }

        $doE->refresh();
        if ($doE->status !== DeliveryOrder::STATUS_DELIVERED) {
            $doE->update([
                'status' => DeliveryOrder::STATUS_DELIVERED,
                'delivered_at' => now(),
            ]);
        }

        $this->command?->info(self::TAG.' UAT data siap.');
        $this->command?->table(
            ['Scenario', 'Ref'],
            [
                ['A draft DO', $doA->code.' ← GIN '.$ginA->gin_number],
                ['B ready queue', $doB->code],
                ['C+D batch assigned', $doC->code.', '.$doD->code.' @ '.$tripBatch->code],
                ['E delivered+POD return', $doE->code.' @ '.$tripPod->code],
                ['Warehouse geo', $warehouse->name.' '.$warehouse->latitude.','.$warehouse->longitude],
                ['Vehicle / Driver', $vehicle->plate_number.' / '.$driver->name],
            ]
        );
    }

    private function issueGin(
        Partner $customer,
        Warehouse $warehouse,
        WarehouseLocation $location,
        Product $product,
        ?int $userId,
        float $qty,
        string $label,
    ): GoodsIssueNote {
        $so = SalesOrder::query()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'created_by' => $userId,
            'so_number' => sprintf('SO-UAT-%s-%s', now()->format('His'), strtoupper(substr($label, 0, 1))),
            'status' => SalesOrder::STATUS_DRAFT,
            'ordered_at' => now()->toDateString(),
            'notes' => self::TAG.' SO '.$label,
            'total_amount' => 0,
        ]);

        $item = SalesOrderItem::query()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => $qty,
            'quantity_delivered' => 0,
            'unit_price' => 3500,
            'notes' => self::TAG,
        ]);

        $so->recalculateTotal();
        app(SalesOrderConfirmationService::class)->confirm($so->fresh());

        $gin = GoodsIssueNote::query()->create([
            'sales_order_id' => $so->id,
            'warehouse_id' => $warehouse->id,
            'issued_by' => $userId,
            'gin_number' => sprintf('GIN-UAT-%s-%s', now()->format('His'), strtoupper(substr($label, 0, 1))),
            'status' => GoodsIssueNote::STATUS_DRAFT,
            'issued_at' => now()->toDateString(),
            'delivery_note_number' => 'SJ-EXT-'.$label,
            'notes' => self::TAG.' GIN '.$label,
        ]);

        GoodsIssueNoteItem::query()->create([
            'goods_issue_note_id' => $gin->id,
            'so_item_id' => $item->id,
            'location_id' => $location->id,
            'quantity_issued' => $qty,
            'batch_number' => 'LOT-UAT-'.strtoupper(substr($label, 0, 1)),
            'notes' => self::TAG,
        ]);

        return app(GinConfirmationService::class)->confirm($gin->fresh(['items']));
    }

    private function confirmDo(DeliveryOrder $order): void
    {
        DeliveryOrderStock::reserve($order);
        $order->update([
            'status' => DeliveryOrder::STATUS_CONFIRMED,
            'confirmed_at' => now(),
            'notes' => trim(($order->notes ? $order->notes.' ' : '').self::TAG),
        ]);
    }
}
