<?php

namespace Modules\Collections\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Collections\Models\CollectionDunning;
use Modules\Collections\Models\CollectionPromise;
use Modules\Collections\Models\PostDatedCheck;
use Modules\Collections\Support\DunningAutomationService;
use Modules\Invoicing\Models\Invoice;

class CollectionDashboardController extends Controller
{
    public function __construct(
        private readonly DunningAutomationService $dunning,
    ) {}

    public function index(Request $request): Response
    {
        $today = Carbon::today();

        // 1. Overdue Invoices
        $overdueInvoices = Invoice::query()
            ->with(['partner'])
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', $today)
            ->whereRaw('total > COALESCE(amount_paid, 0)')
            ->orderBy('due_date')
            ->take(30)
            ->get();

        // 2. Invoices Due Soon (next 7 days)
        $dueSoonInvoices = Invoice::query()
            ->with(['partner'])
            ->where('status', '!=', 'paid')
            ->whereBetween('due_date', [$today, $today->copy()->addDays(7)])
            ->whereRaw('total > COALESCE(amount_paid, 0)')
            ->orderBy('due_date')
            ->take(20)
            ->get();

        // 3. Active Promises to Pay
        $promises = CollectionPromise::query()
            ->with(['partner', 'invoice', 'recorder'])
            ->where('status', CollectionPromise::STATUS_PENDING)
            ->orderBy('promised_date')
            ->get();

        // 4. Recent Dunning Logs
        $recentDunnings = CollectionDunning::query()
            ->with(['partner', 'invoice'])
            ->latest('id')
            ->take(15)
            ->get();

        // 5. Stat Summaries
        $totalOverdueAmount = (float) Invoice::query()
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', $today)
            ->selectRaw('SUM(total - COALESCE(amount_paid, 0)) as overdue_total')
            ->value('overdue_total');

        $pendingPdcCount = PostDatedCheck::query()
            ->whereIn('status', [PostDatedCheck::STATUS_RECEIVED, PostDatedCheck::STATUS_DEPOSITED])
            ->count();

        $pendingPdcAmount = (float) PostDatedCheck::query()
            ->whereIn('status', [PostDatedCheck::STATUS_RECEIVED, PostDatedCheck::STATUS_DEPOSITED])
            ->sum('amount');

        return Inertia::render('Modules/Collections/Dashboard/Index', [
            'overdueInvoices' => $overdueInvoices,
            'dueSoonInvoices' => $dueSoonInvoices,
            'promises' => $promises,
            'recentDunnings' => $recentDunnings,
            'stats' => [
                'total_overdue_amount' => $totalOverdueAmount,
                'overdue_count' => $overdueInvoices->count(),
                'pending_promises_count' => $promises->count(),
                'pending_pdc_count' => $pendingPdcCount,
                'pending_pdc_amount' => $pendingPdcAmount,
            ],
        ]);
    }

    public function sendReminder(Invoice $invoice, Request $request): RedirectResponse
    {
        $dunning = $this->dunning->sendReminder(
            invoice: $invoice,
            channel: $request->string('channel', 'whatsapp'),
            actor: $request->user(),
        );

        return back()->with('success', "Reminder tahap {$dunning->stage} berhasil dikirim ke {$dunning->recipient}.");
    }

    public function storePromise(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'partner_id' => ['required', 'exists:partners,id'],
            'promised_amount' => ['required', 'numeric', 'min:1'],
            'promised_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        CollectionPromise::query()->create([
            ...$validated,
            'status' => CollectionPromise::STATUS_PENDING,
            'recorded_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Janji bayar (Promise to Pay) berhasil dicatat.');
    }

    public function fulfillPromise(CollectionPromise $promise): RedirectResponse
    {
        $promise->update([
            'status' => CollectionPromise::STATUS_FULFILLED,
            'fulfilled_at' => now(),
        ]);

        return back()->with('success', 'Status janji bayar berhasil diperbarui menjadi lunas.');
    }
}
