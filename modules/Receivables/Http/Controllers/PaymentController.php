<?php

namespace Modules\Receivables\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Http\Requests\StorePaymentRequest;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\AgingReport;
use Modules\Receivables\Support\PaymentRecorder;

class PaymentController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $aging = AgingReport::build();

        $payments = Payment::query()
            ->with('partner:id,code,name')
            ->when(request('search'), fn ($q, $search) => $q->where('code', 'like', "%{$search}%")
                ->orWhere('reference_number', 'like', "%{$search}%"))
            ->when(request('status'), fn ($q, $status) => $q->where('status', $status))
            ->when(request('partner_id'), fn ($q, $partnerId) => $q->where('partner_id', $partnerId))
            ->latest('payment_date')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Modules/Receivables/Payments/Index', [
            'payments' => $payments,
            'alerts' => [
                'overdue_count' => $aging['overdue_count'],
                'overdue_amount' => $aging['overdue_amount'],
            ],
            'summary' => [
                'posted_this_month' => (float) Payment::query()
                    ->where('status', Payment::STATUS_POSTED)
                    ->whereBetween('payment_date', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('amount'),
                'open_ar' => round(collect($aging['buckets'])->sum(), 2),
            ],
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function create(): Response
    {
        $partnerId = request()->integer('partner_id') ?: null;
        $invoiceId = request()->integer('invoice_id') ?: null;

        $selectedInvoice = $invoiceId
            ? Invoice::query()->with('partner:id,code,name')->find($invoiceId)
            : null;

        if ($selectedInvoice && ! $partnerId) {
            $partnerId = $selectedInvoice->partner_id;
        }

        $openInvoices = $partnerId
            ? Invoice::query()
                ->where('partner_id', $partnerId)
                ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
                ->orderBy('due_date')
                ->orderBy('issue_date')
                ->get(['id', 'code', 'partner_id', 'status', 'issue_date', 'due_date', 'total', 'amount_paid'])
                ->map(fn (Invoice $invoice) => [
                    'id' => $invoice->id,
                    'code' => $invoice->code,
                    'status' => $invoice->status,
                    'issue_date' => $invoice->issue_date?->toDateString(),
                    'due_date' => $invoice->due_date?->toDateString(),
                    'total' => (float) $invoice->total,
                    'amount_paid' => (float) $invoice->amount_paid,
                    'balance' => $invoice->balanceDue(),
                ])
            : collect();

        return Inertia::render('Modules/Receivables/Payments/Create', [
            'partners' => Partner::query()
                ->where('customer_rank', '>', 0)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'credit_limit']),
            'selectedPartnerId' => $partnerId,
            'selectedInvoiceId' => $invoiceId,
            'openInvoices' => $openInvoices,
            'types' => Payment::types(),
            'methods' => Payment::methods(),
            'companyBankAccounts' => class_exists(\Modules\Accounting\Support\PaymentAccountResolver::class)
                ? \Modules\Accounting\Support\PaymentAccountResolver::optionsForForms()
                : [],
        ]);
    }

    public function store(StorePaymentRequest $request): RedirectResponse
    {
        $payment = PaymentRecorder::record($request->validated());

        return redirect()
            ->route($this->getRoutePrefix().'.receivables.payments.show', $payment)
            ->with('success', __('receivables.messages.payment_recorded'));
    }

    public function show(Payment $payment): Response
    {
        $payment->load([
            'partner:id,code,name',
            'recorder:id,name',
            'allocations.invoice:id,code,status,total,amount_paid,due_date',
        ]);

        return Inertia::render('Modules/Receivables/Payments/Show', [
            'payment' => $payment,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function void(Payment $payment): RedirectResponse
    {
        PaymentRecorder::void($payment);

        return back()->with('success', __('receivables.messages.payment_voided'));
    }

    /**
     * @return array<string, bool>
     */
    private function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'create' => $user->hasPermissionFor('receivables', 'create'),
            'update' => $user->hasPermissionFor('receivables', 'update'),
            'delete' => $user->hasPermissionFor('receivables', 'delete'),
        ];
    }
}
