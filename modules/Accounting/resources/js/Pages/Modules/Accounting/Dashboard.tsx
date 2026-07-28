import AccountingShell from './AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Link } from '@inertiajs/react';

interface Props {
    stats: {
        accounts: number;
        draft_journals: number;
        posted_journals: number;
        open_period: { id: number; name: string; starts_on: string; ends_on: string; status: string } | null;
    };
    can: { manage_coa: boolean; journal: boolean; post: boolean; period: boolean };
}

export default function Dashboard({ stats, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

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
