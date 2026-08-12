import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { clearWizardDraft, readWizardDraft, wizardStorageKey, writeWizardDraft } from './wizardDraft';

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
    /** When true (e.g. Availability prefill), skip restoring a previous draft. */
    skipDraftRestore?: boolean;
    /** Step to start on (e.g. 3 when coming from the Availability board with a pre-filled vehicle). */
    initialStep?: WizardStep;
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
    skipDraftRestore = false,
    initialStep = 1,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const storageKey = wizardStorageKey(mode, excludeRentalId);

    // Hydrate once from sessionStorage on mount.
    const restored = useMemo(
        () => (skipDraftRestore ? null : readWizardDraft(storageKey, initial)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const [step, setStep] = useState<WizardStep>(restored?.step ?? initialStep);
    const [partners, setPartners] = useState(initialPartners);
    const [available, setAvailable] = useState<AvailableVehicle[]>([]);
    const [vehiclesMeta, setVehiclesMeta] = useState<AvailableVehiclesMeta | null>(null);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);
    const [vehiclesError, setVehiclesError] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<AvailableVehicle | null>(null);
    const [quote, setQuote] = useState<ServerQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);

    const { data, setData, post, patch, processing, errors, transform } = useForm<ReservationFormData>(
        restored?.data ?? initial,
    );

    useEffect(() => {
        writeWizardDraft(storageKey, { step, data });
    }, [storageKey, step, data]);

    const discardDraft = useCallback((): void => {
        clearWizardDraft(storageKey);
    }, [storageKey]);


    const isOneWay =
        data.pickup_location_id !== '' &&
        data.return_location_id !== '' &&
        data.pickup_location_id !== data.return_location_id;

    const applyLocation = (field: 'pickup' | 'return', locationId: string): void => {
        const location = locations.find((item) => String(item.id) === locationId);
        const address = location
            ? [location.address, location.city, location.province, location.zip].filter(Boolean).join(', ') || location.name
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

    const selectVehicle = useCallback((vehicle: AvailableVehicle): void => {
        setSelectedVehicle(vehicle);
        if (! vehicle.rate) {
            return;
        }

        setData((current) => ({
            ...current,
            vehicle_id: String(vehicle.id),
            rate_per_period: String(vehicle.rate!.rate_per_period),
            km_limit_per_period: vehicle.rate!.km_limit_per_period?.toString() ?? '',
            excess_km_rate: vehicle.rate!.excess_km_rate?.toString() ?? '',
            late_fee_per_day: vehicle.rate!.late_fee_per_day?.toString() ?? '',
            deposit_amount: String(vehicle.rate!.deposit_amount),
        }));
    }, [setData]);

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
        } catch {
            setAvailable([]);
            setVehiclesMeta(null);
            setVehiclesError(t('rental.wizard.vehicles_load_failed'));
        } finally {
            setVehiclesLoading(false);
        }
    }, [
        availableVehiclesUrl,
        data.end_date,
        data.period_type,
        data.start_date,
        excludeRentalId,
        t,
    ]);

    const vehicleDatesRef = useRef<string | null>(null);

    useEffect(() => {
        if (step < 2) {
            vehicleDatesRef.current = null;

            return;
        }

        const datesKey = `${data.start_date}|${data.end_date}|${data.period_type}`;
        if (datesKey === vehicleDatesRef.current) {
            return;
        }

        vehicleDatesRef.current = datesKey;
        void loadAvailableVehicles();
    }, [step, loadAvailableVehicles, data.start_date, data.end_date, data.period_type]);

    // Keep selection in sync with the loaded list without re-fetching on every pick.
    useEffect(() => {
        if (! data.vehicle_id) {
            setSelectedVehicle(null);

            return;
        }

        const match = available.find((vehicle) => String(vehicle.id) === data.vehicle_id) ?? null;

        if (match && ! data.rate_per_period && match.rate) {
            // Auto-populate rate fields for pre-filled vehicle (e.g. from Availability board).
            selectVehicle(match);
        } else {
            setSelectedVehicle(match);
        }

        if (available.length > 0 && ! match) {
            clearVehicleSelection();
        }
    }, [available, clearVehicleSelection, data.vehicle_id, data.rate_per_period, selectVehicle]);

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
                }),
            });

            if (!response.ok) {
                throw new Error('failed');
            }

            const payload = (await response.json()) as { quote: ServerQuote };
            setQuote(payload.quote);
        } catch {
            setQuote(null);
            setQuoteError(t('rental.wizard.quote_failed'));
        } finally {
            setQuoteLoading(false);
        }
    }, [
        data.vehicle_id,
        data.start_date,
        data.end_date,
        data.period_type,
        data.pickup_location_id,
        data.return_location_id,
        data.one_way_fee_amount,
        data.insurance_package_id,
        excludeRentalId,
        quoteUrl,
        t,
    ]);

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

        return !quoteLoading && quote?.available === true;
    }, [data.end_date, data.partner_id, data.period_type, data.rate_per_period, data.start_date, data.vehicle_id, quote, quoteLoading, step]);

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
            patch(submitUrl, { onSuccess: discardDraft });
        } else {
            post(submitUrl, { onSuccess: discardDraft });
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
                        selectedVehicle={selectedVehicle}
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
                        selectedVehicle={selectedVehicle}
                        drivers={drivers}
                        insurancePackages={insurancePackages}
                        isOneWay={isOneWay}
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
                        drivers={drivers}
                        insurancePackages={insurancePackages}
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
                        <Link href={cancelUrl || prefixedRoute('rental.index')} onClick={discardDraft}>
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
                        <PrimaryButton type="submit" disabled={processing || !canNext || quoteLoading}>
                            {mode === 'edit' ? t('rental.wizard.save_reservation') : t('rental.wizard.create_reservation')}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </form>
    );
}
