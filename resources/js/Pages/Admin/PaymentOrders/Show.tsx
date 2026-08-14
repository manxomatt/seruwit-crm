import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

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
    tenant: {
        id: string;
        name: string;
        status: string;
        trial_ends_at: string | null;
    };
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

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; border: string; bg: string }> = {
    pending: {
        label: 'Menunggu Pembayaran',
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700 ring-slate-200',
        border: 'border-slate-200',
        bg: 'bg-slate-50',
    },
    awaiting_confirmation: {
        label: 'Menunggu Konfirmasi',
        dot: 'bg-amber-500 animate-pulse',
        badge: 'bg-amber-100 text-amber-800 ring-amber-200',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
    },
    confirmed: {
        label: 'Dikonfirmasi',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50',
    },
    rejected: {
        label: 'Ditolak',
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-800 ring-red-200',
        border: 'border-red-200',
        bg: 'bg-red-50',
    },
    expired: {
        label: 'Kedaluwarsa',
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-600 ring-slate-200',
        border: 'border-slate-200',
        bg: 'bg-slate-50',
    },
    cancelled: {
        label: 'Dibatalkan',
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-600 ring-slate-200',
        border: 'border-slate-200',
        bg: 'bg-slate-50',
    },
};

const fmt = (price: string): string => 'Rp ' + Number(price).toLocaleString('id-ID');
const fmtDate = (iso: string): string => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const fmtDateShort = (iso: string): string => new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'medium' });

function CopyButton({ value }: { value: string }) {
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
            title="Salin"
            className="ml-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
            {copied ? (
                <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
            )}
        </button>
    );
}

function Row({ label, value, copyValue }: { label: string; value: React.ReactNode; copyValue?: string }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm font-medium text-slate-800 text-right flex items-center gap-0.5">
                {value}
                {copyValue && <CopyButton value={copyValue} />}
            </span>
        </div>
    );
}

export default function PaymentOrdersShow({ paymentOrder }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [proofExpanded, setProofExpanded] = useState(false);

    const cfg = STATUS_CONFIG[paymentOrder.status] ?? STATUS_CONFIG['pending'];
    const canConfirm = paymentOrder.status === 'pending' || paymentOrder.status === 'awaiting_confirmation';
    const canReject = paymentOrder.status === 'pending' || paymentOrder.status === 'awaiting_confirmation';
    const isActionable = canConfirm || canReject;

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

    const isImage = (url: string | null): boolean => {
        if (!url) return false;
        return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
    };

    return (
        <DynamicLayout>
            <Head title={`Pesanan #${paymentOrder.id}`} />

            <div className="mx-auto max-w-5xl space-y-5">

                {/* Back + breadcrumb */}
                <div>
                    <Link
                        href={prefixedRoute('payment-orders.index')}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                        </svg>
                        Kembali ke daftar
                    </Link>
                </div>

                {/* ── Hero card ── */}
                <div className={`relative overflow-hidden rounded-2xl border ${cfg.border} bg-white shadow-sm`}>
                    {/* accent strip */}
                    <div className={`absolute inset-y-0 left-0 w-1 ${cfg.dot.replace('animate-pulse', '')}`} />

                    <div className="flex flex-col gap-5 px-7 py-6 sm:flex-row sm:items-start sm:justify-between">
                        {/* Left: identity */}
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-xl font-bold text-slate-900">Pesanan #{paymentOrder.id}</h1>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.badge}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                    {cfg.label}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                    {paymentOrder.type === 'renew' ? 'Perpanjangan' : 'Aktivasi'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 2.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zm2.5-.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 2.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z" clipRule="evenodd" />
                                    </svg>
                                    <Link
                                        href={prefixedRoute('tenants.show', paymentOrder.tenant.id)}
                                        className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
                                    >
                                        {paymentOrder.tenant.name}
                                    </Link>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                                        <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.1.644 4.313.987 6.61.987 2.297 0 4.51-.343 6.61-.987.135-.041.264-.09.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
                                    </svg>
                                    {paymentOrder.plan.name} / {paymentOrder.plan.interval}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                                <span>Dibuat {fmtDate(paymentOrder.created_at)}</span>
                                {paymentOrder.expires_at && (
                                    <span>· Kedaluwarsa {fmtDate(paymentOrder.expires_at)}</span>
                                )}
                            </div>
                        </div>

                        {/* Right: amount + actions */}
                        <div className="flex shrink-0 flex-col items-end gap-3">
                            <div className="text-right">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Transfer</p>
                                <p className="mt-0.5 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
                                    {fmt(paymentOrder.total_amount)}
                                </p>
                            </div>
                            {isActionable && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                        </svg>
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmModal(true)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                        Konfirmasi
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Main content ── */}
                <div className="grid gap-5 lg:grid-cols-5">

                    {/* Left column (3/5) */}
                    <div className="space-y-5 lg:col-span-3">

                        {/* Amount breakdown */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Rincian Nominal</p>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">Harga paket</span>
                                    <span className="font-mono text-sm font-medium text-slate-700">{fmt(paymentOrder.amount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">
                                        Kode unik
                                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">+{paymentOrder.unique_code}</span>
                                    </span>
                                    <span className="font-mono text-sm font-medium text-slate-700">Rp {paymentOrder.unique_code.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="my-2 border-t border-dashed border-slate-200" />
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800">Total transfer</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-base font-bold text-slate-900">{fmt(paymentOrder.total_amount)}</span>
                                        <CopyButton value={String(Number(paymentOrder.total_amount))} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bank transfer instructions */}
                        {(paymentOrder.bank_name || paymentOrder.bank_account_number) && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Instruksi Transfer</p>
                                <div>
                                    {paymentOrder.bank_name && (
                                        <Row label="Bank" value={paymentOrder.bank_name} />
                                    )}
                                    {paymentOrder.bank_account_number && (
                                        <Row
                                            label="No. Rekening"
                                            value={<span className="font-mono">{paymentOrder.bank_account_number}</span>}
                                            copyValue={paymentOrder.bank_account_number}
                                        />
                                    )}
                                    {paymentOrder.bank_account_name && (
                                        <Row label="Atas Nama" value={paymentOrder.bank_account_name} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tenant + plan detail */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Detail Workspace</p>
                            <div>
                                <Row
                                    label="Tenant"
                                    value={
                                        <Link
                                            href={prefixedRoute('tenants.show', paymentOrder.tenant.id)}
                                            className="text-teal-700 hover:text-teal-900 hover:underline"
                                        >
                                            {paymentOrder.tenant.name}
                                        </Link>
                                    }
                                />
                                <Row label="Status tenant" value={
                                    <span className="capitalize">{paymentOrder.tenant.status}</span>
                                } />
                                {paymentOrder.tenant.trial_ends_at && (
                                    <Row label="Trial berakhir" value={fmtDateShort(paymentOrder.tenant.trial_ends_at)} />
                                )}
                                <Row label="Paket" value={paymentOrder.plan.name} />
                                <Row label="Interval" value={<span className="capitalize">{paymentOrder.plan.interval}</span>} />
                                <Row label="Tipe pesanan" value={paymentOrder.type === 'renew' ? 'Perpanjangan' : 'Aktivasi baru'} />
                            </div>
                        </div>

                        {/* Status result: confirmed / rejected */}
                        {paymentOrder.confirmed_at && (
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-900">Pembayaran dikonfirmasi</p>
                                    <p className="mt-0.5 text-sm text-emerald-700">
                                        Oleh <span className="font-medium">{paymentOrder.confirmedBy?.name}</span> · {fmtDate(paymentOrder.confirmed_at)}
                                    </p>
                                </div>
                            </div>
                        )}
                        {paymentOrder.rejected_at && (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-red-900">Pembayaran ditolak</p>
                                    <p className="mt-0.5 text-sm text-red-700">
                                        Oleh <span className="font-medium">{paymentOrder.rejectedBy?.name}</span> · {fmtDate(paymentOrder.rejected_at)}
                                    </p>
                                    {paymentOrder.rejection_reason && (
                                        <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
                                            "{paymentOrder.rejection_reason}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column (2/5) */}
                    <div className="space-y-5 lg:col-span-2">

                        {/* Proof of transfer */}
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 pt-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bukti Transfer</p>
                            </div>
                            {paymentOrder.proof_url ? (
                                <>
                                    {isImage(paymentOrder.proof_url) ? (
                                        <div className="relative mt-3 cursor-zoom-in" onClick={() => setProofExpanded(true)}>
                                            <img
                                                src={paymentOrder.proof_url}
                                                alt="Bukti transfer"
                                                className="w-full object-cover"
                                                style={{ maxHeight: '300px', objectFit: 'cover', objectPosition: 'top' }}
                                            />
                                            <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/30 to-transparent opacity-0 transition hover:opacity-100">
                                                <span className="m-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                                    Perbesar ↗
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 px-5">
                                            <a
                                                href={paymentOrder.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
                                            >
                                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                                </svg>
                                                Unduh bukti transfer
                                            </a>
                                        </div>
                                    )}
                                    {paymentOrder.transfer_note && (
                                        <div className="px-5 pb-5 pt-3">
                                            <p className="text-xs font-medium text-slate-400">Catatan dari tenant</p>
                                            <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 italic">
                                                "{paymentOrder.transfer_note}"
                                            </p>
                                        </div>
                                    )}
                                    {!paymentOrder.transfer_note && <div className="pb-5" />}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    </span>
                                    <p className="mt-3 text-sm font-medium text-slate-500">Belum ada bukti transfer</p>
                                    <p className="mt-1 text-xs text-slate-400">Tenant belum mengunggah bukti pembayaran</p>
                                </div>
                            )}
                        </div>

                        {/* Subscription info */}
                        {paymentOrder.subscription && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Langganan Terkait</p>
                                <div>
                                    <Row label="ID Langganan" value={`#${paymentOrder.subscription.id}`} />
                                    <Row label="Status" value={<span className="capitalize">{paymentOrder.subscription.status}</span>} />
                                    {paymentOrder.subscription.ends_at && (
                                        <Row label="Berakhir" value={fmtDateShort(paymentOrder.subscription.ends_at)} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Proof lightbox */}
            {proofExpanded && paymentOrder.proof_url && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setProofExpanded(false)}
                >
                    <img
                        src={paymentOrder.proof_url}
                        alt="Bukti transfer"
                        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setProofExpanded(false)}
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                    <a
                        href={paymentOrder.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                        </svg>
                        Buka di tab baru
                    </a>
                </div>
            )}

            {/* Confirm Modal */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                        </span>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Konfirmasi Pembayaran</h3>
                            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                        </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        Anda akan mengkonfirmasi transfer sebesar <strong>{fmt(paymentOrder.total_amount)}</strong> dari <strong>{paymentOrder.tenant.name}</strong>.
                        Langganan paket <strong>{paymentOrder.plan.name}</strong> akan langsung diaktifkan.
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowConfirmModal(false)} disabled={processing}>Batal</SecondaryButton>
                        <button
                            onClick={handleConfirm}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {processing ? 'Menyimpan...' : 'Ya, Konfirmasi'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)}>
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </span>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Tolak Pembayaran</h3>
                            <p className="text-sm text-gray-500">Alasan akan dikirimkan ke tenant</p>
                        </div>
                    </div>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="mt-4 block w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-red-400 focus:ring-red-400"
                        placeholder="Contoh: Nominal transfer tidak sesuai, harap transfer persis Rp 500.123..."
                    />
                    <div className="mt-5 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowRejectModal(false)} disabled={processing}>Batal</SecondaryButton>
                        <button
                            onClick={handleReject}
                            disabled={processing || !rejectionReason.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Tolak Pembayaran'}
                        </button>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
