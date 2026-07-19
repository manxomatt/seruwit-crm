import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentItem, DocumentType, formatDate, formatDaysUntil, getStatusBadge } from '../../../../documentUtils';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    status: string;
}

interface Props {
    vehicle: Vehicle;
    types: DocumentType[];
    documents: DocumentItem[];
    can: { create: boolean; update: boolean; delete: boolean; verify: boolean };
}

export default function Index({ vehicle, types, documents, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [toDelete, setToDelete] = useState<DocumentItem | null>(null);
    const [processing, setProcessing] = useState(false);

    // Group documents by type (show only the latest active per type)
    const activeByType = new Map<number, DocumentItem>();
    const historyByType = new Map<number, DocumentItem[]>();

    for (const doc of documents) {
        if (!doc.deleted_at) {
            if (!activeByType.has(doc.document_type_id)) {
                activeByType.set(doc.document_type_id, doc);
            }
        } else {
            const list = historyByType.get(doc.document_type_id) ?? [];
            list.push(doc);
            historyByType.set(doc.document_type_id, list);
        }
    }

    const confirmDelete = () => {
        if (!toDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.vehicles.documents.destroy', [vehicle.id, toDelete.id]), {
            preserveScroll: true,
            onSuccess: () => setToDelete(null),
            onFinish: () => setProcessing(false),
        });
    };

    const handleVerify = (doc: DocumentItem) => {
        router.post(prefixedRoute('fleet.vehicles.documents.verify', [vehicle.id, doc.id]), {}, {
            preserveScroll: true,
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {vehicle.name}
                        </h2>
                        <p className="text-sm text-gray-500">{vehicle.plate_number}</p>
                    </div>
                    <div className="flex gap-2">
                        {can.create && (
                            <Link href={prefixedRoute('fleet.vehicles.documents.create', vehicle.id)}>
                                <PrimaryButton>Upload Dokumen</PrimaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('fleet.vehicles.show', vehicle.id)}>
                            <SecondaryButton>← Kembali</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Dokumen – ${vehicle.name}`} />

            <DocumentNav />

            <div className="space-y-4">
                {types.map((type) => {
                    const active = activeByType.get(type.id);
                    const history = historyByType.get(type.id) ?? [];
                    const badge = active ? getStatusBadge(active.status) : null;

                    return (
                        <div key={type.id} className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{type.name}</span>
                                    {type.is_required && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            Wajib
                                        </span>
                                    )}
                                    {badge && (
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}>
                                            {badge.label}
                                        </span>
                                    )}
                                    {!active && (
                                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                                            Belum ada
                                        </span>
                                    )}
                                </div>
                                {can.create && (
                                    <Link
                                        href={`${prefixedRoute('fleet.vehicles.documents.create', vehicle.id)}?type=${type.id}`}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        {active ? 'Perbarui' : 'Upload'}
                                    </Link>
                                )}
                            </div>

                            {active && (
                                <div className="px-6 py-4">
                                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500">No. Dokumen</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{active.document_number ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500">Diterbitkan</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{formatDate(active.issued_at)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500">Berlaku Hingga</dt>
                                            <dd className={`mt-1 text-sm ${active.status === 'expired' ? 'font-medium text-red-600' : active.status === 'expiring_soon' ? 'font-medium text-yellow-700' : 'text-gray-900'}`}>
                                                {formatDate(active.expires_at)}
                                                {active.expires_at && (
                                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                                        ({formatDaysUntil(active.expires_at)})
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500">Diverifikasi</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {active.verified_at ? (
                                                    <span className="text-green-700">✓ {active.verifier?.name}</span>
                                                ) : (
                                                    <span className="text-gray-400">Belum</span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>

                                    {active.media && (
                                        <div className="mt-3">
                                            <a
                                                href={active.media.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                {active.media.original_name}
                                            </a>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-3">
                                        <Link
                                            href={prefixedRoute('fleet.vehicles.documents.show', [vehicle.id, active.id])}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Detail &amp; Riwayat
                                        </Link>
                                        {can.verify && !active.verified_at && (
                                            <button
                                                onClick={() => handleVerify(active)}
                                                className="text-xs text-green-600 hover:text-green-800"
                                            >
                                                Tandai Terverifikasi
                                            </button>
                                        )}
                                        {can.delete && (
                                            <button
                                                onClick={() => setToDelete(active)}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {history.length > 0 && (
                                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                                    <p className="text-xs text-gray-400">{history.length} riwayat sebelumnya</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <ConfirmDeleteDialog
                show={toDelete !== null}
                title="Hapus Dokumen"
                message={`Hapus dokumen ${toDelete?.document_type?.name ?? ''} ini? Data akan masuk arsip (bisa dipulihkan).`}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
                processing={processing}
            />
        </DynamicLayout>
    );
}
