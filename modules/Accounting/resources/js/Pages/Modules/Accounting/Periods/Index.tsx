import AccountingShell from '../AccountingShell';
import { HardCloseIcon, ReopenIcon, SoftCloseIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Period {
    id: number;
    period_index: number;
    name: string;
    starts_on: string;
    ends_on: string;
    status: string;
}

interface YearOption {
    id: number;
    year: number;
    is_closed: boolean;
}

interface Props {
    year: number;
    year_closed: boolean;
    years: YearOption[];
    periods: Period[];
    opening: { id: number; number: string } | null;
    closing: { id: number; number: string } | null;
    can: { period: boolean };
}

export default function Index({ year, year_closed, years, periods, opening, closing, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const ensureForm = useForm({ year: year + 1 });
    const yearActionForm = useForm({ year });

    const ensureYear = (e: FormEvent) => {
        e.preventDefault();
        ensureForm.post(prefixedRoute('accounting.years.ensure'));
    };

    const closeYear = () => {
        if (!confirm(t('accounting.periods.confirm_year_close'))) {
            return;
        }
        yearActionForm.post(prefixedRoute('accounting.years.close'));
    };

    const reopenYear = () => {
        if (!confirm(t('accounting.periods.confirm_year_reopen'))) {
            return;
        }
        yearActionForm.post(prefixedRoute('accounting.years.reopen'));
    };

    return (
        <AccountingShell active="periods" title={t('accounting.periods.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('accounting.periods.year')}</span>
                    <Select
                        className="w-32"
                        value={String(year)}
                        onChange={(value) =>
                            router.get(prefixedRoute('accounting.periods.index'), { year: value }, { preserveState: true })
                        }
                        options={years.map((y) => ({
                            value: String(y.year),
                            label: `${y.year}${y.is_closed ? ' ✓' : ''}`,
                        }))}
                    />
                </div>
                <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                        year_closed ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                >
                    {year_closed ? t('accounting.periods.year_closed') : t('accounting.periods.year_open')}
                </span>
                {can.period && (
                    <form onSubmit={ensureYear} className="flex items-center gap-2">
                        <input
                            type="number"
                            className="w-24 rounded-md border-gray-300 text-sm shadow-sm"
                            value={ensureForm.data.year}
                            onChange={(e) => ensureForm.setData('year', Number(e.target.value))}
                        />
                        <PrimaryButton disabled={ensureForm.processing}>{t('accounting.periods.ensure_year')}</PrimaryButton>
                    </form>
                )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                <Link href={`${prefixedRoute('accounting.opening-balances.create')}?year=${year}`} className="text-indigo-600 hover:text-indigo-800">
                    {t('accounting.opening.title')}
                    {opening ? ` (${opening.number})` : ''}
                </Link>
                {closing && (
                    <Link href={prefixedRoute('accounting.journals.show', closing.id)} className="text-gray-600 hover:text-gray-900">
                        {t('accounting.periods.closing_journal')}: {closing.number}
                    </Link>
                )}
                {can.period && !year_closed && (
                    <PrimaryButton type="button" onClick={closeYear} disabled={yearActionForm.processing}>
                        {t('accounting.periods.close_year')}
                    </PrimaryButton>
                )}
                {can.period && year_closed && (
                    <button
                        type="button"
                        onClick={reopenYear}
                        disabled={yearActionForm.processing}
                        className="rounded-md border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                        {t('accounting.periods.reopen_year')}
                    </button>
                )}
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.periods.name')}</th>
                            <th className="px-4 py-3">{t('accounting.periods.range')}</th>
                            <th className="px-4 py-3">{t('accounting.periods.status')}</th>
                            {can.period && !year_closed && (
                                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map((period) => (
                            <tr key={period.id} className="border-b">
                                <td className="px-4 py-3 text-sm font-medium">{period.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {period.starts_on} — {period.ends_on}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {t(`accounting.period_status.${period.status}`, undefined, period.status)}
                                </td>
                                {can.period && !year_closed && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {period.status !== 'soft_close' && period.status !== 'hard_close' && (
                                                <Link
                                                    href={prefixedRoute('accounting.periods.soft-close', period.id)}
                                                    method="post"
                                                    as="button"
                                                    className="text-amber-600 hover:text-amber-800"
                                                    title={t('accounting.periods.soft_close')}
                                                >
                                                    <SoftCloseIcon />
                                                </Link>
                                            )}
                                            {period.status !== 'hard_close' && (
                                                <Link
                                                    href={prefixedRoute('accounting.periods.hard-close', period.id)}
                                                    method="post"
                                                    as="button"
                                                    className="text-red-600 hover:text-red-800"
                                                    title={t('accounting.periods.hard_close')}
                                                >
                                                    <HardCloseIcon />
                                                </Link>
                                            )}
                                            {period.status !== 'open' && (
                                                <Link
                                                    href={prefixedRoute('accounting.periods.reopen', period.id)}
                                                    method="post"
                                                    as="button"
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title={t('accounting.periods.reopen')}
                                                >
                                                    <ReopenIcon />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}
