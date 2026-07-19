import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentItem, formatDate, getStatusBadge } from '../../../../documentUtils';

interface Driver {
    id: number;
    name: string;
    license_number: string;
}

interface Props {
    driver: Driver;
    document: DocumentItem;
    history: DocumentItem[];
    can: { update: boolean; delete: boolean; verify: boolean };
}

export default function Show({ driver, document: doc, history, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const badge = getStatusBadge(doc.status);

    const handleVerify = () => {
        router.post(prefixedRoute('fleet.drivers.documents.verify', [driver.id, doc.id]), {}, {
            preserveScroll: true,
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {doc.document_type.name}
                        </h2>
                        <p className="text-sm text-gray-500">{driver.name} · {driver.license_number}</p>
                    </div>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link
                                href={`${prefixedRoute('fleet.drivers.documents.create', driver.id)}?type=${doc.document_type_id}`}
                            >
                                <PrimaryButton>Upload Baru</PrimaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('fleet.drivers.documents.index', driver.id)}>
                            <SecondaryButton>← Kembali</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`${doc.document_type.name} – ${driver.name}`} />

            <DocumentNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">Detail Dokumen Aktif</h3>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}>
                                {badge.label}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Jenis</dt>
                                <dd className="mt-1 text-sm text-gray-900">{doc.document_type.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">No. Dokumen</dt>
                                <dd className="mt-1 text-sm text-gray-900">{doc.document_number ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Tanggal Terbit</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(doc.issued_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Berlaku Hingga</dt>
                                <dd className={`mt-1 text-sm ${doc.status === 'expired' ? 'font-medium text-red-600' : doc.status === 'expiring_soon' ? 'font-medium text-yellow-700' : 'text-gray-900'}`}>
                                    {formatDate(doc.expires_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Diupload oleh</dt>
                                <dd className="mt-1 text-sm text-gray-900">{doc.uploader?.name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Diverifikasi oleh</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {doc.verified_at ? (
                                        <span className="text-green-700">
                                            ✓ {doc.verifier?.name ?? '—'} ({formatDate(doc.verified_at)})
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Belum diverifikasi</span>
                                    )}
                                </dd>
                            </div>
                            {doc.notes && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Catatan</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{doc.notes}</dd>
                                </div>
                            )}
                        </dl>

                        {doc.media && (
                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <p className="text-sm font-medium text-gray-500">File Dokumen</p>
                                <a
                                    href={doc.media.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50 hover:text-indigo-800"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    {doc.media.original_name}
                                </a>
                            </div>
                        )}

                        {can.verify && !doc.verified_at && (
                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <button
                                    onClick={handleVerify}
                                    className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                                >
                                    ✓ Tandai Sudah Diverifikasi
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {history.length > 0 && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="font-semibold text-gray-900">Riwayat Sebelumnya</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {history.map((h) => (
                                <div key={h.id} className="flex items-center justify-between px-6 py-4">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            {h.document_number ?? 'Tanpa nomor'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Berlaku: {formatDate(h.issued_at)} → {formatDate(h.expires_at)}
                                            {h.uploader && ` · Upload: ${h.uploader.name}`}
                                        </p>
                                    </div>
                                    {h.media && (
                                        <a
                                            href={h.media.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            Lihat file
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
