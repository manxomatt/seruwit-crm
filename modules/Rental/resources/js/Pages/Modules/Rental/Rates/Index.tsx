import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const formatMoney = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

interface Vehicle { id: number; name: string; plate_number: string; type: string; }
interface Rate { id: number; name: string; period_type: string; rate_per_period: string; km_limit_per_period: number | null; excess_km_rate: string | null; deposit_amount: string; is_active: boolean; notes: string | null; vehicle: Vehicle | null; vehicle_type: string | null; }

interface Props { rates: Rate[]; vehicles: Vehicle[]; }

type FormData = { vehicle_id: string; vehicle_type: string; name: string; period_type: string; rate_per_period: string; km_limit_per_period: string; excess_km_rate: string; deposit_amount: string; is_active: boolean; notes: string; };

const emptyForm: FormData = { vehicle_id: '', vehicle_type: '', name: '', period_type: 'daily', rate_per_period: '', km_limit_per_period: '', excess_km_rate: '', deposit_amount: '', is_active: true, notes: '' };

const selectCls = 'mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

export default function RatesIndex({ rates, vehicles }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Rate | null>(null);

    const createForm = useForm<FormData>(emptyForm);
    const editForm = useForm<FormData>(emptyForm);

    const openEdit = (rate: Rate) => {
        setEditing(rate);
        editForm.setData({
            vehicle_id: String(rate.vehicle?.id ?? ''),
            vehicle_type: rate.vehicle_type ?? '',
            name: rate.name,
            period_type: rate.period_type,
            rate_per_period: rate.rate_per_period,
            km_limit_per_period: String(rate.km_limit_per_period ?? ''),
            excess_km_rate: rate.excess_km_rate ?? '',
            deposit_amount: rate.deposit_amount,
            is_active: rate.is_active,
            notes: rate.notes ?? '',
        });
    };

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(prefixedRoute('rental.rates.store'), { onSuccess: () => { setShowCreate(false); createForm.reset(); } });
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editing) return;
        editForm.patch(prefixedRoute('rental.rates.update', editing.id), { onSuccess: () => setEditing(null) });
    };

    const RateForm = ({ form, onSubmit, label }: { form: ReturnType<typeof useForm<FormData>>; onSubmit: FormEventHandler; label: string }) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="name" value={`${t('rental.fields.rate_name')} *`} />
                    <TextInput id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1 w-full" />
                    <InputError message={form.errors.name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="period_type" value={`${t('rental.fields.period_type')} *`} />
                    <select id="period_type" value={form.data.period_type} onChange={(e) => form.setData('period_type', e.target.value)} className={selectCls}>
                        {PERIOD_TYPES.map((type) => (
                            <option key={type} value={type}>{t(`rental.period_type.${type}`, undefined, type)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel htmlFor="vehicle_id" value={t('rental.fields.specific_vehicle')} />
                    <select id="vehicle_id" value={form.data.vehicle_id} onChange={(e) => form.setData('vehicle_id', e.target.value)} className={selectCls}>
                        <option value="">{t('rental.placeholders.any_vehicle')}</option>
                        {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
                <div>
                    <InputLabel htmlFor="vehicle_type" value={t('rental.fields.vehicle_type')} />
                    <TextInput id="vehicle_type" placeholder={t('rental.placeholders.vehicle_type')} value={form.data.vehicle_type} onChange={(e) => form.setData('vehicle_type', e.target.value)} className="mt-1 w-full" />
                </div>
                <div>
                    <InputLabel htmlFor="rate_per_period" value={`${t('rental.fields.rate_per_period')} *`} />
                    <TextInput id="rate_per_period" type="number" min="0" value={form.data.rate_per_period} onChange={(e) => form.setData('rate_per_period', e.target.value)} className="mt-1 w-full" />
                    <InputError message={form.errors.rate_per_period} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="deposit_amount" value={t('rental.fields.deposit')} />
                    <TextInput id="deposit_amount" type="number" min="0" value={form.data.deposit_amount} onChange={(e) => form.setData('deposit_amount', e.target.value)} className="mt-1 w-full" />
                </div>
                <div>
                    <InputLabel htmlFor="km_limit" value={t('rental.fields.km_limit')} />
                    <TextInput id="km_limit" type="number" min="0" value={form.data.km_limit_per_period} onChange={(e) => form.setData('km_limit_per_period', e.target.value)} className="mt-1 w-full" />
                </div>
                <div>
                    <InputLabel htmlFor="excess_km_rate" value={t('rental.fields.excess_km_rate')} />
                    <TextInput id="excess_km_rate" type="number" min="0" value={form.data.excess_km_rate} onChange={(e) => form.setData('excess_km_rate', e.target.value)} className="mt-1 w-full" />
                </div>
                <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded" />
                        {t('rental.fields.rate_active')}
                    </label>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <SecondaryButton type="button" onClick={() => { setShowCreate(false); setEditing(null); }}>{t('common.cancel')}</SecondaryButton>
                <PrimaryButton disabled={form.processing}>{label}</PrimaryButton>
            </div>
        </form>
    );

    return (
        <DynamicLayout header={t('rental.pages.index.head')}>
            <Head title={t('rental.pages.rates.head')} />
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <Link href={prefixedRoute('rental.index')} className="mb-1 block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">{t('rental.nav.back_to_list')}</Link>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('rental.pages.rates.title')}</h1>
                    </div>
                    <PrimaryButton onClick={() => setShowCreate(true)}>{t('rental.actions.new_rate')}</PrimaryButton>
                </div>

                {showCreate && (
                    <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-900/20">
                        <h2 className="mb-4 text-sm font-semibold text-indigo-700 dark:text-indigo-300">{t('rental.pages.rates.new')}</h2>
                        <RateForm form={createForm} onSubmit={submitCreate} label={t('rental.actions.create_rate')} />
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {[t('rental.fields.rate_name'), t('rental.fields.applies_to'), t('rental.fields.period'), t('rental.fields.rate'), t('rental.fields.km_limit'), t('rental.fields.deposit'), t('rental.fields.status'), ''].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {rates.length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">{t('rental.pages.rates.empty')}</td></tr>
                            )}
                            {rates.map((rate) => (
                                <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{rate.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                        {rate.vehicle ? rate.vehicle.name : rate.vehicle_type ? t('rental.rates.type_prefix', { type: rate.vehicle_type }) : t('rental.rates.all_vehicles')}
                                    </td>
                                    <td className="px-4 py-3 text-sm capitalize text-gray-600 dark:text-gray-300">{t(`rental.period_type.${rate.period_type}`, undefined, rate.period_type)}</td>
                                    <td className="px-4 py-3 text-sm tabular-nums text-gray-900 dark:text-white">{formatMoney(rate.rate_per_period)}</td>
                                    <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">
                                        {rate.km_limit_per_period ? t('rental.rates.km', { km: rate.km_limit_per_period }) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{formatMoney(rate.deposit_amount)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${rate.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {rate.is_active ? t('rental.status.active') : t('rental.status.inactive')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-3 text-sm">
                                            <button onClick={() => openEdit(rate)} className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">{t('common.edit')}</button>
                                            <button onClick={() => router.delete(prefixedRoute('rental.rates.destroy', rate.id), { preserveScroll: true })} className="font-medium text-red-500 hover:text-red-700">{t('common.delete')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={!!editing} onClose={() => setEditing(null)}>
                <div className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.pages.rates.edit')}</h2>
                    <RateForm form={editForm} onSubmit={submitEdit} label={t('common.save')} />
                </div>
            </Modal>
        </DynamicLayout>
    );
}
