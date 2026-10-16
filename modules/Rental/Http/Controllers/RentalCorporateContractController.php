<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalCorporateContract;
use Modules\Rental\Models\RentalDutyOrder;

class RentalCorporateContractController extends Controller
{
    public function index(Request $request): Response
    {
        $statusFilter = (string) $request->string('status', 'all');
        $cycleFilter = (string) $request->string('billing_cycle', 'all');
        $search = trim((string) $request->string('search', ''));

        $query = RentalCorporateContract::query()
            ->with([
                'partner:id,name,email,phone',
                'rentals' => fn ($q) => $q->with(['vehicle:id,name,plate_number,brand,model', 'charges.invoiceLine.invoice']),
            ])
            ->orderByDesc('id');

        if ($statusFilter !== 'all' && $statusFilter !== '') {
            $query->where('status', $statusFilter);
        }

        if ($cycleFilter !== 'all' && $cycleFilter !== '') {
            $query->where('billing_cycle', $cycleFilter);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('po_number', 'like', "%{$search}%")
                    ->orWhere('pic_name', 'like', "%{$search}%")
                    ->orWhereHas('partner', fn ($pq) => $pq->where('name', 'like', "%{$search}%"));
            });
        }

        $contracts = $query->get();

        $rows = $contracts->map(function (RentalCorporateContract $contract): array {
            $metrics = $this->computeContractMetrics($contract);

            return [
                'id' => $contract->id,
                'code' => $contract->code,
                'title' => $contract->title,
                'partner_id' => $contract->partner_id,
                'partner_name' => $contract->partner?->name ?? '—',
                'partner_phone' => $contract->partner?->phone,
                'po_number' => $contract->po_number,
                'pic_name' => $contract->pic_name,
                'pic_phone' => $contract->pic_phone,
                'pic_email' => $contract->pic_email,
                'start_date' => $contract->start_date?->toDateString(),
                'end_date' => $contract->end_date?->toDateString(),
                'billing_cycle' => $contract->billing_cycle,
                'payment_term_days' => (int) $contract->payment_term_days,
                'credit_limit' => (float) $contract->credit_limit,
                'discount_pct' => (float) $contract->discount_pct,
                'tax_included' => (bool) $contract->tax_included,
                'withholding_tax_pct' => (float) $contract->withholding_tax_pct,
                'sla_replacement_hours' => (int) $contract->sla_replacement_hours,
                'status' => $contract->status,
                'notes' => $contract->notes,
                ...$metrics,
            ];
        })->values();

        $kpis = [
            'active_contracts' => $rows->where('status', RentalCorporateContract::STATUS_ACTIVE)->count(),
            'active_units' => (int) $rows->sum('active_rentals_count'),
            'total_unbilled' => round((float) $rows->sum('unbilled_amount'), 2),
            'total_outstanding_ar' => round((float) $rows->sum('outstanding_ar'), 2),
        ];

        $partners = Schema::hasTable('partners')
            ? Partner::query()
                ->select(['id', 'name', 'email', 'phone'])
                ->orderBy('name')
                ->get()
                ->map(fn (Partner $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'email' => $p->email,
                    'phone' => $p->phone,
                ])
                ->values()
            : collect();

        return Inertia::render('Modules/Rental/CorporateContracts/Index', [
            'contracts' => $rows,
            'kpis' => $kpis,
            'partners' => $partners,
            'filters' => [
                'status' => $statusFilter,
                'billing_cycle' => $cycleFilter,
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'title' => ['required', 'string', 'max:191'],
            'po_number' => ['nullable', 'string', 'max:100'],
            'pic_name' => ['nullable', 'string', 'max:150'],
            'pic_phone' => ['nullable', 'string', 'max:60'],
            'pic_email' => ['nullable', 'email', 'max:150'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'billing_cycle' => ['required', 'string', 'in:monthly,biweekly,per_trip'],
            'payment_term_days' => ['required', 'integer', 'min:0', 'max:180'],
            'credit_limit' => ['required', 'numeric', 'min:0'],
            'discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax_included' => ['required', 'boolean'],
            'withholding_tax_pct' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'sla_replacement_hours' => ['required', 'integer', 'min:1', 'max:72'],
            'status' => ['required', 'string', 'in:draft,active,expired,terminated'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $contract = RentalCorporateContract::query()->create([
            'code' => RentalCorporateContract::generateCode(),
            'partner_id' => $validated['partner_id'],
            'title' => $validated['title'],
            'po_number' => $validated['po_number'] ?? null,
            'pic_name' => $validated['pic_name'] ?? null,
            'pic_phone' => $validated['pic_phone'] ?? null,
            'pic_email' => $validated['pic_email'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'billing_cycle' => $validated['billing_cycle'],
            'payment_term_days' => (int) $validated['payment_term_days'],
            'credit_limit' => (float) $validated['credit_limit'],
            'discount_pct' => (float) ($validated['discount_pct'] ?? 0),
            'tax_included' => (bool) $validated['tax_included'],
            'withholding_tax_pct' => (float) ($validated['withholding_tax_pct'] ?? 2),
            'sla_replacement_hours' => (int) $validated['sla_replacement_hours'],
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()
            ->route('rental.corporate.show', $contract->id)
            ->with('success', "Kontrak Sewa Korporat {$contract->code} berhasil dibuat.");
    }

    public function update(Request $request, RentalCorporateContract $contract): RedirectResponse
    {
        $validated = $request->validate([
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'title' => ['required', 'string', 'max:191'],
            'po_number' => ['nullable', 'string', 'max:100'],
            'pic_name' => ['nullable', 'string', 'max:150'],
            'pic_phone' => ['nullable', 'string', 'max:60'],
            'pic_email' => ['nullable', 'email', 'max:150'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'billing_cycle' => ['required', 'string', 'in:monthly,biweekly,per_trip'],
            'payment_term_days' => ['required', 'integer', 'min:0', 'max:180'],
            'credit_limit' => ['required', 'numeric', 'min:0'],
            'discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax_included' => ['required', 'boolean'],
            'withholding_tax_pct' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'sla_replacement_hours' => ['required', 'integer', 'min:1', 'max:72'],
            'status' => ['required', 'string', 'in:draft,active,expired,terminated'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $contract->update([
            'partner_id' => $validated['partner_id'],
            'title' => $validated['title'],
            'po_number' => $validated['po_number'] ?? null,
            'pic_name' => $validated['pic_name'] ?? null,
            'pic_phone' => $validated['pic_phone'] ?? null,
            'pic_email' => $validated['pic_email'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'billing_cycle' => $validated['billing_cycle'],
            'payment_term_days' => (int) $validated['payment_term_days'],
            'credit_limit' => (float) $validated['credit_limit'],
            'discount_pct' => (float) ($validated['discount_pct'] ?? 0),
            'tax_included' => (bool) $validated['tax_included'],
            'withholding_tax_pct' => (float) ($validated['withholding_tax_pct'] ?? 2),
            'sla_replacement_hours' => (int) $validated['sla_replacement_hours'],
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', "Kontrak Korporat {$contract->code} berhasil diperbarui.");
    }

    public function show(Request $request, RentalCorporateContract $contract): Response
    {
        $period = (string) $request->string('period', 'all');

        $contract->load([
            'partner:id,name,email,phone,address',
            'rentals' => fn ($q) => $q->with([
                'vehicle:id,name,plate_number,brand,model',
                'driver:id,name,phone',
                'charges.invoiceLine.invoice',
            ])->orderByDesc('start_date'),
        ]);

        $metrics = $this->computeContractMetrics($contract);

        $dutyOrdersByRental = Schema::hasTable('rental_duty_orders')
            ? RentalDutyOrder::query()
                ->whereIn('rental_id', $contract->rentals->pluck('id'))
                ->where('status', '!=', RentalDutyOrder::STATUS_CANCELLED)
                ->get()
                ->groupBy('rental_id')
            : collect();

        $filteredRentals = $contract->rentals->filter(function (Rental $rental) use ($period): bool {
            if ($period === 'all' || $period === '') {
                return true;
            }

            return $rental->start_date?->format('Y-m') === $period
                || $rental->end_date?->format('Y-m') === $period;
        });

        $rentalRows = $filteredRentals->map(function (Rental $rental) use ($dutyOrdersByRental): array {
            $vehicle = $rental->vehicle;
            $vehicleLabel = $vehicle
                ? trim(($vehicle->brand ?? '').' '.($vehicle->model ?? $vehicle->name ?? ''))
                : 'Unit #'.$rental->vehicle_id;

            $baseAmount = (float) $rental->base_amount;
            $extraAmount = (float) $rental->charges
                ->where('kind', '!=', RentalCharge::KIND_BASE)
                ->sum('amount');

            $dutyOvertime = (float) ($dutyOrdersByRental->get($rental->id)?->sum('overtime_customer_charge') ?? 0);

            $chargesTotal = (float) $rental->charges->sum('amount');
            $grossBillable = $chargesTotal > 0 ? $chargesTotal : ($baseAmount + (float) $rental->excess_amount + (float) $rental->late_fee_amount);

            $nonVoidInvoices = $rental->charges
                ->map(fn (RentalCharge $c) => $c->invoiceLine?->invoice)
                ->filter(fn (?Invoice $inv) => $inv !== null && $inv->status !== Invoice::STATUS_VOID)
                ->unique('id')
                ->values();

            $billedInvoices = $nonVoidInvoices->filter(fn (Invoice $inv) => $inv->status !== Invoice::STATUS_DRAFT);
            $draftInvoices = $nonVoidInvoices->filter(fn (Invoice $inv) => $inv->status === Invoice::STATUS_DRAFT);

            $billingStatus = 'unbilled';
            $primaryInvoice = null;

            if ($billedInvoices->isNotEmpty()) {
                $primaryInvoice = $billedInvoices->first();
                $billingStatus = $primaryInvoice->status;
            } elseif ($draftInvoices->isNotEmpty()) {
                $primaryInvoice = $draftInvoices->first();
                $billingStatus = 'draft_single';
            }

            return [
                'id' => $rental->id,
                'code' => $rental->code,
                'client_po_number' => $rental->client_po_number ?: $rental->corporateContract?->po_number,
                'vehicle_label' => $vehicleLabel !== '' ? $vehicleLabel : ($vehicle?->name ?? '—'),
                'plate_number' => $vehicle?->plate_number ?? '—',
                'driver_name' => $rental->driver?->name,
                'service_type' => $rental->service_type ?? 'self_drive',
                'start_date' => $rental->start_date?->toDateString(),
                'end_date' => $rental->end_date?->toDateString(),
                'status' => $rental->status,
                'base_amount' => $baseAmount,
                'extra_amount' => $extraAmount,
                'duty_overtime_amount' => $dutyOvertime,
                'gross_billable' => round($grossBillable, 2),
                'billing_status' => $billingStatus,
                'can_consolidate' => in_array($billingStatus, ['unbilled', 'draft_single'], true)
                    && ! in_array($rental->status, [Rental::STATUS_CANCELLED], true),
                'invoice_id' => $primaryInvoice?->id,
                'invoice_code' => $primaryInvoice?->code,
            ];
        })->values();

        // Available partner rentals not yet linked to any corporate contract
        $availablePartnerRentals = Rental::query()
            ->where('partner_id', $contract->partner_id)
            ->whereNull('corporate_contract_id')
            ->where('status', '!=', Rental::STATUS_CANCELLED)
            ->with('vehicle:id,name,plate_number,brand,model')
            ->orderByDesc('start_date')
            ->limit(50)
            ->get()
            ->map(fn (Rental $r) => [
                'id' => $r->id,
                'code' => $r->code,
                'vehicle_label' => trim(($r->vehicle?->brand ?? '').' '.($r->vehicle?->model ?? $r->vehicle?->name ?? '')),
                'plate_number' => $r->vehicle?->plate_number ?? '—',
                'start_date' => $r->start_date?->toDateString(),
                'end_date' => $r->end_date?->toDateString(),
                'total_amount' => (float) $r->total_amount,
                'status' => $r->status,
            ])
            ->values();

        // Consolidated / Linked Invoices for this contract
        $allChargeIds = $contract->rentals->flatMap(fn (Rental $r) => $r->charges->pluck('id'))->unique()->values();
        $morph = (new RentalCharge)->getMorphClass();

        $invoices = ($allChargeIds->isNotEmpty() && Schema::hasTable('invoices'))
            ? Invoice::query()
                ->where('status', '!=', Invoice::STATUS_VOID)
                ->whereHas('lines', fn ($q) => $q->where('source_type', $morph)->whereIn('source_id', $allChargeIds))
                ->with('lines')
                ->orderByDesc('id')
                ->get()
                ->map(function (Invoice $inv) use ($contract): array {
                    $subtotal = (float) $inv->subtotal;
                    $taxAmount = (float) $inv->tax_amount;
                    $total = (float) $inv->total;
                    $withholdingPct = (float) $contract->withholding_tax_pct;
                    $withholdingAmount = round($subtotal * ($withholdingPct / 100), 2);
                    $netCashExpected = round($total - $withholdingAmount, 2);

                    return [
                        'id' => $inv->id,
                        'code' => $inv->code,
                        'status' => $inv->status,
                        'issue_date' => $inv->issue_date?->toDateString(),
                        'due_date' => $inv->due_date?->toDateString(),
                        'lines_count' => $inv->lines->count(),
                        'subtotal' => $subtotal,
                        'tax_amount' => $taxAmount,
                        'total' => $total,
                        'withholding_tax_pct' => $withholdingPct,
                        'withholding_amount' => $withholdingAmount,
                        'net_cash_expected' => $netCashExpected,
                        'amount_paid' => (float) ($inv->amount_paid ?? 0),
                        'balance_due' => $inv->balanceDue(),
                        'notes' => $inv->notes,
                        'lines' => $inv->lines->map(fn (InvoiceLine $line) => [
                            'id' => $line->id,
                            'description' => $line->description,
                            'amount' => (float) $line->amount,
                        ])->values()->all(),
                    ];
                })
                ->values()
            : collect();

        $partners = Schema::hasTable('partners')
            ? Partner::query()->select(['id', 'name', 'email', 'phone'])->orderBy('name')->get()
            : collect();

        return Inertia::render('Modules/Rental/CorporateContracts/Show', [
            'contract' => [
                'id' => $contract->id,
                'code' => $contract->code,
                'title' => $contract->title,
                'partner_id' => $contract->partner_id,
                'partner_name' => $contract->partner?->name ?? '—',
                'partner_email' => $contract->partner?->email,
                'partner_phone' => $contract->partner?->phone,
                'partner_address' => $contract->partner?->address,
                'po_number' => $contract->po_number,
                'pic_name' => $contract->pic_name,
                'pic_phone' => $contract->pic_phone,
                'pic_email' => $contract->pic_email,
                'start_date' => $contract->start_date?->toDateString(),
                'end_date' => $contract->end_date?->toDateString(),
                'billing_cycle' => $contract->billing_cycle,
                'payment_term_days' => (int) $contract->payment_term_days,
                'credit_limit' => (float) $contract->credit_limit,
                'discount_pct' => (float) $contract->discount_pct,
                'tax_included' => (bool) $contract->tax_included,
                'withholding_tax_pct' => (float) $contract->withholding_tax_pct,
                'sla_replacement_hours' => (int) $contract->sla_replacement_hours,
                'status' => $contract->status,
                'notes' => $contract->notes,
                ...$metrics,
            ],
            'rentals' => $rentalRows,
            'availablePartnerRentals' => $availablePartnerRentals,
            'invoices' => $invoices,
            'partners' => $partners,
            'filters' => [
                'period' => $period,
            ],
        ]);
    }

    public function attachRentals(Request $request, RentalCorporateContract $contract): RedirectResponse
    {
        $validated = $request->validate([
            'rental_ids' => ['required', 'array', 'min:1'],
            'rental_ids.*' => ['integer', 'exists:rentals,id'],
            'client_po_number' => ['nullable', 'string', 'max:100'],
        ]);

        $poNumber = $validated['client_po_number'] ?? $contract->po_number;

        $updated = Rental::query()
            ->whereIn('id', $validated['rental_ids'])
            ->update([
                'corporate_contract_id' => $contract->id,
                'client_po_number' => $poNumber,
            ]);

        return back()->with('success', "{$updated} booking sewa berhasil ditautkan ke Kontrak {$contract->code}.");
    }

    public function consolidateInvoice(Request $request, RentalCorporateContract $contract): RedirectResponse
    {
        $validated = $request->validate([
            'rental_ids' => ['required', 'array', 'min:1'],
            'rental_ids.*' => ['integer', 'exists:rentals,id'],
            'billing_period' => ['nullable', 'string', 'max:30'],
            'issue_immediately' => ['required', 'boolean'],
            'apply_discount' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! Schema::hasTable('invoices') || ! Schema::hasTable('invoice_lines')) {
            return back()->with('error', 'Modul Invoicing belum aktif.');
        }

        $rentals = Rental::query()
            ->where('corporate_contract_id', $contract->id)
            ->whereIn('id', $validated['rental_ids'])
            ->with(['vehicle:id,name,plate_number,brand,model', 'charges.invoiceLine.invoice'])
            ->orderBy('start_date')
            ->get();

        if ($rentals->isEmpty()) {
            return back()->with('error', 'Tidak ada booking sewa valid yang dipilih untuk konsolidasi tagihan.');
        }

        $invoice = DB::transaction(function () use ($contract, $rentals, $validated): ?Invoice {
            $morph = (new RentalCharge)->getMorphClass();
            $chargesToConsolidate = collect();
            $draftInvoicesToCleanup = collect();

            foreach ($rentals as $rental) {
                $vehicle = $rental->vehicle;
                $plate = $vehicle?->plate_number ?? 'Unit';
                $poTag = $rental->client_po_number ?: $contract->po_number;
                $poSuffix = $poTag ? " (PO: {$poTag})" : '';

                // Ensure base charge exists if base_amount > 0
                if ((float) $rental->base_amount > 0) {
                    $baseCharge = RentalCharge::query()
                        ->where('rental_id', $rental->id)
                        ->where('kind', RentalCharge::KIND_BASE)
                        ->first();

                    $baseDescription = sprintf(
                        '[%s • %s] Sewa Unit %s s/d %s%s',
                        $rental->code,
                        $plate,
                        $rental->start_date?->format('d/m/Y') ?? '-',
                        $rental->end_date?->format('d/m/Y') ?? '-',
                        $poSuffix
                    );

                    if (! $baseCharge) {
                        $baseCharge = RentalCharge::query()->create([
                            'rental_id' => $rental->id,
                            'kind' => RentalCharge::KIND_BASE,
                            'amount' => (float) $rental->base_amount,
                            'description' => $baseDescription,
                        ]);
                    }
                }

                // Refresh charges for this rental
                $rentalCharges = RentalCharge::query()
                    ->where('rental_id', $rental->id)
                    ->with('invoiceLine.invoice')
                    ->orderBy('id')
                    ->get();

                foreach ($rentalCharges as $charge) {
                    $existingLine = $charge->invoiceLine;
                    $existingInvoice = $existingLine?->invoice;

                    // Skip charges already on an issued/paid invoice
                    if ($existingInvoice && ! in_array($existingInvoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID], true)) {
                        continue;
                    }

                    // If attached to a standalone draft invoice, detach line and mark draft invoice for cleanup
                    if ($existingLine && $existingInvoice && $existingInvoice->status === Invoice::STATUS_DRAFT) {
                        $draftInvoicesToCleanup->push($existingInvoice->id);
                        $existingLine->delete();
                    }

                    // Ensure clear corporate description with rental code & plate
                    if (! str_contains((string) $charge->description, $rental->code)) {
                        $charge->update([
                            'description' => "[{$rental->code} • {$plate}] {$charge->description}{$poSuffix}",
                        ]);
                    }

                    $chargesToConsolidate->push($charge->fresh());
                }
            }

            if ($chargesToConsolidate->isEmpty()) {
                return null;
            }

            // Void/remove any emptied standalone draft invoices
            foreach ($draftInvoicesToCleanup->unique() as $draftInvoiceId) {
                $draftInv = Invoice::query()->withCount('lines')->find($draftInvoiceId);
                if ($draftInv && $draftInv->status === Invoice::STATUS_DRAFT) {
                    if ($draftInv->lines_count === 0) {
                        $draftInv->update(['status' => Invoice::STATUS_VOID]);
                    } else {
                        $draftInv->recalculate();
                    }
                }
            }

            $issueDate = now()->toDateString();
            $dueDate = Carbon::parse($issueDate)->addDays((int) $contract->payment_term_days)->toDateString();
            $periodLabel = $validated['billing_period'] ?: now()->translatedFormat('F Y');

            $defaultNotes = sprintf(
                "Tagihan Gabungan Korporat (Consolidated Invoice) — Kontrak %s (%s)%s.\nPeriode: %s | TOP: Net %d Hari.%s",
                $contract->code,
                $contract->title,
                $contract->po_number ? " | PO Induk: {$contract->po_number}" : '',
                $periodLabel,
                (int) $contract->payment_term_days,
                (float) $contract->withholding_tax_pct > 0
                    ? sprintf(' | Potongan PPh 23 (%s%%) dilampirkan Bukti Potong oleh Klien.', number_format((float) $contract->withholding_tax_pct, 1))
                    : ''
            );

            $notes = trim($defaultNotes.(! empty($validated['notes']) ? "\nCatatan: ".$validated['notes'] : ''));

            $consolidatedInvoice = Invoice::query()->create([
                'code' => Invoice::nextCode(),
                'partner_id' => $contract->partner_id,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => $issueDate,
                'due_date' => $dueDate,
                'tax_enabled' => (bool) $contract->tax_included,
                'tax_rate' => $contract->tax_included ? 11.0 : 0.0,
                'tax_code_id' => null,
                'tax_code' => $contract->tax_included ? 'PPN-11' : null,
                'tax_calculation' => 'exclusive',
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => $notes,
            ]);

            $grossSubtotal = 0.0;

            foreach ($chargesToConsolidate as $charge) {
                $amt = (float) $charge->amount;
                $grossSubtotal += $amt;

                InvoiceLine::query()->create([
                    'invoice_id' => $consolidatedInvoice->id,
                    'description' => $charge->description,
                    'amount' => $amt,
                    'source_type' => $morph,
                    'source_id' => $charge->id,
                ]);
            }

            // Apply corporate contract discount line if enabled
            if ($validated['apply_discount'] && (float) $contract->discount_pct > 0 && $grossSubtotal > 0) {
                $discountAmount = -round($grossSubtotal * ((float) $contract->discount_pct / 100), 2);
                InvoiceLine::query()->create([
                    'invoice_id' => $consolidatedInvoice->id,
                    'description' => sprintf(
                        'Diskon Kontrak Korporat %s (%s%%)',
                        $contract->code,
                        number_format((float) $contract->discount_pct, 1)
                    ),
                    'amount' => $discountAmount,
                    'source_type' => null,
                    'source_id' => null,
                ]);
            }

            $consolidatedInvoice->recalculate();

            if ($validated['issue_immediately']) {
                $consolidatedInvoice->update([
                    'status' => Invoice::STATUS_ISSUED,
                ]);
            }

            return $consolidatedInvoice->fresh(['lines']);
        });

        if (! $invoice) {
            return back()->with('error', 'Seluruh booking yang dipilih sudah memiliki invoice aktif (Issued/Paid).');
        }

        return back()->with(
            'success',
            sprintf(
                'Invoice Gabungan %s berhasil diterbitkan untuk %d booking sewa (Total: Rp %s).',
                $invoice->code,
                $rentals->count(),
                number_format((float) $invoice->total, 0, ',', '.')
            )
        );
    }

    /**
     * @return array{
     *     active_rentals_count: int,
     *     total_rentals_count: int,
     *     unbilled_rentals_count: int,
     *     unbilled_amount: float,
     *     outstanding_ar: float,
     *     credit_used: float,
     *     credit_utilization_pct: float
     * }
     */
    private function computeContractMetrics(RentalCorporateContract $contract): array
    {
        $rentals = $contract->rentals;
        $activeCount = $rentals->whereIn('status', [
            Rental::STATUS_RESERVED,
            Rental::STATUS_ACTIVE,
            Rental::STATUS_OVERDUE,
        ])->count();

        $unbilledAmount = 0.0;
        $unbilledCount = 0;
        $openInvoices = collect();

        foreach ($rentals as $rental) {
            if ($rental->status === Rental::STATUS_CANCELLED) {
                continue;
            }

            $charges = $rental->charges;
            if ($charges->isEmpty()) {
                $unbilledAmount += (float) $rental->total_amount;
                $unbilledCount++;

                continue;
            }

            $hasUnbilled = false;
            foreach ($charges as $charge) {
                $inv = $charge->invoiceLine?->invoice;
                if (! $inv || in_array($inv->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID], true)) {
                    $unbilledAmount += (float) $charge->amount;
                    $hasUnbilled = true;
                } elseif (in_array($inv->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID], true)) {
                    $openInvoices->put($inv->id, $inv);
                }
            }

            if ($hasUnbilled) {
                $unbilledCount++;
            }
        }

        $outstandingAr = (float) $openInvoices->sum(fn (Invoice $inv) => $inv->balanceDue());
        $creditUsed = round($unbilledAmount + $outstandingAr, 2);
        $creditLimit = (float) $contract->credit_limit;
        $utilizationPct = $creditLimit > 0 ? round(($creditUsed / $creditLimit) * 100, 1) : 0.0;

        return [
            'active_rentals_count' => $activeCount,
            'total_rentals_count' => $rentals->count(),
            'unbilled_rentals_count' => $unbilledCount,
            'unbilled_amount' => round($unbilledAmount, 2),
            'outstanding_ar' => round($outstandingAr, 2),
            'credit_used' => $creditUsed,
            'credit_utilization_pct' => $utilizationPct,
        ];
    }
}
