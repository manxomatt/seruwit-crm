import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useEffect, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
}

interface CompanyBankAccount {
    id: number;
    name: string;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
}

interface Booking {
    code: string;
    public_token: string;
    status: string;
    channel: string;
    booker_phone: string | null;
    start_date: string | null;
    end_date: string | null;
    period_type: string;
    total_periods: number;
    rate_per_period: number;
    base_amount: number;
    deposit_amount: number;
    deposit_received: boolean;
    total_amount: number;
    pickup_location: string | null;
    return_location: string | null;
    reserved_until: string | null;
    cancelled_reason: string | null;
    vehicle: { id: number; name: string; plate_number: string; photo_url: string | null } | null;
    insurance_package: { id: number; name: string; amount: number } | null;
    can_pay_deposit: boolean;
    can_request_extend: boolean;
    cancel: {
        can_cancel: boolean;
        charge_fee: boolean;
        fee_amount: number;
        free_until: string | null;
        reason: string | null;
    };
    payment: {
        status: string;
        balance_due: number;
        can_pay_balance: boolean;
        invoices: Array<{ id: number; code: string; status: string; balance: number; total: number }>;
    };
    extend_request: {
        id: number;
        requested_end_date: string | null;
        estimated_periods: number;
        estimated_amount: number;
        status: string;
    } | null;
    documents: {
        ktp_uploaded: boolean;
        sim_uploaded: boolean;
        ktp_url: string | null;
        sim_url: string | null;
    };
    deposit_proof?: {
        path: string | null;
        url: string | null;
        status: string | null;
        uploaded_at: string | null;
        rejected_reason: string | null;
        bank_account_id: number | null;
    };
}

interface Props {
    brand: Brand;
    booking: Booking;
    gateway_available: boolean;
    company_bank_accounts?: CompanyBankAccount[];
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const fieldClassName =
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20';

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending_reserved: { label: 'Menunggu Deposit', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
    pending: { label: 'Kedaluwarsa / Pending', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    confirmed: { label: 'Reservasi Aktif', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
    active: { label: 'Sedang Disewa', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
    returned: { label: 'Dikembalikan', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300' },
    completed: { label: 'Selesai', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
    cancelled: { label: 'Dibatalkan', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
    cancelled_paid: { label: 'Dibatalkan', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
};

export default function BookingView({ brand, booking, gateway_available, company_bank_accounts = [] }: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [showCancel, setShowCancel] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [depositTab, setDepositTab] = useState<'transfer' | 'online'>('transfer');
    const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

    // Timer calculation for reserved_until
    useEffect(() => {
        if (booking.status !== 'pending_reserved' || !booking.reserved_until) {
            setTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const target = new Date(booking.reserved_until!).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('00:00:00 (Expired)');
                return;
            }

            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const format = (n: number) => String(n).padStart(2, '0');
            setTimeLeft(`${format(hours)}:${format(minutes)}:${format(seconds)}`);
        };

        updateTimer();
        const timerId = setInterval(updateTimer, 1000);
        return () => clearInterval(timerId);
    }, [booking.status, booking.reserved_until]);

    const payForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
    });

    const proofForm = useForm<{
        booker_phone: string;
        otp_code: string;
        company_bank_account_id: string;
        deposit_proof: File | null;
    }>({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        company_bank_account_id: company_bank_accounts.length > 0 ? String(company_bank_accounts[0].id) : '',
        deposit_proof: null,
    });

    const cancelForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        cancelled_reason: 'Dibatalkan oleh pemesan',
    });

    const extendForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        new_end_date: '',
        notes: '',
    });

    const docsForm = useForm<{
        booker_phone: string;
        otp_code: string;
        ktp: File | null;
        sim: File | null;
    }>({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        ktp: null,
        sim: null,
    });

    const invoiceForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        invoice_id: 0,
    });

    const sendOtp = async (phone: string) => {
        if (!phone) {
            alert('Masukkan nomor telepon terlebih dahulu');
            return;
        }
        try {
            const url = typeof route === 'function' && route().has('book.rental.otp')
                ? route('book.rental.otp')
                : '/book/rental/otp';
            const { data } = await axios.post(url, { booker_phone: phone });
            setOtpHint(data.debug_code ? `Kode OTP (Dev): ${data.debug_code}` : (data.message || 'OTP berhasil dikirim'));
            if (data.debug_code) {
                payForm.setData('otp_code', String(data.debug_code));
                proofForm.setData('otp_code', String(data.debug_code));
                cancelForm.setData('otp_code', String(data.debug_code));
                extendForm.setData('otp_code', String(data.debug_code));
                docsForm.setData('otp_code', String(data.debug_code));
                invoiceForm.setData('otp_code', String(data.debug_code));
            }
        } catch (err: any) {
            setOtpHint(err.response?.data?.message || 'Gagal mengirim OTP');
        }
    };

    const pay = (e: FormEvent) => {
        e.preventDefault();
        const url = typeof route === 'function' && route().has('book.rental.booking.pay_deposit')
            ? route('book.rental.booking.pay_deposit', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/pay-deposit`;
        payForm.post(url);
    };

    const submitProof = (e: FormEvent) => {
        e.preventDefault();
        proofForm.clearErrors();

        if (!proofForm.data.deposit_proof) {
            proofForm.setError('deposit_proof', 'Pilih file bukti transfer (Foto/PDF) terlebih dahulu');
            return;
        }

        if (!proofForm.data.booker_phone) {
            proofForm.setError('booker_phone', 'Nomor telepon pemesan wajib diisi');
            return;
        }

        if (!proofForm.data.otp_code || proofForm.data.otp_code.length !== 6) {
            proofForm.setError('otp_code', 'Kode OTP 6 digit wajib diisi. Klik tombol "OTP" untuk menerima kode');
            return;
        }

        const url = typeof route === 'function' && route().has('book.rental.booking.upload_deposit_proof')
            ? route('book.rental.booking.upload_deposit_proof', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/deposit-proof`;

        proofForm.post(url, {
            forceFormData: true,
        });
    };

    const cancel = (e: FormEvent) => {
        e.preventDefault();
        if (!confirm('Batalkan reservasi ini? Unit akan dilepas ke sistem.')) {
            return;
        }
        const url = typeof route === 'function' && route().has('book.rental.booking.cancel')
            ? route('book.rental.booking.cancel', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/cancel`;
        cancelForm.post(url);
    };

    const requestExtend = (e: FormEvent) => {
        e.preventDefault();
        const url = typeof route === 'function' && route().has('book.rental.booking.extend_request')
            ? route('book.rental.booking.extend_request', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/extend-request`;
        extendForm.post(url, {
            onSuccess: () => setShowExtend(false),
        });
    };

    const uploadDocuments = (e: FormEvent) => {
        e.preventDefault();
        const url = typeof route === 'function' && route().has('book.rental.booking.documents')
            ? route('book.rental.booking.documents', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/documents`;
        docsForm.post(url, {
            forceFormData: true,
            onSuccess: () => setShowDocs(false),
        });
    };

    const payInvoice = (e: FormEvent) => {
        e.preventDefault();
        if (payingInvoiceId === null) {
            return;
        }
        invoiceForm.setData('invoice_id', payingInvoiceId);
        const url = typeof route === 'function' && route().has('book.rental.booking.pay_invoice')
            ? route('book.rental.booking.pay_invoice', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/pay-invoice`;
        invoiceForm.post(url);
    };

    const statusBadge = statusBadgeConfig[booking.status] || {
        label: booking.status,
        color: 'text-slate-700',
        bg: 'bg-slate-100 border-slate-300',
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans antialiased pb-20">
            <Head title={`Reservasi ${booking.code} · ${brand.name}`} />

            {/* Header banner */}
            <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 pb-12 pt-6 text-white shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%)] pointer-events-none" />
                <div className="mx-auto max-w-xl px-4 relative z-10">
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('book.rental.search')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Sewa Lagi
                        </Link>
                        <span className="text-xs font-bold text-teal-400">{brand.name}</span>
                    </div>

                    {/* Code & status header */}
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2">
                            <span className="text-2xl font-mono font-extrabold tracking-wider text-white">{booking.code}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${statusBadge.bg} ${statusBadge.color}`}>
                                {statusBadge.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-xl px-4 -mt-6 relative z-20 space-y-5">
                {/* Flash Messages */}
                {(flash?.error || flash?.success) && (
                    <div className={`rounded-xl p-4 text-sm font-medium shadow-md ${flash.error ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                        {flash.error || flash.success}
                    </div>
                )}

                {/* Countdown Hold Banner */}
                {booking.status === 'pending_reserved' && (
                    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                                    <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">Menunggu Pembayaran Deposit</h3>
                                    <p className="text-xs text-amber-100">Unit ditahan sementara hingga waktu batas.</p>
                                </div>
                            </div>
                            {timeLeft && (
                                <div className="text-right font-mono text-base font-extrabold tracking-wider bg-black/20 px-3 py-1.5 rounded-xl border border-white/20">
                                    {timeLeft}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Vehicle & Booking Card */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-4">
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {booking.vehicle?.photo_url ? (
                                <img src={booking.vehicle.photo_url} alt={booking.vehicle.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Tidak ada foto</div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">{booking.vehicle?.name ?? 'Kendaraan'}</h2>
                            <p className="text-xs font-mono font-semibold text-slate-500">{booking.vehicle?.plate_number}</p>
                        </div>
                    </div>

                    {/* Schedule & Depot Summary */}
                    <div className="p-5 space-y-3.5 text-xs text-slate-700 border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                                <span className="block font-semibold text-slate-400 uppercase text-[10px]">Mulai Sewa</span>
                                <span className="font-bold text-slate-900 text-xs">{booking.start_date ?? '—'}</span>
                                {booking.pickup_location && (
                                    <span className="block text-[11px] text-slate-500 mt-1">{booking.pickup_location}</span>
                                )}
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                                <span className="block font-semibold text-slate-400 uppercase text-[10px]">Selesai Sewa</span>
                                <span className="font-bold text-slate-900 text-xs">{booking.end_date ?? '—'}</span>
                                {booking.return_location && (
                                    <span className="block text-[11px] text-slate-500 mt-1">{booking.return_location}</span>
                                )}
                            </div>
                        </div>

                        {booking.insurance_package && (
                            <div className="flex items-center justify-between rounded-xl bg-teal-50 p-3 border border-teal-200 text-teal-800">
                                <span>Paket Asuransi: <b>{booking.insurance_package.name}</b></span>
                                <span className="font-bold">{money(booking.insurance_package.amount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Financial Summary */}
                    <div className="p-5 bg-slate-50/50 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Sewa Dasar ({booking.total_periods} periode)</span>
                            <span className="font-semibold text-slate-900">{money(booking.base_amount)}</span>
                        </div>

                        <div className="flex justify-between text-slate-600">
                            <span>Wajib Deposit</span>
                            <span className="font-semibold text-slate-900">{money(booking.deposit_amount)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600 pt-1">
                            <span>Status Deposit</span>
                            {booking.deposit_received ? (
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">Lunas / Diterima</span>
                            ) : (
                                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-700">Belum Dibayar</span>
                            )}
                        </div>

                        <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
                            <span>Total Tagihan Sewa</span>
                            <span className="text-teal-600 text-base">{money(booking.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Deposit Proof Pending / Rejected Status Banner */}
                {booking.deposit_proof?.status === 'pending' && (
                    <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-300 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                Bukti Transfer Berhasil Diunggah — Menunggu Approval Admin
                            </h3>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Bukti pembayaran transfer manual Anda telah kami terima dan sedang diverifikasi oleh admin. Unit Anda tetap terikat selama proses konfirmasi.
                        </p>
                        {booking.deposit_proof.url && (
                            <div className="pt-1">
                                <a
                                    href={booking.deposit_proof.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline hover:text-amber-950"
                                >
                                    Lihat Bukti Transfer Uploaded ↗
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {booking.deposit_proof?.status === 'rejected' && (
                    <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-300 space-y-2 text-xs">
                        <h3 className="font-bold text-red-900 uppercase tracking-wider">
                            Bukti Transfer Ditolak
                        </h3>
                        <p className="text-red-800">
                            Alasan: <b>{booking.deposit_proof.rejected_reason || 'Bukti transfer tidak dapat diverifikasi'}</b>
                        </p>
                        <p className="text-red-700">Silakan unggah kembali bukti transfer yang valid di bawah ini.</p>
                    </div>
                )}

                {/* Deposit Payment Box */}
                {booking.can_pay_deposit && booking.deposit_proof?.status !== 'pending' && (
                    <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Pembayaran Deposit ({money(booking.deposit_amount)})
                            </h3>
                            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                                <button
                                    type="button"
                                    onClick={() => setDepositTab('transfer')}
                                    className={`rounded-lg px-2.5 py-1 transition ${depositTab === 'transfer' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Transfer Bank Manual
                                </button>
                                {gateway_available && (
                                    <button
                                        type="button"
                                        onClick={() => setDepositTab('online')}
                                        className={`rounded-lg px-2.5 py-1 transition ${depositTab === 'online' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Gateway Online (Midtrans)
                                    </button>
                                )}
                            </div>
                        </div>

                        {depositTab === 'transfer' && (
                            <form onSubmit={submitProof} className="space-y-4" noValidate>
                                {/* Form Errors Summary */}
                                {Object.keys(proofForm.errors).length > 0 && (
                                    <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
                                        <p className="font-bold">Gagal mengunggah bukti transfer:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                                            {Object.values(proofForm.errors).map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Bank Account Selection & Card */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Pilih Rekening Tujuan Transfer</label>
                                    {company_bank_accounts.length > 0 ? (
                                        <select
                                            className={fieldClassName}
                                            value={proofForm.data.company_bank_account_id}
                                            onChange={(e) => proofForm.setData('company_bank_account_id', e.target.value)}
                                        >
                                            <option value="">-- Pilih Rekening Bank Tujuan --</option>
                                            {company_bank_accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.bank_name ? `${acc.bank_name} - ${acc.name}` : acc.name} ({acc.account_number ?? '—'})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-xs text-slate-500 bg-slate-100 p-2.5 rounded-xl">
                                            Transfer ke rekening bank resmi perusahaan lalu unggah bukti transfer di bawah.
                                        </p>
                                    )}
                                    {proofForm.errors.company_bank_account_id && (
                                        <p className="text-xs text-red-600 mt-1">{proofForm.errors.company_bank_account_id}</p>
                                    )}
                                </div>

                                {/* Active Bank Detail Card */}
                                {(() => {
                                    const selectedBank = company_bank_accounts.find(
                                        (a) => String(a.id) === proofForm.data.company_bank_account_id
                                    ) || company_bank_accounts[0];

                                    if (!selectedBank) return null;

                                    return (
                                        <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 p-4 border border-teal-200/80 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold uppercase tracking-wider text-teal-800 text-[11px]">
                                                    {selectedBank.bank_name || 'Bank Transfer'}
                                                </span>
                                                <span className="text-[11px] text-teal-700 font-medium">a.n. {selectedBank.account_holder || selectedBank.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-base font-extrabold text-teal-950 tracking-wider">
                                                    {selectedBank.account_number || '—'}
                                                </span>
                                                {selectedBank.account_number && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(selectedBank.account_number || '');
                                                            setCopiedAccount(true);
                                                            setTimeout(() => setCopiedAccount(false), 2000);
                                                        }}
                                                        className="rounded-lg bg-teal-600/10 px-2.5 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-600/20"
                                                    >
                                                        {copiedAccount ? 'Tersalin ✓' : 'Salin Rekening'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-teal-700">
                                                Silakan transfer tepat sejumlah <b className="text-teal-900">{money(booking.deposit_amount)}</b> lalu unggah bukti transfer di bawah.
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* File Upload Input */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block">
                                        File Bukti Transfer (Foto / PDF, Maks 5MB) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => proofForm.setData('deposit_proof', e.target.files?.[0] ?? null)}
                                        className="mt-1 text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                    />
                                    {proofForm.errors.deposit_proof && (
                                        <p className="text-xs text-red-600 mt-1">{proofForm.errors.deposit_proof}</p>
                                    )}
                                </div>

                                {/* Phone & OTP inputs */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">No. Telepon Pemesan</label>
                                        <input
                                            type="tel"
                                            className={fieldClassName}
                                            value={proofForm.data.booker_phone}
                                            onChange={(e) => proofForm.setData('booker_phone', e.target.value)}
                                        />
                                        {proofForm.errors.booker_phone && (
                                            <p className="text-xs text-red-600 mt-1">{proofForm.errors.booker_phone}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">Kode OTP</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className={fieldClassName}
                                                placeholder="000000"
                                                maxLength={6}
                                                value={proofForm.data.otp_code}
                                                onChange={(e) => proofForm.setData('otp_code', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void sendOtp(proofForm.data.booker_phone)}
                                                className="mt-1 rounded-xl bg-slate-800 px-3 text-xs font-bold text-white transition hover:bg-slate-700"
                                            >
                                                OTP
                                            </button>
                                        </div>
                                        {proofForm.errors.otp_code && (
                                            <p className="text-xs text-red-600 mt-1">{proofForm.errors.otp_code}</p>
                                        )}
                                    </div>
                                </div>

                                {otpHint && <p className="text-xs font-medium text-teal-700 bg-teal-50 p-2 rounded-lg">{otpHint}</p>}

                                <button
                                    type="submit"
                                    disabled={proofForm.processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-700 disabled:opacity-50"
                                >
                                    {proofForm.processing ? (
                                        <>
                                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Mengunggah Bukti Transfer...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Unggah Bukti Transfer Manual ({money(booking.deposit_amount)})
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {depositTab === 'online' && (
                            <form onSubmit={pay} className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">No. Telepon WhatsApp</label>
                                        <input
                                            type="tel"
                                            className={fieldClassName}
                                            value={payForm.data.booker_phone}
                                            onChange={(e) => payForm.setData('booker_phone', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">Kode OTP</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className={fieldClassName}
                                                placeholder="000000"
                                                maxLength={6}
                                                value={payForm.data.otp_code}
                                                onChange={(e) => payForm.setData('otp_code', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void sendOtp(payForm.data.booker_phone)}
                                                className="mt-1 rounded-xl bg-slate-800 px-3 text-xs font-bold text-white transition hover:bg-slate-700"
                                            >
                                                OTP
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {otpHint && <p className="text-xs font-medium text-teal-700 bg-teal-50 p-2 rounded-lg">{otpHint}</p>}

                                <button
                                    type="submit"
                                    disabled={payForm.processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-700 disabled:opacity-50"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Bayar Deposit Online ({money(booking.deposit_amount)})
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Additional Actions: Documents Upload */}
                <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Dokumen Verifikasi (KTP & SIM)</h3>
                        <button
                            type="button"
                            onClick={() => setShowDocs(!showDocs)}
                            className="text-xs font-bold text-teal-600 underline"
                        >
                            {showDocs ? 'Sembunyikan' : 'Kelola Dokumen'}
                        </button>
                    </div>

                    <div className="flex gap-2 text-xs">
                        <span className={`rounded-lg px-2.5 py-1 font-semibold ${booking.documents?.ktp_uploaded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            KTP: {booking.documents?.ktp_uploaded ? 'Sudah Diunggah' : 'Belum'}
                        </span>
                        <span className={`rounded-lg px-2.5 py-1 font-semibold ${booking.documents?.sim_uploaded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            SIM: {booking.documents?.sim_uploaded ? 'Sudah Diunggah' : 'Belum'}
                        </span>
                    </div>

                    {showDocs && (
                        <form onSubmit={uploadDocuments} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block">Upload KTP</label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => docsForm.setData('ktp', e.target.files?.[0] ?? null)}
                                        className="mt-1 text-xs text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block">Upload SIM</label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => docsForm.setData('sim', e.target.files?.[0] ?? null)}
                                        className="mt-1 text-xs text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="tel"
                                    placeholder="No. HP"
                                    className={fieldClassName}
                                    value={docsForm.data.booker_phone}
                                    onChange={(e) => docsForm.setData('booker_phone', e.target.value)}
                                    required
                                />
                                <div className="flex gap-1">
                                    <input
                                        type="text"
                                        placeholder="OTP"
                                        className={fieldClassName}
                                        maxLength={6}
                                        value={docsForm.data.otp_code}
                                        onChange={(e) => docsForm.setData('otp_code', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void sendOtp(docsForm.data.booker_phone)}
                                        className="mt-1 rounded-xl bg-slate-800 px-2.5 text-xs font-bold text-white"
                                    >
                                        OTP
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={docsForm.processing}
                                className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700"
                            >
                                Unggah Dokumen
                            </button>
                        </form>
                    )}
                </div>

                {/* Additional Actions: Request Extend */}
                {booking.can_request_extend && (
                    <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Perpanjangan Sewa</h3>
                            <button
                                type="button"
                                onClick={() => setShowExtend(!showExtend)}
                                className="text-xs font-bold text-teal-600 underline"
                            >
                                {showExtend ? 'Batal' : 'Ajukan Perpanjangan'}
                            </button>
                        </div>

                        {booking.extend_request && (
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700">
                                Status Pengajuan: <b>{booking.extend_request.status}</b> ({booking.extend_request.requested_end_date})
                            </div>
                        )}

                        {showExtend && (
                            <form onSubmit={requestExtend} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Tanggal Selesai Baru</label>
                                    <input
                                        type="date"
                                        className={fieldClassName}
                                        value={extendForm.data.new_end_date}
                                        onChange={(e) => extendForm.setData('new_end_date', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="tel"
                                        placeholder="No. HP"
                                        className={fieldClassName}
                                        value={extendForm.data.booker_phone}
                                        onChange={(e) => extendForm.setData('booker_phone', e.target.value)}
                                        required
                                    />
                                    <div className="flex gap-1">
                                        <input
                                            type="text"
                                            placeholder="OTP"
                                            className={fieldClassName}
                                            maxLength={6}
                                            value={extendForm.data.otp_code}
                                            onChange={(e) => extendForm.setData('otp_code', e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void sendOtp(extendForm.data.booker_phone)}
                                            className="mt-1 rounded-xl bg-slate-800 px-2.5 text-xs font-bold text-white"
                                        >
                                            OTP
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={extendForm.processing}
                                    className="w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white transition hover:bg-teal-700"
                                >
                                    Kirim Pengajuan Perpanjangan
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Cancel Booking Section */}
                {booking.cancel?.can_cancel && (
                    <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/80 space-y-3 border-l-4 border-l-red-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">Pembatalan Reservasi</h3>
                            <button
                                type="button"
                                onClick={() => setShowCancel(!showCancel)}
                                className="text-xs font-bold text-red-600 underline"
                            >
                                {showCancel ? 'Kembali' : 'Batalkan Reservasi'}
                            </button>
                        </div>

                        {showCancel && (
                            <form onSubmit={cancel} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Alasan Pembatalan</label>
                                    <input
                                        type="text"
                                        className={fieldClassName}
                                        value={cancelForm.data.cancelled_reason}
                                        onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="tel"
                                        placeholder="No. HP"
                                        className={fieldClassName}
                                        value={cancelForm.data.booker_phone}
                                        onChange={(e) => cancelForm.setData('booker_phone', e.target.value)}
                                        required
                                    />
                                    <div className="flex gap-1">
                                        <input
                                            type="text"
                                            placeholder="OTP"
                                            className={fieldClassName}
                                            maxLength={6}
                                            value={cancelForm.data.otp_code}
                                            onChange={(e) => cancelForm.setData('otp_code', e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void sendOtp(cancelForm.data.booker_phone)}
                                            className="mt-1 rounded-xl bg-slate-800 px-2.5 text-xs font-bold text-white"
                                        >
                                            OTP
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                                >
                                    Konfirmasi Batalkan Reservasi
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
