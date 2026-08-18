import CommissionTable from '@/Components/Reseller/CommissionTable';
import Pagination from '@/Components/Reseller/Pagination';
import StatCard from '@/Components/Reseller/StatCard';
import { CommissionRow, EarningsSummary, Paginated } from '@/Components/Reseller/types';
import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Props {
    commissions: Paginated<CommissionRow>;
    summary: EarningsSummary;
    filters: { status: string | null; search: string | null };
}

const STATUSES = ['pending', 'approved', 'paid', 'void'] as const;

export default function Commissions({ commissions, summary, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: { status?: string | null; search?: string }) => {
        router.get(
            route('module.reseller.commissions'),
            {
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
                search: (next.search !== undefined ? next.search : search) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (event) => {
        event.preventDefault();
        applyFilters({ search });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('reseller.commissions_title')} />}>
            <Head title={t('reseller.commissions_title')} />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label={t('reseller.stats.pending')} value={formatMoney(summary.pending)} tone="amber" />
                    <StatCard label={t('reseller.stats.approved')} value={formatMoney(summary.approved)} tone="sky" />
                    <StatCard label={t('reseller.stats.paid')} value={formatMoney(summary.paid)} tone="emerald" />
                    <StatCard label={t('reseller.stats.lifetime')} value={formatMoney(summary.lifetime)} tone="indigo" />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters({ status: null })}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                !filters.status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                        >
                            {t('reseller.status.all')}
                        </button>
                        {STATUSES.map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => applyFilters({ status })}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                    filters.status === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {t(`reseller.status.${status}`)}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="ml-auto">
                        <TextInput
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t('reseller.table.tenant')}
                            className="!rounded-xl text-sm"
                        />
                    </form>
                </div>

                <CommissionTable rows={commissions.data} />

                <Pagination links={commissions.links} />
            </div>
        </DynamicLayout>
    );
}
