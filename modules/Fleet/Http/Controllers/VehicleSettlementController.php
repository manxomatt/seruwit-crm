<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Models\VehicleSettlement;
use Modules\Fleet\Support\VehicleSettlementCalculator;
use Modules\Partners\Models\Partner;

class VehicleSettlementController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display the centralized Investor & Partner Fleet Settlement board.
     */
    public function index(Request $request, VehicleSettlementCalculator $calculator): Response
    {
        $month = (string) $request->query('month', Carbon::now()->format('Y-m'));
        if (! preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = Carbon::now()->format('Y-m');
        }

        $startDate = Carbon::parse($month.'-01')->startOfMonth()->startOfDay();
        $endDate = $startDate->copy()->endOfMonth()->endOfDay();

        $ownershipFilter = (string) $request->query('ownership_type', 'external');
        $partnerFilter = $request->query('partner_id');
        $statusFilter = (string) $request->query('status', 'all');
        $search = trim((string) $request->query('search', ''));

        $vehiclesQuery = Vehicle::query()
            ->with([
                'partner.bankAccounts' => fn ($q) => $q->where('is_active', true),
                'homeBase:id,code,name',
            ])
            ->orderBy('plate_number');

        if ($ownershipFilter === 'external') {
            $vehiclesQuery->whereIn('ownership_type', ['investor', 'partner_loan']);
        } elseif (in_array($ownershipFilter, ['investor', 'partner_loan', 'owned'], true)) {
            $vehiclesQuery->where('ownership_type', $ownershipFilter);
        }

        if ($partnerFilter) {
            $vehiclesQuery->where('partner_id', (int) $partnerFilter);
        }

        if ($search !== '') {
            $vehiclesQuery->where(function ($q) use ($search) {
                $q->where('plate_number', 'ilike', "%{$search}%")
                    ->orWhere('name', 'ilike', "%{$search}%")
                    ->orWhere('contract_number', 'ilike', "%{$search}%")
                    ->orWhereHas('partner', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%"));
            });
        }

        $vehicles = $vehiclesQuery->get();

        $savedMap = collect();
        if (Schema::hasTable('vehicle_settlements') && $vehicles->isNotEmpty()) {
            $savedMap = VehicleSettlement::query()
                ->where('period_month', $month)
                ->whereIn('vehicle_id', $vehicles->pluck('id'))
                ->get()
                ->keyBy('vehicle_id');
        }

        $rows = [];
        foreach ($vehicles as $vehicle) {
            $calc = $calculator->calculateForVehicle($vehicle, $startDate, $endDate);
            /** @var VehicleSettlement|null $saved */
            $saved = $savedMap->get($vehicle->id);

            $status = $saved ? $saved->status : 'unsettled';
            $otherAdjustment = $saved ? (float) $saved->other_adjustment : 0.0;
            $adjustmentNotes = $saved?->adjustment_notes;

            if ($saved && in_array($saved->status, [VehicleSettlement::STATUS_APPROVED, VehicleSettlement::STATUS_PAID], true)) {
                $totalOrders = (int) $saved->total_orders;
                $totalRentalDays = (int) $saved->total_rental_days;
                $totalRevenue = (float) $saved->total_revenue;
                $ownerGrossShare = (float) $saved->owner_gross_share;
                $tenantGrossShare = (float) $saved->tenant_gross_share;
                $totalMaintenanceCost = (float) $saved->total_maintenance_cost;
                $maintenanceDeduction = (float) $saved->maintenance_deduction;
                $netPayout = (float) $saved->net_payout;
            } else {
                $totalOrders = (int) $calc['summary']['total_orders'];
                $totalRentalDays = (int) $calc['summary']['total_rental_days'];
                $totalRevenue = (float) $calc['summary']['total_revenue'];
                $ownerGrossShare = (float) $calc['summary']['owner_gross_share'];
                $tenantGrossShare = (float) $calc['summary']['tenant_gross_share'];
                $totalMaintenanceCost = (float) $calc['summary']['total_maintenance_cost'];
                $maintenanceDeduction = (float) $calc['summary']['maintenance_deduction'];
                $netPayout = max(0.0, round($ownerGrossShare - $maintenanceDeduction + $otherAdjustment, 2));
            }

            if ($statusFilter !== 'all' && $status !== $statusFilter) {
                continue;
            }

            $rows[] = [
                'settlement_id' => $saved?->id,
                'code' => $saved?->code ?? VehicleSettlement::generateCode($month, $vehicle->id),
                'status' => $status,
                'period_month' => $month,
                'vehicle' => $calc['vehicle'],
                'partner' => $calc['partner'],
                'summary' => [
                    'total_orders' => $totalOrders,
                    'total_rental_days' => $totalRentalDays,
                    'total_revenue' => $totalRevenue,
                    'scheme_label' => $calc['summary']['scheme_label'],
                    'owner_gross_share' => $ownerGrossShare,
                    'tenant_gross_share' => $tenantGrossShare,
                    'total_maintenance_cost' => $totalMaintenanceCost,
                    'maintenance_deduction' => $maintenanceDeduction,
                    'other_adjustment' => $otherAdjustment,
                    'adjustment_notes' => $adjustmentNotes,
                    'net_payout' => $netPayout,
                ],
                'payment' => $saved ? [
                    'payment_method' => $saved->payment_method,
                    'bank_name' => $saved->bank_name,
                    'bank_account_number' => $saved->bank_account_number,
                    'bank_account_holder' => $saved->bank_account_holder,
                    'payment_reference' => $saved->payment_reference,
                    'approved_at' => $saved->approved_at?->toIso8601String(),
                    'paid_at' => $saved->paid_at?->toIso8601String(),
                    'notes' => $saved->notes,
                ] : null,
            ];
        }

        $rowsCollection = collect($rows);
        $metrics = [
            'total_units' => $rowsCollection->count(),
            'total_orders' => (int) $rowsCollection->sum(fn ($r) => $r['summary']['total_orders']),
            'total_rental_days' => (int) $rowsCollection->sum(fn ($r) => $r['summary']['total_rental_days']),
            'total_gross_revenue' => (float) $rowsCollection->sum(fn ($r) => $r['summary']['total_revenue']),
            'total_tenant_share' => (float) $rowsCollection->sum(fn ($r) => $r['summary']['tenant_gross_share']),
            'total_maintenance_deduction' => (float) $rowsCollection->sum(fn ($r) => $r['summary']['maintenance_deduction']),
            'total_net_payout' => (float) $rowsCollection->sum(fn ($r) => $r['summary']['net_payout']),
            'paid_amount' => (float) $rowsCollection->where('status', 'paid')->sum(fn ($r) => $r['summary']['net_payout']),
            'pending_amount' => (float) $rowsCollection->where('status', '!==', 'paid')->sum(fn ($r) => $r['summary']['net_payout']),
            'paid_count' => $rowsCollection->where('status', 'paid')->count(),
            'approved_count' => $rowsCollection->where('status', 'approved')->count(),
            'pending_count' => $rowsCollection->whereIn('status', ['unsettled', 'draft'])->count(),
        ];

        $partners = Partner::query()
            ->whereHas('vehicles')
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        return Inertia::render('Modules/Fleet/Settlements/Index', [
            'rows' => $rows,
            'metrics' => $metrics,
            'monthOptions' => $this->buildMonthOptions($month),
            'partners' => $partners,
            'filters' => [
                'month' => $month,
                'month_label' => $startDate->translatedFormat('F Y'),
                'ownership_type' => $ownershipFilter,
                'partner_id' => $partnerFilter ? (string) $partnerFilter : '',
                'status' => $statusFilter,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Generate or refresh draft settlement statements for a period.
     */
    public function generate(Request $request, VehicleSettlementCalculator $calculator): RedirectResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
        ]);

        $month = $validated['month'];
        $startDate = Carbon::parse($month.'-01')->startOfMonth()->startOfDay();
        $endDate = $startDate->copy()->endOfMonth()->endOfDay();

        $query = Vehicle::query()->whereIn('ownership_type', ['investor', 'partner_loan']);
        if (! empty($validated['vehicle_id'])) {
            $query->where('id', (int) $validated['vehicle_id']);
        }

        $vehicles = $query->get();
        $syncedCount = 0;

        foreach ($vehicles as $vehicle) {
            $existing = VehicleSettlement::query()
                ->where('vehicle_id', $vehicle->id)
                ->where('period_month', $month)
                ->first();

            if ($existing && in_array($existing->status, [VehicleSettlement::STATUS_APPROVED, VehicleSettlement::STATUS_PAID], true)) {
                continue;
            }

            $calc = $calculator->calculateForVehicle($vehicle, $startDate, $endDate);
            $otherAdj = $existing ? (float) $existing->other_adjustment : 0.0;
            $ownerGross = (float) $calc['summary']['owner_gross_share'];
            $maintDed = (float) $calc['summary']['maintenance_deduction'];
            $netPayout = max(0.0, round($ownerGross - $maintDed + $otherAdj, 2));

            VehicleSettlement::query()->updateOrCreate(
                [
                    'vehicle_id' => $vehicle->id,
                    'period_month' => $month,
                ],
                [
                    'code' => $existing?->code ?? VehicleSettlement::generateCode($month, $vehicle->id),
                    'partner_id' => $vehicle->partner_id,
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                    'ownership_type' => $vehicle->ownership_type ?? 'investor',
                    'settlement_scheme' => $vehicle->settlement_scheme ?? 'revenue_share',
                    'revenue_share_owner_pct' => $vehicle->revenue_share_owner_pct ?? 70,
                    'revenue_share_tenant_pct' => $vehicle->revenue_share_tenant_pct ?? 30,
                    'fixed_fee_amount' => $vehicle->fixed_fee_amount ?? 0,
                    'maintenance_payer' => $vehicle->maintenance_payer ?? 'tenant',
                    'total_orders' => (int) $calc['summary']['total_orders'],
                    'total_rental_days' => (int) $calc['summary']['total_rental_days'],
                    'total_revenue' => (float) $calc['summary']['total_revenue'],
                    'owner_gross_share' => $ownerGross,
                    'tenant_gross_share' => (float) $calc['summary']['tenant_gross_share'],
                    'total_maintenance_cost' => (float) $calc['summary']['total_maintenance_cost'],
                    'maintenance_deduction' => $maintDed,
                    'other_adjustment' => $otherAdj,
                    'net_payout' => $netPayout,
                    'status' => $existing?->status ?? VehicleSettlement::STATUS_DRAFT,
                ]
            );

            $syncedCount++;
        }

        return redirect()->back()->with(
            'success',
            "Berhasil mengkalkulasi dan menerbitkan {$syncedCount} statement bagi hasil untuk periode {$startDate->translatedFormat('F Y')}."
        );
    }

    /**
     * Save adjustment, approval, or payout transfer details for a vehicle settlement.
     */
    public function savePayout(Request $request, VehicleSettlementCalculator $calculator): RedirectResponse
    {
        $validated = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'period_month' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'status' => ['required', 'string', 'in:draft,approved,paid'],
            'other_adjustment' => ['nullable', 'numeric'],
            'adjustment_notes' => ['nullable', 'string', 'max:255'],
            'payment_method' => ['nullable', 'string', 'max:40'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:60'],
            'bank_account_holder' => ['nullable', 'string', 'max:120'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $vehicle = Vehicle::query()->findOrFail((int) $validated['vehicle_id']);
        $month = $validated['period_month'];
        $startDate = Carbon::parse($month.'-01')->startOfMonth()->startOfDay();
        $endDate = $startDate->copy()->endOfMonth()->endOfDay();

        $calc = $calculator->calculateForVehicle($vehicle, $startDate, $endDate);
        $existing = VehicleSettlement::query()
            ->where('vehicle_id', $vehicle->id)
            ->where('period_month', $month)
            ->first();

        $otherAdj = isset($validated['other_adjustment']) ? (float) $validated['other_adjustment'] : 0.0;
        $ownerGross = (float) $calc['summary']['owner_gross_share'];
        $maintDed = (float) $calc['summary']['maintenance_deduction'];
        $netPayout = max(0.0, round($ownerGross - $maintDed + $otherAdj, 2));

        $newStatus = $validated['status'];
        $userId = $request->user()?->id;

        $approvedAt = $existing?->approved_at;
        $approvedBy = $existing?->approved_by;
        if (in_array($newStatus, [VehicleSettlement::STATUS_APPROVED, VehicleSettlement::STATUS_PAID], true) && ! $approvedAt) {
            $approvedAt = now();
            $approvedBy = $userId;
        }

        $paidAt = $existing?->paid_at;
        $paidBy = $existing?->paid_by;
        if ($newStatus === VehicleSettlement::STATUS_PAID && ! $paidAt) {
            $paidAt = now();
            $paidBy = $userId;
        } elseif ($newStatus !== VehicleSettlement::STATUS_PAID) {
            $paidAt = null;
            $paidBy = null;
        }

        VehicleSettlement::query()->updateOrCreate(
            [
                'vehicle_id' => $vehicle->id,
                'period_month' => $month,
            ],
            [
                'code' => $existing?->code ?? VehicleSettlement::generateCode($month, $vehicle->id),
                'partner_id' => $vehicle->partner_id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'ownership_type' => $vehicle->ownership_type ?? 'investor',
                'settlement_scheme' => $vehicle->settlement_scheme ?? 'revenue_share',
                'revenue_share_owner_pct' => $vehicle->revenue_share_owner_pct ?? 70,
                'revenue_share_tenant_pct' => $vehicle->revenue_share_tenant_pct ?? 30,
                'fixed_fee_amount' => $vehicle->fixed_fee_amount ?? 0,
                'maintenance_payer' => $vehicle->maintenance_payer ?? 'tenant',
                'total_orders' => (int) $calc['summary']['total_orders'],
                'total_rental_days' => (int) $calc['summary']['total_rental_days'],
                'total_revenue' => (float) $calc['summary']['total_revenue'],
                'owner_gross_share' => $ownerGross,
                'tenant_gross_share' => (float) $calc['summary']['tenant_gross_share'],
                'total_maintenance_cost' => (float) $calc['summary']['total_maintenance_cost'],
                'maintenance_deduction' => $maintDed,
                'other_adjustment' => $otherAdj,
                'adjustment_notes' => $validated['adjustment_notes'] ?? null,
                'net_payout' => $netPayout,
                'status' => $newStatus,
                'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
                'bank_name' => $validated['bank_name'] ?? null,
                'bank_account_number' => $validated['bank_account_number'] ?? null,
                'bank_account_holder' => $validated['bank_account_holder'] ?? null,
                'payment_reference' => $validated['payment_reference'] ?? null,
                'approved_at' => $approvedAt,
                'approved_by' => $approvedBy,
                'paid_at' => $paidAt,
                'paid_by' => $paidBy,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        $statusLabel = match ($newStatus) {
            'paid' => 'Lunas Ditransfer (Paid)',
            'approved' => 'Disetujui (Approved)',
            default => 'Draft',
        };

        return redirect()->back()->with(
            'success',
            "Statement bagi hasil unit {$vehicle->plate_number} ({$month}) berhasil diperbarui ke status {$statusLabel}."
        );
    }

    /**
     * Display the settlement / performance statement page for a single vehicle.
     */
    public function show(Request $request, Vehicle $vehicle, VehicleSettlementCalculator $calculator): Response
    {
        $vehicle->loadMissing([
            'partner.bankAccounts' => fn ($q) => $q->where('is_active', true),
            'homeBase:id,code,name',
        ]);

        $month = $request->query('month');
        $startDateParam = $request->query('start_date');
        $endDateParam = $request->query('end_date');

        if ($startDateParam && $endDateParam) {
            $startDate = Carbon::parse($startDateParam)->startOfDay();
            $endDate = Carbon::parse($endDateParam)->endOfDay();
        } elseif ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $startDate = Carbon::parse($month.'-01')->startOfMonth()->startOfDay();
            $endDate = $startDate->copy()->endOfMonth()->endOfDay();
        } else {
            $startDate = Carbon::now()->startOfMonth()->startOfDay();
            $endDate = Carbon::now()->endOfMonth()->endOfDay();
        }

        $periodMonth = $month && preg_match('/^\d{4}-\d{2}$/', $month)
            ? $month
            : $startDate->format('Y-m');

        $settlement = $calculator->calculateForVehicle($vehicle, $startDate, $endDate);

        $savedRecord = null;
        if (Schema::hasTable('vehicle_settlements')) {
            $savedRecord = VehicleSettlement::query()
                ->where('vehicle_id', $vehicle->id)
                ->where('period_month', $periodMonth)
                ->first();
        }

        if ($savedRecord) {
            $otherAdj = (float) $savedRecord->other_adjustment;
            $settlement['summary']['other_adjustment'] = $otherAdj;
            $settlement['summary']['adjustment_notes'] = $savedRecord->adjustment_notes;
            $settlement['summary']['net_payout'] = max(
                0.0,
                round($settlement['summary']['owner_gross_share'] - $settlement['summary']['maintenance_deduction'] + $otherAdj, 2)
            );
        }

        $tenant = tenant();
        $companyInfo = [
            'name' => $tenant instanceof \App\Models\Tenant ? ($tenant->name ?? config('app.name')) : config('app.name'),
            'subdomain' => $tenant instanceof \App\Models\Tenant ? $tenant->id : null,
            'email' => $tenant instanceof \App\Models\Tenant ? ($tenant->email ?? null) : null,
            'phone' => $tenant instanceof \App\Models\Tenant ? ($tenant->phone ?? null) : null,
            'address' => $tenant instanceof \App\Models\Tenant ? ($tenant->address ?? null) : null,
        ];

        return Inertia::render('Modules/Fleet/Vehicles/Settlement', [
            'settlement' => $settlement,
            'savedSettlement' => $savedRecord ? [
                'id' => $savedRecord->id,
                'code' => $savedRecord->code,
                'status' => $savedRecord->status,
                'other_adjustment' => (float) $savedRecord->other_adjustment,
                'adjustment_notes' => $savedRecord->adjustment_notes,
                'payment_method' => $savedRecord->payment_method,
                'bank_name' => $savedRecord->bank_name,
                'bank_account_number' => $savedRecord->bank_account_number,
                'bank_account_holder' => $savedRecord->bank_account_holder,
                'payment_reference' => $savedRecord->payment_reference,
                'approved_at' => $savedRecord->approved_at?->toIso8601String(),
                'paid_at' => $savedRecord->paid_at?->toIso8601String(),
                'notes' => $savedRecord->notes,
            ] : null,
            'monthOptions' => $this->buildMonthOptions($periodMonth),
            'currentFilter' => [
                'month' => $periodMonth,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'company' => $companyInfo,
        ]);
    }

    /**
     * Build quick available month options (next month + past 12 months).
     *
     * @return list<array{value: string, label: string}>
     */
    private function buildMonthOptions(?string $ensureMonth = null): array
    {
        $monthOptions = [];
        $cursor = Carbon::now()->startOfMonth()->addMonth();
        for ($i = 0; $i < 14; $i++) {
            $val = $cursor->format('Y-m');
            $monthOptions[] = [
                'value' => $val,
                'label' => $cursor->translatedFormat('F Y'),
            ];
            $cursor->subMonth();
        }

        if ($ensureMonth && preg_match('/^\d{4}-\d{2}$/', $ensureMonth) && ! collect($monthOptions)->contains('value', $ensureMonth)) {
            $parsedMonth = Carbon::parse($ensureMonth.'-01');
            $monthOptions[] = [
                'value' => $ensureMonth,
                'label' => $parsedMonth->translatedFormat('F Y'),
            ];
            usort($monthOptions, fn ($a, $b) => strcmp($b['value'], $a['value']));
        }

        return $monthOptions;
    }
}
