import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

interface Props {
    active: 'dashboard' | 'accounts' | 'periods' | 'journals' | 'trial_balance' | 'bank';
    title: string;
    headerActions?: ReactNode;
    children: ReactNode;
}

export default function AccountingShell({ active, title, headerActions, children }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const links: Array<{ key: Props['active']; href: string; label: string }> = [
        { key: 'dashboard', href: prefixedRoute('accounting.dashboard'), label: t('accounting.nav.dashboard') },
        { key: 'accounts', href: prefixedRoute('accounting.accounts.index'), label: t('accounting.nav.accounts') },
        { key: 'bank', href: prefixedRoute('accounting.bank-accounts.index'), label: t('accounting.nav.bank') },
        { key: 'journals', href: prefixedRoute('accounting.journals.index'), label: t('accounting.nav.journals') },
        { key: 'periods', href: prefixedRoute('accounting.periods.index'), label: t('accounting.nav.periods') },
        { key: 'trial_balance', href: prefixedRoute('accounting.reports.trial-balance'), label: t('accounting.nav.trial_balance') },
    ];

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    {headerActions}
                </div>
            }
        >
            <Head title={title} />
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
                {links.map((link) => (
                    <Link
                        key={link.key}
                        href={link.href}
                        className={
                            active === link.key
                                ? 'font-medium text-indigo-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
            {children}
        </DynamicLayout>
    );
}
