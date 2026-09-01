<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Setting;
use App\Models\SubscriptionTier;
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
use Modules\Invoicing\Models\Invoice;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Pages\Models\Page;
use Modules\Partners\Models\Partner;
use Modules\Posts\Models\Post;
use Modules\Rental\Models\Rental;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\TransportationManagement\Models\Trip;

class DashboardController extends Controller
{
    private function routeExists(string $name): bool
    {
        return app('router')->has($name) || app('router')->has("central.{$name}");
    }

    private function resolveNamedRoute(string $name): string
    {
        if (app('router')->has($name)) {
            return $name;
        }

        $centralName = "central.{$name}";
        if (app('router')->has($centralName)) {
            return $centralName;
        }

        return $name;
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! function_exists('tenancy') || ! tenancy()->initialized) {
            if ($user->can('manage-tenants') || $user->isAdmin()) {
                return app(\App\Http\Controllers\Central\CentralDashboardController::class)->index($request);
            }
        }

        $primaryRole = $user->getPrimaryRole();

        $period = $request->query('period', 'month');
        $range = $this->resolveDateRange($period);

        $kpis = $this->buildTopLevelKpis($range);
        $finance = $this->buildFinanceBreakdown($range);
        $modules = $this->buildModuleBreakdowns($range);
        $fleetGlobal = $this->buildGlobalFleetMonitoring($range);
        $alerts = $this->buildOperationalAlerts();
        $quickActions = $this->buildQuickActions();
        $filters = $this->buildFilters();

        $stats = $this->buildCmsStats();
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
            'period' => $period,
            'filters' => $filters,
            'kpis' => $kpis,
            'finance' => $finance,
            'modules' => $modules,
            'fleetGlobal' => $fleetGlobal,
            'alerts' => $alerts,
            'quickActions' => $quickActions,
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'recentPosts' => $recentPosts,
            'recentPages' => $recentPages,
            'onboarding' => $this->buildOnboardingOverview($user),
            'subscription' => $this->buildSubscriptionOverview(),
            'currencySymbol' => (string) Setting::getValue('ecommerce.currency_symbol', 'Rp'),
        ]);
    }

    /**
     * Core onboarding overview: fleet vehicles and contact records readiness.
     *
     * @param  \App\Models\User  $user
     * @return array{
     *     has_fleet: bool,
     *     has_partners: bool,
     *     vehicles_count: int,
     *     partners_count: int,
     *     can_create_vehicle: bool,
     *     can_create_partner: bool
     * }
     */
    private function buildOnboardingOverview($user): array
    {
        $hasFleet = Modules::available('fleet');
        $hasPartners = Modules::available('partners');

        $vehiclesCount = $hasFleet ? (int) Vehicle::query()->count() : 0;
        $partnersCount = $hasPartners ? (int) Partner::query()->count() : 0;

        return [
            'has_fleet' => $hasFleet,
            'has_partners' => $hasPartners,
            'vehicles_count' => $vehiclesCount,
            'partners_count' => $partnersCount,
            'can_create_vehicle' => $user->hasPermissionFor('fleet', 'create'),
            'can_create_partner' => $user->hasPermissionFor('partners', 'create'),
        ];
    }

    /**
     * PAYG pricing overview for the current workspace: the tier that applies to
     * the tenant's vehicle count, the monthly estimate, and the full tier ladder
     * so growth-driven price drops are visible. Null when there is no tenant
     * context or no tiers are configured.
     *
     * @return array{
     *     subscription_type: ?string,
     *     vehicle_count: int,
     *     is_billed_quota: bool,
     *     active_tier_id: ?int,
     *     price_per_vehicle: ?float,
     *     monthly_estimate: ?float,
     *     currency_symbol: string,
     *     tiers: array<int, array{id: int, name: string, min_vehicles: int, max_vehicles: int, price_per_vehicle: float}>
     * }|null
     */
    private function buildSubscriptionOverview(): ?array
    {
        if (! function_exists('tenancy') || ! tenancy()->initialized) {
            return null;
        }

        $tenant = tenant();

        if (! $tenant) {
            return null;
        }

        $tiers = SubscriptionTier::query()->orderBy('min_vehicles')->get();

        if ($tiers->isEmpty()) {
            return null;
        }

        $subscription = $tenant->subscription;
        $subscribedVehicles = (int) ($subscription?->subscribed_vehicles ?? 0);

        // Fleet stats
        $totalFleet = Modules::available('fleet') ? (int) Vehicle::query()->count() : 0;
        $activeFleet = Modules::available('fleet') ? (int) Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->count() : 0;
        $expiredFleet = Modules::available('fleet') ? (int) Vehicle::query()->whereNotNull('active_until')->where('active_until', '<', Carbon::now())->count() : 0;
        $expiringFleet = Modules::available('fleet') ? (int) Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->whereNotNull('active_until')->whereBetween('active_until', [Carbon::now(), Carbon::now()->addDays(7)])->count() : 0;

        // Basis: the billed quota when subscribed, otherwise the live registered
        // fleet as a projection of what the tenant would pay.
        $vehicleCount = $subscribedVehicles > 0
            ? $subscribedVehicles
            : $totalFleet;

        $activeTier = $vehicleCount > 0 ? SubscriptionTier::tierFor($vehicleCount) : null;

        // Find next tier for upgrade progress
        $nextTier = null;
        if ($activeTier) {
            $nextTier = $tiers->first(fn (SubscriptionTier $t): bool => $t->min_vehicles > $activeTier->max_vehicles);
        } else {
            $nextTier = $tiers->first();
        }

        $vehiclesToNextTier = $nextTier ? max(0, $nextTier->min_vehicles - $vehicleCount) : 0;

        return [
            'subscription_type' => $tenant->subscription_type,
            'vehicle_count' => $vehicleCount,
            'total_fleet' => $totalFleet,
            'active_fleet' => $activeFleet,
            'expired_fleet' => $expiredFleet,
            'expiring_fleet' => $expiringFleet,
            'is_billed_quota' => $subscribedVehicles > 0,
            'active_tier_id' => $activeTier?->id,
            'next_tier' => $nextTier ? [
                'id' => $nextTier->id,
                'name' => $nextTier->name,
                'min_vehicles' => (int) $nextTier->min_vehicles,
                'price_per_vehicle' => (float) $nextTier->price_per_vehicle,
                'vehicles_needed' => $vehiclesToNextTier,
            ] : null,
            'price_per_vehicle' => $activeTier ? (float) $activeTier->price_per_vehicle : null,
            'monthly_estimate' => $activeTier ? $vehicleCount * (float) $activeTier->price_per_vehicle : null,
            'currency_symbol' => (string) Setting::getValue('ecommerce.currency_symbol', 'Rp'),
            'tiers' => $tiers->map(fn (SubscriptionTier $tier): array => [
                'id' => $tier->id,
                'name' => $tier->name,
                'min_vehicles' => (int) $tier->min_vehicles,
                'max_vehicles' => (int) $tier->max_vehicles,
                'price_per_vehicle' => (float) $tier->price_per_vehicle,
            ])->all(),
        ];
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
            'week' => [
                'start' => $now->copy()->startOfWeek(),
                'end' => $now->copy()->endOfWeek(),
                'previous_start' => $now->copy()->subWeek()->startOfWeek(),
                'previous_end' => $now->copy()->subWeek()->endOfWeek(),
            ],
            default => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
                'previous_start' => $now->copy()->subMonth()->startOfMonth(),
                'previous_end' => $now->copy()->subMonth()->endOfMonth(),
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function buildFilters(): array
    {
        $availableModules = [];

        if (Modules::available('rental')) {
            $availableModules[] = 'rental';
        }
        if (Modules::available('shuttle')) {
            $availableModules[] = 'shuttle';
        }
        if (Modules::available('orders')) {
            $availableModules[] = 'orders';
        }
        if (Modules::available('fleet')) {
            $availableModules[] = 'fleet';
        }
        if (Modules::available('invoicing')) {
            $availableModules[] = 'invoicing';
        }

        return [
            'periods' => [
                ['key' => 'today', 'label' => __('dashboard.periods.today')],
                ['key' => 'week', 'label' => __('dashboard.periods.week')],
                ['key' => 'month', 'label' => __('dashboard.periods.month')],
            ],
            'modules' => $availableModules,
        ];
    }

    /**
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>
     */
    private function buildTopLevelKpis(array $range): array
    {
        $kpis = [];

        if (Modules::available('invoicing')) {
            $paidAmount = (float) Invoice::query()
                ->where('status', Invoice::STATUS_PAID)
                ->whereBetween('paid_at', [$range['start'], $range['end']])
                ->sum('total');

            $prevPaidAmount = (float) Invoice::query()
                ->where('status', Invoice::STATUS_PAID)
                ->whereBetween('paid_at', [$range['previous_start'], $range['previous_end']])
                ->sum('total');

            $revenueDelta = null;
            if ($prevPaidAmount > 0) {
                $revenueDelta = round((($paidAmount - $prevPaidAmount) / $prevPaidAmount) * 100, 1);
            } elseif ($paidAmount > 0) {
                $revenueDelta = 100.0;
            }

            $kpis['revenue'] = [
                'value' => round($paidAmount),
                'delta' => $revenueDelta,
                'delta_label' => $revenueDelta !== null ? ($revenueDelta >= 0 ? '+' : '').$revenueDelta.'% '.__('dashboard.kpi.vs_previous') : null,
                'direction' => $revenueDelta >= 0 ? 'up' : 'down',
            ];

            $outstandingAmount = (float) Invoice::query()
                ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
                ->sum('total');

            $overdueCount = Invoice::query()
                ->where('status', Invoice::STATUS_ISSUED)
                ->where('due_date', '<', Carbon::today())
                ->count();

            $kpis['outstanding'] = [
                'value' => round($outstandingAmount),
                'overdue_count' => $overdueCount,
                'overdue_label' => $overdueCount > 0 ? __('dashboard.kpi.overdue_invoices', ['count' => $overdueCount]) : null,
            ];
        }

        if (Modules::available('fleet')) {
            $totalVehicles = Vehicle::query()->count();
            $activeVehicles = Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->count();

            $inUse = 0;
            if (Modules::available('rental')) {
                $inUse += Rental::query()
                    ->whereIn('status', Rental::blockingStatuses())
                    ->distinct('vehicle_id')
                    ->count('vehicle_id');
            }
            if (Modules::available('shuttle')) {
                $inUse += ShuttleDeparture::query()
                    ->whereIn('status', [ShuttleDeparture::STATUS_DISPATCHED, ShuttleDeparture::STATUS_IN_TRANSIT])
                    ->whereNotNull('vehicle_id')
                    ->distinct('vehicle_id')
                    ->count('vehicle_id');
            }
            if (Modules::available('transportation')) {
                $inUse += Trip::query()
                    ->whereIn('status', [Trip::STATUS_IN_PROGRESS, Trip::STATUS_SCHEDULED])
                    ->whereNotNull('vehicle_id')
                    ->distinct('vehicle_id')
                    ->count('vehicle_id');
            }

            $utilizationPercent = $activeVehicles > 0 ? round(($inUse / $activeVehicles) * 100, 1) : 0;

            $idleCount = max(0, $activeVehicles - $inUse);

            $kpis['fleet_utilization'] = [
                'percent' => $utilizationPercent,
                'in_use' => $inUse,
                'total_active' => $activeVehicles,
                'idle_count' => $idleCount,
            ];
        }

        $complianceCount = 0;
        $complianceDetails = [];

        if (Modules::available('document')) {
            $expiredDocs = Document::query()->expired()->count();
            $complianceCount += $expiredDocs;
            if ($expiredDocs > 0) {
                $complianceDetails[] = [
                    'type' => 'document_expired',
                    'severity' => 'danger',
                    'label' => __('dashboard.kpi.document_expired', ['count' => $expiredDocs]),
                ];
            }
        }

        if (Modules::available('fleet')) {
            $stnkExpiring = Vehicle::query()
                ->whereNotNull('stnk_expires_at')
                ->where('stnk_expires_at', '<=', Carbon::now()->addDays(30))
                ->count();
            $complianceCount += $stnkExpiring;
            if ($stnkExpiring > 0) {
                $complianceDetails[] = [
                    'type' => 'stnk_expiring',
                    'severity' => 'warning',
                    'label' => __('dashboard.kpi.stnk_expiring', ['count' => $stnkExpiring]),
                ];
            }
        }

        if (Modules::available('maintenance')) {
            $openWorkOrders = WorkOrder::query()->open()->count();
            $complianceCount += $openWorkOrders;
            if ($openWorkOrders > 0) {
                $complianceDetails[] = [
                    'type' => 'maintenance_pending',
                    'severity' => 'info',
                    'label' => __('dashboard.kpi.maintenance_pending', ['count' => $openWorkOrders]),
                ];
            }
        }

        if ($complianceCount > 0 || count($complianceDetails) > 0) {
            $kpis['compliance'] = [
                'action_count' => $complianceCount,
                'details' => $complianceDetails,
            ];
        }

        return $kpis;
    }

    /**
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>
     */
    private function buildFinanceBreakdown(array $range): array
    {
        $finance = [];

        if (Modules::available('invoicing')) {
            $revenueByLine = [];
            $totalRevenue = 0;

            if (Modules::available('rental')) {
                $rentalRevenue = (float) Invoice::query()
                    ->where('status', Invoice::STATUS_PAID)
                    ->whereBetween('paid_at', [$range['start'], $range['end']])
                    ->whereHas('lines', function ($q) {
                        $q->where('description', 'like', '%RENT%')
                            ->orWhere('description', 'like', '%rental%')
                            ->orWhere('description', 'like', '%Sewa%')
                            ->orWhere('description', 'like', '%sewa%');
                    })
                    ->sum('total');

                if ($rentalRevenue > 0) {
                    $revenueByLine['rental'] = [
                        'key' => 'rental',
                        'label' => __('dashboard.finance.line_rental'),
                        'amount' => round($rentalRevenue),
                        'percent' => 0,
                    ];
                    $totalRevenue += $rentalRevenue;
                }
            }

            if (Modules::available('shuttle')) {
                $shuttleRevenue = (float) Invoice::query()
                    ->where('status', Invoice::STATUS_PAID)
                    ->whereBetween('paid_at', [$range['start'], $range['end']])
                    ->whereHas('lines', function ($q) {
                        $q->where('description', 'like', '%SHUTTLE%')
                            ->orWhere('description', 'like', '%shuttle%')
                            ->orWhere('description', 'like', '%Travel%')
                            ->orWhere('description', 'like', '%travel%')
                            ->orWhere('description', 'like', '%Tiket%')
                            ->orWhere('description', 'like', '%tiket%');
                    })
                    ->sum('total');

                if ($shuttleRevenue > 0) {
                    $revenueByLine['shuttle'] = [
                        'key' => 'shuttle',
                        'label' => __('dashboard.finance.line_shuttle'),
                        'amount' => round($shuttleRevenue),
                        'percent' => 0,
                    ];
                    $totalRevenue += $shuttleRevenue;
                }
            }

            if (Modules::available('orders')) {
                $logisticsRevenue = (float) Invoice::query()
                    ->where('status', Invoice::STATUS_PAID)
                    ->whereBetween('paid_at', [$range['start'], $range['end']])
                    ->whereHas('lines', function ($q) {
                        $q->where('description', 'like', '%DO-')
                            ->orWhere('description', 'like', '%Logistik%')
                            ->orWhere('description', 'like', '%logistik%')
                            ->orWhere('description', 'like', '%Kurir%')
                            ->orWhere('description', 'like', '%kurir%');
                    })
                    ->sum('total');

                if ($logisticsRevenue > 0) {
                    $revenueByLine['logistics'] = [
                        'key' => 'logistics',
                        'label' => __('dashboard.finance.line_logistics'),
                        'amount' => round($logisticsRevenue),
                        'percent' => 0,
                    ];
                    $totalRevenue += $logisticsRevenue;
                }
            }

            if (empty($revenueByLine)) {
                $totalAll = (float) Invoice::query()
                    ->where('status', Invoice::STATUS_PAID)
                    ->whereBetween('paid_at', [$range['start'], $range['end']])
                    ->sum('total');
                if ($totalAll > 0) {
                    $revenueByLine['other'] = [
                        'key' => 'other',
                        'label' => __('dashboard.finance.line_other'),
                        'amount' => round($totalAll),
                        'percent' => 100,
                    ];
                }
            } else {
                if ($totalRevenue > 0) {
                    $revenueByLine = array_map(function ($item) use ($totalRevenue) {
                        $item['percent'] = round(($item['amount'] / $totalRevenue) * 100, 1);

                        return $item;
                    }, $revenueByLine);
                }
            }

            $finance['revenue_by_line'] = array_values($revenueByLine);

            $invoicesByStatus = Invoice::query()
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            $draftCount = $invoicesByStatus[Invoice::STATUS_DRAFT] ?? 0;
            $issuedCount = $invoicesByStatus[Invoice::STATUS_ISSUED] ?? 0;
            $paidCount = $invoicesByStatus[Invoice::STATUS_PAID] ?? 0;

            $overdueCount = Invoice::query()
                ->where('status', Invoice::STATUS_ISSUED)
                ->where('due_date', '<', Carbon::today())
                ->count();

            $finance['invoices'] = [
                'draft' => $draftCount,
                'issued' => $issuedCount,
                'paid' => $paidCount,
                'overdue' => $overdueCount,
            ];

            $finance['revenue_chart'] = $this->buildRevenueChart();
        }

        return $finance;
    }

    /**
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>
     */
    private function buildModuleBreakdowns(array $range): array
    {
        $modules = [];

        if (Modules::available('shuttle')) {
            $today = Carbon::today();
            $todayTrips = ShuttleDeparture::query()
                ->whereDate('depart_date', $today)
                ->count();

            $allTodayDepartures = ShuttleDeparture::query()
                ->whereDate('depart_date', $today)
                ->get(['seat_capacity', 'seats_booked']);

            $totalSeats = $allTodayDepartures->sum('seat_capacity');
            $bookedSeats = $allTodayDepartures->sum('seats_booked');
            $occupancyPercent = $totalSeats > 0 ? round(($bookedSeats / $totalSeats) * 100) : 0;

            $upcomingDepartures = ShuttleDeparture::query()
                ->with(['corridor:id,name,origin_city,destination_city', 'vehicle:id,plate_number', 'driver:id,name'])
                ->whereDate('depart_date', '>=', $today)
                ->whereIn('status', [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_LOCKED, ShuttleDeparture::STATUS_OPTIMIZED, ShuttleDeparture::STATUS_DISPATCHED])
                ->orderBy('depart_date')
                ->orderBy('depart_time')
                ->limit(5)
                ->get()
                ->map(function (ShuttleDeparture $dep) {
                    $route = $dep->corridor ? ($dep->corridor->origin_city.' - '.$dep->corridor->destination_city) : ($dep->corridor?->name ?? '—');
                    $seatsTotal = $dep->seat_capacity ?? 0;
                    $seatsBooked = $dep->seats_booked ?? 0;

                    $statusMap = [
                        ShuttleDeparture::STATUS_OPEN => 'ready',
                        ShuttleDeparture::STATUS_LOCKED => 'locked',
                        ShuttleDeparture::STATUS_OPTIMIZED => 'optimized',
                        ShuttleDeparture::STATUS_DISPATCHED => 'boarding',
                        ShuttleDeparture::STATUS_IN_TRANSIT => 'in_transit',
                    ];

                    return [
                        'id' => $dep->id,
                        'time' => Carbon::parse($dep->depart_date->format('Y-m-d').' '.$dep->depart_time)->format('H:i T'),
                        'route' => $route,
                        'seats_booked' => $seatsBooked,
                        'seats_total' => $seatsTotal,
                        'status' => $statusMap[$dep->status] ?? $dep->status,
                        'has_driver' => (bool) $dep->driver_id,
                    ];
                })
                ->values()
                ->toArray();

            $modules['shuttle'] = [
                'total_trips_today' => $todayTrips,
                'occupancy_percent' => $occupancyPercent,
                'booked_seats' => $bookedSeats,
                'total_seats' => $totalSeats,
                'upcoming_departures' => $upcomingDepartures,
            ];
        }

        if (Modules::available('rental')) {
            $activeRentals = Rental::query()
                ->whereIn('status', [Rental::STATUS_ACTIVE])
                ->count();

            $totalActiveVehicles = Modules::available('fleet')
                ? Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->count()
                : 0;

            $rentedVehicleIds = Rental::query()
                ->whereIn('status', Rental::blockingStatuses())
                ->distinct('vehicle_id')
                ->pluck('vehicle_id');

            $idleReady = max(0, $totalActiveVehicles - $rentedVehicleIds->count());

            $overdueRentals = Rental::query()->overdue()->count();

            $modules['rental'] = [
                'currently_rented' => $activeRentals,
                'idle_ready' => $idleReady,
                'overdue_count' => $overdueRentals,
            ];
        }

        if (Modules::available('orders')) {
            $today = Carbon::today();
            $totalResiToday = DeliveryOrder::query()
                ->whereDate('order_date', $today)
                ->count();

            $inTransitCount = DeliveryOrder::query()
                ->where('status', DeliveryOrder::STATUS_IN_TRANSIT)
                ->count();

            $podDeliveredCount = DeliveryOrder::query()
                ->where('status', DeliveryOrder::STATUS_DELIVERED)
                ->whereDate('delivered_at', $today)
                ->count();

            $modules['logistics'] = [
                'total_resi_today' => $totalResiToday,
                'in_transit' => $inTransitCount,
                'delivered_pod' => $podDeliveredCount,
            ];
        }

        return $modules;
    }

    /**
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>
     */
    private function buildGlobalFleetMonitoring(array $range): array
    {
        if (! Modules::available('fleet')) {
            return [];
        }

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

        $fuelThisPeriod = FuelLog::query()
            ->whereBetween('filled_at', [$range['start'], $range['end']])
            ->selectRaw('COALESCE(SUM(liters), 0) as liters')
            ->first();

        return [
            'vehicles_active' => $vehiclesByStatus[Vehicle::STATUS_ACTIVE] ?? 0,
            'vehicles_maintenance' => $vehiclesByStatus[Vehicle::STATUS_MAINTENANCE] ?? 0,
            'drivers_ready' => $driversByStatus[Driver::STATUS_AVAILABLE] ?? 0,
            'drivers_on_leave' => $driversByStatus[Driver::STATUS_ON_LEAVE] ?? 0,
            'fuel_liters' => round((float) ($fuelThisPeriod->liters ?? 0)),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildOperationalAlerts(): array
    {
        $alerts = [];

        if (Modules::available('rental')) {
            $overdueRentals = Rental::query()
                ->overdue()
                ->with(['vehicle:id,plate_number,name'])
                ->limit(3)
                ->get();

            foreach ($overdueRentals as $rental) {
                $plate = $rental->vehicle?->plate_number ?? '—';
                $hoursLate = max(1, Carbon::parse($rental->end_date)->startOfDay()->diffInHours(Carbon::now()));
                $alerts[] = [
                    'module' => 'rental',
                    'severity' => 'danger',
                    'icon' => 'alert-circle',
                    'title' => __('dashboard.alerts.rental_overdue_title'),
                    'message' => __('dashboard.alerts.rental_overdue_message', [
                        'plate' => $plate,
                        'hours' => $hoursLate,
                    ]),
                ];
            }
        }

        if (Modules::available('shuttle')) {
            $today = Carbon::today();
            $tripsNoDriver = ShuttleDeparture::query()
                ->whereDate('depart_date', '>=', $today)
                ->whereNull('driver_id')
                ->whereIn('status', [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_LOCKED, ShuttleDeparture::STATUS_OPTIMIZED])
                ->with(['corridor:id,name,origin_city,destination_city'])
                ->limit(3)
                ->get();

            foreach ($tripsNoDriver as $dep) {
                $route = $dep->corridor ? ($dep->corridor->origin_city.' - '.$dep->corridor->destination_city) : ($dep->corridor?->name ?? '—');
                $time = Carbon::parse($dep->depart_date->format('Y-m-d').' '.$dep->depart_time)->format('H:i');
                $alerts[] = [
                    'module' => 'shuttle',
                    'severity' => 'warning',
                    'icon' => 'user-x',
                    'title' => __('dashboard.alerts.shuttle_no_driver_title'),
                    'message' => __('dashboard.alerts.shuttle_no_driver_message', [
                        'route' => $route,
                        'time' => $time,
                    ]),
                ];
            }
        }

        if (Modules::available('fleet')) {
            $stnkExpiringSoon = Vehicle::query()
                ->whereNotNull('stnk_expires_at')
                ->where('stnk_expires_at', '<=', Carbon::now()->addDays(30))
                ->where('stnk_expires_at', '>=', Carbon::now())
                ->orderBy('stnk_expires_at')
                ->limit(3)
                ->get(['id', 'plate_number', 'name', 'stnk_expires_at']);

            foreach ($stnkExpiringSoon as $vehicle) {
                $daysLeft = Carbon::now()->diffInDays($vehicle->stnk_expires_at, false);
                $alerts[] = [
                    'module' => 'fleet',
                    'severity' => 'warning',
                    'icon' => 'file-warning',
                    'title' => __('dashboard.alerts.stnk_expiring_title'),
                    'message' => __('dashboard.alerts.stnk_expiring_message', [
                        'plate' => $vehicle->plate_number,
                        'days' => $daysLeft,
                    ]),
                ];
            }
        }

        if (Modules::available('maintenance')) {
            $overdueWO = WorkOrder::query()
                ->overdue()
                ->with(['vehicle:id,plate_number'])
                ->limit(2)
                ->get();

            foreach ($overdueWO as $wo) {
                $alerts[] = [
                    'module' => 'maintenance',
                    'severity' => 'info',
                    'icon' => 'wrench',
                    'title' => __('dashboard.alerts.maintenance_overdue_title'),
                    'message' => $wo->reference_number.': '.$wo->title.($wo->vehicle?->plate_number ? ' — '.$wo->vehicle->plate_number : ''),
                ];
            }
        }

        if (Modules::available('invoicing')) {
            $overdueInvoices = Invoice::query()
                ->where('status', Invoice::STATUS_ISSUED)
                ->where('due_date', '<', Carbon::today())
                ->with('partner:id,name')
                ->limit(2)
                ->get();

            foreach ($overdueInvoices as $inv) {
                $alerts[] = [
                    'module' => 'invoicing',
                    'severity' => 'danger',
                    'icon' => 'file-invoice-dollar',
                    'title' => __('dashboard.alerts.invoice_overdue_title'),
                    'message' => $inv->code.' — '.($inv->partner?->name ?? '—').' : Rp '.number_format((float) $inv->total, 0, ',', '.'),
                ];
            }
        }

        return array_slice($alerts, 0, 6);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildQuickActions(): array
    {
        $actions = [];

        if (Modules::available('rental')) {
            $actions[] = [
                'key' => 'new_rental',
                'label' => __('dashboard.quick_actions.new_rental_reservation'),
                'icon' => 'car',
                'route' => $this->routeExists('module.rental.create') ? route($this->resolveNamedRoute('module.rental.create')) : null,
                'permission' => 'rental.create',
            ];
        }

        if (Modules::available('shuttle')) {
            $actions[] = [
                'key' => 'issue_ticket',
                'label' => __('dashboard.quick_actions.issue_travel_ticket'),
                'icon' => 'ticket',
                'route' => $this->routeExists('module.shuttle.bookings.create') ? route($this->resolveNamedRoute('module.shuttle.bookings.create')) : null,
                'permission' => 'shuttle.bookings.create',
            ];
        }

        if (Modules::available('orders')) {
            $actions[] = [
                'key' => 'new_logistics',
                'label' => __('dashboard.quick_actions.create_logistics_resi'),
                'icon' => 'package',
                'route' => $this->routeExists('module.orders.create') ? route($this->resolveNamedRoute('module.orders.create')) : null,
                'permission' => 'orders.create',
            ];
        }

        if (Modules::available('invoicing')) {
            $actions[] = [
                'key' => 'new_invoice',
                'label' => __('dashboard.quick_actions.create_manual_invoice'),
                'icon' => 'file-invoice',
                'route' => $this->routeExists('module.invoicing.invoices.create') ? route($this->resolveNamedRoute('module.invoicing.invoices.create')) : null,
                'permission' => 'invoicing.invoices.create',
            ];
        }

        return $actions;
    }

    /**
     * @return array<int, array{month: string, amount: float}>
     */
    private function buildRevenueChart(): array
    {
        if (! Modules::available('invoicing')) {
            return [];
        }

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
                    DeliveryOrder::STATUS_DELIVERED => __('dashboard.activity.do_delivered', ['code' => $order->code]),
                    DeliveryOrder::STATUS_IN_TRANSIT => __('dashboard.activity.do_in_transit', ['code' => $order->code]),
                    DeliveryOrder::STATUS_CONFIRMED => __('dashboard.activity.do_confirmed', ['code' => $order->code]),
                    default => __('dashboard.activity.do_created', ['code' => $order->code]),
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
                    Trip::STATUS_COMPLETED => __('dashboard.activity.trip_completed', ['code' => $trip->code]).($plate ? " — {$plate}" : ''),
                    Trip::STATUS_IN_PROGRESS => __('dashboard.activity.trip_started', ['code' => $trip->code]).($plate ? " — {$plate}" : ''),
                    default => __('dashboard.activity.trip_scheduled', ['code' => $trip->code]).($plate ? " — {$plate}" : ''),
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

        if (Modules::available('rental')) {
            $recentRentals = Rental::query()
                ->with('vehicle:id,plate_number')
                ->latest()
                ->limit(4)
                ->get(['id', 'code', 'status', 'vehicle_id', 'created_at', 'checked_out_at', 'returned_at', 'completed_at']);

            foreach ($recentRentals as $rental) {
                $plate = $rental->vehicle?->plate_number;
                $desc = match ($rental->status) {
                    Rental::STATUS_COMPLETED => __('dashboard.activity.rental_completed', ['code' => $rental->code]).($plate ? " — {$plate}" : ''),
                    Rental::STATUS_ACTIVE => __('dashboard.activity.rental_active', ['code' => $rental->code]).($plate ? " — {$plate}" : ''),
                    Rental::STATUS_CONFIRMED => __('dashboard.activity.rental_confirmed', ['code' => $rental->code]).($plate ? " — {$plate}" : ''),
                    default => __('dashboard.activity.rental_created', ['code' => $rental->code]),
                };
                $timestamp = $rental->completed_at ?? $rental->returned_at ?? $rental->checked_out_at ?? $rental->created_at;

                $activities->push([
                    'icon' => 'car',
                    'type' => 'rental',
                    'description' => $desc,
                    'time' => $timestamp->toIso8601String(),
                ]);
            }
        }

        if (Modules::available('shuttle')) {
            $recentDepartures = ShuttleDeparture::query()
                ->with('vehicle:id,plate_number')
                ->latest()
                ->limit(4)
                ->get(['id', 'departure_number', 'status', 'vehicle_id', 'created_at', 'dispatched_at', 'completed_at']);

            foreach ($recentDepartures as $dep) {
                $plate = $dep->vehicle?->plate_number;
                $code = $dep->departure_number ?? 'SH-'.$dep->id;
                $desc = match ($dep->status) {
                    ShuttleDeparture::STATUS_COMPLETED => __('dashboard.activity.shuttle_completed', ['code' => $code]).($plate ? " — {$plate}" : ''),
                    ShuttleDeparture::STATUS_IN_TRANSIT => __('dashboard.activity.shuttle_in_transit', ['code' => $code]).($plate ? " — {$plate}" : ''),
                    ShuttleDeparture::STATUS_DISPATCHED => __('dashboard.activity.shuttle_dispatched', ['code' => $code]).($plate ? " — {$plate}" : ''),
                    default => __('dashboard.activity.shuttle_created', ['code' => $code]),
                };
                $timestamp = $dep->completed_at ?? $dep->dispatched_at ?? $dep->created_at;

                $activities->push([
                    'icon' => 'bus',
                    'type' => 'shuttle',
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
                    Invoice::STATUS_PAID => __('dashboard.activity.invoice_paid', ['code' => $invoice->code]),
                    Invoice::STATUS_ISSUED => __('dashboard.activity.invoice_issued', ['code' => $invoice->code]),
                    default => __('dashboard.activity.invoice_created', ['code' => $invoice->code]),
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
                    WorkOrder::STATUS_COMPLETED => __('dashboard.activity.wo_completed').($plate ? " — {$plate}" : ''),
                    default => __('dashboard.activity.wo_created', ['ref' => $wo->reference_number, 'title' => $wo->title]),
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
            ->take(10)
            ->values()
            ->toArray();
    }
}
