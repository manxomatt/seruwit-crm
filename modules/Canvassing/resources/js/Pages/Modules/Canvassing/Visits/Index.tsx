import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, router } from '@inertiajs/react';

interface Visit { id: number; salesperson: { id: number; name: string }; partner: { name: string }; checked_in_at: string; checked_out_at: string | null; outcome: string; }
interface Paginated { data: Visit[]; links: { url: string | null; label: string; active: boolean }[]; }
interface Props { visits: Paginated; filters: { salesperson_id?: string; outcome?: string; date?: string }; }

const outcomeColor = (o: string) => ({
    pending: 'bg-yellow-100 text-yellow-700',
    contacted: 'bg-blue-100 text-blue-700',
    interested: 'bg-green-100 text-green-700',
    not_interested: 'bg-red-100 text-red-700',
    no_contact: 'bg-gray-100 text-gray-500',
    callback: 'bg-purple-100 text-purple-700',
})[o] ?? 'bg-gray-100 text-gray-500';

export default function VisitsIndex({ visits, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const filter = (key: string, value: string) => {
        router.get(prefixedRoute('canvassing.visits.index'), { ...filters, [key]: value }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout header="Canvassing">
            <Head title="All Visits" />
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Link href={prefixedRoute('canvassing.index')} className="mb-1 block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Dashboard</Link>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">All Visits</h1>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <input type="date" value={filters.date ?? ''} onChange={(e) => filter('date', e.target.value)} className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <select value={filters.outcome ?? ''} onChange={(e) => filter('outcome', e.target.value)} className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <option value="">All outcomes</option>
                        <option value="pending">In Progress</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="no_contact">No Contact</option>
                        <option value="callback">Callback</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {['Partner', 'Salesperson', 'Check In', 'Duration', 'Outcome', ''].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {visits.data.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No visits found.</td></tr>
                            )}
                            {visits.data.map((v) => {
                                const duration = v.checked_out_at
                                    ? Math.round((new Date(v.checked_out_at).getTime() - new Date(v.checked_in_at).getTime()) / 60000) + ' min'
                                    : <span className="text-orange-500">Open</span>;
                                return (
                                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{v.partner.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            <Link href={prefixedRoute('canvassing.salespeople.show', v.salesperson.id)} className="hover:underline">{v.salesperson.name}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{new Date(v.checked_in_at).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{duration}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${outcomeColor(v.outcome)}`}>{v.outcome.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={prefixedRoute('canvassing.visits.show', v.id)} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">View</Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center gap-1">
                    {visits.links.map((link, i) => (
                        <Link key={i} href={link.url ?? '#'} dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} />
                    ))}
                </div>
            </div>
        </DynamicLayout>
    );
}
