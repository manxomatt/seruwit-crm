import ExpensesShell from '../ExpensesShell';

interface Props {
    categories: Array<{
        id: number;
        code: string;
        name: string;
        is_active: boolean;
        description?: string | null;
        claim_lines_count: number;
        account?: { id: number; code: string; name: string } | null;
    }>;
}

export default function ExpenseCategoriesIndex({ categories }: Props): JSX.Element {
    return (
        <ExpensesShell active="categories" title="Kategori Biaya & Pemetaan COA">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="py-2.5 pr-3">Kode</th>
                                <th className="py-2.5 px-3">Nama Kategori Biaya</th>
                                <th className="py-2.5 px-3">Akun Beban COA Default</th>
                                <th className="py-2.5 px-3">Deskripsi</th>
                                <th className="py-2.5 pl-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td className="py-3 pr-3 font-mono font-bold text-indigo-600">{cat.code}</td>
                                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{cat.name}</td>
                                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                                        {cat.account ? `${cat.account.code} — ${cat.account.name}` : '—'}
                                    </td>
                                    <td className="py-3 px-3 text-slate-500">{cat.description ?? '—'}</td>
                                    <td className="py-3 pl-3 text-right">
                                        <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                            {cat.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ExpensesShell>
    );
}
