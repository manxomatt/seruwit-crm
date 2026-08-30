import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface OrderProps {
    id: number;
    type: string;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    currency: string;
    expires_at: string;
    transfer_proof_path: string | null;
    transfer_note: string | null;
    rejection_reason: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    proof_url: string | null;
    subscribed_vehicles?: number | null;
    upgrade_from_vehicles?: number | null;
    price_per_vehicle?: string | number | null;
}

interface PlanProps {
    id: number;
    name: string;
    interval: string;
}

interface Props {
    order: OrderProps;
    plan: PlanProps | null;
}

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function CopyIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
        </svg>
    );
}

function ClockIcon({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    );
}

function CloudUploadIcon({ className = 'h-8 w-8' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
    );
}

export default function SubscriptionPayment({ order, plan }: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        proof: null as File | null,
        transfer_note: '',
    });

    const expiryDate = order.expires_at ? new Date(order.expires_at) : null;

    useEffect(() => {
        if (!expiryDate) return;

        const updateTimer = () => {
            const now = Date.now();
            const diff = expiryDate.getTime() - now;

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
                return;
            }

            const totalSec = Math.floor(diff / 1000);
            const hours = Math.floor(totalSec / 3600);
            const minutes = Math.floor((totalSec % 3600) / 60);
            const seconds = totalSec % 60;

            setTimeLeft({ hours, minutes, seconds, isExpired: false });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [order.expires_at]);

    const copyToClipboard = (text: string, field: string) => {
        if (!navigator?.clipboard) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2500);
        });
    };

    const handleFileChange = (file: File | null) => {
        setData('proof', file);
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const cancelOrder = () => {
        post(route('module.subscription.cancel', order.id), {
            onFinish: () => setShowCancelDialog(false),
        });
    };

    const formatPrice = (price: string | number): string => {
        const num = Number(price);
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    const submitProof = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!data.proof) return;
        post(route('module.subscription.proof', order.id), {
            onSuccess: () => {
                reset('proof', 'transfer_note');
                setPreviewUrl(null);
            },
        });
    };

    const isTerminalExpired = timeLeft.isExpired || order.status === 'expired' || order.status === 'cancelled';
    const canSubmitProof = !isTerminalExpired && (order.status === 'pending' || order.status === 'awaiting_confirmation' || order.status === 'rejected');
    const canCancel = !isTerminalExpired && (order.status === 'pending' || order.status === 'awaiting_confirmation');

    return (
        <DynamicLayout>
            <Head title={`Pembayaran Langganan #${order.id}`} />

            {/* ── Top Hero ── */}
            <div className="relative overflow-hidden bg-slate-900 py-10 sm:py-14 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.25),rgba(255,255,255,0))]" />
                
                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                                Pesanan Pembayaran #{order.id}
                            </div>
                            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">
                                Selesaikan Transfer Langganan
                            </h1>
                            <p className="mt-1 text-sm text-slate-300">
                                Paket: <strong className="text-white">{plan?.name || 'Paket Langganan'}</strong>
                                {order.subscribed_vehicles ? (
                                    <>
                                        {' '}· Kapasitas:{' '}
                                        <strong className="text-teal-300">
                                            {order.subscribed_vehicles} Unit
                                            {order.type === 'upgrade' && order.upgrade_from_vehicles ? ` (+${Math.max(1, order.subscribed_vehicles - order.upgrade_from_vehicles)} upgrade)` : ''}
                                        </strong>
                                    </>
                                ) : null}
                                {' '}· Tagihan Total:{' '}
                                <strong className="text-teal-300">{formatPrice(order.total_amount)}</strong>
                            </p>
                        </div>

                        {/* Live Expiry Countdown */}
                        {!isTerminalExpired && order.status === 'pending' && (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:text-right backdrop-blur-sm">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>Sisa Waktu Pembayaran</span>
                                </div>
                                <p className="mt-1 font-mono text-xl font-black tracking-wider text-amber-200">
                                    {String(timeLeft.hours).padStart(2, '0')}:
                                    {String(timeLeft.minutes).padStart(2, '0')}:
                                    {String(timeLeft.seconds).padStart(2, '0')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stepper Progress */}
                    <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                        <div className="flex items-center gap-2 text-teal-400">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 border border-teal-400 text-xs">
                                ✓
                            </span>
                            <span className="hidden sm:inline">1. Pilih Paket</span>
                        </div>
                        <div className={`flex items-center gap-2 ${order.status === 'confirmed' ? 'text-teal-400' : 'text-teal-300'}`}>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs">
                                2
                            </span>
                            <span className="font-extrabold">2. Transfer Bank</span>
                        </div>
                        <div className={`flex items-center gap-2 ${order.status === 'confirmed' ? 'text-teal-400' : 'text-slate-400'}`}>
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${order.status === 'confirmed' ? 'bg-teal-500/20 border border-teal-400' : 'bg-slate-800 border border-slate-700'}`}>
                                {order.status === 'confirmed' ? '✓' : '3'}
                            </span>
                            <span className="hidden sm:inline">3. Aktivasi Otomatis</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
                {/* Flash Message */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                        <CheckIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* ── Status Banners ── */}
                {isTerminalExpired ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-lg font-bold text-slate-900">
                            {order.status === 'cancelled' ? 'Pesanan Telah Dibatalkan' : 'Pesanan Telah Kedaluwarsa'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            Silakan kembali ke halaman paket untuk memilih dan membuat pesanan pembayaran baru.
                        </p>
                        <Link
                            href={route('module.subscription.index')}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-slate-800 transition"
                        >
                            ← Pilih Paket Baru
                        </Link>
                    </div>
                ) : order.status === 'confirmed' ? (
                    <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                                <CheckIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                    Berhasil Dikonfirmasi
                                </span>
                                <h3 className="mt-1 text-lg font-black text-slate-900">
                                    Pembayaran Diterima & Paket Langganan Telah Aktif!
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    Terima kasih! Seluruh fitur dan modul untuk paket <strong>{plan?.name}</strong> kini telah aktif dan dapat langsung digunakan.
                                </p>
                                <Link
                                    href={route('module.subscription.index')}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition"
                                >
                                    Lihat Status Langganan
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : order.status === 'awaiting_confirmation' ? (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white animate-pulse">
                                <ClockIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-900">
                                    Sedang Diverifikasi
                                </span>
                                <h4 className="mt-1 text-base font-black text-slate-900">
                                    Bukti Pembayaran Diterima!
                                </h4>
                                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                                    Tim kami sedang memverifikasi bukti transfer Anda (biasanya membutuhkan <strong>5 - 15 menit</strong> pada jam kerja). Halaman ini akan otomatis terupdate setelah konfirmasi.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : order.status === 'rejected' ? (
                    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
                        <h4 className="font-black text-red-900">Bukti Transfer Ditolak</h4>
                        <p className="mt-1 text-sm text-red-700">
                            Alasan: <strong>{order.rejection_reason || 'Bukti transfer tidak terbaca atau nominal tidak sesuai.'}</strong>
                        </p>
                        <p className="mt-2 text-xs text-red-600">
                            Silakan unggah kembali bukti transfer yang valid di bawah.
                        </p>
                    </div>
                ) : null}

                {/* ── Transfer Instruction Card ── */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/75 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs">
                                💳
                            </span>
                            <h3 className="font-bold text-slate-900">Tujuan Transfer Bank</h3>
                        </div>
                        {order.bank_name && (
                            <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-xs font-black tracking-wider uppercase text-slate-800">
                                {order.bank_name}
                            </span>
                        )}
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Bank Details Grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Bank & Account Number */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Nomor Rekening
                                </p>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">
                                        {order.bank_account_number || '-'}
                                    </span>
                                    {order.bank_account_number && (
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(order.bank_account_number!, 'account')}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                                        >
                                            {copiedField === 'account' ? (
                                                <span className="text-teal-600 font-bold">✓ Tersalin</span>
                                            ) : (
                                                <>
                                                    <CopyIcon className="h-3.5 w-3.5" />
                                                    <span>Salin</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                {order.bank_account_name && (
                                    <p className="mt-1.5 text-xs text-slate-600">
                                        Atas Nama: <strong className="text-slate-800">{order.bank_account_name}</strong>
                                    </p>
                                )}
                            </div>

                            {/* Total Exact Amount */}
                            <div className="rounded-2xl border-2 border-teal-600 bg-gradient-to-br from-teal-50/60 to-white p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                                        Jumlah Transfer Tepat
                                    </p>
                                    <span className="rounded-md bg-teal-200/80 px-2 py-0.5 text-[10px] font-black uppercase text-teal-900">
                                        Penting
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="font-mono text-xl sm:text-2xl font-black text-teal-950">
                                        {formatPrice(order.total_amount)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(String(Number(order.total_amount)), 'amount')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 shadow-sm transition"
                                    >
                                        {copiedField === 'amount' ? (
                                            <span className="text-white font-bold">✓ Tersalin</span>
                                        ) : (
                                            <>
                                                <CopyIcon className="h-3.5 w-3.5" />
                                                <span>Salin Nominal</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="mt-1.5 text-xs text-teal-800">
                                    Nominal: {formatPrice(order.amount)} + kode unik{' '}
                                    <strong className="text-teal-950 font-black">+{order.unique_code}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Critical Reminder Alert */}
                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs sm:text-sm text-amber-900 leading-relaxed">
                            ⚠️ <strong>PENTING:</strong> Mohon transfer sejumlah <strong>{formatPrice(order.total_amount)}</strong> sesuai 3 digit kode unik terakhir untuk verifikasi instan secara otomatis oleh sistem kami.
                        </div>
                    </div>
                </div>

                {/* ── Proof of Transfer Upload Card ── */}
                {canSubmitProof && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    {order.status === 'rejected' ? 'Unggah Ulang Bukti Transfer' : 'Konfirmasi Bukti Transfer'}
                                </h3>
                                <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                                    Unggah foto / screenshot struk atau bukti transfer M-Banking Anda.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitProof} className="space-y-5">
                            {/* Upload Dropzone */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    File Bukti Transfer (JPG, PNG, PDF maks. 5MB)
                                </label>
                                
                                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:border-teal-500 hover:bg-teal-50/30 transition">
                                    {previewUrl ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <img
                                                src={previewUrl}
                                                alt="Preview Bukti"
                                                className="max-h-48 rounded-xl object-contain shadow-sm border border-slate-200"
                                            />
                                            <p className="text-xs font-bold text-teal-700">
                                                File terpilih: {data.proof?.name}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="rounded-full bg-teal-100 p-3 text-teal-700">
                                                <CloudUploadIcon className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">
                                                Klik untuk memilih atau seret file ke sini
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Format JPG, PNG, PDF hingga 5MB
                                            </p>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            handleFileChange(file);
                                        }}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                </div>

                                {errors.proof && (
                                    <p className="mt-2 text-xs font-semibold text-red-600">{errors.proof}</p>
                                )}
                            </div>

                            {/* Transfer Note */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Catatan Transfer (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={data.transfer_note}
                                    onChange={(e) => setData('transfer_note', e.target.value)}
                                    placeholder="Contoh: Transfer dari Rek BCA a.n Hendra Wijaya"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                />
                                {errors.transfer_note && (
                                    <p className="mt-1 text-xs text-red-600">{errors.transfer_note}</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !data.proof}
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-teal-700 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-700/25 hover:bg-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <>
                                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                            Mengunggah...
                                        </>
                                    ) : (
                                        'Kirim Bukti Pembayaran'
                                    )}
                                </button>

                                {canCancel && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCancelDialog(true)}
                                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        Batalkan Pesanan
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Uploaded Proof Preview (when already submitted) ── */}
                {order.proof_url && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                        <h4 className="font-bold text-slate-900">Bukti Pembayaran yang Terunggah</h4>
                        <div className="mt-3 flex items-center gap-4">
                            <a
                                href={order.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 transition"
                            >
                                👁️ Buka File Bukti Transfer
                            </a>
                            {order.transfer_note && (
                                <p className="text-xs text-slate-600">
                                    Catatan: <strong className="text-slate-800">{order.transfer_note}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Back to Subscription */}
                <div className="text-center pt-4">
                    <Link
                        href={route('module.subscription.index')}
                        className="text-xs font-bold text-slate-500 hover:text-teal-700 transition"
                    >
                        ← Kembali ke Daftar Paket Langganan
                    </Link>
                </div>
            </div>

            {/* Cancel Modal */}
            <ConfirmDeleteDialog
                show={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                onConfirm={cancelOrder}
                processing={processing}
                title="Batalkan pesanan pembayaran?"
                message="Pesanan ini akan dibatalkan dan tidak bisa diaktifkan kembali. Anda bisa membuat pesanan baru kapan saja dari halaman langganan."
                confirmText="Ya, batalkan pesanan"
                cancelText="Kembali"
                processingText="Membatalkan…"
            />
        </DynamicLayout>
    );
}

