<?php

namespace Modules\Payables\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Support\PurchaseBillService;
use Modules\Purchasing\Models\GoodReceiptNote;
use RuntimeException;

class SupplierBillController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $bills = SupplierBill::query()
            ->with(['partner:id,code,name', 'goodReceiptNote:id,grn_number'])
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where('code', 'like', "%{$search}%");
            })
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->latest('bill_date')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return inertia('Modules/Payables/Bills/Index', [
            'bills' => $bills,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
            ],
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function show(SupplierBill $bill): Response
    {
        $bill->load(['partner:id,code,name', 'lines', 'purchaseOrder:id,po_number', 'goodReceiptNote:id,grn_number']);

        return inertia('Modules/Payables/Bills/Show', [
            'bill' => $bill,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function storeFromGrn(GoodReceiptNote $grn): RedirectResponse
    {
        try {
            $bill = app(PurchaseBillService::class)->createFromGrn($grn);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.payables.bills.show', $bill)
            ->with('success', __('payables.messages.bill_created'));
    }

    public function issue(SupplierBill $bill): RedirectResponse
    {
        if ($bill->status !== SupplierBill::STATUS_DRAFT) {
            return back()->with('error', __('payables.messages.issue_draft_only'));
        }

        $bill->update(['status' => SupplierBill::STATUS_ISSUED]);

        return back()->with('success', __('payables.messages.bill_issued'));
    }

    public function void(SupplierBill $bill): RedirectResponse
    {
        if (! in_array($bill->status, [SupplierBill::STATUS_DRAFT, SupplierBill::STATUS_ISSUED], true)) {
            return back()->with('error', __('payables.messages.void_not_allowed'));
        }

        if ((float) $bill->amount_paid > 0) {
            return back()->with('error', __('payables.messages.void_has_payments'));
        }

        $bill->update(['status' => SupplierBill::STATUS_VOID]);

        return back()->with('success', __('payables.messages.bill_voided'));
    }

    /**
     * @return array{view: bool, create: bool, update: bool, delete: bool}
     */
    private function abilitiesFor(): array
    {
        $user = auth()->user();

        return [
            'view' => $user?->hasPermissionFor('payables', 'view') ?? false,
            'create' => $user?->hasPermissionFor('payables', 'create') ?? false,
            'update' => $user?->hasPermissionFor('payables', 'update') ?? false,
            'delete' => $user?->hasPermissionFor('payables', 'delete') ?? false,
        ];
    }
}
