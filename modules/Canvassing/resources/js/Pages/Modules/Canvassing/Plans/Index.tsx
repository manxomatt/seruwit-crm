import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { formatDateDmY } from '@/utils/date';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import CanvassingNav from '../../../../CanvassingNav';

interface SalespersonOption {
    id: number;
    name: string;
}

interface Plan {
    id: number;
    plan_date: string;
    notes: string | null;
    status: string;
    salesperson: { id: number; name: string };
}

interface PaginatedPlans {
    data: Plan[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    plans: PaginatedPlans;
    salespeople: SalespersonOption[];
    filters: { salesperson_id?: string; date?: string; status?: string };
}

const STATUSES = ['planned', 'completed', 'cancelled'] as const;

const statusColor = (s: string): string =>
    ({
        planned: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-gray-100 text-gray-500',
    })[s] ?? 'bg-gray-100 text-gray-500';

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

export default function PlansIndex({ plans, salespeople, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [processing, setProcessing] = useState(false);

    const { data, setData, post, processing: formProcessing, errors, reset } = useForm({
        salesperson_id: '',
        plan_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const salespersonOptions = useMemo(
        () => salespeople.map((sp) => ({ value: String(sp.id), label: sp.name })),
        [salespeople],
    );

    const applyFilters = (patch: { salesperson_id?: string; date?: string; status?: string }): void => {
        router.get(
            prefixedRoute('canvassing.plans.index'),
            {
                salesperson_id:
                    patch.salesperson_id !== undefined
                        ? patch.salesperson_id || undefined
                        : filters.salesperson_id || undefined,
                date: patch.date !== undefined ? patch.date || undefined : filters.date || undefined,
                status: patch.status !== undefined ? patch.status || undefined : filters.status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('canvassing.plans.store'), {
            onSuccess: () => reset('notes'),
        });
    };

    const openDeleteDialog = (plan: Plan): void => {
        setPlanToDelete(plan);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = (): void => {
        setShowDeleteDialog(false);
        setPlanToDelete(null);
    };

    const confirmDelete = (): void => {
        if (!planToDelete) {
            return;
        }

        setProcessing(true);
        router.delete(prefixedRoute('canvassing.plans.destroy', planToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('canvassing.plans.title')}</h2>
            }
        >
            <Head title={t('canvassing.plans.head')} />

            <CanvassingNav />

            <form onSubmit={submit} className="mb-6 bg-white p-6 shadow-sm sm:rounded-lg">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                        <InputLabel value={t('canvassing.plans.salesperson')} />
                        <Select
                            className="mt-1"
                            value={data.salesperson_id}
                            onChange={(value) => setData('salesperson_id', value)}
                            placeholder={t('canvassing.plans.salesperson')}
                            options={salespersonOptions}
                        />
                        <InputError message={errors.salesperson_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="plan_date" value={t('canvassing.plans.date')} />
                        <input
                            id="plan_date"
                            type="date"
                            value={data.plan_date}
                            onChange={(e) => setData('plan_date', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                        <InputError message={errors.plan_date} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="notes" value={t('canvassing.plans.notes')} />
                        <input
                            id="notes"
                            type="text"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <PrimaryButton disabled={formProcessing || !data.salesperson_id}>
                        {t('canvassing.plans.create')}
                    </PrimaryButton>
                </div>
            </form>

            <div className="mb-6 flex flex-wrap gap-3">
                <Select
                    className="min-w-[12rem]"
                    value={filters.salesperson_id ?? ''}
                    onChange={(value) => applyFilters({ salesperson_id: value })}
                    placeholder={t('canvassing.plans.all_salespeople')}
                    options={[{ value: '', label: t('canvassing.plans.all_salespeople') }, ...salespersonOptions]}
                />
                <input
                    type="date"
                    value={filters.date ?? ''}
                    onChange={(e) => applyFilters({ date: e.target.value })}
                    className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Select
                    className="min-w-[12rem]"
                    value={filters.status ?? ''}
                    onChange={(value) => applyFilters({ status: value })}
                    placeholder={t('canvassing.plans.all_statuses')}
                    searchable={false}
                    options={[
                        { value: '', label: t('canvassing.plans.all_statuses') },
                        ...STATUSES.map((s) => ({
                            value: s,
                            label: t(`canvassing.status.${s}`, undefined, s),
                        })),
                    ]}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.plans.columns.salesperson')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.plans.columns.date')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.plans.columns.status')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.plans.columns.notes')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('common.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {plans.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                    {t('canvassing.plans.empty')}
                                </td>
                            </tr>
                        ) : (
                            plans.data.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        <Link
                                            href={prefixedRoute('canvassing.salespeople.show', plan.salesperson.id)}
                                            className="hover:underline"
                                        >
                                            {plan.salesperson.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-600">{formatDateDmY(plan.plan_date)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusColor(plan.status)}`}
                                        >
                                            {t(`canvassing.status.${plan.status}`, undefined, plan.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{plan.notes ?? '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => openDeleteDialog(plan)}
                                            className="inline-flex text-red-600 hover:text-red-900"
                                            title={t('common.delete')}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {plans.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (plans.current_page - 1) * plans.per_page + 1,
                                to: Math.min(plans.current_page * plans.per_page, plans.total),
                                total: plans.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {plans.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                message={
                    planToDelete
                        ? t('canvassing.plans.delete_confirm', {
                              name: planToDelete.salesperson.name,
                              date: formatDateDmY(planToDelete.plan_date),
                          })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
