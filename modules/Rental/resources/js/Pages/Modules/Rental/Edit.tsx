import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import RentalNav from '../../../RentalNav';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
}

interface Driver {
    id: number;
    name: string;
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

interface Rental {
    id: number;
    code: string;
    vehicle_id: number;
    driver_id: number | null;
    partner_id: number;
    start_date: string;
    end_date: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: number | null;
    excess_km_rate: string | null;
    late_fee_per_day: string | null;
    deposit_amount: string;
    pickup_location: string | null;
    return_location: string | null;
    fuel_policy_notes: string | null;
    notes: string | null;
}

interface Props {
    rental: Rental;
    vehicles: Vehicle[];
    drivers: Driver[];
    partners: Partner[];
    rates: Rate[];
}

const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

export default function Edit({ rental, vehicles, drivers, partners, rates }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        vehicle_id: String(rental.vehicle_id),
        driver_id: String(rental.driver_id ?? ''),
        partner_id: String(rental.partner_id),
        start_date: rental.start_date,
        end_date: rental.end_date,
        period_type: rental.period_type,
        rate_per_period: rental.rate_per_period,
        km_limit_per_period: String(rental.km_limit_per_period ?? ''),
        excess_km_rate: rental.excess_km_rate ?? '',
        late_fee_per_day: rental.late_fee_per_day ?? '',
        deposit_amount: rental.deposit_amount,
        pickup_location: rental.pickup_location ?? '',
        return_location: rental.return_location ?? '',
        fuel_policy_notes: rental.fuel_policy_notes ?? '',
        notes: rental.notes ?? '',
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
            { value: '', label: t('rental.placeholders.apply_rate_short') },
            ...rates.map((r) => ({ value: String(r.id), label: r.name })),
        ],
        [rates, t],
    );
    const periodOptions = useMemo(
        () => PERIOD_TYPES.map((type) => ({ value: type, label: t(`rental.period_type.${type}`, undefined, type) })),
        [t],
    );

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
        patch(prefixedRoute('rental.update', rental.id));
    };

    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {t('rental.pages.edit.title', { code: rental.code })}
                </h2>
            }
        >
            <Head title={t('rental.pages.edit.title', { code: rental.code })} />

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
                            <InputLabel htmlFor="driver_id" value={t('rental.fields.driver')} />
                            <Select
                                id="driver_id"
                                className="mt-1"
                                value={data.driver_id}
                                onChange={(value) => setData('driver_id', value)}
                                placeholder={t('rental.placeholders.no_driver')}
                                options={driverOptions}
                            />
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
                                className="min-w-[12rem]"
                                value=""
                                onChange={applyRate}
                                placeholder={t('rental.placeholders.apply_rate_short')}
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
                        </div>
                        <div>
                            <InputLabel htmlFor="rate_per_period" value={`${t('rental.fields.rate_per_period')} *`} />
                            <TextInput
                                id="rate_per_period"
                                type="number"
                                min="0"
                                value={data.rate_per_period}
                                onChange={(e) => setData('rate_per_period', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.rate_per_period} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="km_limit" value={t('rental.fields.km_limit')} />
                            <TextInput
                                id="km_limit"
                                type="number"
                                min="0"
                                value={data.km_limit_per_period}
                                onChange={(e) => setData('km_limit_per_period', e.target.value)}
                                className="mt-1 w-full"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="excess_km_rate" value={t('rental.fields.excess_km_rate')} />
                            <TextInput
                                id="excess_km_rate"
                                type="number"
                                min="0"
                                value={data.excess_km_rate}
                                onChange={(e) => setData('excess_km_rate', e.target.value)}
                                className="mt-1 w-full"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="late_fee_per_day" value={t('rental.fields.late_fee_per_day')} />
                            <TextInput
                                id="late_fee_per_day"
                                type="number"
                                min="0"
                                placeholder={t('rental.placeholders.late_fee_fallback')}
                                value={data.late_fee_per_day}
                                onChange={(e) => setData('late_fee_per_day', e.target.value)}
                                className="mt-1 w-full"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="deposit_amount" value={t('rental.fields.deposit')} />
                            <TextInput
                                id="deposit_amount"
                                type="number"
                                min="0"
                                value={data.deposit_amount}
                                onChange={(e) => setData('deposit_amount', e.target.value)}
                                className="mt-1 w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('rental.sections.locations')}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="pickup_location" value={t('rental.fields.pickup_location')} />
                            <TextInput
                                id="pickup_location"
                                value={data.pickup_location}
                                onChange={(e) => setData('pickup_location', e.target.value)}
                                className="mt-1 w-full"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="return_location" value={t('rental.fields.return_location')} />
                            <TextInput
                                id="return_location"
                                value={data.return_location}
                                onChange={(e) => setData('return_location', e.target.value)}
                                className="mt-1 w-full"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="fuel_policy_notes" value={t('rental.fields.fuel_policy_notes')} />
                            <textarea
                                id="fuel_policy_notes"
                                rows={2}
                                value={data.fuel_policy_notes}
                                onChange={(e) => setData('fuel_policy_notes', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                placeholder={t('rental.placeholders.fuel_policy')}
                            />
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
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Link href={prefixedRoute('rental.show', rental.id)}>
                        <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}
