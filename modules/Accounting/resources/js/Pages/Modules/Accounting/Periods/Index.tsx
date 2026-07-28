import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
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
    years: YearOption[];
    periods: Period[];
    can: { period: boolean };
}

export default function Index({ year, years, periods, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const ensureForm = useForm({ year: year + 1 });

    const ensureYear = (e: FormEvent) => {
        e.preventDefault();
        ensureForm.post(prefixedRoute('accounting.years.ensure'));
    };

    return (
        <AccountingShell active="periods" title={t('accounting.periods.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="text-sm text-gray-600">
                    {t('accounting.periods.year')}
                    <select
                        className="ml-2 rounded-md border-gray-300 text-sm shadow-sm"
                        value={year}
                        onChange={(e) =>
                            router.get(prefixedRoute('accounting.periods.index'), { year: e.target.value }, { preserveState: true })
                        }
                    >
                        {years.map((y) => (
                            <option key={y.id} value={y.year}>
                                {y.year}
                            </option>
                        ))}
                    </select>
                </label>
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

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.periods.name')}</th>
                            <th className="px-4 py-3">{t('accounting.periods.range')}</th>
                            <th className="px-4 py-3">{t('accounting.periods.status')}</th>
                            {can.period && <th className="px-4 py-3" />}
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
                                {can.period && (
                                    <td className="space-x-2 px-4 py-3 text-right text-sm">
                                        {period.status !== 'soft_close' && period.status !== 'hard_close' && (
                                            <Link
                                                href={prefixedRoute('accounting.periods.soft-close', period.id)}
                                                method="post"
                                                as="button"
                                                className="text-amber-600 hover:text-amber-800"
                                            >
                                                {t('accounting.periods.soft_close')}
                                            </Link>
                                        )}
                                        {period.status !== 'hard_close' && (
                                            <Link
                                                href={prefixedRoute('accounting.periods.hard-close', period.id)}
                                                method="post"
                                                as="button"
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                {t('accounting.periods.hard_close')}
                                            </Link>
                                        )}
                                        {period.status !== 'open' && (
                                            <Link
                                                href={prefixedRoute('accounting.periods.reopen', period.id)}
                                                method="post"
                                                as="button"
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                {t('accounting.periods.reopen')}
                                            </Link>
                                        )}
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
