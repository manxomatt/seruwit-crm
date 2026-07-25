import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface SalespersonOption { id: number; name: string; }
interface Plan {
    id: number;
    plan_date: string;
    notes: string | null;
    status: string;
    salesperson: { id: number; name: string };
}
interface Paginated {
    data: Plan[];
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    plans: Paginated;
    salespeople: SalespersonOption[];
    filters: { salesperson_id?: string; date?: string; status?: string };
}

const STATUSES = ['planned', 'completed', 'cancelled'] as const;

const statusColor = (s: string) => ({
    planned: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
})[s] ?? 'bg-gray-100 text-gray-500';

export default function PlansIndex({ plans, salespeople, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const { data, setData, post, processing, errors, reset } = useForm({
        salesperson_id: '',
        plan_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const filter = (key: string, value: string) => {
        router.get(prefixedRoute('canvassing.plans.index'), { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('canvassing.plans.store'), {
            onSuccess: () => reset('notes'),
        });
    };

    const destroy = (id: number) => {
        if (!confirm(t('common.delete') + '?')) {
            return;
        }
        router.delete(prefixedRoute('canvassing.plans.destroy', id));
    };

    const columns = [
        t('canvassing.plans.columns.salesperson'),
        t('canvassing.plans.columns.date'),
        t('canvassing.plans.columns.status'),
        t('canvassing.plans.columns.notes'),
        '',
    ];

    return (
        <DynamicLayout header={t('canvassing.title')}>
            <Head title={t('canvassing.plans.head')} />
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Link href={prefixedRoute('canvassing.index')} className="mb-1 block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">{t('canvassing.nav.dashboard')}</Link>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('canvassing.plans.title')}</h1>
                    </div>
                </div>

                <form onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">{t('canvassing.plans.salesperson')}</label>
                            <select
                                value={data.salesperson_id}
                                onChange={(e) => setData('salesperson_id', e.target.value)}
                                className="w-full rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value=""></option>
                                {salespeople.map((sp) => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                            {errors.salesperson_id && <p className="mt-1 text-xs text-red-600">{errors.salesperson_id}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">{t('canvassing.plans.date')}</label>
                            <input
                                type="date"
                                value={data.plan_date}
                                onChange={(e) => setData('plan_date', e.target.value)}
                                className="w-full rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            />
                            {errors.plan_date && <p className="mt-1 text-xs text-red-600">{errors.plan_date}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-500">{t('canvassing.plans.notes')}</label>
                            <input
                                type="text"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <PrimaryButton disabled={processing || !data.salesperson_id}>{t('canvassing.plans.create')}</PrimaryButton>
                    </div>
                </form>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <select
                        value={filters.salesperson_id ?? ''}
                        onChange={(e) => filter('salesperson_id', e.target.value)}
                        className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">{t('canvassing.plans.all_salespeople')}</option>
                        {salespeople.map((sp) => (
                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filters.date ?? ''}
                        onChange={(e) => filter('date', e.target.value)}
                        className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <select
                        value={filters.status ?? ''}
                        onChange={(e) => filter('status', e.target.value)}
                        className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">{t('canvassing.plans.all_statuses')}</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>{t(`canvassing.status.${s}`)}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {columns.map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {plans.data.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">{t('canvassing.plans.empty')}</td></tr>
                            )}
                            {plans.data.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                        <Link href={prefixedRoute('canvassing.salespeople.show', plan.salesperson.id)} className="hover:underline">
                                            {plan.salesperson.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">
                                        {new Date(plan.plan_date).toLocaleDateString(localeTag)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(plan.status)}`}>
                                            {t(`canvassing.status.${plan.status}`, undefined, plan.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{plan.notes ?? '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => destroy(plan.id)}
                                            className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                                        >
                                            {t('common.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center gap-1">
                    {plans.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </DynamicLayout>
    );
}
