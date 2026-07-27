import Select from '@/Components/Select';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PosLayout from '../../../../PosLayout';

interface Store {
    id: number;
    name: string;
}

interface ShiftRow {
    id: number;
    status: string;
    opening_float: string | number;
    opened_at: string;
    closed_at: string | null;
    completed_sales_count: number;
    warehouse: { id: number; name: string };
    opener: { id: number; name: string };
}

interface Paginated {
    data: ShiftRow[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    shifts: Paginated;
    stores: Store[];
    openShift: { id: number; warehouse: { id: number; name: string } } | null;
    filters: { status?: string | null; warehouse_id?: number | null };
    promptOpen: boolean;
    can: { open_shift: boolean; close_shift: boolean; sell: boolean };
}

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

export default function Index({ shifts, stores, openShift, filters, promptOpen, can }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [showOpen, setShowOpen] = useState(promptOpen && can.open_shift && !openShift);

    const form = useForm({
        warehouse_id: stores[0]?.id ? String(stores[0].id) : '',
        opening_float: '0',
        notes: '',
    });

    useEffect(() => {
        if (promptOpen && can.open_shift && !openShift) {
            setShowOpen(true);
        }
    }, [promptOpen, can.open_shift, openShift]);

    const applyFilters = (overrides: Record<string, string>): void => {
        router.get(
            prefixedRoute('pos.shifts.index'),
            {
                status: overrides.status !== undefined ? overrides.status || undefined : filters.status || undefined,
                warehouse_id:
                    overrides.warehouse_id !== undefined
                        ? overrides.warehouse_id || undefined
                        : filters.warehouse_id || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const submitOpen = (event: FormEvent): void => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            warehouse_id: Number(data.warehouse_id),
            opening_float: Number(data.opening_float),
        }));
        form.post(prefixedRoute('pos.shifts.store'), {
            onSuccess: () => setShowOpen(false),
        });
    };

    return (
        <PosLayout
            title={t('pos.shifts.index.head')}
            header={
                <div className="flex items-center gap-2">
                    {openShift && can.sell && (
                        <Link
                            href={prefixedRoute('pos.terminal')}
                            className="rounded-lg bg-[var(--pos-pay)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--pos-pay-hover)]"
                        >
                            {t('pos.nav.terminal')}
                        </Link>
                    )}
                    {can.open_shift && !openShift && (
                        <PrimaryButton type="button" onClick={() => setShowOpen(true)}>
                            {t('pos.shifts.index.open')}
                        </PrimaryButton>
                    )}
                </div>
            }
        >
            <Head title={t('pos.shifts.index.title')} />

            <div className="mb-6 flex flex-wrap gap-3">
                <Select
                    className="min-w-[12rem]"
                    value={filters.status || ''}
                    onChange={(value) => applyFilters({ status: value })}
                    placeholder={t('pos.shifts.index.all_statuses')}
                    options={[
                        { value: '', label: t('pos.shifts.index.all_statuses') },
                        { value: 'open', label: t('pos.shift_status.open') },
                        { value: 'closed', label: t('pos.shift_status.closed') },
                    ]}
                />
                <Select
                    className="min-w-[14rem]"
                    value={filters.warehouse_id ? String(filters.warehouse_id) : ''}
                    onChange={(value) => applyFilters({ warehouse_id: value })}
                    placeholder={t('pos.shifts.index.all_stores')}
                    maxVisibleOptions={10}
                    options={[
                        { value: '', label: t('pos.shifts.index.all_stores') },
                        ...stores.map((store) => ({ value: String(store.id), label: store.name })),
                    ]}
                />
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.shifts.index.columns.id')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.shifts.index.columns.store')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.shifts.index.columns.opened_by')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.shifts.index.columns.opened_at')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('pos.shifts.index.columns.sales')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.shifts.index.columns.status')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shifts.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                    {t('pos.shifts.index.empty')}
                                </td>
                            </tr>
                        ) : (
                            shifts.data.map((shift) => (
                                <tr key={shift.id} className="hover:bg-slate-50/80">
                                    <td className="px-4 py-3 font-medium">#{shift.id}</td>
                                    <td className="px-4 py-3">{shift.warehouse?.name}</td>
                                    <td className="px-4 py-3">{shift.opener?.name}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {shift.opened_at ? new Date(shift.opened_at).toLocaleString('id-ID') : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">{shift.completed_sales_count}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                shift.status === 'open'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {t(`pos.shift_status.${shift.status}`, undefined, shift.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={prefixedRoute('pos.shifts.show', shift.id)}
                                            className="inline-flex text-[var(--pos-accent)] hover:opacity-80"
                                            title={t('common.view')}
                                        >
                                            <EyeIcon />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {shifts.links.length > 3 && (
                <div className="mt-4 flex flex-wrap gap-1">
                    {shifts.links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url || '#'}
                            preserveState
                            className={`rounded-md px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-[var(--pos-accent)] text-white'
                                    : link.url
                                      ? 'bg-white text-gray-700 hover:bg-slate-50'
                                      : 'cursor-not-allowed bg-slate-100 text-gray-400'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            {showOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
                    <form onSubmit={submitOpen} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold">{t('pos.shifts.open_form.title')}</h3>
                        {stores.length === 0 ? (
                            <p className="mt-4 text-sm text-gray-500">{t('pos.shifts.open_form.no_stores')}</p>
                        ) : (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <InputLabel value={t('pos.shifts.open_form.store')} />
                                    <Select
                                        className="mt-1 w-full"
                                        value={form.data.warehouse_id}
                                        onChange={(value) => form.setData('warehouse_id', value)}
                                        maxVisibleOptions={10}
                                        options={stores.map((store) => ({
                                            value: String(store.id),
                                            label: store.name,
                                        }))}
                                    />
                                    <InputError message={form.errors.warehouse_id} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value={t('pos.shifts.open_form.opening_float')} />
                                    <TextInput
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="mt-1 block w-full"
                                        value={form.data.opening_float}
                                        onChange={(e) => form.setData('opening_float', e.target.value)}
                                    />
                                    <InputError message={form.errors.opening_float} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value={t('pos.shifts.open_form.notes')} />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowOpen(false)}
                                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-slate-50"
                            >
                                {t('common.cancel')}
                            </button>
                            {stores.length > 0 && (
                                <PrimaryButton disabled={form.processing}>{t('pos.actions.open_shift')}</PrimaryButton>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </PosLayout>
    );
}
