import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Vehicle { id: number; name: string; plate_number: string; type: string; }
interface Driver { id: number; name: string; phone: string | null; }
interface Partner { id: number; name: string; code: string; }
interface Rate { id: number; name: string; period_type: string; rate_per_period: string; km_limit_per_period: number | null; excess_km_rate: string | null; deposit_amount: string; }

interface Props {
    vehicles: Vehicle[];
    drivers: Driver[];
    partners: Partner[];
    rates: Rate[];
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
    deposit_amount: string;
    notes: string;
};

const selectCls = 'mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

export default function Create({ vehicles, drivers, partners, rates }: Props): JSX.Element {
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
        deposit_amount: '',
        notes: '',
    });

    const applyRate = (rateId: string) => {
        const rate = rates.find((r) => r.id === Number(rateId));
        if (!rate) return;
        setData((prev) => ({
            ...prev,
            period_type: rate.period_type,
            rate_per_period: rate.rate_per_period,
            km_limit_per_period: rate.km_limit_per_period?.toString() ?? '',
            excess_km_rate: rate.excess_km_rate ?? '',
            deposit_amount: rate.deposit_amount,
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('rental.store'));
    };

    return (
        <DynamicLayout header={t('rental.pages.index.head')}>
            <Head title={t('rental.pages.create.title')} />
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Link href={prefixedRoute('rental.index')} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        {t('rental.nav.back_to_list')}
                    </Link>
                </div>
                <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">{t('rental.pages.create.title')}</h1>

                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('rental.sections.booking')}</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="partner_id" value={`${t('rental.fields.customer')} *`} />
                                <select id="partner_id" value={data.partner_id} onChange={(e) => setData('partner_id', e.target.value)} className={selectCls}>
                                    <option value="">{t('rental.placeholders.select_partner')}</option>
                                    {partners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                </select>
                                <InputError message={errors.partner_id} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="vehicle_id" value={`${t('rental.fields.vehicle')} *`} />
                                <select id="vehicle_id" value={data.vehicle_id} onChange={(e) => setData('vehicle_id', e.target.value)} className={selectCls}>
                                    <option value="">{t('rental.placeholders.select_vehicle')}</option>
                                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.plate_number}</option>)}
                                </select>
                                <InputError message={errors.vehicle_id} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="driver_id" value={t('rental.fields.driver_optional')} />
                                <select id="driver_id" value={data.driver_id} onChange={(e) => setData('driver_id', e.target.value)} className={selectCls}>
                                    <option value="">{t('rental.placeholders.no_driver')}</option>
                                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <InputError message={errors.driver_id} className="mt-1" />
                            </div>
                            <div />
                            <div>
                                <InputLabel htmlFor="start_date" value={`${t('rental.fields.start_date')} *`} />
                                <TextInput id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.start_date} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="end_date" value={`${t('rental.fields.end_date')} *`} />
                                <TextInput id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.end_date} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('rental.sections.pricing')}</h2>
                            {rates.length > 0 && (
                                <select
                                    onChange={(e) => applyRate(e.target.value)}
                                    defaultValue=""
                                    className="rounded-md border-gray-300 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">{t('rental.placeholders.apply_rate')}</option>
                                    {rates.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="period_type" value={`${t('rental.fields.period_type')} *`} />
                                <select id="period_type" value={data.period_type} onChange={(e) => setData('period_type', e.target.value)} className={selectCls}>
                                    {PERIOD_TYPES.map((type) => (
                                        <option key={type} value={type}>{t(`rental.period_type.${type}`, undefined, type)}</option>
                                    ))}
                                </select>
                                <InputError message={errors.period_type} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="rate_per_period" value={`${t('rental.fields.rate_per_period')} *`} />
                                <TextInput id="rate_per_period" type="number" min="0" value={data.rate_per_period} onChange={(e) => setData('rate_per_period', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.rate_per_period} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="km_limit_per_period" value={t('rental.fields.km_limit')} />
                                <TextInput id="km_limit_per_period" type="number" min="0" placeholder={t('rental.placeholders.unlimited')} value={data.km_limit_per_period} onChange={(e) => setData('km_limit_per_period', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.km_limit_per_period} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="excess_km_rate" value={t('rental.fields.excess_km_rate')} />
                                <TextInput id="excess_km_rate" type="number" min="0" placeholder="0" value={data.excess_km_rate} onChange={(e) => setData('excess_km_rate', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.excess_km_rate} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="deposit_amount" value={t('rental.fields.deposit')} />
                                <TextInput id="deposit_amount" type="number" min="0" value={data.deposit_amount} onChange={(e) => setData('deposit_amount', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.deposit_amount} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <InputLabel htmlFor="notes" value={t('rental.fields.notes')} />
                        <textarea
                            id="notes"
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={prefixedRoute('rental.index')}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton disabled={processing}>{t('rental.actions.create_rental')}</PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
