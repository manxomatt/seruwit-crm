import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import WizardStepper from './WizardStepper';
import StepConfirm from './steps/StepConfirm';
import StepCustomer from './steps/StepCustomer';
import StepDates from './steps/StepDates';
import StepExtras from './steps/StepExtras';
import StepVehicles from './steps/StepVehicles';
import type {
    AvailableVehicle,
    AvailableVehiclesMeta,
    DriverOption,
    InsurancePackage,
    LocationOption,
    PartnerOption,
    ReservationFormData,
    ServerQuote,
    WizardStep,
} from './types';
import { csrfToken } from './types';

interface Props {
    mode: 'create' | 'edit';
    initial: ReservationFormData;
    partners: PartnerOption[];
    drivers: DriverOption[];
    locations: LocationOption[];
    insurancePackages: InsurancePackage[];
    defaultOneWayFee: number;
    availableVehiclesUrl: string;
    quoteUrl: string;
    walkInUrl: string;
    submitUrl: string;
    cancelUrl: string;
    excludeRentalId?: number | null;
}

export default function ReservationForm({
    mode,
    initial,
    partners: initialPartners,
    drivers,
    locations,
    insurancePackages,
    defaultOneWayFee,
    availableVehiclesUrl,
    quoteUrl,
    walkInUrl,
    submitUrl,
    cancelUrl,
    excludeRentalId = null,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [step, setStep] = useState<WizardStep>(1);
    const [partners, setPartners] = useState(initialPartners);
    const [available, setAvailable] = useState<AvailableVehicle[]>([]);
    const [vehiclesMeta, setVehiclesMeta] = useState<AvailableVehiclesMeta | null>(null);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);
    const [vehiclesError, setVehiclesError] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<AvailableVehicle | null>(null);
    const [quote, setQuote] = useState<ServerQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);

    const { data, setData, post, put, processing, errors, transform } = useForm<ReservationFormData>(initial);

    const isOneWay =
        data.pickup_location_id !== '' &&
        data.return_location_id !== '' &&
        data.pickup_location_id !== data.return_location_id;

    const applyLocation = (field: 'pickup' | 'return', locationId: string): void => {
        const location = locations.find((item) => String(item.id) === locationId);
        const address = location
            ? [location.address, location.city].filter(Boolean).join(', ') || location.name
            : '';

        if (field === 'pickup') {
            setData((current) => ({
                ...current,
                pickup_location_id: locationId,
                pickup_location: locationId ? address : current.pickup_location,
                one_way_fee_amount:
                    locationId && current.return_location_id && locationId !== current.return_location_id
                        ? current.one_way_fee_amount || String(defaultOneWayFee)
                        : locationId === current.return_location_id
                          ? ''
                          : current.one_way_fee_amount,
            }));
            return;
        }

        setData((current) => ({
            ...current,
            return_location_id: locationId,
            return_location: locationId ? address : current.return_location,
            one_way_fee_amount:
                locationId && current.pickup_location_id && locationId !== current.pickup_location_id
                    ? current.one_way_fee_amount || String(defaultOneWayFee)
                    : locationId === current.pickup_location_id
                      ? ''
                      : current.one_way_fee_amount,
        }));
    };

    const clearVehicleSelection = useCallback((): void => {
        setSelectedVehicle(null);
        setData((current) => ({
            ...current,
            vehicle_id: '',
            rate_per_period: '',
            km_limit_per_period: '',
            excess_km_rate: '',
            late_fee_per_day: '',
            deposit_amount: '',
        }));
    }, [setData]);

    const loadAvailableVehicles = useCallback(async (): Promise<void> => {
        if (!data.start_date || !data.end_date || !data.period_type) {
            return;
        }

        setVehiclesLoading(true);
        setVehiclesError(null);

        const params = new URLSearchParams({
            start_date: data.start_date,
            end_date: data.end_date,
            period_type: data.period_type,
        });
        if (excludeRentalId) {
            params.set('exclude_rental_id', String(excludeRentalId));
        }

        try {
            const response = await fetch(`${availableVehiclesUrl}?${params.toString()}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                throw new Error('failed');
            }
            const payload = (await response.json()) as {
                vehicles: AvailableVehicle[];
                meta: AvailableVehiclesMeta;
            };
            setAvailable(payload.vehicles);
            setVehiclesMeta(payload.meta);
            if (data.vehicle_id) {
                const match = payload.vehicles.find((v) => String(v.id) === data.vehicle_id) ?? null;
                setSelectedVehicle(match);
                if (!match) {
                    clearVehicleSelection();
                }
            }
        } catch {
            setAvailable([]);
            setVehiclesMeta(null);
            setVehiclesError(t('rental.wizard.vehicles_load_failed'));
        } finally {
            setVehiclesLoading(false);
        }
    }, [
        availableVehiclesUrl,
        clearVehicleSelection,
        data.end_date,
        data.period_type,
        data.start_date,
        data.vehicle_id,
        excludeRentalId,
        t,
    ]);

    useEffect(() => {
        if (step === 2) {
            void loadAvailableVehicles();
        }
    }, [step, loadAvailableVehicles]);

    const loadQuote = useCallback(async (): Promise<void> => {
        if (!data.vehicle_id || !data.start_date || !data.end_date || !data.period_type) {
            return;
        }

        setQuoteLoading(true);
        setQuoteError(null);

        try {
            const response = await fetch(quoteUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    vehicle_id: Number(data.vehicle_id),
                    start_date: data.start_date,
                    end_date: data.end_date,
                    period_type: data.period_type,
                    pickup_location_id: data.pickup_location_id || null,
                    return_location_id: data.return_location_id || null,
                    one_way_fee_amount: data.one_way_fee_amount || null,
                    insurance_package_id: data.insurance_package_id || null,
                    exclude_rental_id: excludeRentalId,
                    rate_per_period: data.rate_per_period || null,
                    deposit_amount: data.deposit_amount || null,
                }),
            });

            if (!response.ok) {
                throw new Error('failed');
            }

            const payload = (await response.json()) as { quote: ServerQuote };
            setQuote(payload.quote);

            if (payload.quote.rate_per_period != null) {
                setData((current) => ({
                    ...current,
                    rate_per_period: String(payload.quote.rate_per_period),
                    deposit_amount: String(payload.quote.deposit_amount ?? current.deposit_amount),
                    km_limit_per_period:
                        payload.quote.rate?.km_limit_per_period != null
                            ? String(payload.quote.rate.km_limit_per_period)
                            : current.km_limit_per_period,
                    excess_km_rate:
                        payload.quote.rate?.excess_km_rate != null
                            ? String(payload.quote.rate.excess_km_rate)
                            : current.excess_km_rate,
                    late_fee_per_day:
                        payload.quote.rate?.late_fee_per_day != null
                            ? String(payload.quote.rate.late_fee_per_day)
                            : current.late_fee_per_day,
                    one_way_fee_amount:
                        payload.quote.one_way_fee_amount != null && payload.quote.one_way_fee_amount > 0
                            ? String(payload.quote.one_way_fee_amount)
                            : current.one_way_fee_amount,
                }));
            }
        } catch {
            setQuote(null);
            setQuoteError(t('rental.wizard.quote_failed'));
        } finally {
            setQuoteLoading(false);
        }
    }, [data, excludeRentalId, quoteUrl, setData, t]);

    useEffect(() => {
        if (step === 5) {
            void loadQuote();
        }
    }, [step, loadQuote]);

    const canNext = useMemo((): boolean => {
        if (step === 1) {
            return Boolean(data.start_date && data.end_date && data.period_type && data.end_date >= data.start_date);
        }
        if (step === 2) {
            return Boolean(data.vehicle_id && data.rate_per_period);
        }
        if (step === 3) {
            return true;
        }
        if (step === 4) {
            return Boolean(data.partner_id);
        }
        return quote?.available === true;
    }, [data, quote, step]);

    const selectVehicle = (vehicle: AvailableVehicle): void => {
        setSelectedVehicle(vehicle);
        if (vehicle.rate) {
            setData((current) => ({
                ...current,
                vehicle_id: String(vehicle.id),
                period_type: vehicle.rate!.period_type || current.period_type,
                rate_per_period: String(vehicle.rate!.rate_per_period),
                km_limit_per_period: vehicle.rate!.km_limit_per_period?.toString() ?? '',
                excess_km_rate: vehicle.rate!.excess_km_rate?.toString() ?? '',
                late_fee_per_day: vehicle.rate!.late_fee_per_day?.toString() ?? '',
                deposit_amount: String(vehicle.rate!.deposit_amount),
            }));
            return;
        }

        setData((current) => ({
            ...current,
            vehicle_id: String(vehicle.id),
            rate_per_period: '',
            km_limit_per_period: '',
            excess_km_rate: '',
            late_fee_per_day: '',
            deposit_amount: '',
        }));
    };

    const goNext = (): void => {
        if (step < 5 && canNext) {
            if (step === 1) {
                // Changing dates invalidates vehicle until Step 2 reloads.
                setAvailable([]);
            }
            setStep((s) => (s + 1) as WizardStep);
        }
    };

    const goBack = (): void => {
        if (step > 1) {
            setStep((s) => (s - 1) as WizardStep);
        }
    };

    const fieldStep = (field: string): WizardStep => {
        if (['start_date', 'end_date', 'period_type', 'pickup_location_id', 'return_location_id', 'pickup_location', 'return_location'].includes(field)) {
            return 1;
        }
        if (['vehicle_id', 'rate_per_period', 'deposit_amount'].includes(field)) {
            return 2;
        }
        if (['driver_id', 'insurance_package_id', 'one_way_fee_amount', 'fuel_policy_notes', 'notes'].includes(field)) {
            return 3;
        }
        if (field === 'partner_id') {
            return 4;
        }
        return 5;
    };

    useEffect(() => {
        const keys = Object.keys(errors);
        if (keys.length === 0) {
            return;
        }
        setStep(fieldStep(keys[0]));
    }, [errors]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (step !== 5 || !canNext) {
            return;
        }

        transform((form) => ({
            ...form,
            driver_id: form.driver_id || null,
            km_limit_per_period: form.km_limit_per_period || null,
            excess_km_rate: form.excess_km_rate || null,
            late_fee_per_day: form.late_fee_per_day || null,
            deposit_amount: form.deposit_amount || 0,
            pickup_location_id: form.pickup_location_id || null,
            return_location_id: form.return_location_id || null,
            one_way_fee_amount: form.one_way_fee_amount || null,
            insurance_package_id: form.insurance_package_id || null,
        }));

        if (mode === 'edit') {
            put(submitUrl);
        } else {
            post(submitUrl);
        }
    };

    // When dates change after a vehicle was chosen, clear selection so Step 2 revalidates.
    useEffect(() => {
        if (step === 1 && data.vehicle_id) {
            // keep selection until they leave step 1; cleared when loading vehicles if unavailable
        }
    }, [data.start_date, data.end_date, data.period_type, data.vehicle_id, step]);

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                <WizardStepper step={step} onStepClick={setStep} />

                {step === 1 && (
                    <StepDates
                        data={data}
                        setData={setData}
                        errors={errors}
                        locations={locations}
                        defaultOneWayFee={defaultOneWayFee}
                        onApplyLocation={applyLocation}
                    />
                )}
                {step === 2 && (
                    <StepVehicles
                        data={data}
                        setData={setData}
                        errors={errors}
                        vehicles={available}
                        meta={vehiclesMeta}
                        loading={vehiclesLoading}
                        loadError={vehiclesError}
                        onSelect={selectVehicle}
                    />
                )}
                {step === 3 && (
                    <StepExtras
                        data={data}
                        setData={setData}
                        errors={errors}
                        drivers={drivers}
                        insurancePackages={insurancePackages}
                        isOneWay={isOneWay}
                    />
                )}
                {step === 4 && (
                    <StepCustomer
                        data={data}
                        setData={setData}
                        errors={errors}
                        partners={partners}
                        setPartners={setPartners}
                        walkInUrl={walkInUrl}
                    />
                )}
                {step === 5 && (
                    <StepConfirm
                        data={data}
                        quote={quote}
                        quoteLoading={quoteLoading}
                        quoteError={quoteError}
                        selectedVehicle={selectedVehicle}
                        partners={partners}
                    />
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    {step > 1 ? (
                        <SecondaryButton type="button" onClick={goBack}>
                            {t('rental.wizard.back')}
                        </SecondaryButton>
                    ) : (
                        <Link href={cancelUrl || prefixedRoute('rental.index')}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                    )}
                </div>
                <div className="flex gap-3">
                    {step < 5 ? (
                        <PrimaryButton type="button" onClick={goNext} disabled={!canNext}>
                            {t('rental.wizard.next')}
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton disabled={processing || !canNext || quoteLoading}>
                            {mode === 'edit' ? t('rental.wizard.save_reservation') : t('rental.wizard.create_reservation')}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </form>
    );
}
