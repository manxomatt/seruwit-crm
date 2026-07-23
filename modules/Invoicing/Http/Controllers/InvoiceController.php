<?php

namespace Modules\Invoicing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Invoicing\Http\Requests\StoreInvoiceRequest;
use Modules\Invoicing\Http\Requests\UpdateInvoiceRequest;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;

class InvoiceController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the invoices, with the outstanding/paid summary
     * cards that serve as this phase's lightweight reporting.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $invoices = Invoice::query()
            ->with('partner:id,code,name')
            ->when(request('search'), fn ($query, $search) => $query->where('code', 'like', "%{$search}%"))
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest('issue_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Invoicing/Invoices/Index', [
            'invoices' => $invoices,
            'summary' => [
                'outstanding' => (float) Invoice::query()->where('status', Invoice::STATUS_ISSUED)->sum('total'),
                'paid_this_month' => (float) Invoice::query()
                    ->where('status', Invoice::STATUS_PAID)
                    ->whereBetween('paid_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('total'),
                'draft_count' => Invoice::query()->where('status', Invoice::STATUS_DRAFT)->count(),
            ],
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => $this->abilitiesFor(),
        ]);
    }

    /**
     * Show the form for creating a new, empty invoice.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Invoicing/Invoices/Create', [
            'partners' => Partner::query()->orderBy('name')->get(['id', 'code', 'name']),
            'selectedPartnerId' => request('partner_id'),
        ]);
    }

    /**
     * Store a newly created draft invoice with no lines yet.
     */
    public function store(StoreInvoiceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $invoice = Invoice::create([
            'code' => Invoice::nextCode(),
            'partner_id' => $validated['partner_id'],
            'status' => Invoice::STATUS_DRAFT,
            'issue_date' => $validated['issue_date'] ?? now()->toDateString(),
            'due_date' => $validated['due_date'] ?? null,
            'tax_enabled' => Setting::getValue('ecommerce.tax_enabled', '1') === '1',
            'tax_rate' => (float) Setting::getValue('ecommerce.tax_rate', '11'),
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route($this->getRoutePrefix().'.invoicing.invoices.show', $invoice)
            ->with('success', 'Draft invoice created.');
    }

    /**
     * Display the specified invoice and its lines.
     */
    public function show(Invoice $invoice): Response
    {
        $invoice->load(['partner:id,code,name', 'lines']);

        return Inertia::render('Modules/Invoicing/Invoices/Show', [
            'invoice' => $invoice,
            'can' => $this->abilitiesFor(),
        ]);
    }

    /**
     * Update the specified draft invoice's metadata.
     */
    public function update(UpdateInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft invoice can be edited.');
        }

        $invoice->update($request->validated());
        $invoice->recalculate();

        return back()->with('success', 'Invoice updated.');
    }

    /**
     * Remove the specified draft invoice. Its lines go with it, which is what
     * releases the underlying work for re-invoicing.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft invoice can be deleted.');
        }

        $invoice->delete();

        return redirect()->route($this->getRoutePrefix().'.invoicing.invoices.index')
            ->with('success', 'Invoice deleted.');
    }

    /**
     * Issue the draft invoice, freezing its totals.
     */
    public function issue(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft invoice can be issued.');
        }

        if (! $invoice->lines()->exists()) {
            return back()->with('error', 'Add at least one line before issuing.');
        }

        $invoice->update(['status' => Invoice::STATUS_ISSUED]);

        return back()->with('success', 'Invoice issued.');
    }

    /**
     * Mark the issued invoice as paid.
     */
    public function pay(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_ISSUED) {
            return back()->with('error', 'Only an issued invoice can be marked as paid.');
        }

        $invoice->update([
            'status' => Invoice::STATUS_PAID,
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Invoice marked as paid.');
    }

    /**
     * Void a draft or issued invoice. Its lines are dropped, which releases the
     * work behind them for re-invoicing, while the frozen totals stay on the row
     * for audit and the code is never reused.
     */
    public function void(Invoice $invoice): RedirectResponse
    {
        if (! in_array($invoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_ISSUED], true)) {
            return back()->with('error', 'A paid invoice cannot be voided.');
        }

        DB::transaction(function () use ($invoice) {
            $invoice->lines()->delete();
            $invoice->update(['status' => Invoice::STATUS_VOID]);
        });

        return back()->with('success', 'Invoice voided.');
    }

    /**
     * @return array<string, bool>
     */
    private function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'create' => $user->hasPermissionFor('invoicing', 'create'),
            'update' => $user->hasPermissionFor('invoicing', 'update'),
            'delete' => $user->hasPermissionFor('invoicing', 'delete'),
        ];
    }
}
