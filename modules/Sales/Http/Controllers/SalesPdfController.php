<?php

namespace Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesOrder;

class SalesPdfController extends Controller
{
    public function salesOrder(SalesOrder $so): Response|RedirectResponse
    {
        if (in_array($so->status, [SalesOrder::STATUS_DRAFT, SalesOrder::STATUS_CANCELLED], true)) {
            return back()->with('error', __('sales.messages.pdf_so_status'));
        }

        $so->load([
            'partner:id,code,name',
            'warehouse:id,name',
            'items.product:id,name,code,unit',
            'items.packaging:id,name,qty',
            'createdBy:id,name',
        ]);

        return Pdf::loadView('sales::sales-order', [
            'so' => $so,
            'company' => $this->company(),
            'currencySymbol' => Setting::getValue('ecommerce.currency_symbol', 'Rp'),
        ])->stream("so-{$so->so_number}.pdf");
    }

    public function gin(GoodsIssueNote $gin): Response|RedirectResponse
    {
        if ($gin->status !== GoodsIssueNote::STATUS_CONFIRMED) {
            return back()->with('error', __('sales.messages.pdf_gin_confirmed_only'));
        }

        $gin->load([
            'salesOrder:id,so_number,partner_id',
            'salesOrder.partner:id,code,name',
            'warehouse:id,name',
            'issuedBy:id,name',
            'items.salesOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        return Pdf::loadView('sales::gin', [
            'gin' => $gin,
            'company' => $this->company(),
        ])->stream("gin-{$gin->gin_number}.pdf");
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
