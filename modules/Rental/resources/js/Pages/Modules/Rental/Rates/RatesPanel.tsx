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
import MoneyInput from '@/Components/MoneyInput';
import { formatMoney } from '@/utils/money';
import { router, useForm, type InertiaFormProps } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';

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
    rental_class: string | null;
    valid_from: string | null;
    valid_to: string | null;
    min_periods: number | null;
    priority: number;
}

interface Props {
    rates: Rate[];
    vehicles: Vehicle[];
    rentalClasses: Array<{ value: string; label: string }>;
}

type FormData = {
    vehicle_id: string;
    vehicle_type: string;
    rental_class: string;
    name: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: string;
    excess_km_rate: string;
    late_fee_per_day: string;
    deposit_amount: string;
    is_active: boolean;
    valid_from: string;
    valid_to: string;
    min_periods: string;
    priority: string;
    notes: string;
};

const emptyForm: FormData = {
    vehicle_id: '',
    vehicle_type: '',
    rental_class: '',
    name: '',
    period_type: 'daily',
    rate_per_period: '',
    km_limit_per_period: '',
    excess_km_rate: '',
    late_fee_per_day: '',
    deposit_amount: '',
    is_active: true,
    valid_from: '',
    valid_to: '',
    min_periods: '',
    priority: '0',
    notes: '',
};

const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

interface RateFormProps {
    form: InertiaFormProps<FormData>;
    onSubmit: FormEventHandler;
    onCancel: () => void;
    label: string;
    periodOptions: Array<{ value: string; label: string }>;
    vehicleOptions: Array<{ value: string; label: string }>;
    rentalClassOptions: Array<{ value: string; label: string }>;
    labels: {
        rateName: string;
        periodType: string;
        ratePerPeriod: string;
        deposit: string;
        specificVehicle: string;
        anyVehicle: string;
        vehicleType: string;
        rentalClass: string;
        anyClass: string;
        kmLimit: string;
        excessKmRate: string;
        lateFeePerDay: string;
        validFrom: string;
        validTo: string;
        minPeriods: string;
        priority: string;
        rateActive: string;
        cancel: string;
    };
}

/**
 * Stable form component — must live outside RatesIndex so setData re-renders
 * do not remount inputs (which drops focus on every keystroke).
 */
function RateForm({
    form,
    onSubmit,
    onCancel,
    label,
    periodOptions,
    vehicleOptions,
    rentalClassOptions,
    labels,
}: RateFormProps): JSX.Element {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="name" value={`${labels.rateName} *`} />
                    <TextInput
                        id="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="period_type" value={`${labels.periodType} *`} />
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
                    <InputLabel htmlFor="rate_per_period" value={`${labels.ratePerPeriod} *`} />
                    <MoneyInput
                        id="rate_per_period"
                        value={form.data.rate_per_period}
                        onChange={(value) => form.setData('rate_per_period', value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.rate_per_period} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="deposit_amount" value={labels.deposit} />
                    <MoneyInput
                        id="deposit_amount"
                        value={form.data.deposit_amount}
                        onChange={(value) => form.setData('deposit_amount', value)}
                        className="mt-1 w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">Set ke Rp 0 jika tarif ini tanpa deposit.</p>
                </div>
                <div>
                    <InputLabel htmlFor="vehicle_id" value={labels.specificVehicle} />
                    <Select
                        id="vehicle_id"
                        className="mt-1"
                        value={form.data.vehicle_id}
                        onChange={(value) => form.setData('vehicle_id', value)}
                        placeholder={labels.anyVehicle}
                        options={vehicleOptions}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="rental_class" value={labels.rentalClass} />
                    <Select
                        id="rental_class"
                        className="mt-1"
                        value={form.data.rental_class}
                        onChange={(value) => form.setData('rental_class', value)}
                        placeholder={labels.anyClass}
                        options={rentalClassOptions}
                    />
                    <InputError message={form.errors.rental_class} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="vehicle_type" value={labels.vehicleType} />
                    <TextInput
                        id="vehicle_type"
                        value={form.data.vehicle_type}
                        onChange={(e) => form.setData('vehicle_type', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="priority" value={labels.priority} />
                    <TextInput
                        id="priority"
                        type="number"
                        min="0"
                        value={form.data.priority}
                        onChange={(e) => form.setData('priority', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.priority} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="valid_from" value={labels.validFrom} />
                    <TextInput
                        id="valid_from"
                        type="date"
                        value={form.data.valid_from}
                        onChange={(e) => form.setData('valid_from', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.valid_from} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="valid_to" value={labels.validTo} />
                    <TextInput
                        id="valid_to"
                        type="date"
                        value={form.data.valid_to}
                        onChange={(e) => form.setData('valid_to', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.valid_to} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="min_periods" value={labels.minPeriods} />
                    <TextInput
                        id="min_periods"
                        type="number"
                        min="1"
                        value={form.data.min_periods}
                        onChange={(e) => form.setData('min_periods', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.min_periods} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="km_limit" value={labels.kmLimit} />
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
                    <InputLabel htmlFor="excess_km_rate" value={labels.excessKmRate} />
                    <MoneyInput
                        id="excess_km_rate"
                        value={form.data.excess_km_rate}
                        onChange={(value) => form.setData('excess_km_rate', value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="late_fee_per_day" value={labels.lateFeePerDay} />
                    <MoneyInput
                        id="late_fee_per_day"
                        value={form.data.late_fee_per_day}
                        onChange={(value) => form.setData('late_fee_per_day', value)}
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
                        {labels.rateActive}
                    </label>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <SecondaryButton type="button" onClick={onCancel}>
                    {labels.cancel}
                </SecondaryButton>
                <PrimaryButton disabled={form.processing}>{label}</PrimaryButton>
            </div>
        </form>
    );
}

export default function RatesIndex({ rates, vehicles, rentalClasses }: Props): JSX.Element {
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
    const rentalClassOptions = useMemo(
        () => [{ value: '', label: t('rental.placeholders.any_rental_class') }, ...rentalClasses],
        [rentalClasses, t],
    );

    const formLabels = useMemo(
        () => ({
            rateName: t('rental.fields.rate_name'),
            periodType: t('rental.fields.period_type'),
            ratePerPeriod: t('rental.fields.rate_per_period'),
            deposit: t('rental.fields.deposit'),
            specificVehicle: t('rental.fields.specific_vehicle'),
            anyVehicle: t('rental.placeholders.any_vehicle'),
            vehicleType: t('rental.fields.vehicle_type'),
            rentalClass: t('rental.fields.rental_class'),
            anyClass: t('rental.placeholders.any_rental_class'),
            kmLimit: t('rental.fields.km_limit'),
            excessKmRate: t('rental.fields.excess_km_rate'),
            lateFeePerDay: t('rental.fields.late_fee_per_day'),
            validFrom: t('rental.fields.valid_from'),
            validTo: t('rental.fields.valid_to'),
            minPeriods: t('rental.fields.min_periods'),
            priority: t('rental.fields.priority'),
            rateActive: t('rental.fields.rate_active'),
            cancel: t('common.cancel'),
        }),
        [t],
    );

    const openEdit = (rate: Rate): void => {
        setEditing(rate);
        editForm.setData({
            vehicle_id: String(rate.vehicle?.id ?? ''),
            vehicle_type: rate.vehicle_type ?? '',
            rental_class: rate.rental_class ?? '',
            name: rate.name,
            period_type: rate.period_type,
            rate_per_period: rate.rate_per_period,
            km_limit_per_period: String(rate.km_limit_per_period ?? ''),
            excess_km_rate: rate.excess_km_rate ?? '',
            late_fee_per_day: rate.late_fee_per_day ?? '',
            deposit_amount: rate.deposit_amount,
            is_active: rate.is_active,
            valid_from: rate.valid_from ?? '',
            valid_to: rate.valid_to ?? '',
            min_periods: String(rate.min_periods ?? ''),
            priority: String(rate.priority ?? 0),
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

    const cancelForm = (): void => {
        setShowCreate(false);
        setEditing(null);
    };

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-gray-800">{t('rental.pages.rates.head')}</h2>
                <PrimaryButton onClick={() => setShowCreate(true)}>{t('rental.actions.new_rate')}</PrimaryButton>
            </div>

            {showCreate && (
                <div className="mb-6 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h2 className="mb-4 text-sm font-semibold text-gray-800">{t('rental.pages.rates.new')}</h2>
                    <RateForm
                        form={createForm}
                        onSubmit={submitCreate}
                        onCancel={cancelForm}
                        label={t('rental.actions.create_rate')}
                        periodOptions={periodOptions}
                        vehicleOptions={vehicleOptions}
                        rentalClassOptions={rentalClassOptions}
                        labels={formLabels}
                    />
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
                                        : rate.rental_class
                                          ? t('rental.rates.class_prefix', {
                                                class: t(`fleet.rental_class.${rate.rental_class}`, undefined, rate.rental_class),
                                            })
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
                                <td className="px-4 py-3 tabular-nums text-gray-600">
                                    {Number(rate.deposit_amount) > 0 ? (
                                        <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                                            {formatMoney(rate.deposit_amount)}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                            Tanpa Deposit
                                        </span>
                                    )}
                                </td>
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
                    <RateForm
                        form={editForm}
                        onSubmit={submitEdit}
                        onCancel={cancelForm}
                        label={t('common.save')}
                        periodOptions={periodOptions}
                        vehicleOptions={vehicleOptions}
                        rentalClassOptions={rentalClassOptions}
                        labels={formLabels}
                    />
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
        </div>
    );
}
