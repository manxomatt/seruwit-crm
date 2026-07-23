<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Http\Controllers\Concerns\ResolvesActiveDriver;
use Modules\Orders\Http\Requests\StorePodRequest;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\PodItem;
use Modules\Orders\Models\PodPhoto;
use Modules\Orders\Models\ProofOfDelivery;
use Modules\Orders\Support\ShipmentStatusNotifier;
use Modules\TransportationManagement\Actions\TripStopTransitions;

/**
 * Proof-of-delivery capture: the form a driver fills at the dropoff, and the
 * submission that records the handover and marks the order delivered.
 */
class PodController extends Controller
{
    use ResolvesActiveDriver;

    public function create(DeliveryOrder $order): Response
    {
        $driver = $this->activeDriver();
        $this->ensureOrderBelongsToDriver($order, $driver);

        abort_if($order->status !== DeliveryOrder::STATUS_IN_TRANSIT, 403, 'This order is not out for delivery.');

        $order->load(['partner:id,name', 'items.product:id,name']);

        return Inertia::render('Modules/Orders/Driver/PodForm', [
            'driverName' => $driver->name,
            'order' => $order,
        ]);
    }

    public function store(StorePodRequest $request, DeliveryOrder $order, ShipmentStatusNotifier $notifier, TripStopTransitions $transitions): RedirectResponse
    {
        $driver = $this->activeDriver();
        $this->ensureOrderBelongsToDriver($order, $driver);

        abort_if($order->status !== DeliveryOrder::STATUS_IN_TRANSIT, 403, 'This order is not out for delivery.');

        $validated = $request->validated();
        $dropoffStop = $order->dropoffStop();

        DB::transaction(function () use ($order, $validated, $dropoffStop, $transitions): void {
            $signaturePath = null;

            if (! empty($validated['signature'])) {
                $signaturePath = $this->storeImage($validated['signature'], 'pod/signatures', 'png');
            }

            $pod = ProofOfDelivery::create([
                'delivery_order_id' => $order->id,
                'trip_stop_id' => $dropoffStop?->id,
                'recipient_name' => $validated['recipient_name'],
                'signature_path' => $signaturePath,
                'notes' => $validated['notes'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'delivered_at' => now(),
                'submitted_by' => Auth::id(),
            ]);

            foreach ($validated['photos'] ?? [] as $photo) {
                PodPhoto::create([
                    'proof_of_delivery_id' => $pod->id,
                    'path' => $this->storeImage($photo, 'pod/photos', 'jpg'),
                ]);
            }

            foreach ($validated['items'] as $item) {
                PodItem::create([
                    'proof_of_delivery_id' => $pod->id,
                    'delivery_order_item_id' => $item['delivery_order_item_id'],
                    'accepted_quantity' => $item['accepted_quantity'],
                    'rejected_quantity' => $item['rejected_quantity'],
                    'returned_quantity' => $item['returned_quantity'],
                    'reason' => $item['reason'] ?? null,
                ]);
            }

            // Completing the dropoff stop is an Eloquent update, so TripStopObserver
            // sees it and flips the order to delivered. When there is no stop (order
            // dispatched without fine-grained stops) fall back to marking it here.
            if ($dropoffStop !== null) {
                $transitions->complete($dropoffStop->trip, $dropoffStop);
            } else {
                $order->update([
                    'status' => DeliveryOrder::STATUS_DELIVERED,
                    'delivered_at' => now(),
                ]);
            }
        });

        $order->refresh();

        if ($order->status === DeliveryOrder::STATUS_DELIVERED) {
            $notifier->announce($order, DeliveryOrder::STATUS_IN_TRANSIT, DeliveryOrder::STATUS_DELIVERED);
        }

        return redirect()
            ->route('module.driver.trip', $order->trip_id)
            ->with('success', 'Bukti pengiriman tersimpan.');
    }

    protected function ensureOrderBelongsToDriver(DeliveryOrder $order, \Modules\Fleet\Models\Driver $driver): void
    {
        abort_if($order->trip === null || $order->trip->driver_id !== $driver->id, 403);
    }

    /**
     * Decodes a base64 data-URL image and writes it to tenant-isolated public
     * storage, returning the stored path.
     */
    protected function storeImage(string $dataUrl, string $directory, string $extension): string
    {
        $payload = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $binary = base64_decode($payload, true);

        $path = $directory.'/'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, $binary);

        return $path;
    }
}
