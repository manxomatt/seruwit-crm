<?php

namespace Modules\Invoicing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Modules\Invoicing\Http\Requests\StoreInvoiceLineRequest;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;

/**
 * Hand-written lines, and removal of any line whatever raised it.
 *
 * Removal being generic is what lets a module's work be released without
 * Invoicing knowing anything about it: a delivery order counts as unbilled
 * precisely because no line points at its charge, so deleting the line is the
 * whole of "take this back off the invoice".
 */
class InvoiceLineController extends Controller
{
    public function store(StoreInvoiceLineRequest $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Lines can only be changed on a draft invoice.');
        }

        DB::transaction(function () use ($request, $invoice) {
            $invoice->lines()->create($request->validated());
            $invoice->recalculate();
        });

        return back()->with('success', 'Line added.');
    }

    public function destroy(Invoice $invoice, InvoiceLine $line): RedirectResponse
    {
        if ($line->invoice_id !== $invoice->id) {
            abort(404);
        }

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Lines can only be changed on a draft invoice.');
        }

        DB::transaction(function () use ($invoice, $line) {
            $line->delete();
            $invoice->recalculate();
        });

        return back()->with('success', 'Line removed.');
    }
}
