import PageHeader from '@/Components/PageHeader';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

export type ExpensesNavKey = 'dashboard' | 'claims' | 'advances' | 'categories';

interface Props {
    active: ExpensesNavKey;
    title: string;
    headerActions?: ReactNode;
    children: ReactNode;
}

function tabClass(active: boolean): string {
    return [
        'inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0',
        active
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
    ].join(' ');
}

export default function ExpensesShell({ active, title, headerActions, children }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const links: Array<{ key: ExpensesNavKey; href: string; label: string; icon: string }> = [
        { key: 'dashboard', href: prefixedRoute('expenses.dashboard'), label: 'Ringkasan', icon: '📊' },
        { key: 'claims', href: prefixedRoute('expenses.claims.index'), label: 'Pengeluaran & Petty Cash', icon: '🧾' },
        { key: 'advances', href: prefixedRoute('expenses.advances.index'), label: 'Kasbon & Uang Jalan', icon: '💸' },
        { key: 'categories', href: prefixedRoute('expenses.categories.index'), label: 'Kategori Biaya', icon: '🏷️' },
    ];

    return (
        <DynamicLayout header={<PageHeader title={title} actions={headerActions} />}>
            <Head title={title} />

            <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
                <nav className="flex items-center gap-1.5 overflow-x-auto" aria-label="Navigasi Pengeluaran & Kasbon">
                    {links.map((link) => (
                        <Link key={link.key} href={link.href} className={tabClass(active === link.key)}>
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <Link
                    href={prefixedRoute('accounting.dashboard')}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <span>📚</span>
                    <span>Ke Buku Besar (Accounting)</span>
                </Link>
            </div>

            {children}
        </DynamicLayout>
    );
}
