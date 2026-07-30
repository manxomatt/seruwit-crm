<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Rental\Http\Requests\StoreRentalRequest;
use Modules\Rental\Http\Requests\UpdateRentalRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalInsurancePackage;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalAddonCatalog;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalHandoverMedia;
use Modules\Rental\Support\RentalInvoiceService;
use Modules\Rental\Support\RentalLocationHydrator;

class RentalController extends Controller
{
    public function __construct(private readonly RentalInvoiceService $invoices) {}

    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $rentals = Rental::query()
            ->with([
                'vehicle:id,name,plate_number,type',
                'partner:id,name,code',
                'driver:id,name',
            ])
            ->when(request('status'), fn ($q, $s) => $q->where('status', $s))
            ->when(request('search'), fn ($q, $s) => $q->where(function ($q) use ($s): void {
                $q->where('code', 'like', "%{$s}%")
                    ->orWhereHas('partner', fn ($q) => $q->where('name', 'like', "%{$s}%"));
            }))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Rental/Index', [
            'rentals' => $rentals,
            'filters' => request()->only('status', 'search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Rental/Create', [
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'drivers' => Driver::query()
                ->where('status', Driver::STATUS_AVAILABLE)
                ->orderBy('name')
                ->get(['id', 'name', 'phone']),
            'partners' => Partner::query()
                ->where('status', 'active')
                ->when(
                    Schema::hasColumn('partners', 'is_blacklisted'),
                    fn ($query) => $query->where('is_blacklisted', false),
                )
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'rates' => RentalRate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
            'locations' => $this->locationOptions(),
            'insurancePackages' => $this->insurancePackageOptions(),
            'defaultOneWayFee' => (float) \App\Models\Setting::getValue('rental.default_one_way_fee', '150000'),
        ]);
    }

    public function store(StoreRentalRequest $request, RentalLocationHydrator $hydrator): RedirectResponse
    {
        $validated = $hydrator->hydrate($request->validated());
        $totalPeriods = Rental::computePeriods($validated['start_date'], $validated['end_date'], $validated['period_type']);
        $rate = (float) $validated['rate_per_period'];

        $rental = Rental::create(array_merge($validated, [
            'code' => Rental::nextCode(),
            'total_periods' => $totalPeriods,
            'base_amount' => $rate * $totalPeriods,
            'excess_amount' => 0,
            'deposit_amount' => $validated['deposit_amount'] ?? 0,
            'total_amount' => $rate * $totalPeriods,
            'status' => Rental::STATUS_DRAFT,
        ]));

        return redirect()->route($this->getRoutePrefix().'.rental.show', $rental)
            ->with('success', __('rental.messages.created'));
    }

    public function show(Rental $rental): Response
    {
        $rental->load([
            'vehicle:id,name,plate_number,type,status',
            'driver:id,name,phone',
            'partner:id,name,code,phone',
            'confirmedBy:id,name',
            'extensions',
            'damages',
            'insurancePackage',
            'pickupLocation:id,code,name,address,city',
            'returnLocation:id,code,name,address,city',
            'vehicleSwaps.fromVehicle:id,name,plate_number',
            'vehicleSwaps.toVehicle:id,name,plate_number',
            'vehicleSwaps.swappedByUser:id,name',
            'charges' => fn ($query) => $query
                ->where('kind', RentalCharge::KIND_ADDON)
                ->with('invoiceLine.invoice')
                ->orderBy('id'),
        ]);

        $trackingEnabled = Modules::available('tracking');
        $livePosition = null;
        $hasGpsDevice = false;
        $gpsSummary = null;

        // Soft dependency: Tracking registers Vehicle::gpsDevice at boot. Only
        // surface a fix when the module is actually available for this tenant.
        if ($trackingEnabled && $rental->vehicle) {
            $device = $rental->vehicle->gpsDevice;
            $hasGpsDevice = $device !== null;

            if ($device?->hasPosition()) {
                $livePosition = [
                    'latitude' => $device->last_latitude,
                    'longitude' => $device->last_longitude,
                    'speed_kph' => $device->last_speed_kph,
                    'recorded_at' => $device->last_recorded_at?->toDateTimeString(),
                ];
            }

            if (class_exists(\Modules\Tracking\Models\VehiclePosition::class)
                && class_exists(\Modules\Tracking\Support\PositionTrail::class)) {
                $from = $rental->checked_out_at ?? $rental->start_date;
                $to = $rental->returned_at ?? now();

                $positions = \Modules\Tracking\Models\VehiclePosition::query()
                    ->where('vehicle_id', $rental->vehicle_id)
                    ->whereBetween('recorded_at', [$from, $to])
                    ->orderBy('recorded_at')
                    ->get();

                $odometerKm = null;
                if ($rental->start_odometer !== null && $rental->end_odometer !== null) {
                    $odometerKm = max(0, (int) $rental->end_odometer - (int) $rental->start_odometer);
                }

                $gpsSummary = [
                    'distance_km' => \Modules\Tracking\Support\PositionTrail::distanceKm($positions),
                    'points' => $positions->count(),
                    'odometer_km' => $odometerKm,
                    'from' => \Illuminate\Support\Carbon::parse($from)->toDateTimeString(),
                    'to' => \Illuminate\Support\Carbon::parse($to)->toDateTimeString(),
                ];
            }
        }

        return Inertia::render('Modules/Rental/Show', [
            'rental' => $rental->append('is_overdue'),
            'addonCharges' => $rental->charges->map(fn (RentalCharge $charge): array => [
                'id' => $charge->id,
                'addon_code' => $charge->addon_code,
                'description' => $charge->description,
                'amount' => (float) $charge->amount,
                'is_invoiced' => $charge->isInvoiced(),
                'can_delete' => ! $charge->isInvoiced()
                    || $charge->invoiceLine?->invoice?->status === \Modules\Invoicing\Models\Invoice::STATUS_DRAFT,
            ])->values()->all(),
            'addonCodes' => collect(RentalAddonCatalog::codes())
                ->map(fn (string $code): array => [
                    'value' => $code,
                    'label' => RentalAddonCatalog::label($code),
                ])
                ->all(),
            'swapVehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->where('id', '!=', $rental->vehicle_id)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'vehicleSwaps' => $rental->vehicleSwaps->map(fn ($swap): array => [
                'id' => $swap->id,
                'from_vehicle' => $swap->fromVehicle
                    ? $swap->fromVehicle->name.' — '.$swap->fromVehicle->plate_number
                    : null,
                'to_vehicle' => $swap->toVehicle
                    ? $swap->toVehicle->name.' — '.$swap->toVehicle->plate_number
                    : null,
                'odometer_km' => $swap->odometer_km,
                'notes' => $swap->notes,
                'swapped_at' => $swap->swapped_at?->toDateTimeString(),
                'swapped_by' => $swap->swappedByUser?->name,
            ])->values()->all(),
            'trackingEnabled' => $trackingEnabled,
            'hasGpsDevice' => $hasGpsDevice,
            'livePosition' => $livePosition,
            'gpsSummary' => $gpsSummary,
            'payment' => $this->invoices->paymentSummary($rental),
            'invoicingEnabled' => $this->invoices->isAvailable(),
            'checklistItems' => RentalHandoverChecklist::itemKeys(),
            'fuelLevels' => RentalHandoverChecklist::fuelLevels(),
            'handoverEvidence' => [
                'checkout_photos' => app(RentalHandoverMedia::class)->publicUrls($rental->checkout_photos),
                'checkout_signature_url' => app(RentalHandoverMedia::class)->publicUrl($rental->checkout_signature_path),
                'return_photos' => app(RentalHandoverMedia::class)->publicUrls($rental->return_photos),
                'return_signature_url' => app(RentalHandoverMedia::class)->publicUrl($rental->return_signature_path),
            ],
            'gatewayEnabled' => class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
                && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable(),
            'canPayDepositOnline' => class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
                && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable()
                && (float) $rental->deposit_amount > 0
                && $rental->deposit_received_at === null
                && in_array($rental->status, [
                    Rental::STATUS_DRAFT,
                    Rental::STATUS_CONFIRMED,
                    Rental::STATUS_ACTIVE,
                ], true),
        ]);
    }

    public function edit(Rental $rental): Response
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED]),
            403,
            __('rental.errors.edit_draft_confirmed_only'),
        );

        $rental->load(['vehicle:id,name,plate_number,type', 'driver:id,name', 'partner:id,name,code']);

        return Inertia::render('Modules/Rental/Edit', [
            'rental' => $rental,
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'drivers' => Driver::query()
                ->where('status', Driver::STATUS_AVAILABLE)
                ->orderBy('name')
                ->get(['id', 'name', 'phone']),
            'partners' => Partner::query()
                ->where('status', 'active')
                ->when(
                    Schema::hasColumn('partners', 'is_blacklisted'),
                    fn ($query) => $query->where('is_blacklisted', false),
                )
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'rates' => RentalRate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
            'locations' => $this->locationOptions(),
            'insurancePackages' => $this->insurancePackageOptions(),
            'defaultOneWayFee' => (float) \App\Models\Setting::getValue('rental.default_one_way_fee', '150000'),
        ]);
    }

    public function update(UpdateRentalRequest $request, Rental $rental, RentalLocationHydrator $hydrator): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED]),
            403,
            __('rental.errors.edit_draft_confirmed_only'),
        );

        $validated = $hydrator->hydrate($request->validated());
        $totalPeriods = Rental::computePeriods($validated['start_date'], $validated['end_date'], $validated['period_type']);
        $rate = (float) $validated['rate_per_period'];

        $rental->update(array_merge($validated, [
            'total_periods' => $totalPeriods,
            'base_amount' => $rate * $totalPeriods,
            'deposit_amount' => $validated['deposit_amount'] ?? 0,
        ]));

        $rental->recalculateTotalAmount();

        return redirect()->route($this->getRoutePrefix().'.rental.show', $rental)
            ->with('success', __('rental.messages.updated'));
    }

    public function destroy(Rental $rental): RedirectResponse
    {
        abort_if(
            $rental->status !== Rental::STATUS_DRAFT,
            403,
            __('rental.errors.delete_draft_only'),
        );

        $rental->delete();

        return redirect()->route($this->getRoutePrefix().'.rental.index')
            ->with('success', __('rental.messages.deleted'));
    }

    /**
     * @return \Illuminate\Support\Collection<int, Location>
     */
    private function locationOptions()
    {
        if (! Schema::hasTable('locations')) {
            return collect();
        }

        return Location::query()->active()->orderBy('name')->get([
            'id', 'code', 'name', 'address', 'city',
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, RentalInsurancePackage>
     */
    private function insurancePackageOptions()
    {
        if (! Schema::hasTable('rental_insurance_packages')) {
            return collect();
        }

        return RentalInsurancePackage::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }
}
