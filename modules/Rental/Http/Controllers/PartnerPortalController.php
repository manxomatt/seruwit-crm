<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Http\Controllers\Concerns\ResolvesActivePartner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;

class PartnerPortalController extends Controller
{
    use ResolvesActivePartner;

    public function index(): Response
    {
        $partner = $this->activePartner();

        $rentals = Rental::query()
            ->where('partner_id', $partner->id)
            ->with(['vehicle:id,name,plate_number'])
            ->latest()
            ->paginate(15);

        $invoices = class_exists(Invoice::class)
            ? Invoice::query()
                ->where('partner_id', $partner->id)
                ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
                ->latest()
                ->limit(20)
                ->get(['id', 'code', 'status', 'total', 'amount_paid', 'due_date', 'issue_date'])
            : collect();

        return Inertia::render('Modules/Rental/Portal/Index', [
            'partner' => $partner->only(['id', 'code', 'name']),
            'rentals' => $rentals,
            'openInvoices' => $invoices,
            'gatewayEnabled' => $this->gatewayAvailable(),
        ]);
    }

    public function show(Rental $rental): Response
    {
        $partner = $this->activePartner();
        $this->ensureRentalBelongsToPartner($rental, $partner);

        $rental->load([
            'vehicle:id,name,plate_number,type',
            'charges' => fn ($q) => $q->where('kind', RentalCharge::KIND_ADDON)->orderBy('id'),
        ]);

        return Inertia::render('Modules/Rental/Portal/Show', [
            'partner' => $partner->only(['id', 'code', 'name']),
            'rental' => $rental,
            'gatewayEnabled' => $this->gatewayAvailable(),
            'canPayDeposit' => $this->gatewayAvailable()
                && (float) $rental->deposit_amount > 0
                && $rental->deposit_received_at === null
                && in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE], true),
        ]);
    }

    public function payDeposit(Rental $rental): RedirectResponse
    {
        abort_unless($this->gatewayAvailable(), 404);

        $partner = $this->activePartner();
        $this->ensureRentalBelongsToPartner($rental, $partner);
        $rental->loadMissing('partner');

        $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
            ->createRentalDepositCharge($rental);

        return redirect()->away($charge->redirect_url);
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
