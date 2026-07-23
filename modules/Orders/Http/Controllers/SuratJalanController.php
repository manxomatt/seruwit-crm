<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Modules\Orders\Models\DeliveryOrder;

class SuratJalanController extends Controller
{
    /**
     * Stream the printable surat jalan (delivery note) for the given order.
     * Only meaningful once a trip carries the order — the document names the
     * vehicle and driver.
     */
    public function show(DeliveryOrder $order): Response|RedirectResponse
    {
        $printable = [
            DeliveryOrder::STATUS_ASSIGNED,
            DeliveryOrder::STATUS_IN_TRANSIT,
            DeliveryOrder::STATUS_DELIVERED,
        ];

        if (! in_array($order->status, $printable, true)) {
            return back()->with('error', 'A surat jalan is only available once the order is assigned to a trip.');
        }

        $order->load(['partner', 'items.product', 'trip.vehicle', 'trip.driver']);

        return Pdf::loadView('orders::surat-jalan', [
            'order' => $order,
            'stop' => $order->dropoffStop(),
        ])->stream("surat-jalan-{$order->code}.pdf");
    }
}
