<?php

namespace Modules\Invoicing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Modules\Invoicing\Models\Invoice;

class InvoicePdfController extends Controller
{
    /**
     * Stream the printable PDF for an issued or paid invoice.
     */
    public function show(Invoice $invoice): Response|RedirectResponse
    {
        if (! in_array($invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PAID], true)) {
            return back()->with('error', 'Only an issued or paid invoice can be printed.');
        }

        $invoice->load(['customer:id,code,name', 'lines']);

        return Pdf::loadView('invoicing::invoice', [
            'invoice' => $invoice,
            'company' => [
                'name' => Setting::getValue('general.site_name', ''),
                'address' => Setting::getValue('site.address', ''),
                'phone' => Setting::getValue('site.phone', ''),
            ],
            'currencySymbol' => Setting::getValue('ecommerce.currency_symbol', 'Rp'),
        ])->stream("invoice-{$invoice->code}.pdf");
    }
}
