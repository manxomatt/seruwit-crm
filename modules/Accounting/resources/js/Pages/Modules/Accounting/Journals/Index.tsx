import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';

interface Journal {
    id: number;
    number: string;
    entry_date: string;
    type: string;
    status: string;
    memo: string | null;
    period: { id: number; name: string } | null;
}

interface Paginated {
    data: Journal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    journals: Paginated;
    filters: { status: string | null; period_id: number | null };
    periods: Array<{ id: number; name: string }>;
    can: { journal: boolean; post: boolean };
}

export default function Index({ journals, filters, periods, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell
            active="journals"
            title={t('accounting.journals.title')}
            headerActions={
                can.journal ? (
                    <Link href={prefixedRoute('accounting.journals.create')}>
                        <PrimaryButton>{t('accounting.journals.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <div className="mb-4 flex flex-wrap gap-3">
                <select
                    className="rounded-md border-gray-300 text-sm shadow-sm"
                    value={filters.status ?? ''}
                    onChange={(e) =>
                        router.get(
                            prefixedRoute('accounting.journals.index'),
                            { status: e.target.value || undefined, period_id: filters.period_id || undefined },
                            { preserveState: true },
                        )
                    }
                >
                    <option value="">{t('accounting.journals.all_statuses')}</option>
                    <option value="draft">{t('accounting.status.draft')}</option>
                    <option value="posted">{t('accounting.status.posted')}</option>
                    <option value="void">{t('accounting.status.void')}</option>
                </select>
                <select
                    className="rounded-md border-gray-300 text-sm shadow-sm"
                    value={filters.period_id ?? ''}
                    onChange={(e) =>
                        router.get(
                            prefixedRoute('accounting.journals.index'),
                            { status: filters.status || undefined, period_id: e.target.value || undefined },
                            { preserveState: true },
                        )
                    }
                >
                    <option value="">{t('accounting.journals.all_periods')}</option>
                    {periods.map((period) => (
                        <option key={period.id} value={period.id}>
                            {period.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.journals.number')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.date')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.period')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.status')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.memo')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {journals.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.journals.empty')}
                                </td>
                            </tr>
                        )}
                        {journals.data.map((journal) => (
                            <tr key={journal.id} className="border-b">
                                <td className="px-4 py-3">
                                    <Link
                                        href={prefixedRoute('accounting.journals.show', journal.id)}
                                        className="font-medium text-indigo-600"
                                    >
                                        {journal.number}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm">{journal.entry_date}</td>
                                <td className="px-4 py-3 text-sm">{journal.period?.name}</td>
                                <td className="px-4 py-3 text-sm">
                                    {t(`accounting.status.${journal.status}`, undefined, journal.status)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{journal.memo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Head title={t('accounting.journals.title')} />
        </AccountingShell>
    );
}
