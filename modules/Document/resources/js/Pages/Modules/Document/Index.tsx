import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link } from '@inertiajs/react';
import DocumentNav from '../../../DocumentNav';
import { DocumentItem, formatDate, formatDaysUntil, getStatusBadge } from '../../../documentUtils';

interface Props {
    summary: {
        expired: number;
        expiring_week: number;
        expiring_month: number;
    };
    documents: {
        data: (DocumentItem & {
            documentable: { id: number; name: string; plate_number?: string };
        })[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

export default function Index({ summary, documents }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Documents
                </h2>
            }
        >
            <Head title="Documents" />

            <DocumentNav />

            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Expired</p>
                    <p className="mt-1 text-3xl font-bold text-red-600">{summary.expired}</p>
                    <p className="mt-1 text-xs text-gray-500">Dokumen sudah lewat masa berlaku</p>
                </div>
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Expire minggu ini</p>
                    <p className="mt-1 text-3xl font-bold text-yellow-600">{summary.expiring_week}</p>
                    <p className="mt-1 text-xs text-gray-500">Dalam 7 hari ke depan</p>
                </div>
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Expire bulan ini</p>
                    <p className="mt-1 text-3xl font-bold text-orange-500">{summary.expiring_month}</p>
                    <p className="mt-1 text-xs text-gray-500">Dalam 30 hari ke depan</p>
                </div>
            </div>

            {/* Documents table */}
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-base font-semibold text-gray-900">
                        Dokumen Bermasalah &amp; Segera Expire
                    </h3>
                </div>

                {documents.data.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-sm text-gray-500">Semua dokumen valid. 🎉</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Entitas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Jenis Dokumen
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        No. Dokumen
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Berlaku Hingga
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Aksi</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {documents.data.map((doc) => {
                                    const badge = getStatusBadge(doc.status);
                                    const entityRoute =
                                        doc.documentable_type === 'vehicle'
                                            ? prefixedRoute('fleet.vehicles.documents.index', doc.documentable_id)
                                            : prefixedRoute('fleet.drivers.documents.index', doc.documentable_id);

                                    const entityLabel =
                                        doc.documentable_type === 'vehicle'
                                            ? `${doc.documentable.name} (${doc.documentable.plate_number ?? ''})`
                                            : doc.documentable.name;

                                    return (
                                        <tr key={doc.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <Link
                                                    href={entityRoute}
                                                    className="font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    {entityLabel}
                                                </Link>
                                                <span className="ml-1 text-xs capitalize text-gray-400">
                                                    ({doc.documentable_type})
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {doc.document_type.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {doc.document_number ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className={doc.status === 'expired' ? 'text-red-600 font-medium' : ''}>
                                                    {formatDate(doc.expires_at)}
                                                </span>
                                                <span className="ml-1 text-xs text-gray-400">
                                                    ({formatDaysUntil(doc.expires_at)})
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                <Link
                                                    href={entityRoute}
                                                    className="font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Upload Baru →
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {documents.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                        <p className="text-sm text-gray-700">
                            Total <span className="font-medium">{documents.total}</span> dokumen
                        </p>
                        <div className="flex gap-1">
                            {documents.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded px-3 py-1 text-sm ${link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                                ? 'text-gray-700 hover:bg-gray-100'
                                                : 'cursor-default text-gray-300'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
