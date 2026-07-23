import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface User { id: number; name: string; email: string; }
interface Salesperson { id: number; name: string; employee_code: string | null; area: string | null; phone: string | null; email: string | null; is_active: boolean; notes: string | null; user: User | null; }
interface Target { id: number; year: number; month: number; target_visits: number; target_new_partners: number; notes: string | null; }
interface Visit { id: number; partner: { name: string }; checked_in_at: string; checked_out_at: string | null; outcome: string; }
interface Paginated { data: Visit[]; links: { url: string | null; label: string; active: boolean }[]; }

interface Props { salesperson: Salesperson; visits: Paginated; targets: Target[]; currentTarget: Target | null; thisMonthVisits: number; }

const outcomeColor = (o: string) => ({
    pending: 'bg-yellow-100 text-yellow-700',
    contacted: 'bg-blue-100 text-blue-700',
    interested: 'bg-green-100 text-green-700',
    not_interested: 'bg-red-100 text-red-700',
    no_contact: 'bg-gray-100 text-gray-500',
    callback: 'bg-purple-100 text-purple-700',
})[o] ?? 'bg-gray-100 text-gray-500';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SalespersonShow({ salesperson, visits, targets, currentTarget, thisMonthVisits }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showTargetForm, setShowTargetForm] = useState(false);
    const [targetForm, setTargetForm] = useState({
        target_visits: currentTarget?.target_visits ?? 0,
        target_new_partners: currentTarget?.target_new_partners ?? 0,
        notes: currentTarget?.notes ?? '',
    });

    const saveTarget = () => {
        const url = currentTarget
            ? prefixedRoute('canvassing.targets.update', currentTarget.id)
            : prefixedRoute('canvassing.targets.store');
        const method = currentTarget ? 'patch' : 'post';
        router[method](url, {
            ...targetForm,
            salesperson_id: salesperson.id,
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
        }, { onSuccess: () => setShowTargetForm(false) });
    };

    return (
        <DynamicLayout header="Canvassing">
            <Head title={salesperson.name} />
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-4">
                    <Link href={prefixedRoute('canvassing.salespeople.index')} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Salespeople</Link>
                </div>

                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{salesperson.name}</h1>
                        {salesperson.area && <p className="mt-0.5 text-sm text-gray-500">{salesperson.area}</p>}
                        <div className="mt-1 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${salesperson.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {salesperson.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {salesperson.employee_code && <span className="text-xs text-gray-400">{salesperson.employee_code}</span>}
                        </div>
                    </div>
                    <Link href={prefixedRoute('canvassing.salespeople.edit', salesperson.id)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Edit
                    </Link>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Details */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact</h3>
                        <dl className="space-y-1 text-sm">
                            <div><dt className="text-gray-400">Phone</dt><dd className="text-gray-900 dark:text-white">{salesperson.phone ?? '—'}</dd></div>
                            <div><dt className="text-gray-400">Email</dt><dd className="text-gray-900 dark:text-white">{salesperson.email ?? '—'}</dd></div>
                            <div><dt className="text-gray-400">Login</dt><dd className="text-gray-900 dark:text-white">{salesperson.user ? salesperson.user.email : 'No account linked'}</dd></div>
                        </dl>
                    </div>

                    {/* This month */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">This Month</h3>
                        <div className="text-3xl font-bold text-emerald-600">{thisMonthVisits}</div>
                        <p className="text-sm text-gray-500">visits completed</p>
                        {currentTarget && (
                            <div className="mt-2">
                                <div className="mb-1 flex justify-between text-xs text-gray-500">
                                    <span>Target: {currentTarget.target_visits}</span>
                                    <span>{Math.min(100, Math.round((thisMonthVisits / currentTarget.target_visits) * 100))}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (thisMonthVisits / currentTarget.target_visits) * 100)}%` }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current target */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Target {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
                            </h3>
                            <button onClick={() => setShowTargetForm(!showTargetForm)} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                                {showTargetForm ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                        {showTargetForm ? (
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs text-gray-500">Target Visits</label>
                                    <input type="number" min="0" value={targetForm.target_visits} onChange={(e) => setTargetForm((p) => ({ ...p, target_visits: Number(e.target.value) }))} className="mt-0.5 w-full rounded border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Target New Partners</label>
                                    <input type="number" min="0" value={targetForm.target_new_partners} onChange={(e) => setTargetForm((p) => ({ ...p, target_new_partners: Number(e.target.value) }))} className="mt-0.5 w-full rounded border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <button onClick={saveTarget} className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Save Target</button>
                            </div>
                        ) : currentTarget ? (
                            <dl className="space-y-1 text-sm">
                                <div className="flex justify-between"><dt className="text-gray-400">Visits</dt><dd className="font-semibold text-gray-900 dark:text-white">{currentTarget.target_visits}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-400">New Partners</dt><dd className="font-semibold text-gray-900 dark:text-white">{currentTarget.target_new_partners}</dd></div>
                            </dl>
                        ) : (
                            <p className="text-sm text-gray-400">No target set for this month.</p>
                        )}
                    </div>
                </div>

                {/* Visits */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Visit History</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {['Partner', 'Check In', 'Duration', 'Outcome'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {visits.data.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No visits yet.</td></tr>
                            )}
                            {visits.data.map((v) => {
                                const duration = v.checked_out_at
                                    ? Math.round((new Date(v.checked_out_at).getTime() - new Date(v.checked_in_at).getTime()) / 60000) + ' min'
                                    : 'Open';
                                return (
                                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                            <Link href={prefixedRoute('canvassing.visits.show', v.id)} className="hover:underline">{v.partner.name}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(v.checked_in_at).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{duration}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${outcomeColor(v.outcome)}`}>{v.outcome.replace('_', ' ')}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="flex justify-center gap-1 p-3">
                        {visits.links.map((link, i) => (
                            <Link key={i} href={link.url ?? '#'} dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`rounded px-2 py-1 text-xs ${link.active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} />
                        ))}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
