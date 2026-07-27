import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import CanvassingNav from '../../../../CanvassingNav';

interface Photo {
    id: number;
    path: string;
    url: string;
}

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

interface Props {
    visit: Visit;
}

const outcomeColor = (o: string): string =>
    ({
        pending: 'bg-yellow-100 text-yellow-700',
        contacted: 'bg-blue-100 text-blue-700',
        interested: 'bg-green-100 text-green-700',
        not_interested: 'bg-red-100 text-red-700',
        no_contact: 'bg-gray-100 text-gray-500',
        callback: 'bg-purple-100 text-purple-700',
    })[o] ?? 'bg-gray-100 text-gray-500';

export default function VisitShow({ visit }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const duration = visit.checked_out_at
        ? Math.round((new Date(visit.checked_out_at).getTime() - new Date(visit.checked_in_at).getTime()) / 60000)
        : null;

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{visit.partner.name}</h2>
                    <span className={`rounded-md px-3 py-1 text-sm font-semibold ${outcomeColor(visit.outcome)}`}>
                        {t(`canvassing.outcomes.${visit.outcome}`, undefined, visit.outcome)}
                    </span>
                </div>
            }
        >
            <Head title={t('canvassing.visits.show_head', { name: visit.partner.name })} />

            <CanvassingNav />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('canvassing.visits.details')}
                    </h3>
                    <dl className="space-y-2 text-sm">
                        <div>
                            <dt className="text-gray-400">{t('canvassing.visits.salesperson')}</dt>
                            <dd>
                                <Link
                                    href={prefixedRoute('canvassing.salespeople.show', visit.salesperson.id)}
                                    className="font-medium text-indigo-600 hover:underline"
                                >
                                    {visit.salesperson.name}
                                </Link>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-400">{t('canvassing.visits.check_in')}</dt>
                            <dd className="text-gray-900">{new Date(visit.checked_in_at).toLocaleString(localeTag)}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-400">{t('canvassing.visits.check_out')}</dt>
                            <dd className="text-gray-900">
                                {visit.checked_out_at ? (
                                    new Date(visit.checked_out_at).toLocaleString(localeTag)
                                ) : (
                                    <span className="text-orange-500">{t('canvassing.visits.still_open')}</span>
                                )}
                            </dd>
                        </div>
                        {duration !== null && (
                            <div>
                                <dt className="text-gray-400">{t('canvassing.visits.duration')}</dt>
                                <dd className="text-gray-900">{t('canvassing.visits.duration_min', { count: duration })}</dd>
                            </div>
                        )}
                        {visit.submitter && (
                            <div>
                                <dt className="text-gray-400">{t('canvassing.visits.submitted_by')}</dt>
                                <dd className="text-gray-900">{visit.submitter.name}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('canvassing.visits.location')}
                    </h3>
                    {visit.latitude && visit.longitude ? (
                        <div className="space-y-2 text-sm">
                            <p className="tabular-nums text-gray-600">
                                {visit.latitude}, {visit.longitude}
                            </p>
                            <a
                                href={`https://maps.google.com/?q=${visit.latitude},${visit.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {t('canvassing.visits.open_maps')}
                            </a>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">{t('canvassing.visits.no_gps')}</p>
                    )}
                    {visit.notes && (
                        <div className="mt-4">
                            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {t('canvassing.visits.notes')}
                            </h4>
                            <p className="text-sm text-gray-700">{visit.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {visit.photos.length > 0 && (
                <div className="mt-4 bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('canvassing.visits.photos', { count: visit.photos.length })}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {visit.photos.map((photo) => (
                            <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
                                <img src={photo.url} alt="Visit photo" className="aspect-square w-full rounded-md object-cover" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </DynamicLayout>
    );
}
