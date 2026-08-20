import PageHeader from '@/Components/PageHeader';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

type AccountingNavKey =
    | 'dashboard'
    | 'accounts'
    | 'periods'
    | 'journals'
    | 'trial_balance'
    | 'profit_loss'
    | 'balance_sheet'
    | 'cash_flow'
    | 'general_ledger'
    | 'partner_statement'
    | 'tax_register'
    | 'wht_payable'
    | 'bank'
    | 'opening'
    | 'tax_codes'
    | 'tax_policies'
    | 'fixed_assets'
    | 'budgets'
    | 'travel_revenue';

interface Props {
    active: AccountingNavKey;
    title: string;
    headerActions?: ReactNode;
    children: ReactNode;
}

interface NavLink {
    key: AccountingNavKey;
    href: string;
    label: string;
    icon?: string;
}

interface NavGroup {
    id: 'reports' | 'setup';
    label: string;
    icon: string;
    keys: AccountingNavKey[];
    items: NavLink[];
}

function ChevronDownIcon({ className = 'h-4 w-4' }: { className?: string }): JSX.Element {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function CheckIcon(): JSX.Element {
    return (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function tabClass(active: boolean): string {
    return [
        'inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0',
        active
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
    ].join(' ');
}

export default function AccountingShell({ active, title, headerActions, children }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const primary: NavLink[] = [
        { key: 'dashboard', href: prefixedRoute('accounting.dashboard'), label: t('accounting.nav.dashboard'), icon: '📊' },
        { key: 'journals', href: prefixedRoute('accounting.journals.index'), label: t('accounting.nav.journals'), icon: '📑' },
        { key: 'bank', href: prefixedRoute('accounting.bank-accounts.index'), label: t('accounting.nav.bank'), icon: '🏦' },
    ];

    const reports: NavLink[] = [
        { key: 'trial_balance', href: prefixedRoute('accounting.reports.trial-balance'), label: t('accounting.nav.trial_balance') },
        { key: 'profit_loss', href: prefixedRoute('accounting.reports.profit-loss'), label: t('accounting.nav.profit_loss') },
        { key: 'balance_sheet', href: prefixedRoute('accounting.reports.balance-sheet'), label: t('accounting.nav.balance_sheet') },
        { key: 'cash_flow', href: prefixedRoute('accounting.reports.cash-flow'), label: t('accounting.nav.cash_flow') },
        { key: 'general_ledger', href: prefixedRoute('accounting.reports.general-ledger'), label: t('accounting.nav.general_ledger') },
        { key: 'partner_statement', href: prefixedRoute('accounting.reports.partner-statement'), label: t('accounting.nav.partner_statement') },
        { key: 'tax_register', href: prefixedRoute('accounting.reports.tax-register'), label: t('accounting.nav.tax_register') },
        { key: 'wht_payable', href: prefixedRoute('accounting.reports.wht-payable'), label: t('accounting.nav.wht_payable') },
        { key: 'travel_revenue', href: prefixedRoute('accounting.reports.travel-revenue'), label: t('accounting.nav.travel_revenue') },
    ];

    const setup: NavLink[] = [
        { key: 'accounts', href: prefixedRoute('accounting.accounts.index'), label: t('accounting.nav.accounts') },
        { key: 'tax_codes', href: prefixedRoute('accounting.tax-codes.index'), label: t('accounting.nav.tax_codes') },
        { key: 'tax_policies', href: prefixedRoute('accounting.tax-policies.index'), label: t('accounting.nav.tax_policies') },
        { key: 'periods', href: prefixedRoute('accounting.periods.index'), label: t('accounting.nav.periods') },
        { key: 'opening', href: prefixedRoute('accounting.opening-balances.create'), label: t('accounting.nav.opening') },
        { key: 'fixed_assets', href: prefixedRoute('accounting.fixed-assets.index'), label: t('accounting.nav.fixed_assets') },
        { key: 'budgets', href: prefixedRoute('accounting.budgets.index'), label: t('accounting.nav.budgets') },
    ];

    const groups: NavGroup[] = [
        {
            id: 'reports',
            label: t('accounting.nav.groups.reports'),
            icon: '📈',
            keys: reports.map((item) => item.key),
            items: reports,
        },
        {
            id: 'setup',
            label: t('accounting.nav.groups.setup'),
            icon: '⚙️',
            keys: setup.map((item) => item.key),
            items: setup,
        },
    ];

    const activeGroup = groups.find((group) => group.keys.includes(active));
    const activeLeaf =
        [...primary, ...reports, ...setup].find((item) => item.key === active) ?? null;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={title}
                    description={
                        activeGroup && activeLeaf ? (
                            <>
                                {activeGroup.label}
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">/</span>
                                {activeLeaf.label}
                            </>
                        ) : undefined
                    }
                    actions={headerActions}
                />
            }
        >
            <Head title={title} />

            {/* Accounting Sub-Navigation Bar */}
            <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
                <nav className="flex items-center gap-1.5 overflow-x-auto" aria-label={t('accounting.nav.aria')}>
                    {primary.map((link) => {
                        const isLinkActive = active === link.key;
                        return (
                            <Link key={link.key} href={link.href} className={tabClass(isLinkActive)}>
                                {link.icon && <span>{link.icon}</span>}
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}

                    {groups.map((group) => {
                        const groupActive = group.keys.includes(active);

                        return (
                            <Menu key={group.id} as="div" className="relative shrink-0">
                                <MenuButton className={tabClass(groupActive)}>
                                    {group.icon && <span>{group.icon}</span>}
                                    <span>{group.label}</span>
                                    <ChevronDownIcon
                                        className={`h-4 w-4 ${groupActive ? 'text-white/80' : 'text-slate-400'}`}
                                    />
                                </MenuButton>

                                <MenuItems
                                    transition
                                    anchor="bottom start"
                                    className="z-50 mt-1 w-64 origin-top-left rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                >
                                    <div className="px-2.5 pb-1.5 pt-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {group.label}
                                        </p>
                                    </div>
                                    {group.items.map((item) => {
                                        const selected = active === item.key;

                                        return (
                                            <MenuItem key={item.key}>
                                                <Link
                                                    href={item.href}
                                                    className={[
                                                        'flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-xs font-semibold transition',
                                                        selected
                                                            ? 'bg-indigo-50 dark:bg-indigo-950/40 font-bold text-indigo-700 dark:text-indigo-300'
                                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
                                                    ].join(' ')}
                                                >
                                                    <span>{item.label}</span>
                                                    {selected && (
                                                        <span className="text-indigo-600 dark:text-indigo-400">
                                                            <CheckIcon />
                                                        </span>
                                                    )}
                                                </Link>
                                            </MenuItem>
                                        );
                                    })}
                                </MenuItems>
                            </Menu>
                        );
                    })}
                </nav>
            </div>

            {children}
        </DynamicLayout>
    );
}
