<?php

namespace Modules\Payables\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Modules\Partners\Models\Partner;
use Modules\Payables\Http\Requests\StoreBillPaymentRequest;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Support\BillPaymentRecorder;

class BillPaymentController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $payments = BillPayment::query()
            ->with('partner:id,code,name')
            ->latest('payment_date')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return inertia('Modules/Payables/Payments/Index', [
            'payments' => $payments,
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('payables', 'create') ?? false,
                'delete' => auth()->user()?->hasPermissionFor('payables', 'delete') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        $partnerId = request()->integer('partner_id') ?: null;
        $billId = request()->integer('bill_id') ?: null;

        $openBills = $partnerId
            ? SupplierBill::query()
                ->where('partner_id', $partnerId)
                ->whereIn('status', [SupplierBill::STATUS_ISSUED, SupplierBill::STATUS_PARTIALLY_PAID])
                ->orderBy('due_date')
                ->get()
                ->map(fn (SupplierBill $bill) => [
                    'id' => $bill->id,
                    'code' => $bill->code,
                    'total' => (float) $bill->total,
                    'amount_paid' => (float) $bill->amount_paid,
                    'balance' => $bill->balanceDue(),
                ])
            : collect();

        return inertia('Modules/Payables/Payments/Create', [
            'partners' => Partner::query()
                ->where('supplier_rank', '>', 0)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'selectedPartnerId' => $partnerId,
            'selectedBillId' => $billId,
            'openBills' => $openBills,
            'methods' => BillPayment::methods(),
        ]);
    }

    public function store(StoreBillPaymentRequest $request): RedirectResponse
    {
        try {
            $payment = BillPaymentRecorder::record($request->validated());
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()->route($this->getRoutePrefix().'.payables.payments.show', $payment)
            ->with('success', __('payables.messages.payment_recorded'));
    }

    public function show(BillPayment $payment): Response
    {
        $payment->load(['partner:id,code,name', 'allocations.bill:id,code,total', 'recordedBy:id,name']);

        return inertia('Modules/Payables/Payments/Show', [
            'payment' => $payment,
            'can' => [
                'delete' => auth()->user()?->hasPermissionFor('payables', 'delete') ?? false,
            ],
        ]);
    }

    public function void(BillPayment $payment): RedirectResponse
    {
        try {
            BillPaymentRecorder::void($payment);
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with('success', __('payables.messages.payment_voided'));
    }
}
