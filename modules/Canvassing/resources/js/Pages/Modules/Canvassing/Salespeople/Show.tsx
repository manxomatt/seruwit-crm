import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CanvassingNav from '../../../../CanvassingNav';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Salesperson {
    id: number;
    name: string;
    employee_code: string | null;
    area: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    notes: string | null;
    user: User | null;
}

interface Target {
    id: number;
    year: number;
    month: number;
    target_visits: number;
    target_new_partners: number;
    notes: string | null;
}

interface Visit {
    id: number;
    partner: { name: string };
    checked_in_at: string;
    checked_out_at: string | null;
    outcome: string;
}

interface PaginatedVisits {
    data: Visit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    salesperson: Salesperson;
    visits: PaginatedVisits;
    targets: Target[];
    currentTarget: Target | null;
    thisMonthVisits: number;
}

const outcomeColor = (o: string): string =>
    ({
        pending: 'bg-yellow-100 text-yellow-700',
        contacted: 'bg-blue-100 text-blue-700',
        interested: 'bg-green-100 text-green-700',
        not_interested: 'bg-red-100 text-red-700',
        no_contact: 'bg-gray-100 text-gray-500',
        callback: 'bg-purple-100 text-purple-700',
    })[o] ?? 'bg-gray-100 text-gray-500';

export default function SalespersonShow({
    salesperson,
    visits,
    currentTarget,
    thisMonthVisits,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showTargetForm, setShowTargetForm] = useState(false);
    const [targetForm, setTargetForm] = useState({
        target_visits: currentTarget?.target_visits ?? 0,
        target_new_partners: currentTarget?.target_new_partners ?? 0,
        notes: currentTarget?.notes ?? '',
    });

    const currentMonth = new Date().getMonth() + 1;

    const saveTarget = (): void => {
        const url = currentTarget
            ? prefixedRoute('canvassing.targets.update', currentTarget.id)
            : prefixedRoute('canvassing.targets.store');
        const method = currentTarget ? 'patch' : 'post';
        router[method](
            url,
            {
                ...targetForm,
                salesperson_id: salesperson.id,
                year: new Date().getFullYear(),
                month: currentMonth,
            },
            { onSuccess: () => setShowTargetForm(false) },
        );
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{salesperson.name}</h2>
                        {salesperson.area && <p className="mt-0.5 text-sm text-gray-500">{salesperson.area}</p>}
                    </div>
                    <Link href={prefixedRoute('canvassing.salespeople.edit', salesperson.id)}>
                        <PrimaryButton>{t('common.edit')}</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={salesperson.name} />

            <CanvassingNav />

            <div className="mb-4 flex items-center gap-2">
                <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        salesperson.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                >
                    {salesperson.is_active ? t('canvassing.status.active') : t('canvassing.status.inactive')}
                </span>
                {salesperson.employee_code && <span className="text-xs text-gray-400">{salesperson.employee_code}</span>}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="overflow-hidden bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('canvassing.salespeople.contact')}
                    </h3>
                    <dl className="space-y-1 text-sm">
                        <div>
                            <dt className="text-gray-400">{t('canvassing.salespeople.phone')}</dt>
                            <dd className="text-gray-900">{salesperson.phone ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-400">{t('canvassing.salespeople.email')}</dt>
                            <dd className="text-gray-900">{salesperson.email ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-400">{t('canvassing.salespeople.login')}</dt>
                            <dd className="text-gray-900">
                                {salesperson.user ? salesperson.user.email : t('canvassing.salespeople.no_account')}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="overflow-hidden bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('canvassing.salespeople.this_month')}
                    </h3>
                    <div className="text-3xl font-bold text-emerald-600">{thisMonthVisits}</div>
                    <p className="text-sm text-gray-500">{t('canvassing.salespeople.visits_completed')}</p>
                    {currentTarget && (
                        <div className="mt-2">
                            <div className="mb-1 flex justify-between text-xs text-gray-500">
                                <span>{t('canvassing.salespeople.target_label', { count: currentTarget.target_visits })}</span>
                                <span>
                                    {Math.min(100, Math.round((thisMonthVisits / currentTarget.target_visits) * 100))}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{
                                        width: `${Math.min(100, (thisMonthVisits / currentTarget.target_visits) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden bg-white p-4 shadow-sm sm:rounded-lg">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {t('canvassing.salespeople.target_month', {
                                month: t(`canvassing.months.${currentMonth}`),
                                year: new Date().getFullYear(),
                            })}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowTargetForm(!showTargetForm)}
                            className="text-xs text-indigo-600 hover:underline"
                        >
                            {showTargetForm ? t('common.cancel') : t('common.edit')}
                        </button>
                    </div>
                    {showTargetForm ? (
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs text-gray-500">{t('canvassing.salespeople.target_visits')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={targetForm.target_visits}
                                    onChange={(e) =>
                                        setTargetForm((p) => ({ ...p, target_visits: Number(e.target.value) }))
                                    }
                                    className="mt-0.5 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">
                                    {t('canvassing.salespeople.target_new_partners')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={targetForm.target_new_partners}
                                    onChange={(e) =>
                                        setTargetForm((p) => ({ ...p, target_new_partners: Number(e.target.value) }))
                                    }
                                    className="mt-0.5 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={saveTarget}
                                className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                            >
                                {t('canvassing.salespeople.save_target')}
                            </button>
                        </div>
                    ) : currentTarget ? (
                        <dl className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-400">{t('canvassing.salespeople.visits')}</dt>
                                <dd className="font-semibold text-gray-900">{currentTarget.target_visits}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-400">{t('canvassing.salespeople.new_partners')}</dt>
                                <dd className="font-semibold text-gray-900">{currentTarget.target_new_partners}</dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="text-sm text-gray-400">{t('canvassing.salespeople.no_target')}</p>
                    )}
                </div>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-gray-700">{t('canvassing.salespeople.visit_history')}</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns_visits.partner')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns_visits.check_in')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns_visits.duration')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns_visits.outcome')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visits.data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                                    {t('canvassing.salespeople.no_visits')}
                                </td>
                            </tr>
                        )}
                        {visits.data.map((v) => {
                            const duration = v.checked_out_at
                                ? t('canvassing.salespeople.duration_min', {
                                      count: Math.round(
                                          (new Date(v.checked_out_at).getTime() - new Date(v.checked_in_at).getTime()) /
                                              60000,
                                      ),
                                  })
                                : t('canvassing.status.open');

                            return (
                                <tr key={v.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        <Link
                                            href={prefixedRoute('canvassing.visits.show', v.id)}
                                            className="hover:underline"
                                        >
                                            {v.partner.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(v.checked_in_at).toLocaleString(localeTag)}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-600">{duration}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${outcomeColor(v.outcome)}`}
                                        >
                                            {t(`canvassing.outcomes.${v.outcome}`, undefined, v.outcome)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {visits.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (visits.current_page - 1) * visits.per_page + 1,
                                to: Math.min(visits.current_page * visits.per_page, visits.total),
                                total: visits.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {visits.links.map((link, index) => (
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
        </DynamicLayout>
    );
}
