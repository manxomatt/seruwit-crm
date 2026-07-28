import AccountingShell from './AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Link } from '@inertiajs/react';

interface Check {
    key: string;
    label: string;
    ok: boolean;
    detail: string | null;
}

interface Props {
    stats: {
        accounts: number;
        draft_journals: number;
        posted_journals: number;
        open_period: { id: number; name: string; starts_on: string; ends_on: string; status: string } | null;
    };
    readiness: {
        ready: boolean;
        blocking: Check[];
        warnings: Check[];
        opening_status: string;
    };
    can: { manage_coa: boolean; journal: boolean; post: boolean; period: boolean };
}

export default function Dashboard({ stats, readiness, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const checks = [...readiness.blocking, ...readiness.warnings];
    const allClear = readiness.ready && readiness.warnings.every((check) => check.ok);

    return (
        <AccountingShell
            active="dashboard"
            title={t('accounting.dashboard.title')}
            headerActions={
                can.journal ? (
                    <Link href={prefixedRoute('accounting.journals.create')}>
                        <PrimaryButton>{t('accounting.journals.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label={t('accounting.dashboard.accounts')} value={String(stats.accounts)} />
                <Stat label={t('accounting.dashboard.draft_journals')} value={String(stats.draft_journals)} />
                <Stat label={t('accounting.dashboard.posted_journals')} value={String(stats.posted_journals)} />
                <Stat
                    label={t('accounting.dashboard.open_period')}
                    value={stats.open_period?.name ?? t('accounting.dashboard.no_open_period')}
                />
            </div>

            <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">{t('accounting.readiness.title')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('accounting.readiness.help')}</p>
                    </div>
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            allClear
                                ? 'bg-green-100 text-green-800'
                                : readiness.ready
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                        }`}
                    >
                        {allClear
                            ? t('accounting.readiness.status_ready')
                            : readiness.ready
                              ? t('accounting.readiness.status_warnings')
                              : t('accounting.readiness.status_blocked')}
                    </span>
                </div>

                <ul className="mt-4 divide-y divide-gray-100">
                    {checks.map((check) => (
                        <li key={check.key} className="flex items-start justify-between gap-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{check.label}</p>
                                {check.detail && <p className="mt-0.5 text-xs text-gray-500">{check.detail}</p>}
                            </div>
                            <span
                                className={`shrink-0 text-xs font-semibold uppercase ${
                                    check.ok ? 'text-green-700' : 'text-red-700'
                                }`}
                            >
                                {check.ok ? t('accounting.readiness.ok') : t('accounting.readiness.fail')}
                            </span>
                        </li>
                    ))}
                </ul>

                {readiness.opening_status === 'pending' && can.period && (
                    <div className="mt-4">
                        <Link href={prefixedRoute('accounting.opening-balances.create')}>
                            <PrimaryButton>{t('accounting.opening.post')}</PrimaryButton>
                        </Link>
                    </div>
                )}
            </div>
        </AccountingShell>
    );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
    );
}
