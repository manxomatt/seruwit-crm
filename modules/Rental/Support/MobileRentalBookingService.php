<?php

namespace Modules\Rental\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalInsurancePackage;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;

/**
 * Passenger-facing rental booking façade over staff domain services.
 */
class MobileRentalBookingService
{
    public function __construct(
        private readonly RentalRateResolver $rates,
        private readonly RentalLocationHydrator $hydrator,
        private readonly RentalEligibility $eligibility,
        private readonly MobilePassengerPartnerResolver $partners,
        private readonly RentalBookingPolicy $policy,
        private readonly RentalConfirmationService $confirmation,
        private readonly RentalMailer $mailer,
    ) {}

    /**
     * @return array{
     *     available: bool,
     *     reasons: list<string>,
     *     total_periods: int,
     *     rate: ?RentalRate,
     *     rate_per_period: float|null,
     *     deposit_amount: float|null,
     *     base_amount: float|null,
     *     one_way_fee_amount: float|null,
     *     insurance_amount: float|null,
     *     total_amount: float|null,
     *     min_periods: int|null
     * }
     */
    public function quote(array $input): array
    {
        $vehicle = Vehicle::query()->findOrFail((int) $input['vehicle_id']);
        $start = (string) $input['start_date'];
        $end = (string) $input['end_date'];
        $periodType = (string) $input['period_type'];

        $reasons = Rental::vehicleAvailabilityReasons($vehicle, $start, $end);
        $rate = $this->rates->suggest($vehicle, $start, $end, $periodType);
        $periods = Rental::computePeriods($start, $end, $periodType);

        if ($rate !== null && $rate->min_periods !== null && $periods < (int) $rate->min_periods) {
            $reasons[] = __('rental.validation.min_periods', [
                'rate' => $rate->name,
                'min' => (int) $rate->min_periods,
            ]);
        }

        $hydrated = $this->hydrator->hydrate([
            'pickup_location_id' => $input['pickup_location_id'] ?? null,
            'return_location_id' => $input['return_location_id'] ?? null,
            'one_way_fee_amount' => $input['one_way_fee_amount'] ?? null,
        ]);

        $insuranceAmount = null;
        if (filled($input['insurance_package_id'] ?? null)) {
            $package = RentalInsurancePackage::query()
                ->where('is_active', true)
                ->find((int) $input['insurance_package_id']);
            $insuranceAmount = $package ? (float) $package->amount : null;
        }

        $ratePerPeriod = $rate ? (float) $rate->rate_per_period : null;
        $withDeposit = filter_var($input['with_deposit'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $deposit = ($rate && $withDeposit) ? (float) ($rate->deposit_amount ?? 0) : 0.0;
        if (array_key_exists('deposit_amount', $input) && $input['deposit_amount'] !== null) {
            $deposit = (float) $input['deposit_amount'];
        }
        $base = $ratePerPeriod !== null ? round($ratePerPeriod * $periods, 2) : null;
        $oneWay = isset($hydrated['one_way_fee_amount']) ? (float) $hydrated['one_way_fee_amount'] : null;
        $total = $base !== null
            ? round($base + ($oneWay ?? 0) + ($insuranceAmount ?? 0), 2)
            : null;

        return [
            'available' => $reasons === [] && $rate !== null,
            'reasons' => $reasons,
            'total_periods' => $periods,
            'rate' => $rate,
            'rate_per_period' => $ratePerPeriod,
            'deposit_amount' => $deposit,
            'base_amount' => $base,
            'one_way_fee_amount' => $oneWay,
            'insurance_amount' => $insuranceAmount,
            'total_amount' => $total,
            'min_periods' => $rate?->min_periods !== null ? (int) $rate->min_periods : null,
        ];
    }

    /**
     * Create an HQ-style Pending Reserved hold (vehicle reserved until TTL / payment).
     *
     * @param  array<string, mixed>  $input
     */
    public function create(string $bookerPhone, array $input, string $channel = Rental::CHANNEL_MOBILE): Rental
    {
        if (! in_array($channel, Rental::passengerChannels(), true)) {
            throw ValidationException::withMessages([
                'channel' => __('rental.public.not_passenger_channel'),
            ]);
        }

        $quote = $this->quote($input);

        if (! $quote['available'] || $quote['rate'] === null) {
            throw ValidationException::withMessages([
                'vehicle_id' => $quote['reasons'][0] ?? __('rental.public.quote_unavailable'),
            ]);
        }

        /** @var RentalRate $rate */
        $rate = $quote['rate'];
        $vehicle = Vehicle::query()->findOrFail((int) $input['vehicle_id']);
        $partner = $this->partners->resolve(
            $bookerPhone,
            $input['customer_name'] ?? null,
            $input['customer_email'] ?? null,
        );
        $this->eligibility->assertCanConfirm($partner);

        $hydrated = $this->hydrator->hydrate([
            'pickup_location_id' => $input['pickup_location_id'] ?? null,
            'return_location_id' => $input['return_location_id'] ?? null,
            'pickup_location' => $input['pickup_location'] ?? null,
            'return_location' => $input['return_location'] ?? null,
            'one_way_fee_amount' => $input['one_way_fee_amount'] ?? null,
        ]);

        $periods = $quote['total_periods'];
        $ratePerPeriod = (float) $rate->rate_per_period;
        $baseAmount = round($ratePerPeriod * $periods, 2);
        $reservedUntil = $this->policy->reservedUntilTimestamp();

        $created = DB::transaction(function () use ($input, $vehicle, $partner, $bookerPhone, $rate, $hydrated, $periods, $ratePerPeriod, $baseAmount, $reservedUntil, $channel): Rental {
            $rental = Rental::query()->create([
                'code' => Rental::nextCode(),
                'channel' => $channel,
                'public_token' => Str::random(40),
                'booker_phone' => $bookerPhone,
                'vehicle_id' => $vehicle->id,
                'partner_id' => $partner->id,
                'status' => Rental::STATUS_PENDING_RESERVED,
                'reserved_until' => $reservedUntil,
                'start_date' => $input['start_date'],
                'end_date' => $input['end_date'],
                'period_type' => $input['period_type'],
                'rate_per_period' => $ratePerPeriod,
                'km_limit_per_period' => $rate->km_limit_per_period,
                'excess_km_rate' => $rate->excess_km_rate,
                'late_fee_per_day' => $rate->late_fee_per_day,
                'deposit_amount' => (float) ($quote['deposit_amount'] ?? 0),
                'deposit_status' => Rental::DEPOSIT_HELD,
                'total_periods' => $periods,
                'base_amount' => $baseAmount,
                'total_amount' => $baseAmount,
                'pickup_location_id' => $hydrated['pickup_location_id'] ?? null,
                'return_location_id' => $hydrated['return_location_id'] ?? null,
                'pickup_fleet_base_id' => $hydrated['pickup_fleet_base_id'] ?? null,
                'return_fleet_base_id' => $hydrated['return_fleet_base_id'] ?? null,
                'pickup_location' => $hydrated['pickup_location'] ?? ($input['pickup_location'] ?? null),
                'return_location' => $hydrated['return_location'] ?? ($input['return_location'] ?? null),
                'one_way_fee_amount' => $hydrated['one_way_fee_amount'] ?? null,
                'insurance_package_id' => $input['insurance_package_id'] ?? null,
                'fuel_policy_notes' => $input['fuel_policy_notes'] ?? null,
                'notes' => $input['notes'] ?? null,
            ]);

            $availability = Rental::vehicleAvailabilityReasons(
                $vehicle,
                $rental->start_date->toDateString(),
                $rental->end_date->toDateString(),
                $rental->id,
            );

            if ($availability !== []) {
                throw ValidationException::withMessages([
                    'vehicle_id' => $availability[0],
                ]);
            }

            return $rental->fresh(['vehicle', 'partner', 'insurancePackage', 'pickupLocation', 'returnLocation']);
        });

        if ($created->status === Rental::STATUS_PENDING_RESERVED) {
            $this->mailer->notify(
                $created->loadMissing(['vehicle', 'partner']),
                RentalLifecycleMailNotification::EVENT_BOOKED,
            );
        }

        return $created;
    }

    public function cancel(Rental $rental, string $reason): Rental
    {
        if (! in_array((string) $rental->channel, Rental::passengerChannels(), true)) {
            throw ValidationException::withMessages([
                'booking' => __('rental.public.not_passenger_channel'),
            ]);
        }

        $assessment = $this->policy->passengerCancelAssessment($rental);

        if (! $assessment['can_cancel']) {
            throw ValidationException::withMessages([
                'booking' => $assessment['reason'] ?? __('rental.public.cancel_not_allowed'),
            ]);
        }

        $this->expirePendingDepositCharges($rental);

        $cancelled = $this->confirmation->cancel(
            $rental,
            $reason,
            chargeFee: (bool) $assessment['charge_fee'],
        );

        $this->mailer->notify(
            $cancelled->loadMissing(['vehicle', 'partner']),
            RentalLifecycleMailNotification::EVENT_CANCELLED,
            [
                'fee_amount' => (float) $assessment['fee_amount'],
            ],
        );

        return $cancelled->fresh(['vehicle', 'partner', 'insurancePackage', 'pickupLocation', 'returnLocation']);
    }

    private function expirePendingDepositCharges(Rental $rental): void
    {
        if (! class_exists(\Modules\Receivables\Models\GatewayCharge::class)) {
            return;
        }

        if (! Modules::available('receivables') || ! Schema::hasTable('gateway_charges')) {
            return;
        }

        \Modules\Receivables\Models\GatewayCharge::query()
            ->where('rental_id', $rental->id)
            ->where('purpose', \Modules\Receivables\Models\GatewayCharge::PURPOSE_RENTAL_DEPOSIT)
            ->where('status', \Modules\Receivables\Models\GatewayCharge::STATUS_PENDING)
            ->update(['status' => \Modules\Receivables\Models\GatewayCharge::STATUS_CANCELLED]);
    }
}
