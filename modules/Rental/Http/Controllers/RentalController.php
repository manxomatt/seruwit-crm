<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Http\Requests\StoreRentalRequest;
use Modules\Rental\Http\Requests\StoreWalkInCustomerRequest;
use Modules\Rental\Http\Requests\UpdateRentalRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalInsurancePackage;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalInvoiceService;
use Modules\Rental\Support\RentalLocationHydrator;
use Modules\Rental\Support\RentalPriceEngine;
use Modules\Rental\Support\RentalShowPresenter;
use Modules\Rental\Support\WalkInCustomerCreator;

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
        $selectedPartnerId = request()->integer('partner_id') ?: null;
        $prefillVehicleId = request()->integer('vehicle_id') ?: null;
        $prefillStartDate = filled(request('start_date')) ? (string) request('start_date') : null;
        $prefillEndDate = filled(request('end_date')) ? (string) request('end_date') : null;
        $prefillPeriodType = filled(request('period_type')) ? (string) request('period_type') : null;
        $startStep = request()->integer('start_step') ?: null;

        $prefill = [
            'vehicle_id' => $prefillVehicleId,
            'start_date' => $prefillStartDate,
            'end_date' => $prefillEndDate,
            'period_type' => $prefillPeriodType,
            'start_step' => $startStep,
        ];

        // When pre-filling from the availability board, default both
        // pickup and return to the first active depot.
        if ($startStep !== null && $prefillVehicleId !== null) {
            $depots = app(RentalLocationHydrator::class)->depotOptions();
            if ($depots !== []) {
                $defaultDepot = $depots[0];
                $depotAddress = implode(', ', array_filter([
                    $defaultDepot['address'],
                    $defaultDepot['city'],
                    $defaultDepot['province'],
                    $defaultDepot['zip'],
                ], fn ($part) => filled($part))) ?: $defaultDepot['name'];

                $prefill['pickup_location_id'] = $defaultDepot['id'];
                $prefill['return_location_id'] = $defaultDepot['id'];
                $prefill['pickup_location'] = $depotAddress;
                $prefill['return_location'] = $depotAddress;
            }
        }

        return Inertia::render('Modules/Rental/Create', [
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type', 'rental_class']),
            'drivers' => Driver::query()
                ->where('status', Driver::STATUS_AVAILABLE)
                ->orderBy('name')
                ->get(['id', 'name', 'phone']),
            'partners' => $this->partnerOptions(),
            'selectedPartnerId' => $selectedPartnerId,
            'prefill' => $prefill,
            'rates' => RentalRate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'period_type',
                    'rate_per_period',
                    'km_limit_per_period',
                    'excess_km_rate',
                    'late_fee_per_day',
                    'deposit_amount',
                    'vehicle_id',
                    'vehicle_type',
                    'rental_class',
                    'min_periods',
                    'priority',
                    'valid_from',
                    'valid_to',
                ]),
            'locations' => $this->locationOptions(),
            'insurancePackages' => $this->insurancePackageOptions(),
            'defaultOneWayFee' => (float) \App\Models\Setting::getValue('rental.default_one_way_fee', '150000'),
            'suggestRateUrl' => route($this->getRoutePrefix().'.rental.rates.suggest'),
            'availableVehiclesUrl' => route($this->getRoutePrefix().'.rental.reservations.available_vehicles'),
            'quoteUrl' => route($this->getRoutePrefix().'.rental.reservations.quote'),
            'walkInUrl' => route($this->getRoutePrefix().'.rental.walk_in_customers.store'),
            'aiKycEnabled' => \Modules\Rental\Support\RentalGeneralSettings::all()['ai_kyc_enabled'],
            'aiScanDocUrl' => route($this->getRoutePrefix().'.rental.ai_scan_document'),
        ]);
    }

    /**
     * Quick-create (or reuse) a walk-in customer.
     * JSON requests keep the Reservation wizard state; form posts redirect to create.
     */
    public function storeWalkInCustomer(StoreWalkInCustomerRequest $request, WalkInCustomerCreator $creator): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $result = $creator->createOrReuse($request->validated());
        $partner = $result['partner'];
        $message = $result['created']
            ? __('rental.messages.walk_in_created', ['name' => $partner->name])
            : __('rental.messages.walk_in_reused', ['name' => $partner->name]);

        if ($request->wantsJson() || $request->expectsJson() || $request->header('X-Reservation-Wizard') === '1') {
            return response()->json([
                'partner' => $this->partnerOption($partner),
                'created' => $result['created'],
                'message' => $message,
            ]);
        }

        return redirect()
            ->route($this->getRoutePrefix().'.rental.create', ['partner_id' => $partner->id])
            ->with('success', $message);
    }

    public function store(StoreRentalRequest $request, RentalLocationHydrator $hydrator, RentalPriceEngine $priceEngine): RedirectResponse
    {
        $validated = $hydrator->hydrate($request->validated());
        $pricing = $this->applyResolvedRatePricing($validated, $priceEngine);
        $validated = $pricing['validated'];

        $rental = Rental::create(array_merge($validated, [
            'code' => Rental::nextCode(),
            'total_periods' => $pricing['total_periods'],
            'base_amount' => $pricing['base_amount'],
            'excess_amount' => 0,
            'total_amount' => $pricing['base_amount'],
            'status' => Rental::STATUS_DRAFT,
            'applied_period_tier_id' => $pricing['period_tier_id'],
            'applied_loyalty_tier_id' => $pricing['loyalty_tier_id'],
            'period_pricing_snapshot' => $pricing['period_breakdown'],
            'tier_discount_amount' => $pricing['discount_amount'],
        ]));

        return redirect()->route($this->getRoutePrefix().'.rental.show', $rental)
            ->with('success', __('rental.messages.created'));
    }

    public function show(Rental $rental, RentalShowPresenter $presenter): Response
    {
        return Inertia::render(
            'Modules/Rental/Show',
            $presenter->props($rental, $this->getRoutePrefix()),
        );
    }

    public function edit(Rental $rental): Response
    {
        abort_if(
            ! in_array($rental->status, Rental::editableStatuses(), true),
            403,
            __('rental.errors.edit_draft_confirmed_only'),
        );

        $rental->load(['vehicle:id,name,plate_number,type', 'driver:id,name', 'partner:id,name,code']);

        return Inertia::render('Modules/Rental/Edit', [
            'rental' => $rental,
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type', 'rental_class']),
            'drivers' => Driver::query()
                ->where('status', Driver::STATUS_AVAILABLE)
                ->orderBy('name')
                ->get(['id', 'name', 'phone']),
            'partners' => $this->partnerOptions(),
            'rates' => RentalRate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
            'locations' => $this->locationOptions(),
            'insurancePackages' => $this->insurancePackageOptions(),
            'defaultOneWayFee' => (float) \App\Models\Setting::getValue('rental.default_one_way_fee', '150000'),
            'availableVehiclesUrl' => route($this->getRoutePrefix().'.rental.reservations.available_vehicles'),
            'quoteUrl' => route($this->getRoutePrefix().'.rental.reservations.quote'),
            'walkInUrl' => route($this->getRoutePrefix().'.rental.walk_in_customers.store'),
        ]);
    }

    public function update(UpdateRentalRequest $request, Rental $rental, RentalLocationHydrator $hydrator, RentalPriceEngine $priceEngine): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, Rental::editableStatuses(), true),
            403,
            __('rental.errors.edit_draft_confirmed_only'),
        );

        $validated = $hydrator->hydrate($request->validated());
        $pricing = $this->applyResolvedRatePricing($validated, $priceEngine, $rental);
        $validated = $pricing['validated'];

        $rental->update(array_merge($validated, [
            'total_periods' => $pricing['total_periods'],
            'base_amount' => $pricing['base_amount'],
            'applied_period_tier_id' => $pricing['period_tier_id'],
            'applied_loyalty_tier_id' => $pricing['loyalty_tier_id'],
            'period_pricing_snapshot' => $pricing['period_breakdown'],
            'tier_discount_amount' => $pricing['discount_amount'],
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
     * @return \Illuminate\Support\Collection<int, object{id: int, code: string, name: string, address: string|null, city: string|null}>
     */
    private function locationOptions()
    {
        return collect(app(RentalLocationHydrator::class)->depotOptions())
            ->map(fn (array $depot): object => (object) $depot);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{
     *     id: int,
     *     name: string,
     *     code: string,
     *     phone: string|null,
     *     mobile: string|null,
     *     email: string|null,
     *     id_number: string|null,
     *     license_number: string|null,
     *     license_expires_at: string|null,
     *     address: string|null,
     *     account_type: string|null,
     *     status: string|null
     * }>
     */
    private function partnerOptions()
    {
        return Partner::query()
            ->where('status', 'active')
            ->when(
                Schema::hasColumn('partners', 'is_blacklisted'),
                fn ($query) => $query->where('is_blacklisted', false),
            )
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'code',
                'phone',
                'mobile',
                'email',
                'id_number',
                'license_number',
                'license_expires_at',
                'address',
                'account_type',
                'status',
            ])
            ->map(fn (Partner $partner): array => $this->partnerOption($partner))
            ->values();
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     code: string,
     *     phone: string|null,
     *     mobile: string|null,
     *     email: string|null,
     *     id_number: string|null,
     *     license_number: string|null,
     *     license_expires_at: string|null,
     *     address: string|null,
     *     account_type: string|null,
     *     status: string|null
     * }
     */
    private function partnerOption(Partner $partner): array
    {
        return [
            'id' => $partner->id,
            'name' => $partner->name,
            'code' => $partner->code,
            'phone' => $partner->phone,
            'mobile' => $partner->mobile,
            'email' => $partner->email,
            'id_number' => $partner->id_number,
            'license_number' => $partner->license_number,
            'license_expires_at' => $partner->license_expires_at?->toDateString(),
            'address' => $partner->address,
            'account_type' => $partner->account_type,
            'status' => $partner->status,
        ];
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

    /**
     * Pricing always comes from the active tariff scheme + tier engine
     * — never from free-form input.
     *
     * @param  array<string, mixed>  $validated
     * @return array{
     *   validated: array<string, mixed>,
     *   total_periods: int,
     *   base_amount: float,
     *   period_tier_id: ?int,
     *   loyalty_tier_id: ?int,
     *   period_breakdown: ?array<int, array<string, mixed>>,
     *   discount_amount: float,
     * }
     */
    private function applyResolvedRatePricing(array $validated, RentalPriceEngine $priceEngine, ?Rental $rental = null): array
    {
        $vehicle = Vehicle::query()->findOrFail((int) $validated['vehicle_id']);
        $partner = isset($validated['partner_id'])
            ? Partner::query()->find((int) $validated['partner_id'])
            : ($rental?->partner ?? null);

        try {
            $pricing = $priceEngine->calculate(
                $vehicle,
                (string) $validated['start_date'],
                (string) $validated['end_date'],
                (string) $validated['period_type'],
                $partner,
            );
        } catch (\RuntimeException) {
            abort(422, __('rental.validation.rate_required'));
        }

        $rate = $pricing['base_rate'];

        $validated['rate_per_period'] = $pricing['effective_rate_per_period'];
        $validated['km_limit_per_period'] = $rate->km_limit_per_period;
        $validated['excess_km_rate'] = $rate->excess_km_rate;
        $validated['late_fee_per_day'] = $rate->late_fee_per_day;
        $validated['deposit_amount'] = (float) ($rate->deposit_amount ?? 0);

        return [
            'validated' => $validated,
            'total_periods' => $pricing['total_periods'],
            'base_amount' => $pricing['base_amount'],
            'period_tier_id' => $pricing['period_tier_applied']?->id,
            'loyalty_tier_id' => $pricing['loyalty_tier_applied']?->id,
            'period_breakdown' => $pricing['period_breakdown'],
            'discount_amount' => $pricing['discount_amount'],
        ];
    }

    /**
     * Render dedicated full-page for vehicle checkout / serah terima.
     */
    public function checkoutPage(Rental $rental): Response|RedirectResponse
    {
        if ($rental->status !== Rental::STATUS_CONFIRMED) {
            return redirect()->route($this->getRoutePrefix().'.rental.show', $rental)
                ->with('error', __('rental.errors.checkout_confirmed_only'));
        }

        $rental->load([
            'vehicle:id,name,plate_number,type,status,photo_url,rental_class',
            'driver:id,name,phone',
            'partner:id,name,code,phone',
            'depositCompanyBankAccount:id,name,bank_name,account_number,account_holder',
        ]);

        $depositBlocksCheckout = false;
        $checkoutBlockedReason = null;

        if ((float) $rental->deposit_amount > 0 && ! $rental->isDepositReceived()) {
            $depositBlocksCheckout = true;
            $checkoutBlockedReason = __('rental.errors.checkout_deposit_required');
        }

        if ((float) $rental->deposit_amount <= 0 && $rental->deposit_proof_status !== Rental::PROOF_APPROVED) {
            $paymentSummary = $this->invoices->paymentSummary($rental);
            if ($paymentSummary['balance_due'] > 0 || in_array($paymentSummary['status'], ['unpaid', 'partial', 'draft'], true)) {
                $depositBlocksCheckout = true;
                $checkoutBlockedReason = __('rental.errors.checkout_prepayment_required');
            }
        }

        $pickupCustomerSignatureUrl = null;
        if (filled($rental->pickup_customer_signature_path)) {
            $pickupCustomerSignatureUrl = str_starts_with((string) $rental->pickup_customer_signature_path, 'data:image')
                ? (string) $rental->pickup_customer_signature_path
                : asset('storage/'.$rental->pickup_customer_signature_path);
        }

        return Inertia::render('Modules/Rental/Checkout', [
            'rental' => $rental->append('is_overdue'),
            'fuelLevels' => RentalHandoverChecklist::fuelLevels(),
            'checklistItems' => RentalHandoverChecklist::itemKeys(),
            'depositBlocksCheckout' => $depositBlocksCheckout,
            'checkoutBlockedReason' => $checkoutBlockedReason,
            'pickupCustomerSignatureUrl' => $pickupCustomerSignatureUrl,
        ]);
    }

    /**
     * Render dedicated full-page for vehicle return / pengembalian unit.
     */
    public function returnPage(Rental $rental): Response|RedirectResponse
    {
        if ($rental->status !== Rental::STATUS_ACTIVE) {
            return redirect()->route($this->getRoutePrefix().'.rental.show', $rental)
                ->with('error', __('rental.errors.return_active_only'));
        }

        $rental->load([
            'vehicle:id,name,plate_number,type,status,photo_url,rental_class',
            'driver:id,name,phone',
            'partner:id,name,code,phone',
        ]);

        $aiInspectionEnabled = config('services.gemini.api_key') !== null || config('rental.ai.inspection_enabled', true);

        return Inertia::render('Modules/Rental/Return', [
            'rental' => $rental->append('is_overdue'),
            'fuelLevels' => RentalHandoverChecklist::fuelLevels(),
            'checklistItems' => RentalHandoverChecklist::itemKeys(),
            'aiInspectionEnabled' => (bool) $aiInspectionEnabled,
            'aiInspectLiveUrl' => route($this->getRoutePrefix().'.rental.ai_inspect_live', $rental),
        ]);
    }
}
