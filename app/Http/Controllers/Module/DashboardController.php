<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Modules\Facades\Modules;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Carousels\Models\Carousel;
use Modules\Document\Models\Document;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Inventory\Models\StockLevel;
use Modules\Invoicing\Models\Invoice;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Pages\Models\Page;
use Modules\Partners\Models\Partner;
use Modules\Posts\Models\Post;
use Modules\TransportationManagement\Models\Trip;

class DashboardController extends Controller
{
    /**
     * Display the module dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $primaryRole = $user->getPrimaryRole();

        $period = $request->query('period', 'week');
        $range = $this->resolveDateRange($period);

        $stats = $this->buildCmsStats();
        $logistics = $this->buildLogisticsStats($range);
        $alerts = $this->buildAlerts();
        $recentActivity = $this->buildRecentActivity();

        $recentPosts = Modules::available('posts')
            ? Post::query()->latest()->limit(5)->get(['id', 'title', 'slug', 'is_published', 'created_at'])
            : collect();

        $recentPages = Modules::available('pages')
            ? Page::query()->latest()->limit(5)->get(['id', 'title', 'slug', 'is_published', 'created_at'])
            : collect();

        return Inertia::render('Module/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
            'primaryRole' => $primaryRole ? [
                'name' => $primaryRole->name,
                'slug' => $primaryRole->slug,
            ] : null,
            'stats' => $stats,
            'logistics' => $logistics,
            'alerts' => $alerts,
            'recentActivity' => $recentActivity,
            'recentPosts' => $recentPosts,
            'recentPages' => $recentPages,
            'period' => $period,
        ]);
    }

    /**
     * @return array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}
     */
    private function resolveDateRange(string $period): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today' => [
                'start' => $now->copy()->startOfDay(),
                'end' => $now->copy()->endOfDay(),
                'previous_start' => $now->copy()->subDay()->startOfDay(),
                'previous_end' => $now->copy()->subDay()->endOfDay(),
            ],
            'month' => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
                'previous_start' => $now->copy()->subMonth()->startOfMonth(),
                'previous_end' => $now->copy()->subMonth()->endOfMonth(),
            ],
            default => [
                'start' => $now->copy()->startOfWeek(),
                'end' => $now->copy()->endOfWeek(),
                'previous_start' => $now->copy()->subWeek()->startOfWeek(),
                'previous_end' => $now->copy()->subWeek()->endOfWeek(),
            ],
        };
    }

    /**
     * @return array<string, array<string, int>>
     */
    private function buildCmsStats(): array
    {
        $stats = [
            'media' => [
                'total' => Media::query()->count(),
                'images' => Media::query()->where('type', 'image')->count(),
                'documents' => Media::query()->where('type', 'document')->count(),
            ],
        ];

        if (Modules::available('posts')) {
            $stats['posts'] = [
                'total' => Post::query()->count(),
                'published' => Post::query()->where('is_published', true)->count(),
                'draft' => Post::query()->where('is_published', false)->count(),
            ];
        }

        if (Modules::available('pages')) {
            $stats['pages'] = [
                'total' => Page::query()->count(),
                'published' => Page::query()->where('is_published', true)->count(),
                'draft' => Page::query()->where('is_published', false)->count(),
            ];
        }

        if (Modules::available('carousels')) {
            $stats['carousels'] = [
                'total' => Carousel::query()->count(),
                'active' => Carousel::query()->where('is_active', true)->count(),
            ];
        }

        return $stats;
    }

    /**
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>
     */
    private function buildLogisticsStats(array $range): array
    {
        $data = [];

        if (Modules::available('transportation')) {
            $activeTrips = Trip::query()
                ->whereIn('status', [Trip::STATUS_SCHEDULED, Trip::STATUS_IN_PROGRESS])
                ->count();

            $previousActiveTrips = Trip::query()
                ->whereIn('status', [Trip::STATUS_SCHEDULED, Trip::STATUS_IN_PROGRESS])
                ->where('created_at', '<', $range['start'])
                ->count();

            $data['trips'] = [
                'active' => $activeTrips,
                'previous_active' => $previousActiveTrips,
                'period' => [
                    'total' => Trip::query()->whereBetween('created_at', [$range['start'], $range['end']])->count(),
                    'completed' => Trip::query()
                        ->where('status', Trip::STATUS_COMPLETED)
                        ->whereBetween('completed_at', [$range['start'], $range['end']])
                        ->count(),
                ],
            ];
        }

        if (Modules::available('orders')) {
            $orderCounts = DeliveryOrder::query()
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            $periodOrders = DeliveryOrder::query()
                ->whereBetween('created_at', [$range['start'], $range['end']])
                ->count();

            $previousPeriodOrders = DeliveryOrder::query()
                ->whereBetween('created_at', [$range['previous_start'], $range['previous_end']])
                ->count();

            $data['orders'] = [
                'by_status' => $orderCounts,
                'total' => array_sum($orderCounts),
                'period_total' => $periodOrders,
                'previous_period_total' => $previousPeriodOrders,
            ];
        }

        if (Modules::available('fleet')) {
            $vehiclesByStatus = Vehicle::query()
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            $driversByStatus = Driver::query()
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            $data['fleet'] = [
                'vehicles' => $vehiclesByStatus,
                'vehicles_total' => array_sum($vehiclesByStatus),
                'drivers' => $driversByStatus,
                'drivers_total' => array_sum($driversByStatus),
            ];

            $fuelThisPeriod = FuelLog::query()
                ->whereBetween('filled_at', [$range['start'], $range['end']])
                ->selectRaw('COALESCE(SUM(liters), 0) as liters, COALESCE(SUM(cost), 0) as cost')
                ->first();

            $data['fleet']['fuel'] = [
                'liters' => round((float) $fuelThisPeriod->liters),
                'cost' => round((float) $fuelThisPeriod->cost),
            ];
        }

        if (Modules::available('partners')) {
            $data['partners'] = [
                'total' => Partner::query()->count(),
                'customers' => Partner::query()->where('customer_rank', '>', 0)->count(),
                'suppliers' => Partner::query()->where('supplier_rank', '>', 0)->count(),
            ];
        }

        if (Modules::available('invoicing')) {
            $invoicesByStatus = Invoice::query()
                ->select('status', DB::raw('count(*) as total'), DB::raw('COALESCE(SUM(total), 0) as amount'))
                ->groupBy('status')
                ->get()
                ->keyBy('status')
                ->map(fn ($row) => ['count' => $row->total, 'amount' => round((float) $row->amount)])
                ->toArray();

            $overdueCount = Invoice::query()
                ->where('status', Invoice::STATUS_ISSUED)
                ->where('due_date', '<', Carbon::today())
                ->count();

            $overdueAmount = Invoice::query()
                ->where('status', Invoice::STATUS_ISSUED)
                ->where('due_date', '<', Carbon::today())
                ->sum('total');

            $data['invoices'] = [
                'by_status' => $invoicesByStatus,
                'overdue' => ['count' => $overdueCount, 'amount' => round((float) $overdueAmount)],
            ];

            $data['revenue'] = $this->buildRevenueChart();
        }

        if (Modules::available('partners') && Modules::available('invoicing')) {
            $data['top_partners'] = Invoice::query()
                ->where('status', Invoice::STATUS_PAID)
                ->select('partner_id', DB::raw('SUM(total) as revenue'))
                ->groupBy('partner_id')
                ->orderByDesc('revenue')
                ->limit(5)
                ->with('partner:id,name')
                ->get()
                ->map(fn ($row) => [
                    'name' => $row->partner?->name ?? 'Unknown',
                    'revenue' => round((float) $row->revenue),
                ]);
        }

        return $data;
    }

    /**
     * @return array<int, array{month: string, amount: float}>
     */
    private function buildRevenueChart(): array
    {
        return Invoice::query()
            ->where('status', Invoice::STATUS_PAID)
            ->where('paid_at', '>=', Carbon::now()->subMonths(6)->startOfMonth())
            ->selectRaw("to_char(paid_at, 'YYYY-MM') as month, COALESCE(SUM(total), 0) as amount")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => Carbon::createFromFormat('Y-m', $row->month)->translatedFormat('M'),
                'amount' => round((float) $row->amount),
            ])
            ->values()
            ->toArray();
    }

    /**
     * @return array<int, array{type: string, severity: string, message: string, count: int}>
     */
    private function buildAlerts(): array
    {
        $alerts = [];

        if (Modules::available('document')) {
            $expiredDocs = Document::query()->expired()->count();
            if ($expiredDocs > 0) {
                $alerts[] = [
                    'type' => 'document_expired',
                    'severity' => 'danger',
                    'message' => "{$expiredDocs} dokumen kendaraan expired",
                    'count' => $expiredDocs,
                ];
            }

            $expiringDocs = Document::query()->expiringSoon()->count();
            if ($expiringDocs > 0) {
                $alerts[] = [
                    'type' => 'document_expiring',
                    'severity' => 'warning',
                    'message' => "{$expiringDocs} dokumen akan expired dalam 30 hari",
                    'count' => $expiringDocs,
                ];
            }
        }

        if (Modules::available('fleet')) {
            $expiringLicenses = Driver::query()
                ->where('status', '!=', Driver::STATUS_INACTIVE)
                ->whereNotNull('license_expires_at')
                ->where('license_expires_at', '<=', Carbon::now()->addDays(30))
                ->count();

            if ($expiringLicenses > 0) {
                $alerts[] = [
                    'type' => 'license_expiring',
                    'severity' => 'warning',
                    'message' => "{$expiringLicenses} SIM driver akan expired dalam 30 hari",
                    'count' => $expiringLicenses,
                ];
            }
        }

        if (Modules::available('inventory')) {
            $lowStock = StockLevel::query()
                ->whereHas('product', fn ($q) => $q->where('is_storable', true))
                ->get()
                ->filter(fn (StockLevel $level) => $level->isLowStock())
                ->count();

            if ($lowStock > 0) {
                $alerts[] = [
                    'type' => 'low_stock',
                    'severity' => 'warning',
                    'message' => "{$lowStock} produk stok di bawah minimum",
                    'count' => $lowStock,
                ];
            }
        }

        if (Modules::available('maintenance')) {
            $pendingWorkOrders = WorkOrder::query()->open()->count();
            if ($pendingWorkOrders > 0) {
                $alerts[] = [
                    'type' => 'work_orders',
                    'severity' => 'info',
                    'message' => "{$pendingWorkOrders} work order belum selesai",
                    'count' => $pendingWorkOrders,
                ];
            }

            $overdueWorkOrders = WorkOrder::query()->overdue()->count();
            if ($overdueWorkOrders > 0) {
                $alerts[] = [
                    'type' => 'work_orders_overdue',
                    'severity' => 'danger',
                    'message' => "{$overdueWorkOrders} work order melewati jadwal",
                    'count' => $overdueWorkOrders,
                ];
            }
        }

        if (Modules::available('invoicing')) {
            $overdueInvoices = Invoice::query()
                ->where('status', Invoice::STATUS_ISSUED)
                ->where('due_date', '<', Carbon::today())
                ->count();

            if ($overdueInvoices > 0) {
                $alerts[] = [
                    'type' => 'invoice_overdue',
                    'severity' => 'danger',
                    'message' => "{$overdueInvoices} invoice melewati jatuh tempo",
                    'count' => $overdueInvoices,
                ];
            }
        }

        return $alerts;
    }

    /**
     * @return array<int, array{icon: string, type: string, description: string, time: string}>
     */
    private function buildRecentActivity(): array
    {
        $activities = collect();

        if (Modules::available('orders')) {
            $recentOrders = DeliveryOrder::query()
                ->latest()
                ->limit(5)
                ->get(['id', 'code', 'status', 'created_at', 'delivered_at', 'confirmed_at']);

            foreach ($recentOrders as $order) {
                $desc = match ($order->status) {
                    DeliveryOrder::STATUS_DELIVERED => "DO {$order->code} terkirim",
                    DeliveryOrder::STATUS_IN_TRANSIT => "DO {$order->code} dalam pengiriman",
                    DeliveryOrder::STATUS_CONFIRMED => "DO {$order->code} dikonfirmasi",
                    default => "DO {$order->code} dibuat",
                };
                $timestamp = $order->delivered_at ?? $order->confirmed_at ?? $order->created_at;

                $activities->push([
                    'icon' => 'package',
                    'type' => 'order',
                    'description' => $desc,
                    'time' => $timestamp->toIso8601String(),
                ]);
            }
        }

        if (Modules::available('transportation')) {
            $recentTrips = Trip::query()
                ->with('vehicle:id,plate_number')
                ->latest()
                ->limit(5)
                ->get(['id', 'code', 'status', 'vehicle_id', 'created_at', 'started_at', 'completed_at']);

            foreach ($recentTrips as $trip) {
                $plate = $trip->vehicle?->plate_number;
                $desc = match ($trip->status) {
                    Trip::STATUS_COMPLETED => "Trip {$trip->code} selesai".($plate ? " — {$plate}" : ''),
                    Trip::STATUS_IN_PROGRESS => "Trip {$trip->code} dimulai".($plate ? " — {$plate}" : ''),
                    default => "Trip {$trip->code} dijadwalkan".($plate ? " — {$plate}" : ''),
                };
                $timestamp = $trip->completed_at ?? $trip->started_at ?? $trip->created_at;

                $activities->push([
                    'icon' => 'truck',
                    'type' => 'trip',
                    'description' => $desc,
                    'time' => $timestamp->toIso8601String(),
                ]);
            }
        }

        if (Modules::available('invoicing')) {
            $recentInvoices = Invoice::query()
                ->latest()
                ->limit(3)
                ->get(['id', 'code', 'status', 'created_at', 'paid_at']);

            foreach ($recentInvoices as $invoice) {
                $desc = match ($invoice->status) {
                    Invoice::STATUS_PAID => "Invoice {$invoice->code} dibayar",
                    Invoice::STATUS_ISSUED => "Invoice {$invoice->code} diterbitkan",
                    default => "Invoice {$invoice->code} dibuat",
                };
                $timestamp = $invoice->paid_at ?? $invoice->created_at;

                $activities->push([
                    'icon' => 'file-invoice',
                    'type' => 'invoice',
                    'description' => $desc,
                    'time' => $timestamp->toIso8601String(),
                ]);
            }
        }

        if (Modules::available('maintenance')) {
            $recentWorkOrders = WorkOrder::query()
                ->with('vehicle:id,plate_number')
                ->latest()
                ->limit(3)
                ->get(['id', 'reference_number', 'title', 'status', 'vehicle_id', 'created_at', 'completed_at']);

            foreach ($recentWorkOrders as $wo) {
                $plate = $wo->vehicle?->plate_number;
                $desc = match ($wo->status) {
                    WorkOrder::STATUS_COMPLETED => 'Service selesai'.($plate ? " — {$plate}" : ''),
                    default => "WO {$wo->reference_number}: {$wo->title}",
                };
                $timestamp = $wo->completed_at ?? $wo->created_at;

                $activities->push([
                    'icon' => 'tool',
                    'type' => 'maintenance',
                    'description' => $desc,
                    'time' => $timestamp->toIso8601String(),
                ]);
            }
        }

        return $activities
            ->sortByDesc('time')
            ->take(8)
            ->values()
            ->toArray();
    }
}
