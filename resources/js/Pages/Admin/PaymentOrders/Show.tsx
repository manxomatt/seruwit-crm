import DynamicLayout from '@/Layouts/DynamicLayout';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface PaymentOrder {
    id: number;
    type: string;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    currency: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    transfer_proof_path: string | null;
    transfer_note: string | null;
    rejection_reason: string | null;
    expires_at: string;
    confirmed_at: string | null;
    rejected_at: string | null;
    created_at: string;
    proof_url: string | null;
    tenant?: {
        id: string;
        name: string;
        status: string;
        trial_ends_at: string | null;
    } | null;
    onboarding_session?: {
        id: number;
        company_name: string;
        subdomain: string;
    } | null;
    plan: {
        id: number;
        name: string;
        price: string;
        interval: string;
    };
    subscription: {
        id: number;
        status: string;
        ends_at: string | null;
    } | null;
    confirmedBy: { id: number; name: string } | null;
    rejectedBy: { id: number; name: string } | null;
}

interface Props {
    paymentOrder: PaymentOrder;
}

const STATUS_STYLES: Record<string, { label_key: string; dot: string; badge: string; border: string }> = {
    pending: {
        label_key: 'pending',
        dot: 'bg-slate-400',
        badge: 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700',
        border: 'border-slate-200/80 dark:border-slate-800',
    },
    awaiting_confirmation: {
        label_key: 'awaiting_confirmation',
        dot: 'bg-amber-500 animate-pulse',
        badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
        border: 'border-amber-200/60 dark:border-amber-800/50',
    },
    confirmed: {
        label_key: 'confirmed',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
        border: 'border-emerald-200/60 dark:border-emerald-800/50',
    },
    rejected: {
        label_key: 'rejected',
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
        border: 'border-rose-200/60 dark:border-rose-800/50',
    },
    expired: {
        label_key: 'expired',
        dot: 'bg-slate-400',
        badge: 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800',
        border: 'border-slate-200/80 dark:border-slate-800',
    },
    cancelled: {
        label_key: 'cancelled',
        dot: 'bg-slate-400',
        badge: 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800',
        border: 'border-slate-200/80 dark:border-slate-800',
    },
};

function CopyButton({ value, copyLabel }: { value: string; copyLabel: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            type="button"
            onClick={copy}
            title={copyLabel}
            className="ml-1.5 inline-flex items-center rounded-lg p-1 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
            {copied ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">Copied!</span>
            ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
            )}
        </button>
    );
}

function Row({ label, value, copyValue, copyLabel }: { label: string; value: React.ReactNode; copyValue?: string; copyLabel?: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 py-2.5 last:border-0">
            <span className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <span className="flex items-center gap-0.5 text-right text-xs font-bold text-slate-900 dark:text-white">
                {value}
                {copyValue && copyLabel && <CopyButton value={copyValue} copyLabel={copyLabel} />}
            </span>
        </div>
    );
}

export default function PaymentOrdersShow({ paymentOrder }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const { prefixedRoute } = useRoutePrefix();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [proofExpanded, setProofExpanded] = useState(false);

    const cfg = STATUS_STYLES[paymentOrder.status] ?? STATUS_STYLES['pending'];
    const canConfirm = paymentOrder.status === 'pending' || paymentOrder.status === 'awaiting_confirmation';
    const canReject = paymentOrder.status === 'pending' || paymentOrder.status === 'awaiting_confirmation';
    const isActionable = canConfirm || canReject;

    const fmt = (price: string): string => 'Rp ' + Number(price).toLocaleString('id-ID');
    const fmtDate = (iso: string): string => new Date(iso).toLocaleString(localeTag, { dateStyle: 'medium', timeStyle: 'short' });
    const fmtDateShort = (iso: string): string => new Date(iso).toLocaleDateString(localeTag, { dateStyle: 'medium' });

    const handleConfirm = () => {
        setProcessing(true);
        router.post(prefixedRoute('payment-orders.confirm', paymentOrder.id), {}, {
            onSuccess: () => setShowConfirmModal(false),
            onFinish: () => setProcessing(false),
        });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) return;
        setProcessing(true);
        router.post(prefixedRoute('payment-orders.reject', paymentOrder.id), { rejection_reason: rejectionReason }, {
            onSuccess: () => setShowRejectModal(false),
            onFinish: () => setProcessing(false),
        });
    };

    const isImage = (url: string | null, path?: string | null): boolean => {
        const target = path || url;
        if (!target) return false;
        return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(target);
    };

    const pageTitle = t('payment_orders.show.page_title').replace(':id', String(paymentOrder.id));

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={pageTitle}
                    actions={
                        <Link href={prefixedRoute('payment-orders.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('payment_orders.show.back')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={pageTitle} />

            <div className="mx-auto max-w-5xl space-y-6">

                {/* Hero Card */}
                <div className={`relative overflow-hidden rounded-3xl border ${cfg.border} bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8`}>
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        {/* Left Info */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{pageTitle}</h1>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                    {t(`payment_orders.statuses.${paymentOrder.status}`, {}, paymentOrder.status)}
                                </span>
                                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    {t(`payment_orders.types.${paymentOrder.type}`, {}, paymentOrder.type)}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    🏢 {paymentOrder.tenant ? (
                                        <Link
                                            href={prefixedRoute('tenants.show', paymentOrder.tenant.id)}
                                            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            {paymentOrder.tenant.name}
                                        </Link>
                                    ) : (
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {paymentOrder.onboarding_session?.company_name ?? 'Onboarding Registration'} ({paymentOrder.onboarding_session?.subdomain})
                                        </span>
                                    )}
                                </span>
                                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                                    📦 {paymentOrder.plan.name} / {paymentOrder.plan.interval}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-mono text-slate-400">
                                <span>📅 {t('payment_orders.show.created_at').replace(':date', fmtDate(paymentOrder.created_at))}</span>
                                {paymentOrder.expires_at && (
                                    <span>⏳ {t('payment_orders.show.expires_at').replace(':date', fmtDate(paymentOrder.expires_at))}</span>
                                )}
                            </div>
                        </div>

                        {/* Right Total + Actions */}
                        <div className="flex shrink-0 flex-col items-start sm:items-end gap-4">
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.show.total_transfer_label')}</p>
                                <p className="mt-1 text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                                    {fmt(paymentOrder.total_amount)}
                                </p>
                            </div>

                            {isActionable && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50 text-xs font-bold shadow-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 transition"
                                    >
                                        ❌ {t('payment_orders.show.actions.reject')}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmModal(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition"
                                    >
                                        ✅ {t('payment_orders.show.actions.confirm')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-5">

                    {/* Left Column (3/5) */}
                    <div className="space-y-6 lg:col-span-3">

                        {/* Amount Breakdown */}
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                📊 {t('payment_orders.show.breakdown.title')}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">{t('payment_orders.show.breakdown.plan_price')}</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{fmt(paymentOrder.amount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        {t('payment_orders.show.breakdown.unique_code')}
                                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            +{paymentOrder.unique_code}
                                        </span>
                                    </span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">Rp {paymentOrder.unique_code.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="my-2 border-t border-dashed border-slate-100 dark:border-slate-800" />
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-900 dark:text-white">{t('payment_orders.show.breakdown.total')}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">{fmt(paymentOrder.total_amount)}</span>
                                        <CopyButton value={String(Number(paymentOrder.total_amount))} copyLabel={t('payment_orders.show.copy')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bank Transfer Instructions */}
                        {(paymentOrder.bank_name || paymentOrder.bank_account_number) && (
                            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                    🏛️ {t('payment_orders.show.bank.title')}
                                </h3>
                                <div>
                                    {paymentOrder.bank_name && (
                                        <Row label={t('payment_orders.show.bank.name')} value={paymentOrder.bank_name} />
                                    )}
                                    {paymentOrder.bank_account_number && (
                                        <Row
                                            label={t('payment_orders.show.bank.account_number')}
                                            value={<span className="font-mono">{paymentOrder.bank_account_number}</span>}
                                            copyValue={paymentOrder.bank_account_number}
                                            copyLabel={t('payment_orders.show.copy')}
                                        />
                                    )}
                                    {paymentOrder.bank_account_name && (
                                        <Row label={t('payment_orders.show.bank.account_name')} value={paymentOrder.bank_account_name} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Workspace Details */}
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                🏢 {t('payment_orders.show.workspace.title')}
                            </h3>
                            <div>
                                {paymentOrder.tenant ? (
                                    <>
                                        <Row
                                            label={t('payment_orders.show.workspace.tenant')}
                                            value={
                                                <Link
                                                    href={prefixedRoute('tenants.show', paymentOrder.tenant.id)}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {paymentOrder.tenant.name}
                                                </Link>
                                            }
                                        />
                                        <Row label={t('payment_orders.show.workspace.tenant_status')} value={
                                            <span className="capitalize">{paymentOrder.tenant.status}</span>
                                        } />
                                        {paymentOrder.tenant.trial_ends_at && (
                                            <Row label={t('payment_orders.show.workspace.trial_ends')} value={fmtDateShort(paymentOrder.tenant.trial_ends_at)} />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Row
                                            label={t('payment_orders.show.workspace.tenant')}
                                            value={paymentOrder.onboarding_session?.company_name ?? 'Onboarding Registration'}
                                        />
                                        <Row
                                            label="Subdomain"
                                            value={paymentOrder.onboarding_session?.subdomain ?? '-'}
                                        />
                                        <Row
                                            label={t('payment_orders.show.workspace.tenant_status')}
                                            value={<span className="text-amber-600 dark:text-amber-400 font-bold">Awaiting Provisioning</span>}
                                        />
                                    </>
                                )}
                                <Row label={t('payment_orders.show.workspace.plan')} value={paymentOrder.plan.name} />
                                <Row label={t('payment_orders.show.workspace.interval')} value={<span className="capitalize">{paymentOrder.plan.interval}</span>} />
                                <Row
                                    label={t('payment_orders.show.workspace.order_type')}
                                    value={t(`payment_orders.types.${paymentOrder.type === 'renew' ? 'renew' : 'activate_new'}`, {}, paymentOrder.type)}
                                />
                            </div>
                        </div>

                        {/* Confirmed Block */}
                        {paymentOrder.confirmed_at && (
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/40 p-5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 text-sm">
                                    ✅
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{t('payment_orders.show.confirmed_block.title')}</p>
                                    <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                                        {t('payment_orders.show.confirmed_block.by')
                                            .replace(':name', paymentOrder.confirmedBy?.name ?? '')
                                            .replace(':date', fmtDate(paymentOrder.confirmed_at))}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Rejected Block */}
                        {paymentOrder.rejected_at && (
                            <div className="flex items-start gap-3 rounded-2xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 p-5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-sm">
                                    ❌
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-rose-900 dark:text-rose-200">{t('payment_orders.show.rejected_block.title')}</p>
                                    <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-400">
                                        {t('payment_orders.show.rejected_block.by')
                                            .replace(':name', paymentOrder.rejectedBy?.name ?? '')
                                            .replace(':date', fmtDate(paymentOrder.rejected_at))}
                                    </p>
                                    {paymentOrder.rejection_reason && (
                                        <p className="mt-2 rounded-xl bg-rose-100/80 dark:bg-rose-900/60 p-3 text-xs italic text-rose-900 dark:text-rose-200">
                                            "{paymentOrder.rejection_reason}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (2/5) */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* Transfer Proof Card */}
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                🖼️ {t('payment_orders.show.proof.title')}
                            </h3>

                            {paymentOrder.proof_url ? (
                                <div className="space-y-4">
                                    {isImage(paymentOrder.proof_url, paymentOrder.transfer_proof_path) ? (
                                        <div className="relative group cursor-zoom-in rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800" onClick={() => setProofExpanded(true)}>
                                            <img
                                                src={paymentOrder.proof_url}
                                                alt={t('payment_orders.show.proof.title')}
                                                className="w-full object-cover max-h-72"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition backdrop-blur-xs">
                                                <span className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-bold shadow-md">
                                                    🔍 {t('payment_orders.show.proof.expand')}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <a
                                            href={paymentOrder.proof_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                        >
                                            📥 {t('payment_orders.show.proof.download')}
                                        </a>
                                    )}

                                    {paymentOrder.transfer_note && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.show.proof.tenant_note')}</p>
                                            <p className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs italic text-slate-700 dark:text-slate-300">
                                                "{paymentOrder.transfer_note}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <span className="text-3xl mb-2 inline-block">📄</span>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('payment_orders.show.proof.empty_title')}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">{t('payment_orders.show.proof.empty_hint')}</p>
                                </div>
                            )}
                        </div>

                        {/* Subscription Info */}
                        {paymentOrder.subscription && (
                            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                    🔄 {t('payment_orders.show.subscription.title')}
                                </h3>
                                <div>
                                    <Row label={t('payment_orders.show.subscription.id')} value={`#${paymentOrder.subscription.id}`} />
                                    <Row label={t('payment_orders.show.subscription.status')} value={<span className="capitalize">{paymentOrder.subscription.status}</span>} />
                                    {paymentOrder.subscription.ends_at && (
                                        <Row label={t('payment_orders.show.subscription.ends_at')} value={fmtDateShort(paymentOrder.subscription.ends_at)} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Proof Lightbox Modal */}
            {proofExpanded && paymentOrder.proof_url && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
                    onClick={() => setProofExpanded(false)}
                >
                    <img
                        src={paymentOrder.proof_url}
                        alt={t('payment_orders.show.proof.title')}
                        className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setProofExpanded(false)}
                        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Confirm Modal */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-lg">
                            ✅
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('payment_orders.show.confirm_modal.title')}</h3>
                            <p className="text-xs text-slate-400">{t('payment_orders.show.confirm_modal.subtitle')}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 p-4 text-xs text-emerald-900 dark:text-emerald-200">
                        {t('payment_orders.show.confirm_modal.body')
                            .replace(':amount', fmt(paymentOrder.total_amount))
                            .replace(':tenant', paymentOrder.tenant?.name ?? paymentOrder.onboarding_session?.company_name ?? 'Onboarding Registration')
                            .replace(':plan', paymentOrder.plan.name)}
                    </div>
                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton onClick={() => setShowConfirmModal(false)} disabled={processing} className="!rounded-xl text-xs">
                            {t('payment_orders.show.confirm_modal.cancel')}
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={handleConfirm}
                            disabled={processing}
                            className="!rounded-xl text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700"
                        >
                            {processing ? t('payment_orders.show.confirm_modal.saving') : t('payment_orders.show.confirm_modal.submit')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-lg">
                            ❌
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('payment_orders.show.reject_modal.title')}</h3>
                            <p className="text-xs text-slate-400">{t('payment_orders.show.reject_modal.subtitle')}</p>
                        </div>
                    </div>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="mt-2 block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white shadow-sm focus:border-rose-400 focus:ring-rose-400"
                        placeholder={t('payment_orders.show.reject_modal.placeholder')}
                    />
                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton onClick={() => setShowRejectModal(false)} disabled={processing} className="!rounded-xl text-xs">
                            {t('payment_orders.show.reject_modal.cancel')}
                        </SecondaryButton>
                        <button
                            onClick={handleReject}
                            disabled={processing || !rejectionReason.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                        >
                            {processing ? t('payment_orders.show.reject_modal.saving') : t('payment_orders.show.reject_modal.submit')}
                        </button>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
