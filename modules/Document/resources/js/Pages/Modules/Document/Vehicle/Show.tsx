import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentItem, formatDate, getStatusBadge } from '../../../../documentUtils';
import PageHeader from '@/Components/PageHeader';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
}

interface Props {
    vehicle: Vehicle;
    document: DocumentItem;
    history: DocumentItem[];
    can: { update: boolean; delete: boolean; verify: boolean };
}

export default function Show({ vehicle, document: doc, history, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const badge = getStatusBadge(doc.status, t);

    const handleVerify = () => {
        router.post(prefixedRoute('fleet.vehicles.documents.verify', [vehicle.id, doc.id]), {}, {
            preserveScroll: true,
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={`${doc.document_type.name} · ${vehicle.name} (${vehicle.plate_number})`}
                    actions={
                        <div className="flex gap-2">
                            {can.update && (
                                <Link
                                    href={`${prefixedRoute('fleet.vehicles.documents.create', vehicle.id)}?type=${doc.document_type_id}`}
                                >
                                    <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                        📤 {t('document.show.upload_new')}
                                    </PrimaryButton>
                                </Link>
                            )}
                            <Link href={prefixedRoute('fleet.vehicles.documents.index', vehicle.id)}>
                                <SecondaryButton className="!rounded-xl text-xs">
                                    ← {t('document.entity_docs.back')}
                                </SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={`${doc.document_type.name} – ${vehicle.name}`} />

            <DocumentNav />

            <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                📜 {t('document.show.active_detail')}
                            </h3>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.classes}`}>
                                {badge.label}
                            </span>
                        </div>
                    </div>

                    <div>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.show.type')}</dt>
                                <dd className="mt-1 font-bold text-slate-900 dark:text-white">{doc.document_type.name}</dd>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.show.number')}</dt>
                                <dd className="mt-1 font-mono font-bold text-slate-900 dark:text-white">{doc.document_number ?? '—'}</dd>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.show.issued')}</dt>
                                <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300">{formatDate(doc.issued_at, localeTag)}</dd>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.show.expires')}</dt>
                                <dd className={`mt-1 font-mono ${doc.status === 'expired' ? 'font-bold text-rose-600 dark:text-rose-400' : doc.status === 'expiring_soon' ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                    {formatDate(doc.expires_at, localeTag)}
                                </dd>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.show.uploaded_by')}</dt>
                                <dd className="mt-1 text-slate-900 dark:text-white font-bold">{doc.uploader?.name ?? '—'}</dd>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.show.verified_by')}</dt>
                                <dd className="mt-1 font-bold">
                                    {doc.verified_at ? (
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            ✓ {doc.verifier?.name ?? '—'} ({formatDate(doc.verified_at, localeTag)})
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-normal">{t('document.show.not_verified')}</span>
                                    )}
                                </dd>
                            </div>
                            {doc.notes && (
                                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                                    <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.show.notes')}</dt>
                                    <dd className="mt-1 text-slate-800 dark:text-slate-200">{doc.notes}</dd>
                                </div>
                            )}
                        </dl>

                        {doc.media && (
                            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('document.show.file')}</p>
                                <a
                                    href={doc.media.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition"
                                >
                                    <span>📎</span>
                                    {doc.media.original_name}
                                </a>
                            </div>
                        )}

                        {can.verify && !doc.verified_at && (
                            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <button
                                    onClick={handleVerify}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-500 shadow-sm transition"
                                >
                                    ✓ {t('document.show.mark_verified')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {history.length > 0 && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                ⏳ {t('document.show.history')}
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            {history.map((h) => (
                                <div key={h.id} className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-bold font-mono text-slate-900 dark:text-white">
                                            {h.document_number ?? t('document.show.no_number')}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {t('document.show.validity_range', {
                                                from: formatDate(h.issued_at, localeTag),
                                                to: formatDate(h.expires_at, localeTag),
                                            })}
                                            {h.uploader && ` · ${t('document.show.upload_by', { name: h.uploader.name })}`}
                                        </p>
                                    </div>
                                    {h.media && (
                                        <a
                                            href={h.media.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            {t('document.show.view_file')}
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

