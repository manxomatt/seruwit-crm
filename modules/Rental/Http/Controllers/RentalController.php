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
use Modules\Partners\Models\Partner;
use Modules\Rental\Http\Requests\StoreRentalRequest;
use Modules\Rental\Http\Requests\UpdateRentalRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalAddonCatalog;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalHandoverMedia;
use Modules\Rental\Support\RentalInvoiceService;

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
        ]);
    }

    public function store(StoreRentalRequest $request): RedirectResponse
    {
        $validated = $request->validated();
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
        ]);
    }

    public function update(UpdateRentalRequest $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED]),
            403,
            __('rental.errors.edit_draft_confirmed_only'),
        );

        $validated = $request->validated();
        $totalPeriods = Rental::computePeriods($validated['start_date'], $validated['end_date'], $validated['period_type']);
        $rate = (float) $validated['rate_per_period'];

        $rental->update(array_merge($validated, [
            'total_periods' => $totalPeriods,
            'base_amount' => $rate * $totalPeriods,
            'deposit_amount' => $validated['deposit_amount'] ?? 0,
            'total_amount' => $rate * $totalPeriods,
        ]));

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
}
