<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Invoicing\Models\Invoice;
use Modules\Shuttle\Http\Controllers\Concerns\ResolvesActivePartner;
use Modules\Shuttle\Models\ShuttleBooking;

class PartnerPortalController extends Controller
{
    use ResolvesActivePartner;

    public function index(): Response
    {
        $partner = $this->activePartner();

        $bookings = ShuttleBooking::query()
            ->where('partner_id', $partner->id)
            ->with(['departure.corridor:id,name,code', 'departure:id,departure_number,depart_date,depart_time,corridor_id,status'])
            ->latest()
            ->paginate(15);

        $openInvoices = class_exists(Invoice::class)
            ? Invoice::query()
                ->where('partner_id', $partner->id)
                ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
                ->latest()
                ->limit(20)
                ->get(['id', 'code', 'status', 'total', 'amount_paid', 'due_date', 'issue_date'])
            : collect();

        return Inertia::render('Modules/Shuttle/Portal/Index', [
            'partner' => $partner->only(['id', 'code', 'name']),
            'bookings' => $bookings,
            'openInvoices' => $openInvoices,
            'gatewayEnabled' => $this->gatewayAvailable(),
        ]);
    }

    public function show(ShuttleBooking $booking): Response
    {
        $partner = $this->activePartner();
        $this->ensureBookingBelongsToPartner($booking, $partner);

        $booking->load([
            'departure.corridor',
            'passengers',
            'invoice:id,code,status,total,amount_paid,due_date',
            'creditInvoice:id,code,status,total',
        ]);

        return Inertia::render('Modules/Shuttle/Portal/Show', [
            'partner' => $partner->only(['id', 'code', 'name']),
            'booking' => $booking,
            'gatewayEnabled' => $this->gatewayAvailable(),
            'canPayInvoice' => $this->gatewayAvailable()
                && $booking->invoice
                && in_array($booking->invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID], true)
                && (float) $booking->invoice->amount_paid < (float) $booking->invoice->total,
        ]);
    }

    public function payInvoice(Invoice $invoice): RedirectResponse
    {
        abort_unless($this->gatewayAvailable(), 404);

        $partner = $this->activePartner();
        $this->ensureInvoiceBelongsToPartner($invoice, $partner);
        $invoice->loadMissing('partner');

        $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
            ->createInvoiceCharge($invoice);

        return redirect()->away($charge->redirect_url);
    }

    private function gatewayAvailable(): bool
    {
        if (! class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)) {
            return false;
        }

        return app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable();
    }
}
