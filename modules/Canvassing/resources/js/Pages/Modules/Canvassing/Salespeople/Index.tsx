import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';

interface Salesperson { id: number; name: string; employee_code: string | null; area: string | null; phone: string | null; is_active: boolean; visits_count: number; }
interface Paginated { data: Salesperson[]; links: { url: string | null; label: string; active: boolean }[]; }
interface Props { salespeople: Paginated; filters: { search?: string; active?: string }; }

export default function SalespeopleIndex({ salespeople, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const search = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.get(prefixedRoute('canvassing.salespeople.index'), { ...filters, search: e.target.value }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout header="Canvassing">
            <Head title="Salespeople" />
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <Link href={prefixedRoute('canvassing.index')} className="mb-1 block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Dashboard</Link>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Salespeople</h1>
                    </div>
                    <Link href={prefixedRoute('canvassing.salespeople.create')}><PrimaryButton>Add Salesperson</PrimaryButton></Link>
                </div>

                <div className="mb-4 flex items-center gap-3">
                    <TextInput placeholder="Search name or area…" defaultValue={filters.search ?? ''} onChange={search} className="w-64" />
                    <select
                        value={filters.active ?? ''}
                        onChange={(e) => router.get(prefixedRoute('canvassing.salespeople.index'), { ...filters, active: e.target.value }, { preserveState: true, replace: true })}
                        className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {['Name', 'Code', 'Area', 'Phone', 'Visits', 'Status', ''].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {salespeople.data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No salespeople found.</td></tr>
                            )}
                            {salespeople.data.map((sp) => (
                                <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                        <Link href={prefixedRoute('canvassing.salespeople.show', sp.id)} className="hover:underline">{sp.name}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{sp.employee_code ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{sp.area ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{sp.phone ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{sp.visits_count}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {sp.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm">
                                        <Link href={prefixedRoute('canvassing.salespeople.edit', sp.id)} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Edit</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center gap-1">
                    {salespeople.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </DynamicLayout>
    );
}
