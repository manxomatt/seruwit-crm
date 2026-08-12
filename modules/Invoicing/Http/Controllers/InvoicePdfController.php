<?php

namespace Modules\Invoicing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Support\DocumentTemplateManager;

class InvoicePdfController extends Controller
{
    public function show(Invoice $invoice): Response|RedirectResponse
    {
        if (! in_array($invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PAID], true)) {
            return back()->with('error', __('invoicing.messages.print_issued_only'));
        }

        $invoice->load(['partner:id,code,name', 'lines']);

        $template = DocumentTemplateManager::resolveForPdf(DocumentTemplateManager::CODE_INVOICE, [
            'invoice' => $invoice,
            'partner' => $invoice->partner,
            'company' => [
                'name' => Setting::getValue('general.site_name', ''),
                'address' => Setting::getValue('site.address', ''),
                'phone' => Setting::getValue('site.phone', ''),
            ],
        ]);

        return Pdf::loadView('invoicing::invoice', [
            'invoice' => $invoice,
            'company' => [
                'name' => Setting::getValue('general.site_name', ''),
                'address' => Setting::getValue('site.address', ''),
                'phone' => Setting::getValue('site.phone', ''),
            ],
            'currencySymbol' => Setting::getValue('ecommerce.currency_symbol', 'Rp'),
            'template' => $template,
        ])->stream("invoice-{$invoice->code}.pdf");
    }
}
