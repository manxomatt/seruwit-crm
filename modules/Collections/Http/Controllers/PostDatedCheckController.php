<?php

namespace Modules\Collections\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Support\PaymentAccountResolver;
use Modules\Collections\Models\PostDatedCheck;
use Modules\Collections\Support\PostDatedCheckService;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;

class PostDatedCheckController extends Controller
{
    public function __construct(
        private readonly PostDatedCheckService $service,
    ) {}

    public function index(Request $request): Response
    {
        $query = PostDatedCheck::query()
            ->with(['partner', 'invoice', 'companyBankAccount', 'receiver'])
            ->latest('due_date');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->integer('partner_id'));
        }

        $pdcs = $query->paginate(20)->withQueryString();
        $partners = Partner::query()->orderBy('name')->get(['id', 'name']);
        $invoices = Invoice::query()
            ->where('status', '!=', 'paid')
            ->orderByDesc('id')
            ->take(50)
            ->get(['id', 'code', 'partner_id', 'total', 'amount_paid']);

        return Inertia::render('Modules/Collections/PostDatedChecks/Index', [
            'pdcs' => $pdcs,
            'partners' => $partners,
            'invoices' => $invoices,
            'companyBankAccounts' => PaymentAccountResolver::optionsForForms(),
            'filters' => $request->only(['status', 'partner_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'check_number' => ['required', 'string', 'max:64', 'unique:post_dated_checks,check_number'],
            'bank_name' => ['required', 'string', 'max:100'],
            'partner_id' => ['required', 'exists:partners,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        PostDatedCheck::query()->create([
            ...$validated,
            'status' => PostDatedCheck::STATUS_RECEIVED,
            'received_by' => $request->user()?->id,
        ]);

        return back()->with('success', "Bilyet Giro {$validated['check_number']} berhasil dicatat.");
    }

    public function deposit(PostDatedCheck $pdc): RedirectResponse
    {
        $this->service->deposit($pdc);

        return back()->with('success', "Giro {$pdc->check_number} telah ditandai dititipkan ke bank (deposited).");
    }

    public function clear(PostDatedCheck $pdc, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_bank_account_id' => ['nullable', 'integer'],
        ]);

        $this->service->clear(
            pdc: $pdc,
            companyBankAccountId: $validated['company_bank_account_id'] ?? null,
            actor: $request->user(),
        );

        return back()->with('success', "Giro {$pdc->check_number} berhasil dicairkan (cleared).");
    }

    public function bounce(PostDatedCheck $pdc, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bounced_reason' => ['required', 'string', 'max:255'],
        ]);

        $this->service->bounce(
            pdc: $pdc,
            reason: $validated['bounced_reason'],
            actor: $request->user(),
        );

        return back()->with('success', "Giro {$pdc->check_number} ditandai ditolak / kosong (bounced).");
    }

    public function destroy(PostDatedCheck $pdc): RedirectResponse
    {
        if ($pdc->isCleared()) {
            return back()->with('error', 'Giro yang sudah cair tidak dapat dihapus.');
        }

        $checkNum = $pdc->check_number;
        $pdc->delete();

        return back()->with('success', "Data Giro {$checkNum} berhasil dihapus.");
    }
}
