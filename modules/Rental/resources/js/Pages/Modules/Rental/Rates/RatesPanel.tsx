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
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginatedLink[];
}

interface Props {
    rates: Paginated<Rate>;
    vehicles: Vehicle[];
    rentalClasses: Array<{ value: string; label: string }>;
}

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

interface Rate {
    id: number;
    name: string;
    vehicle_id: number | null;
    vehicle: { id: number; name: string; plate_number: string; type: string } | null;
    vehicle_type: string;
    rental_class: string;
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

interface FormData {
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
}

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

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
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

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 20.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';
const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-red-600 transition data-[focus]:bg-red-50 data-[focus]:text-red-700';

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
    const [selected, setSelected] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

    const createForm = useForm<FormData>({ ...emptyForm });
    const editForm = useForm<FormData>({ ...emptyForm });

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

    const pageIds = useMemo(() => rates.data.map((rate) => rate.id), [rates.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));

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
                createForm.setData({ ...emptyForm });
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

    const toggleRow = (id: number): void => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
    };

    const toggleAllOnPage = (): void => {
        setSelected((prev) => {
            if (allPageSelected) {
                return prev.filter((id) => !pageIds.includes(id));
            }

            return Array.from(new Set([...prev, ...pageIds]));
        });
    };

    const clearSelection = (): void => {
        setSelected([]);
    };

    const activateSelected = (): void => {
        if (selected.length === 0) {
            return;
        }
        setProcessing(true);
        router.patch(
            prefixedRoute('rental.rates.batch-status'),
            { ids: selected, is_active: true },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const deactivateSelected = (): void => {
        if (selected.length === 0) {
            return;
        }
        setProcessing(true);
        router.patch(
            prefixedRoute('rental.rates.batch-status'),
            { ids: selected, is_active: false },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmBatchDelete = (): void => {
        if (selected.length === 0) {
            return;
        }
        setProcessing(true);
        router.post(
            prefixedRoute('rental.rates.batch-destroy'),
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowBatchDeleteDialog(false);
                    clearSelection();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const cancelForm = (): void => {
        setShowCreate(false);
        setEditing(null);
    };

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-gray-800">{t('rental.pages.rates.head')}</h2>
                <PrimaryButton onClick={() => {
                    createForm.setData({ ...emptyForm });
                    setShowCreate(true);
                }}>{t('rental.actions.new_rate')}</PrimaryButton>
            </div>

            {selected.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-2.5 ring-1 ring-inset ring-indigo-100">
                    <div className="flex items-center gap-2 text-sm text-indigo-800">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <span className="font-medium">{t('rental.pages.rates.batch_selected', { count: selected.length }, `${selected.length} tarif dipilih`)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={activateSelected}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
                        >
                            Aktif
                        </button>
                        <button
                            type="button"
                            onClick={deactivateSelected}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 disabled:opacity-50"
                        >
                            Non Aktif
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBatchDeleteDialog(true)}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                        >
                            <TrashIcon />
                            Hapus
                        </button>
                        <button
                            type="button"
                            onClick={clearSelection}
                            disabled={processing}
                            className="text-xs text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline disabled:opacity-50"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}

            <Modal
                show={showCreate}
                onClose={() => setShowCreate(false)}>
                <div className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('rental.pages.rates.new')}</h2>
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
            </Modal>

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

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                {rates.data.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h3 className="text-sm font-medium text-gray-900">{t('rental.pages.rates.empty')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('rental.pages.rates.empty')}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        <th className="w-10 px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={allPageSelected}
                                                ref={(input) => {
                                                    if (input) {
                                                        input.indeterminate = somePageSelected && !allPageSelected;
                                                    }
                                                }}
                                                onChange={toggleAllOnPage}
                                                aria-label={t('common.select_all')}
                                            />
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.rate_name')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.applies_to')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.period')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.rate')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.km_limit')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.deposit')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.status')}
                                        </th>
                                        <th className="w-24 px-3 py-2.5">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rates.data.map((rate) => (
                                        <tr key={rate.id} className="group transition-colors hover:bg-gray-50/80">
                                            <td className="w-10 px-3 py-2.5">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selected.includes(rate.id)}
                                                    onChange={() => toggleRow(rate.id)}
                                                    aria-label={t('common.select')}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-900 text-sm">
                                                {rate.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-600">
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
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-600">
                                                {t(`rental.period_type.${rate.period_type}`, undefined, rate.period_type)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-sm text-gray-900">
                                                {formatMoney(rate.rate_per_period)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-sm text-gray-600">
                                                {rate.km_limit_per_period ? t('rental.rates.km', { km: rate.km_limit_per_period }) : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-sm text-gray-600">
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
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                                                <span
                                                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${rate.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    {rate.is_active ? 'Aktif' : 'Non Aktif'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                                <Menu>
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                        title={t('common.actions')}
                                                    >
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>
                                                    <MenuItems
                                                        anchor="bottom end"
                                                        transition
                                                        className="z-20 w-48 origin-top-right rounded-xl border border-gray-100 bg-white p-1 shadow-lg shadow-gray-200/60 ring-1 ring-black/5 transition ease-out data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100"
                                                    >
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(rate)}
                                                                className={menuItemClassName}
                                                            >
                                                                <span className="text-indigo-600">
                                                                    <PencilIcon />
                                                                </span>
                                                                {t('common.edit')}
                                                            </button>
                                                        </MenuItem>
                                                        <div className="my-1 border-t border-gray-100" />
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(rate)}
                                                                className={menuItemDangerClassName}
                                                            >
                                                                <TrashIcon />
                                                                {t('common.delete')}
                                                            </button>
                                                        </MenuItem>
                                                    </MenuItems>
                                                </Menu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {rates.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
                                <p className="text-xs text-gray-500">
                                    {t('common.showing_results', {
                                        from: (rates.current_page - 1) * rates.per_page + 1,
                                        to: Math.min(rates.current_page * rates.per_page, rates.total),
                                        total: rates.total,
                                    })}
                                </p>
                                <div className="flex gap-1">
                                    {rates.links.map((link, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                            disabled={!link.url}
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${link.active
                                                ? 'bg-gray-900 text-white'
                                                : link.url
                                                    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                    : 'cursor-not-allowed text-gray-300'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

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

            <ConfirmDeleteDialog
                show={showBatchDeleteDialog}
                onClose={() => !processing && setShowBatchDeleteDialog(false)}
                onConfirm={confirmBatchDelete}
                processing={processing}
                title={t('rental.pages.rates.batch_delete_title')}
                message={
                    selected.length > 0
                        ? t('rental.pages.rates.batch_delete_confirm', { count: selected.length }, `Anda akan menghapus ${selected.length} tarif sekaligus. Data yang sudah dipakai oleh transaksi aktif tidak akan terhapus.`)
                        : undefined
                }
            />
        </div>
    );
}
