import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import MoneyInput from '@/Components/MoneyInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import RentalNav from '../../../RentalNav';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

interface Driver {
    id: number;
    name: string;
    phone: string | null;
}

interface Partner {
    id: number;
    name: string;
    code: string;
}

interface Rate {
    id: number;
    name: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: number | null;
    excess_km_rate: string | null;
    late_fee_per_day: string | null;
    deposit_amount: string;
}

interface LocationOption {
    id: number;
    code: string;
    name: string;
    address: string | null;
    city: string | null;
}

interface InsurancePackage {
    id: number;
    code: string;
    name: string;
    amount: string | number;
    deductible_amount: string | number;
    description: string | null;
}

interface Props {
    vehicles: Vehicle[];
    drivers: Driver[];
    partners: Partner[];
    rates: Rate[];
    locations?: LocationOption[];
    insurancePackages?: InsurancePackage[];
    defaultOneWayFee?: number;
}

type FormData = {
    vehicle_id: string;
    driver_id: string;
    partner_id: string;
    start_date: string;
    end_date: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: string;
    excess_km_rate: string;
    late_fee_per_day: string;
    deposit_amount: string;
    pickup_location_id: string;
    return_location_id: string;
    pickup_location: string;
    return_location: string;
    one_way_fee_amount: string;
    insurance_package_id: string;
    fuel_policy_notes: string;
    notes: string;
};

const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

function locationLabel(location: LocationOption): string {
    const address = [location.address, location.city].filter(Boolean).join(', ');
    return address ? `${location.name} — ${address}` : `${location.name} (${location.code})`;
}

export default function Create({
    vehicles,
    drivers,
    partners,
    rates,
    locations = [],
    insurancePackages = [],
    defaultOneWayFee = 150000,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm<FormData>({
        vehicle_id: '',
        driver_id: '',
        partner_id: '',
        start_date: '',
        end_date: '',
        period_type: 'daily',
        rate_per_period: '',
        km_limit_per_period: '',
        excess_km_rate: '',
        late_fee_per_day: '',
        deposit_amount: '',
        pickup_location_id: '',
        return_location_id: '',
        pickup_location: '',
        return_location: '',
        one_way_fee_amount: '',
        insurance_package_id: '',
        fuel_policy_notes: '',
        notes: '',
    });

    const partnerOptions = useMemo(
        () => partners.map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
        [partners],
    );
    const vehicleOptions = useMemo(
        () => vehicles.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.plate_number}` })),
        [vehicles],
    );
    const driverOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.no_driver') },
            ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
        ],
        [drivers, t],
    );
    const rateOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.apply_rate') },
            ...rates.map((r) => ({ value: String(r.id), label: r.name })),
        ],
        [rates, t],
    );
    const periodOptions = useMemo(
        () => PERIOD_TYPES.map((type) => ({ value: type, label: t(`rental.period_type.${type}`, undefined, type) })),
        [t],
    );
    const locationOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.select_location') },
            ...locations.map((location) => ({ value: String(location.id), label: locationLabel(location) })),
        ],
        [locations, t],
    );
    const insuranceOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.no_insurance') },
            ...insurancePackages.map((pkg) => ({
                value: String(pkg.id),
                label: `${pkg.name} — Rp ${Number(pkg.amount).toLocaleString('id-ID')}/${t('rental.period_type.day')}`,
            })),
        ],
        [insurancePackages, t],
    );

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

    const applyRate = (rateId: string): void => {
        if (!rateId) {
            return;
        }
        const rate = rates.find((r) => r.id === Number(rateId));
        if (!rate) {
            return;
        }
        setData((prev) => ({
            ...prev,
            period_type: rate.period_type,
            rate_per_period: rate.rate_per_period,
            km_limit_per_period: rate.km_limit_per_period?.toString() ?? '',
            excess_km_rate: rate.excess_km_rate ?? '',
            late_fee_per_day: rate.late_fee_per_day ?? '',
            deposit_amount: rate.deposit_amount,
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('rental.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('rental.pages.create.title')}</h2>}
        >
            <Head title={t('rental.pages.create.title')} />

            <RentalNav />

            <form onSubmit={submit} className="space-y-6">
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('rental.sections.booking')}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="partner_id" value={`${t('rental.fields.customer')} *`} />
                            <Select
                                id="partner_id"
                                className="mt-1"
                                value={data.partner_id}
                                onChange={(value) => setData('partner_id', value)}
                                placeholder={t('rental.placeholders.select_partner')}
                                options={partnerOptions}
                            />
                            <InputError message={errors.partner_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="vehicle_id" value={`${t('rental.fields.vehicle')} *`} />
                            <Select
                                id="vehicle_id"
                                className="mt-1"
                                value={data.vehicle_id}
                                onChange={(value) => setData('vehicle_id', value)}
                                placeholder={t('rental.placeholders.select_vehicle')}
                                options={vehicleOptions}
                            />
                            <InputError message={errors.vehicle_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="driver_id" value={t('rental.fields.driver_optional')} />
                            <Select
                                id="driver_id"
                                className="mt-1"
                                value={data.driver_id}
                                onChange={(value) => setData('driver_id', value)}
                                placeholder={t('rental.placeholders.no_driver')}
                                options={driverOptions}
                            />
                            <InputError message={errors.driver_id} className="mt-1" />
                        </div>
                        <div />
                        <div>
                            <InputLabel htmlFor="start_date" value={`${t('rental.fields.start_date')} *`} />
                            <TextInput
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.start_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="end_date" value={`${t('rental.fields.end_date')} *`} />
                            <TextInput
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.end_date} className="mt-1" />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t('rental.sections.pricing')}</h2>
                        {rates.length > 0 && (
                            <Select
                                className="min-w-[14rem]"
                                value=""
                                onChange={applyRate}
                                placeholder={t('rental.placeholders.apply_rate')}
                                options={rateOptions}
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="period_type" value={`${t('rental.fields.period_type')} *`} />
                            <Select
                                id="period_type"
                                className="mt-1"
                                value={data.period_type}
                                onChange={(value) => setData('period_type', value)}
                                options={periodOptions}
                                searchable={false}
                            />
                            <InputError message={errors.period_type} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="rate_per_period" value={`${t('rental.fields.rate_per_period')} *`} />
                            <MoneyInput
                                id="rate_per_period"
                                value={data.rate_per_period}
                                onChange={(value) => setData('rate_per_period', value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.rate_per_period} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="km_limit_per_period" value={t('rental.fields.km_limit')} />
                            <TextInput
                                id="km_limit_per_period"
                                type="number"
                                min="0"
                                placeholder={t('rental.placeholders.unlimited')}
                                value={data.km_limit_per_period}
                                onChange={(e) => setData('km_limit_per_period', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.km_limit_per_period} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="excess_km_rate" value={t('rental.fields.excess_km_rate')} />
                            <MoneyInput
                                id="excess_km_rate"
                                placeholder="0"
                                value={data.excess_km_rate}
                                onChange={(value) => setData('excess_km_rate', value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.excess_km_rate} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="late_fee_per_day" value={t('rental.fields.late_fee_per_day')} />
                            <MoneyInput
                                id="late_fee_per_day"
                                placeholder={t('rental.placeholders.late_fee_fallback')}
                                value={data.late_fee_per_day}
                                onChange={(value) => setData('late_fee_per_day', value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.late_fee_per_day} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="deposit_amount" value={t('rental.fields.deposit')} />
                            <MoneyInput
                                id="deposit_amount"
                                value={data.deposit_amount}
                                onChange={(value) => setData('deposit_amount', value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.deposit_amount} className="mt-1" />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('rental.sections.locations')}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="pickup_location_id" value={t('rental.fields.pickup_branch')} />
                            <Select
                                id="pickup_location_id"
                                options={locationOptions}
                                value={data.pickup_location_id}
                                onChange={(e) => applyLocation('pickup', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.pickup_location_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="return_location_id" value={t('rental.fields.return_branch')} />
                            <Select
                                id="return_location_id"
                                options={locationOptions}
                                value={data.return_location_id}
                                onChange={(e) => applyLocation('return', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.return_location_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="pickup_location" value={t('rental.fields.pickup_location')} />
                            <TextInput
                                id="pickup_location"
                                value={data.pickup_location}
                                onChange={(e) => setData('pickup_location', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.pickup_location} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="return_location" value={t('rental.fields.return_location')} />
                            <TextInput
                                id="return_location"
                                value={data.return_location}
                                onChange={(e) => setData('return_location', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.return_location} className="mt-1" />
                        </div>
                        {isOneWay && (
                            <div>
                                <InputLabel htmlFor="one_way_fee_amount" value={t('rental.fields.one_way_fee')} />
                                <MoneyInput
                                    id="one_way_fee_amount"
                                    value={data.one_way_fee_amount}
                                    onChange={(value) => setData('one_way_fee_amount', value)}
                                    className="mt-1 w-full"
                                />
                                <InputError message={errors.one_way_fee_amount} className="mt-1" />
                            </div>
                        )}
                        <div className={isOneWay ? '' : 'sm:col-span-2'}>
                            <InputLabel htmlFor="insurance_package_id" value={t('rental.fields.insurance_package')} />
                            <Select
                                id="insurance_package_id"
                                options={insuranceOptions}
                                value={data.insurance_package_id}
                                onChange={(e) => setData('insurance_package_id', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.insurance_package_id} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="fuel_policy_notes" value={t('rental.fields.fuel_policy_notes')} />
                            <textarea
                                id="fuel_policy_notes"
                                rows={2}
                                value={data.fuel_policy_notes}
                                onChange={(e) => setData('fuel_policy_notes', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder={t('rental.placeholders.fuel_policy')}
                            />
                            <InputError message={errors.fuel_policy_notes} className="mt-1" />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <InputLabel htmlFor="notes" value={t('rental.fields.notes')} />
                    <textarea
                        id="notes"
                        rows={3}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Link href={prefixedRoute('rental.index')}>
                        <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing}>{t('rental.actions.create_rental')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}
