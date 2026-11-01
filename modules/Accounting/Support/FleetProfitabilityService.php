<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Carbon;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetBase\Models\FleetBase;

class FleetProfitabilityService
{
    /**
     * Compute comprehensive P&L for a single vehicle within an optional date range.
     *
     * @return array{
     *     vehicle: array{id: int, name: string, plate_number: string, type: string, ownership_type: string, partner_name: string|null, home_base_name: string|null},
     *     date_range: array{from: string, to: string},
     *     revenues: array{rental: float, shuttle: float, other: float, total: float},
     *     expenses: array{fuel: float, toll_parking: float, maintenance: float, vehicle_doc: float, driver_allowance: float, depreciation: float, partner_settlement: float, other: float, total: float},
     *     net_profit: float,
     *     margin_pct: float,
     *     transactions: list<array{date: string, entry_number: string, memo: string, account_code: string, account_name: string, category: string, debit: float, credit: float, amount: float}>
     * }
     */
    public function vehicleProfitability(Vehicle $vehicle, ?string $from = null, ?string $to = null): array
    {
        $fromDate = $from ? Carbon::parse($from)->toDateString() : now()->startOfYear()->toDateString();
        $toDate = $to ? Carbon::parse($to)->toDateString() : now()->toDateString();

        $lines = JournalLine::query()
            ->with(['account:id,code,name,type,normal_balance,system_role', 'journalEntry:id,number,entry_date,memo,event'])
            ->where('vehicle_id', $vehicle->id)
            ->whereHas('journalEntry', function ($q) use ($fromDate, $toDate): void {
                $q->where('status', JournalEntry::STATUS_POSTED)
                    ->whereDate('entry_date', '>=', $fromDate)
                    ->whereDate('entry_date', '<=', $toDate);
            })
            ->get();

        $revenues = [
            'rental' => 0.0,
            'shuttle' => 0.0,
            'other' => 0.0,
            'total' => 0.0,
        ];

        $expenses = [
            'fuel' => 0.0,
            'toll_parking' => 0.0,
            'maintenance' => 0.0,
            'vehicle_doc' => 0.0,
            'driver_allowance' => 0.0,
            'depreciation' => 0.0,
            'partner_settlement' => 0.0,
            'other' => 0.0,
            'total' => 0.0,
        ];

        $transactions = [];

        foreach ($lines as $line) {
            $account = $line->account;
            if (! $account) {
                continue;
            }

            $debit = (float) $line->debit;
            $credit = (float) $line->credit;
            $type = $account->type;
            $role = (string) $account->system_role;
            $code = (string) $account->code;

            // Revenue: normal balance Credit
            if (in_array($type, [Account::TYPE_REVENUE, Account::TYPE_CONTRA_REVENUE], true)) {
                $netRevenue = round($credit - $debit, 2);
                if (abs($netRevenue) >= 0.005) {
                    if ($role === 'rental_revenue' || str_starts_with($code, '411')) {
                        $revenues['rental'] += $netRevenue;
                        $cat = 'Pendapatan Sewa';
                    } elseif ($role === 'shuttle_revenue' || str_starts_with($code, '412')) {
                        $revenues['shuttle'] += $netRevenue;
                        $cat = 'Pendapatan Shuttle';
                    } else {
                        $revenues['other'] += $netRevenue;
                        $cat = 'Pendapatan Lain';
                    }
                    $revenues['total'] += $netRevenue;

                    $transactions[] = [
                        'date' => $line->journalEntry?->entry_date?->toDateString() ?? $fromDate,
                        'entry_number' => $line->journalEntry?->number ?? '-',
                        'memo' => $line->memo ?: ($line->journalEntry?->memo ?: $account->name),
                        'account_code' => $account->code,
                        'account_name' => $account->name,
                        'category' => $cat,
                        'debit' => $debit,
                        'credit' => $credit,
                        'amount' => $netRevenue,
                    ];
                }
            } elseif ($type === Account::TYPE_EXPENSE) {
                // Expense: normal balance Debit
                $netExpense = round($debit - $credit, 2);
                if ($netExpense >= 0.005) {
                    if ($role === 'expense_fuel' || str_starts_with($code, '611')) {
                        $expenses['fuel'] += $netExpense;
                        $cat = 'BBM';
                    } elseif ($role === 'expense_toll_parking' || str_starts_with($code, '612')) {
                        $expenses['toll_parking'] += $netExpense;
                        $cat = 'Tol & Parkir';
                    } elseif ($role === 'expense_maintenance' || str_starts_with($code, '613')) {
                        $expenses['maintenance'] += $netExpense;
                        $cat = 'Perawatan & Servis';
                    } elseif ($role === 'expense_vehicle_doc' || str_starts_with($code, '614')) {
                        $expenses['vehicle_doc'] += $netExpense;
                        $cat = 'Pajak & Dokumen';
                    } elseif ($role === 'expense_meal_travel' || str_starts_with($code, '615')) {
                        $expenses['driver_allowance'] += $netExpense;
                        $cat = 'Uang Makan / SPPD';
                    } elseif (str_starts_with($code, '62') || str_contains(strtolower($account->name), 'penyusutan')) {
                        $expenses['depreciation'] += $netExpense;
                        $cat = 'Penyusutan';
                    } elseif (str_contains(strtolower($account->name), 'bagi hasil') || str_contains(strtolower($account->name), 'mitra')) {
                        $expenses['partner_settlement'] += $netExpense;
                        $cat = 'Bagi Hasil Mitra';
                    } else {
                        $expenses['other'] += $netExpense;
                        $cat = 'Biaya Lainnya';
                    }
                    $expenses['total'] += $netExpense;

                    $transactions[] = [
                        'date' => $line->journalEntry?->entry_date?->toDateString() ?? $fromDate,
                        'entry_number' => $line->journalEntry?->number ?? '-',
                        'memo' => $line->memo ?: ($line->journalEntry?->memo ?: $account->name),
                        'account_code' => $account->code,
                        'account_name' => $account->name,
                        'category' => $cat,
                        'debit' => $debit,
                        'credit' => $credit,
                        'amount' => -$netExpense,
                    ];
                }
            }
        }

        foreach ($revenues as $k => $v) {
            $revenues[$k] = round($v, 2);
        }
        foreach ($expenses as $k => $v) {
            $expenses[$k] = round($v, 2);
        }

        $netProfit = round($revenues['total'] - $expenses['total'], 2);
        $marginPct = $revenues['total'] > 0
            ? round(($netProfit / $revenues['total']) * 100, 2)
            : 0.0;

        usort($transactions, fn ($a, $b) => strcmp($b['date'], $a['date']));

        return [
            'vehicle' => [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
                'ownership_type' => $vehicle->ownership_type ?? 'owned',
                'partner_name' => $vehicle->partner?->name,
                'home_base_name' => $vehicle->homeBase?->name,
            ],
            'date_range' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'revenues' => $revenues,
            'expenses' => $expenses,
            'net_profit' => $netProfit,
            'margin_pct' => $marginPct,
            'transactions' => $transactions,
        ];
    }

    /**
     * Fleet-wide profitability ranking and summary.
     *
     * @return array{
     *     date_range: array{from: string, to: string},
     *     kpi: array{total_revenue: float, total_expense: float, net_profit: float, average_margin_pct: float, total_vehicles: int, profitable_count: int, unprofitable_count: int},
     *     rows: list<array<string, mixed>>
     * }
     */
    public function fleetSummary(?string $from = null, ?string $to = null, ?int $fleetBaseId = null): array
    {
        $fromDate = $from ? Carbon::parse($from)->toDateString() : now()->startOfYear()->toDateString();
        $toDate = $to ? Carbon::parse($to)->toDateString() : now()->toDateString();

        $vehicles = Vehicle::query()
            ->with(['partner:id,name', 'homeBase:id,code,name'])
            ->when($fleetBaseId, fn ($q, $id) => $q->where('home_base_id', $id))
            ->orderBy('plate_number')
            ->get();

        $rows = [];
        $totalRevenue = 0.0;
        $totalExpense = 0.0;
        $profitableCount = 0;
        $unprofitableCount = 0;

        foreach ($vehicles as $vehicle) {
            $pnl = $this->vehicleProfitability($vehicle, $fromDate, $toDate);

            $rev = $pnl['revenues']['total'];
            $exp = $pnl['expenses']['total'];
            $profit = $pnl['net_profit'];

            $totalRevenue += $rev;
            $totalExpense += $exp;

            if ($profit >= 0) {
                $profitableCount++;
            } else {
                $unprofitableCount++;
            }

            $rows[] = [
                'vehicle_id' => $vehicle->id,
                'plate_number' => $vehicle->plate_number,
                'name' => $vehicle->name,
                'type' => $vehicle->type,
                'home_base_name' => $vehicle->homeBase?->name ?? 'Pusat',
                'partner_name' => $vehicle->partner?->name ?? 'Perusahaan',
                'ownership_type' => $vehicle->ownership_type ?? 'owned',
                'revenue' => $rev,
                'expense' => $exp,
                'net_profit' => $profit,
                'margin_pct' => $pnl['margin_pct'],
                'fuel_cost' => $pnl['expenses']['fuel'],
                'maintenance_cost' => $pnl['expenses']['maintenance'],
                'doc_cost' => $pnl['expenses']['vehicle_doc'],
                'driver_cost' => $pnl['expenses']['driver_allowance'],
            ];
        }

        usort($rows, fn ($a, $b) => $b['net_profit'] <=> $a['net_profit']);

        $netProfit = round($totalRevenue - $totalExpense, 2);
        $avgMargin = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0.0;

        return [
            'date_range' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'kpi' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_expense' => round($totalExpense, 2),
                'net_profit' => $netProfit,
                'average_margin_pct' => $avgMargin,
                'total_vehicles' => count($vehicles),
                'profitable_count' => $profitableCount,
                'unprofitable_count' => $unprofitableCount,
            ],
            'rows' => $rows,
        ];
    }

    /**
     * Profitability grouped by FleetBase (Pool / Cabang).
     *
     * @return array{
     *     date_range: array{from: string, to: string},
     *     totals: array{total_revenue: float, total_expense: float, net_profit: float, margin_pct: float},
     *     pools: list<array<string, mixed>>
     * }
     */
    public function poolProfitability(?string $from = null, ?string $to = null): array
    {
        $fromDate = $from ? Carbon::parse($from)->toDateString() : now()->startOfYear()->toDateString();
        $toDate = $to ? Carbon::parse($to)->toDateString() : now()->toDateString();

        $bases = FleetBase::query()->orderBy('name')->get();

        $poolData = [];
        $grandRevenue = 0.0;
        $grandExpense = 0.0;

        foreach ($bases as $base) {
            $summary = $this->fleetSummary($fromDate, $toDate, (int) $base->id);

            $rev = $summary['kpi']['total_revenue'];
            $exp = $summary['kpi']['total_expense'];
            $profit = $summary['kpi']['net_profit'];

            $grandRevenue += $rev;
            $grandExpense += $exp;

            $poolData[] = [
                'id' => $base->id,
                'code' => $base->code,
                'name' => $base->name,
                'city' => $base->city,
                'vehicle_count' => $summary['kpi']['total_vehicles'],
                'revenue' => $rev,
                'expense' => $exp,
                'net_profit' => $profit,
                'margin_pct' => $summary['kpi']['average_margin_pct'],
            ];
        }

        // Also calculate unassigned / Pusat pool if any
        $unassignedSummary = $this->fleetSummary($fromDate, $toDate, null);
        $assignedVehicleIds = collect($poolData)->sum('vehicle_count');

        $grandNetProfit = round($grandRevenue - $grandExpense, 2);
        $grandMargin = $grandRevenue > 0 ? round(($grandNetProfit / $grandRevenue) * 100, 2) : 0.0;

        return [
            'date_range' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'totals' => [
                'total_revenue' => round($grandRevenue, 2),
                'total_expense' => round($grandExpense, 2),
                'net_profit' => $grandNetProfit,
                'margin_pct' => $grandMargin,
            ],
            'pools' => $poolData,
        ];
    }
}
