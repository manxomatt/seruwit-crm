import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link } from '@inertiajs/react';

interface Photo { id: number; path: string; url: string; }
interface Visit {
    id: number;
    salesperson: { id: number; name: string };
    partner: { id: number; name: string; phone: string | null };
    submitter: { name: string } | null;
    plan: { id: number; plan_date: string } | null;
    checked_in_at: string;
    checked_out_at: string | null;
    latitude: string | null;
    longitude: string | null;
    outcome: string;
    notes: string | null;
    photos: Photo[];
}
interface Props { visit: Visit; }

const outcomeColor = (o: string) => ({
    pending: 'bg-yellow-100 text-yellow-700',
    contacted: 'bg-blue-100 text-blue-700',
    interested: 'bg-green-100 text-green-700',
    not_interested: 'bg-red-100 text-red-700',
    no_contact: 'bg-gray-100 text-gray-500',
    callback: 'bg-purple-100 text-purple-700',
})[o] ?? 'bg-gray-100 text-gray-500';

export default function VisitShow({ visit }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const duration = visit.checked_out_at
        ? Math.round((new Date(visit.checked_out_at).getTime() - new Date(visit.checked_in_at).getTime()) / 60000)
        : null;

    return (
        <DynamicLayout header="Canvassing">
            <Head title={`Visit — ${visit.partner.name}`} />
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-4">
                    <Link href={prefixedRoute('canvassing.visits.index')} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← All Visits</Link>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{visit.partner.name}</h1>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${outcomeColor(visit.outcome)}`}>{visit.outcome.replace('_', ' ')}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Visit Details</h3>
                        <dl className="space-y-2 text-sm">
                            <div><dt className="text-gray-400">Salesperson</dt><dd><Link href={prefixedRoute('canvassing.salespeople.show', visit.salesperson.id)} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">{visit.salesperson.name}</Link></dd></div>
                            <div><dt className="text-gray-400">Check In</dt><dd className="text-gray-900 dark:text-white">{new Date(visit.checked_in_at).toLocaleString('id-ID')}</dd></div>
                            <div><dt className="text-gray-400">Check Out</dt><dd className="text-gray-900 dark:text-white">{visit.checked_out_at ? new Date(visit.checked_out_at).toLocaleString('id-ID') : <span className="text-orange-500">Still open</span>}</dd></div>
                            {duration !== null && <div><dt className="text-gray-400">Duration</dt><dd className="text-gray-900 dark:text-white">{duration} min</dd></div>}
                            {visit.submitter && <div><dt className="text-gray-400">Submitted by</dt><dd className="text-gray-900 dark:text-white">{visit.submitter.name}</dd></div>}
                        </dl>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</h3>
                        {visit.latitude && visit.longitude ? (
                            <div className="space-y-2 text-sm">
                                <p className="tabular-nums text-gray-600 dark:text-gray-300">{visit.latitude}, {visit.longitude}</p>
                                <a href={`https://maps.google.com/?q=${visit.latitude},${visit.longitude}`} target="_blank" rel="noreferrer" className="inline-block rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                    Open in Maps
                                </a>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No GPS data recorded</p>
                        )}
                        {visit.notes && (
                            <div className="mt-4">
                                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{visit.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {visit.photos.length > 0 && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Photos ({visit.photos.length})</h3>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {visit.photos.map((photo) => (
                                <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
                                    <img src={photo.url} alt="Visit photo" className="aspect-square w-full rounded-md object-cover" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
