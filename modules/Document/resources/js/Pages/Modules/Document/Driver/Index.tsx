import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentItem, DocumentType, formatDate, formatDaysUntil, getStatusBadge } from '../../../../documentUtils';
import PageHeader from '@/Components/PageHeader';

interface Driver {
    id: number;
    name: string;
    license_number: string;
    status: string;
}

interface Props {
    driver: Driver;
    types: DocumentType[];
    documents: DocumentItem[];
    can: { create: boolean; update: boolean; delete: boolean; verify: boolean };
}

export default function Index({ driver, types, documents, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [toDelete, setToDelete] = useState<DocumentItem | null>(null);
    const [processing, setProcessing] = useState(false);

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
        router.delete(prefixedRoute('fleet.drivers.documents.destroy', [driver.id, toDelete.id]), {
            preserveScroll: true,
            onSuccess: () => setToDelete(null),
            onFinish: () => setProcessing(false),
        });
    };

    const handleVerify = (doc: DocumentItem) => {
        router.post(prefixedRoute('fleet.drivers.documents.verify', [driver.id, doc.id]), {}, {
            preserveScroll: true,
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={`${driver.name} (${driver.license_number})`}
                    actions={
                        <div className="flex gap-2">
                            {can.create && (
                                <Link href={prefixedRoute('fleet.drivers.documents.create', driver.id)}>
                                    <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                        📤 {t('document.entity_docs.upload')}
                                    </PrimaryButton>
                                </Link>
                            )}
                            <Link href={prefixedRoute('fleet.drivers.show', driver.id)}>
                                <SecondaryButton className="!rounded-xl text-xs">
                                    ← {t('document.entity_docs.back')}
                                </SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('document.entity_docs.docs_head', { name: driver.name })} />

            <DocumentNav />

            <div className="space-y-4">
                {types.map((type) => {
                    const active = activeByType.get(type.id);
                    const history = historyByType.get(type.id) ?? [];
                    const badge = active ? getStatusBadge(active.status, t) : null;

                    return (
                        <div key={type.id} className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">{type.name}</span>
                                    {type.is_required && (
                                        <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                            {t('document.entity_docs.required_badge')}
                                        </span>
                                    )}
                                    {badge && (
                                        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.classes}`}>
                                            {badge.label}
                                        </span>
                                    )}
                                    {!active && (
                                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {t('document.entity_docs.none')}
                                        </span>
                                    )}
                                </div>
                                {can.create && (
                                    <Link
                                        href={`${prefixedRoute('fleet.drivers.documents.create', driver.id)}?type=${type.id}`}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        {active ? `🔄 ${t('document.entity_docs.renew')}` : `📤 ${t('document.entity_docs.upload_action')}`}
                                    </Link>
                                )}
                            </div>

                            {active && (
                                <div className="px-6 py-5">
                                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                                        <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.entity_docs.number')}</dt>
                                            <dd className="mt-1 font-mono font-bold text-slate-900 dark:text-white">{active.document_number ?? '—'}</dd>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.entity_docs.issued')}</dt>
                                            <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300">{formatDate(active.issued_at, localeTag)}</dd>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.entity_docs.expires')}</dt>
                                            <dd className={`mt-1 font-mono ${active.status === 'expired' ? 'font-bold text-rose-600 dark:text-rose-400' : active.status === 'expiring_soon' ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                {formatDate(active.expires_at, localeTag)}
                                                {active.expires_at && (
                                                    <span className="ml-1 text-[11px] font-normal text-slate-400">
                                                        ({formatDaysUntil(active.expires_at, t)})
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('document.entity_docs.verified')}</dt>
                                            <dd className="mt-1 text-slate-900 dark:text-white font-bold">
                                                {active.verified_at ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">✓ {active.verifier?.name}</span>
                                                ) : (
                                                    <span className="text-slate-400 font-normal">{t('document.entity_docs.not_verified')}</span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>

                                    {active.media && (
                                        <div className="mt-4">
                                            <a
                                                href={active.media.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                <span>📎</span>
                                                {active.media.original_name}
                                            </a>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        <Link
                                            href={prefixedRoute('fleet.drivers.documents.show', [driver.id, active.id])}
                                            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        >
                                            👁️ {t('document.entity_docs.detail_history')}
                                        </Link>
                                        {can.verify && !active.verified_at && (
                                            <button
                                                onClick={() => handleVerify(active)}
                                                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                            >
                                                ✓ {t('document.entity_docs.mark_verified')}
                                            </button>
                                        )}
                                        {can.delete && (
                                            <button
                                                onClick={() => setToDelete(active)}
                                                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                                            >
                                                🗑️ {t('common.delete')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {history.length > 0 && (
                                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-6 py-3">
                                    <p className="text-xs font-medium text-slate-400">
                                        {t('document.entity_docs.history_count', { count: history.length })}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <ConfirmDeleteDialog
                show={toDelete !== null}
                title={t('document.entity_docs.delete_title')}
                message={t('document.entity_docs.delete_message', {
                    type: toDelete?.document_type?.name ?? '',
                })}
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
                processing={processing}
            />
        </DynamicLayout>
    );
}

