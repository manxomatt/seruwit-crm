import AccountingShell from '../AccountingShell';
import { EyeIcon, PencilIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
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
                <Select
                    className="w-44"
                    value={filters.status ?? ''}
                    onChange={(value) =>
                        router.get(
                            prefixedRoute('accounting.journals.index'),
                            { status: value || undefined, period_id: filters.period_id || undefined },
                            { preserveState: true },
                        )
                    }
                    placeholder={t('accounting.journals.all_statuses')}
                    options={[
                        { value: '', label: t('accounting.journals.all_statuses') },
                        { value: 'draft', label: t('accounting.status.draft') },
                        { value: 'posted', label: t('accounting.status.posted') },
                        { value: 'void', label: t('accounting.status.void') },
                    ]}
                />
                <Select
                    className="w-56"
                    searchable
                    value={filters.period_id ? String(filters.period_id) : ''}
                    onChange={(value) =>
                        router.get(
                            prefixedRoute('accounting.journals.index'),
                            { status: filters.status || undefined, period_id: value || undefined },
                            { preserveState: true },
                        )
                    }
                    placeholder={t('accounting.journals.all_periods')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.no_options')}
                    noResultsText={t('common.no_results')}
                    options={[
                        { value: '', label: t('accounting.journals.all_periods') },
                        ...periods.map((period) => ({
                            value: String(period.id),
                            label: period.name,
                        })),
                    ]}
                />
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
                            <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {journals.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.journals.empty')}
                                </td>
                            </tr>
                        )}
                        {journals.data.map((journal) => (
                            <tr key={journal.id} className="border-b">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{journal.number}</td>
                                <td className="px-4 py-3 text-sm">{journal.entry_date}</td>
                                <td className="px-4 py-3 text-sm">{journal.period?.name}</td>
                                <td className="px-4 py-3 text-sm">
                                    {t(`accounting.status.${journal.status}`, undefined, journal.status)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{journal.memo}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={prefixedRoute('accounting.journals.show', journal.id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                            title={t('common.view')}
                                        >
                                            <EyeIcon />
                                        </Link>
                                        {journal.status === 'draft' && can.journal && (
                                            <Link
                                                href={prefixedRoute('accounting.journals.edit', journal.id)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title={t('common.edit')}
                                            >
                                                <PencilIcon />
                                            </Link>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Head title={t('accounting.journals.title')} />
        </AccountingShell>
    );
}
