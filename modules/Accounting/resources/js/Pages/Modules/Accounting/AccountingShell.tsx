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
    | 'bank'
    | 'opening'
    | 'tax_codes'
    | 'fixed_assets'
    | 'budgets';

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
}

interface NavGroup {
    id: 'reports' | 'setup';
    label: string;
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
        'inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
        active
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800',
    ].join(' ');
}

export default function AccountingShell({ active, title, headerActions, children }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const primary: NavLink[] = [
        { key: 'dashboard', href: prefixedRoute('accounting.dashboard'), label: t('accounting.nav.dashboard') },
        { key: 'journals', href: prefixedRoute('accounting.journals.index'), label: t('accounting.nav.journals') },
        { key: 'bank', href: prefixedRoute('accounting.bank-accounts.index'), label: t('accounting.nav.bank') },
    ];

    const reports: NavLink[] = [
        { key: 'trial_balance', href: prefixedRoute('accounting.reports.trial-balance'), label: t('accounting.nav.trial_balance') },
        { key: 'profit_loss', href: prefixedRoute('accounting.reports.profit-loss'), label: t('accounting.nav.profit_loss') },
        { key: 'balance_sheet', href: prefixedRoute('accounting.reports.balance-sheet'), label: t('accounting.nav.balance_sheet') },
        { key: 'cash_flow', href: prefixedRoute('accounting.reports.cash-flow'), label: t('accounting.nav.cash_flow') },
        { key: 'general_ledger', href: prefixedRoute('accounting.reports.general-ledger'), label: t('accounting.nav.general_ledger') },
        { key: 'partner_statement', href: prefixedRoute('accounting.reports.partner-statement'), label: t('accounting.nav.partner_statement') },
    ];

    const setup: NavLink[] = [
        { key: 'accounts', href: prefixedRoute('accounting.accounts.index'), label: t('accounting.nav.accounts') },
        { key: 'tax_codes', href: prefixedRoute('accounting.tax-codes.index'), label: t('accounting.nav.tax_codes') },
        { key: 'periods', href: prefixedRoute('accounting.periods.index'), label: t('accounting.nav.periods') },
        { key: 'opening', href: prefixedRoute('accounting.opening-balances.create'), label: t('accounting.nav.opening') },
        { key: 'fixed_assets', href: prefixedRoute('accounting.fixed-assets.index'), label: t('accounting.nav.fixed_assets') },
        { key: 'budgets', href: prefixedRoute('accounting.budgets.index'), label: t('accounting.nav.budgets') },
    ];

    const groups: NavGroup[] = [
        {
            id: 'reports',
            label: t('accounting.nav.groups.reports'),
            keys: reports.map((item) => item.key),
            items: reports,
        },
        {
            id: 'setup',
            label: t('accounting.nav.groups.setup'),
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
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-gray-800">{title}</h2>
                        {activeGroup && activeLeaf && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                {activeGroup.label}
                                <span className="mx-1.5 text-gray-300">/</span>
                                {activeLeaf.label}
                            </p>
                        )}
                    </div>
                    {headerActions}
                </div>
            }
        >
            <Head title={title} />

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex gap-5 overflow-x-auto" aria-label={t('accounting.nav.aria')}>
                    {primary.map((link) => (
                        <Link key={link.key} href={link.href} className={tabClass(active === link.key)}>
                            {link.label}
                        </Link>
                    ))}

                    {groups.map((group) => {
                        const groupActive = group.keys.includes(active);

                        return (
                            <Menu key={group.id} as="div" className="relative shrink-0">
                                <MenuButton className={tabClass(groupActive)}>
                                    {group.label}
                                    <ChevronDownIcon
                                        className={`h-4 w-4 ${groupActive ? 'text-indigo-500' : 'text-gray-400'}`}
                                    />
                                </MenuButton>

                                <MenuItems
                                    transition
                                    anchor="bottom start"
                                    className="z-40 mt-1 w-64 origin-top-left rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                >
                                    <div className="px-2.5 pb-1.5 pt-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
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
                                                        'flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition',
                                                        selected
                                                            ? 'bg-indigo-50 font-medium text-indigo-700'
                                                            : 'text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900',
                                                    ].join(' ')}
                                                >
                                                    <span>{item.label}</span>
                                                    {selected && (
                                                        <span className="text-indigo-600">
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
