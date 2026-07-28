import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import RentalNav from '../../../../RentalNav';

const formatMoney = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
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
    is_active: boolean;
    notes: string | null;
    vehicle: Vehicle | null;
    vehicle_type: string | null;
}

interface Props {
    rates: Rate[];
    vehicles: Vehicle[];
}

type FormData = {
    vehicle_id: string;
    vehicle_type: string;
    name: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: string;
    excess_km_rate: string;
    late_fee_per_day: string;
    deposit_amount: string;
    is_active: boolean;
    notes: string;
};

const emptyForm: FormData = {
    vehicle_id: '',
    vehicle_type: '',
    name: '',
    period_type: 'daily',
    rate_per_period: '',
    km_limit_per_period: '',
    excess_km_rate: '',
    late_fee_per_day: '',
    deposit_amount: '',
    is_active: true,
    notes: '',
};

const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

export default function RatesIndex({ rates, vehicles }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Rate | null>(null);
    const [rateToDelete, setRateToDelete] = useState<Rate | null>(null);
    const [deleting, setDeleting] = useState(false);

    const createForm = useForm<FormData>(emptyForm);
    const editForm = useForm<FormData>(emptyForm);

    const periodOptions = useMemo(
        () => PERIOD_TYPES.map((type) => ({ value: type, label: t(`rental.period_type.${type}`, undefined, type) })),
        [t],
    );
    const vehicleOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.any_vehicle') },
            ...vehicles.map((v) => ({ value: String(v.id), label: `${v.name} (${v.plate_number})` })),
        ],
        [vehicles, t],
    );

    const openEdit = (rate: Rate): void => {
        setEditing(rate);
        editForm.setData({
            vehicle_id: String(rate.vehicle?.id ?? ''),
            vehicle_type: rate.vehicle_type ?? '',
            name: rate.name,
            period_type: rate.period_type,
            rate_per_period: rate.rate_per_period,
            km_limit_per_period: String(rate.km_limit_per_period ?? ''),
            excess_km_rate: rate.excess_km_rate ?? '',
            late_fee_per_day: rate.late_fee_per_day ?? '',
            deposit_amount: rate.deposit_amount,
            is_active: rate.is_active,
            notes: rate.notes ?? '',
        });
    };

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(prefixedRoute('rental.rates.store'), {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.patch(prefixedRoute('rental.rates.update', editing.id), {
            onSuccess: () => setEditing(null),
        });
    };

    const openDeleteDialog = (rate: Rate): void => {
        setRateToDelete(rate);
    };

    const closeDeleteDialog = (): void => {
        if (deleting) {
            return;
        }
        setRateToDelete(null);
    };

    const confirmDelete = (): void => {
        if (!rateToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(prefixedRoute('rental.rates.destroy', rateToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setRateToDelete(null);
            },
        });
    };

    const RateForm = ({
        form,
        onSubmit,
        label,
    }: {
        form: ReturnType<typeof useForm<FormData>>;
        onSubmit: FormEventHandler;
        label: string;
    }): JSX.Element => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="name" value={`${t('rental.fields.rate_name')} *`} />
                    <TextInput
                        id="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="period_type" value={`${t('rental.fields.period_type')} *`} />
                    <Select
                        id="period_type"
                        className="mt-1"
                        value={form.data.period_type}
                        onChange={(value) => form.setData('period_type', value)}
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
                        value={form.data.rate_per_period}
                        onChange={(e) => form.setData('rate_per_period', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.rate_per_period} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="deposit_amount" value={t('rental.fields.deposit')} />
                    <TextInput
                        id="deposit_amount"
                        type="number"
                        min="0"
                        value={form.data.deposit_amount}
                        onChange={(e) => form.setData('deposit_amount', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="vehicle_id" value={t('rental.fields.specific_vehicle')} />
                    <Select
                        id="vehicle_id"
                        className="mt-1"
                        value={form.data.vehicle_id}
                        onChange={(value) => form.setData('vehicle_id', value)}
                        placeholder={t('rental.placeholders.any_vehicle')}
                        options={vehicleOptions}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="vehicle_type" value={t('rental.fields.vehicle_type')} />
                    <TextInput
                        id="vehicle_type"
                        value={form.data.vehicle_type}
                        onChange={(e) => form.setData('vehicle_type', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="km_limit" value={t('rental.fields.km_limit')} />
                    <TextInput
                        id="km_limit"
                        type="number"
                        min="0"
                        value={form.data.km_limit_per_period}
                        onChange={(e) => form.setData('km_limit_per_period', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="excess_km_rate" value={t('rental.fields.excess_km_rate')} />
                    <TextInput
                        id="excess_km_rate"
                        type="number"
                        min="0"
                        value={form.data.excess_km_rate}
                        onChange={(e) => form.setData('excess_km_rate', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="late_fee_per_day" value={t('rental.fields.late_fee_per_day')} />
                    <TextInput
                        id="late_fee_per_day"
                        type="number"
                        min="0"
                        value={form.data.late_fee_per_day}
                        onChange={(e) => form.setData('late_fee_per_day', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                            className="rounded"
                        />
                        {t('rental.fields.rate_active')}
                    </label>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <SecondaryButton
                    type="button"
                    onClick={() => {
                        setShowCreate(false);
                        setEditing(null);
                    }}
                >
                    {t('common.cancel')}
                </SecondaryButton>
                <PrimaryButton disabled={form.processing}>{label}</PrimaryButton>
            </div>
        </form>
    );

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('rental.pages.rates.title')}</h2>
                    <PrimaryButton onClick={() => setShowCreate(true)}>{t('rental.actions.new_rate')}</PrimaryButton>
                </div>
            }
        >
            <Head title={t('rental.pages.rates.head')} />

            <RentalNav />

            {showCreate && (
                <div className="mb-6 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h2 className="mb-4 text-sm font-semibold text-gray-800">{t('rental.pages.rates.new')}</h2>
                    <RateForm form={createForm} onSubmit={submitCreate} label={t('rental.actions.create_rate')} />
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {[
                                t('rental.fields.rate_name'),
                                t('rental.fields.applies_to'),
                                t('rental.fields.period'),
                                t('rental.fields.rate'),
                                t('rental.fields.km_limit'),
                                t('rental.fields.deposit'),
                                t('rental.fields.status'),
                                '',
                            ].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rates.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                    {t('rental.pages.rates.empty')}
                                </td>
                            </tr>
                        )}
                        {rates.map((rate) => (
                            <tr key={rate.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{rate.name}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {rate.vehicle
                                        ? rate.vehicle.name
                                        : rate.vehicle_type
                                          ? t('rental.rates.type_prefix', { type: rate.vehicle_type })
                                          : t('rental.rates.all_vehicles')}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {t(`rental.period_type.${rate.period_type}`, undefined, rate.period_type)}
                                </td>
                                <td className="px-4 py-3 tabular-nums text-gray-900">{formatMoney(rate.rate_per_period)}</td>
                                <td className="px-4 py-3 tabular-nums text-gray-600">
                                    {rate.km_limit_per_period ? t('rental.rates.km', { km: rate.km_limit_per_period }) : '—'}
                                </td>
                                <td className="px-4 py-3 tabular-nums text-gray-600">{formatMoney(rate.deposit_amount)}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                                            rate.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {rate.is_active ? t('rental.status.active') : t('rental.status.inactive')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(rate)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                            title={t('common.edit')}
                                        >
                                            <PencilIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteDialog(rate)}
                                            className="text-red-600 hover:text-red-900"
                                            title={t('common.delete')}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal show={!!editing} onClose={() => setEditing(null)}>
                <div className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('rental.pages.rates.edit')}</h2>
                    <RateForm form={editForm} onSubmit={submitEdit} label={t('common.save')} />
                </div>
            </Modal>

            <ConfirmDeleteDialog
                show={!!rateToDelete}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={deleting}
                title={t('rental.pages.rates.delete_title')}
                message={
                    rateToDelete
                        ? t('rental.pages.rates.delete_confirm', { name: rateToDelete.name })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
