<?php

namespace Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;

class PurchasingPdfController extends Controller
{
    public function purchaseOrder(PurchaseOrder $po): Response|RedirectResponse
    {
        if (in_array($po->status, [PurchaseOrder::STATUS_DRAFT, PurchaseOrder::STATUS_CANCELLED], true)) {
            return back()->with('error', __('purchasing.messages.pdf_po_status'));
        }

        $po->load(['partner:id,code,name', 'warehouse:id,name', 'items.product:id,name,code,unit', 'items.packaging:id,name,qty', 'createdBy:id,name']);

        return Pdf::loadView('purchasing::purchase-order', [
            'po' => $po,
            'company' => $this->company(),
            'currencySymbol' => Setting::getValue('ecommerce.currency_symbol', 'Rp'),
        ])->stream("po-{$po->po_number}.pdf");
    }

    public function grn(GoodReceiptNote $grn): Response|RedirectResponse
    {
        if ($grn->status !== GoodReceiptNote::STATUS_CONFIRMED) {
            return back()->with('error', __('purchasing.messages.pdf_grn_confirmed_only'));
        }

        $grn->load([
            'purchaseOrder:id,po_number,partner_id',
            'purchaseOrder.partner:id,code,name',
            'warehouse:id,name',
            'receivedBy:id,name',
            'items.purchaseOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        return Pdf::loadView('purchasing::grn', [
            'grn' => $grn,
            'company' => $this->company(),
        ])->stream("grn-{$grn->grn_number}.pdf");
    }

    /**
     * @return array{name: string, address: string, phone: string}
     */
    private function company(): array
    {
        return [
            'name' => Setting::getValue('general.site_name', ''),
            'address' => Setting::getValue('site.address', ''),
            'phone' => Setting::getValue('site.phone', ''),
        ];
    }
}
