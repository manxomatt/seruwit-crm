import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';

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
    booker_phone_verified: boolean;
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
    pickup_request?: {
        requested_at: string | null;
        status: string | null;
        customer_signature_url: string | null;
        terms_agreed: boolean;
        notes: string | null;
        can_request: boolean;
    };
}

interface Props {
    brand: Brand;
    booking: Booking;
    gateway_available: boolean;
    company_bank_accounts?: CompanyBankAccount[];
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const formatDeadlineTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes} WIB`;
    } catch {
        return isoString;
    }
};

const fieldClassName =
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[var(--brand-color)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20';

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending_reserved: { label: 'Menunggu Deposit', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    pending: { label: 'Kedaluwarsa / Pending', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    confirmed: { label: 'Reservasi Aktif', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
    active: { label: 'Sedang Disewa', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200' },
    returned: { label: 'Dikembalikan', color: 'text-indigo-850', bg: 'bg-indigo-50 border-indigo-200' },
    completed: { label: 'Selesai', color: 'text-slate-800', bg: 'bg-slate-100 border-slate-250' },
    cancelled: { label: 'Dibatalkan', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-200' },
    cancelled_paid: { label: 'Dibatalkan', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-200' },
};

function DigitalSignaturePad({
    onChange,
}: {
    value?: string;
    onChange: (val: string) => void;
}) {
    const [drawing, setDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const getPos = (e: any, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDraw = (e: any) => {
        const canvas = e.target as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setDrawing(true);
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: any) => {
        if (!drawing) return;
        const canvas = e.target as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e, canvas);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDraw = (e: any) => {
        if (!drawing) return;
        setDrawing(false);
        const canvas = e.target as HTMLCanvasElement;
        onChange(canvas.toDataURL('image/png'));
    };

    const clearCanvas = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        onChange('');
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Area Tanda Tangan Digital *</span>
                {hasDrawn && (
                    <button
                        type="button"
                        onClick={(e) => {
                            const container = e.currentTarget.parentElement?.parentElement;
                            const canvas = container?.querySelector('canvas');
                            if (canvas) clearCanvas(canvas as HTMLCanvasElement);
                        }}
                        className="text-[11px] font-bold text-rose-600 underline"
                    >
                        Hapus / Reset
                    </button>
                )}
            </div>
            <canvas
                width={320}
                height={120}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
                className="w-full h-28 rounded-xl border border-slate-300 bg-white touch-none cursor-crosshair shadow-inner"
            />
            <p className="text-[10px] text-slate-400">
                Gunakan jari atau stylus di atas kotak putih untuk membubuhkan tanda tangan digital persetujuan sewa.
            </p>
        </div>
    );
}

export default function BookingView({ brand, booking, gateway_available, company_bank_accounts = [] }: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [showCancel, setShowCancel] = useState(false);
    const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [depositTab, setDepositTab] = useState<'transfer' | 'online'>('transfer');
    const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

    // Page-level central OTP verification state
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [sendingPageOtp, setSendingPageOtp] = useState(false);

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

    useEffect(() => {
        if (!proofForm.data.company_bank_account_id && company_bank_accounts.length > 0) {
            proofForm.setData('company_bank_account_id', String(company_bank_accounts[0].id));
        }
    }, [company_bank_accounts]);

    const invoiceForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        invoice_id: 0,
    });

    const pickupForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        terms_agreed: false,
        customer_signature: '',
        pickup_notes: '',
    });

    const sendOtp = async (phone: string) => {
        if (!phone) {
            alert('Masukkan nomor telepon terlebih dahulu');
            return;
        }
        setSendingPageOtp(true);
        setOtpHint(null);
        setVerificationError(null);
        try {
            const url = typeof route === 'function' && route().has('book.rental.otp')
                ? route('book.rental.otp')
                : '/book/rental/otp';
            const { data } = await axios.post(url, { booker_phone: phone });
            if (data.already_verified) {
                setOtpHint('Nomor WhatsApp Anda sudah terverifikasi ✓');
                router.reload({ only: ['booking'] });
            } else {
                setOtpHint(data.debug_code ? `Kode OTP (Dev): ${data.debug_code}` : (data.message || 'OTP berhasil dikirim'));
                if (data.debug_code) {
                    setVerificationCode(String(data.debug_code));
                }
            }
        } catch (err: any) {
            setOtpHint(err.response?.data?.message || 'Gagal mengirim OTP');
        } finally {
            setSendingPageOtp(false);
        }
    };

    const handleVerifyPageOtp = async (e: FormEvent) => {
        e.preventDefault();
        if (!verificationCode || verificationCode.length !== 6) {
            setVerificationError('Kode OTP harus 6 digit');
            return;
        }
        setVerifyingOtp(true);
        setVerificationError(null);
        try {
            const url = route('book.rental.booking.verify_otp', booking.public_token);
            await axios.post(url, {
                booker_phone: booking.booker_phone,
                otp_code: verificationCode,
            });
            router.reload({ only: ['booking'] });
        } catch (err: any) {
            setVerificationError(err.response?.data?.message || 'Gagal memverifikasi OTP');
        } finally {
            setVerifyingOtp(false);
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

        const url = typeof route === 'function' && route().has('book.rental.booking.upload_deposit_proof')
            ? route('book.rental.booking.upload_deposit_proof', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/deposit-proof`;

        proofForm.post(url, {
            forceFormData: true,
        });
    };

    const handleOpenCancelModal = (e: FormEvent) => {
        e.preventDefault();
        setShowConfirmCancelModal(true);
    };

    const executeCancel = () => {
        const url = typeof route === 'function' && route().has('book.rental.booking.cancel')
            ? route('book.rental.booking.cancel', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/cancel`;
        cancelForm.post(url, {
            onFinish: () => setShowConfirmCancelModal(false),
        });
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

    const submitPickupRequest = (e: FormEvent) => {
        e.preventDefault();
        if (!pickupForm.data.customer_signature) {
            pickupForm.setError('customer_signature', 'Silakan bubuhkan tanda tangan digital Anda pada kotak yang tersedia.');
            return;
        }
        const url = typeof route === 'function' && route().has('book.rental.booking.request_pickup')
            ? route('book.rental.booking.request_pickup', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/request-pickup`;
        pickupForm.post(url, {
            preserveScroll: true,
        });
    };

    const getStatusBadge = () => {
        if (booking.deposit_proof?.status === 'pending') {
            return { label: 'Menunggu Verifikasi Pembayaran', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200 shadow-xs' };
        }
        if (booking.status === 'pending_reserved') {
            if (Number(booking.deposit_amount) <= 0) {
                return { label: 'Menunggu Pelunasan', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200 shadow-xs' };
            }
            return { label: 'Menunggu Deposit', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200 shadow-xs' };
        }
        return statusBadgeConfig[booking.status] || {
            label: booking.status,
            color: 'text-slate-800',
            bg: 'bg-slate-100 border-slate-200 shadow-xs',
        };
    };

    const statusBadge = getStatusBadge();
    const brandColor = brand.color || '#0f766e';
    const isVerified = booking.booker_phone_verified;

    return (
        <div 
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 pb-20"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`Reservasi ${booking.code} · ${brand.name}`} />

            {/* Brand Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <Link
                        href={route('book.rental.search')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Sewa Baru
                    </Link>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--brand-color)]">{brand.name}</span>
                </div>
            </div>

            {/* Main Content Layout (Desktop 2-column structure) */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
                
                {/* Flash Messages */}
                {(flash?.error || flash?.success) && (
                    <div className={`rounded-xl p-4 text-sm font-medium shadow-md ${flash.error ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {flash.error || flash.success}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Left Column: Details & Vehicle Info (cols 7) */}
                    <div className="flex-1 w-full space-y-6">
                        
                        {/* Code & Status Card */}
                        <div className="rounded-2xl border border-slate-200/85 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">KODE BOOKING</span>
                                <h2 className="text-2xl font-mono font-black tracking-wider text-slate-900 mt-1">{booking.code}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${statusBadge.bg} ${statusBadge.color}`}>
                                    {statusBadge.label}
                                </span>
                            </div>
                        </div>

                        {/* Countdown Hold Banner */}
                        {booking.status === 'pending_reserved' && booking.deposit_proof?.status !== 'pending' && (
                            <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                                            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-extrabold tracking-tight">
                                                {Number(booking.deposit_amount) <= 0 ? 'Menunggu Pelunasan' : 'Batas Hold Unit'}
                                            </h3>
                                            <p className="text-xs text-amber-100 font-medium">Selesaikan sebelum waktu habis</p>
                                        </div>
                                    </div>
                                    {booking.reserved_until && (
                                        <div className="text-right font-mono text-base font-extrabold tracking-wider bg-black/20 px-3 py-1.5 rounded-xl border border-white/20">
                                            {formatDeadlineTime(booking.reserved_until)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Vehicle & Booking Card */}
                        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                            <div className="p-5 border-b border-slate-100 flex items-center gap-4">
                                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                                    {booking.vehicle?.photo_url ? (
                                        <img src={booking.vehicle.photo_url} alt={booking.vehicle.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tanpa Foto</div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">{booking.vehicle?.name ?? 'Kendaraan'}</h2>
                                    <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{booking.vehicle?.plate_number}</p>
                                </div>
                            </div>

                            {/* Schedule & Depot Summary */}
                            <div className="p-5 space-y-3.5 text-xs text-slate-700 border-b border-slate-100">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60 shadow-xs">
                                        <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Mulai Sewa</span>
                                        <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">{booking.start_date ?? '—'}</span>
                                        {booking.pickup_location && (
                                            <span className="block text-[10px] text-slate-500 mt-1 font-medium">{booking.pickup_location}</span>
                                        )}
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60 shadow-xs">
                                        <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Selesai Sewa</span>
                                        <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">{booking.end_date ?? '—'}</span>
                                        {booking.return_location && (
                                            <span className="block text-[10px] text-slate-500 mt-1 font-medium">{booking.return_location}</span>
                                        )}
                                    </div>
                                </div>

                                {booking.insurance_package && (
                                    <div className="flex items-center justify-between rounded-xl bg-teal-50/50 p-3 border border-teal-200/80 text-teal-800 text-xs">
                                        <span>Paket Asuransi: <b className="text-teal-950">{booking.insurance_package.name}</b></span>
                                        <span className="font-extrabold">{money(booking.insurance_package.amount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Actions: Documents Upload */}
                        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Dokumen Verifikasi (KTP & SIM)</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isVerified) {
                                            alert('Verifikasi nomor WhatsApp Anda terlebih dahulu');
                                            return;
                                        }
                                        setShowDocs(!showDocs);
                                    }}
                                    className={`text-xs font-bold underline ${!isVerified ? 'text-slate-400 cursor-not-allowed' : 'text-[var(--brand-color)]'}`}
                                >
                                    {showDocs ? 'Sembunyikan' : 'Kelola Dokumen'}
                                </button>
                            </div>

                            <div className="flex gap-2 text-xs">
                                <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents?.ktp_uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    KTP: {booking.documents?.ktp_uploaded ? 'Terunggah' : 'Belum'}
                                </span>
                                <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents?.sim_uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    SIM: {booking.documents?.sim_uploaded ? 'Terunggah' : 'Belum'}
                                </span>
                            </div>

                            {showDocs && isVerified && (
                                <form onSubmit={uploadDocuments} className="mt-3 pt-3 border-t border-slate-100 space-y-3" noValidate>
                                    {Object.keys(docsForm.errors).length > 0 && (
                                        <div className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-250 font-medium">
                                            <p className="font-bold text-rose-950">Gagal mengunggah dokumen:</p>
                                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                                                {Object.values(docsForm.errors).map((err, idx) => (
                                                    <li key={idx}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 block">
                                                    Upload KTP (Foto / PDF)
                                                </label>
                                                {booking.documents?.ktp_uploaded && booking.documents?.ktp_url && (
                                                    <a
                                                        href={booking.documents.ktp_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[11px] font-bold text-[var(--brand-color)] underline"
                                                    >
                                                        Lihat File ↗
                                                    </a>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => docsForm.setData('ktp', e.target.files?.[0] ?? null)}
                                                className="mt-1.5 text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                            />
                                            {docsForm.errors.ktp && (
                                                <p className="text-xs text-rose-600 mt-1 font-bold">{docsForm.errors.ktp}</p>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 block">
                                                    Upload SIM A (Foto / PDF)
                                                </label>
                                                {booking.documents?.sim_uploaded && booking.documents?.sim_url && (
                                                    <a
                                                        href={booking.documents.sim_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[11px] font-bold text-[var(--brand-color)] underline"
                                                    >
                                                        Lihat File ↗
                                                    </a>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => docsForm.setData('sim', e.target.files?.[0] ?? null)}
                                                className="mt-1.5 text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                            />
                                            {docsForm.errors.sim && (
                                                <p className="text-xs text-rose-600 mt-1 font-bold">{docsForm.errors.sim}</p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={docsForm.processing}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-sm font-extrabold text-white shadow-md disabled:opacity-50 transition"
                                    >
                                        {docsForm.processing ? 'Mengunggah...' : 'Unggah Dokumen Verifikasi'}
                                    </button>
                                </form>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Verification & Action Forms (cols 5) */}
                    <div className="w-full lg:w-[420px] shrink-0 space-y-6">
                        
                        {/* Central Verification Card */}
                        {!isVerified && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                                            Verifikasi Nomor Telepon
                                        </h3>
                                        <p className="text-xs text-amber-800/85 leading-relaxed mt-0.5">
                                            Lakukan verifikasi WhatsApp Anda: <b>{booking.booker_phone}</b> untuk mengakses pembayaran, permohonan pickup, perpanjangan, atau pembatalan.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleVerifyPageOtp} className="space-y-3 pt-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Input 6 digit OTP"
                                            className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/25 tracking-widest text-center"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void sendOtp(booking.booker_phone || '')}
                                            disabled={sendingPageOtp}
                                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 text-xs font-bold transition disabled:opacity-50 shrink-0"
                                        >
                                            {sendingPageOtp ? 'Mengirim...' : 'Kirim OTP'}
                                        </button>
                                    </div>

                                    {otpHint && (
                                        <p className="rounded-lg bg-teal-50 p-2 text-xs font-medium text-teal-800 border border-teal-200">
                                            {otpHint}
                                        </p>
                                    )}

                                    {verificationError && (
                                        <p className="text-xs text-rose-600 font-bold">{verificationError}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={verifyingOtp}
                                        className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold transition disabled:opacity-50"
                                    >
                                        {verifyingOtp ? 'Memverifikasi...' : 'Verifikasi & Buka Akses'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Pricing & Deposit Summary */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b pb-2 border-slate-100">Rincian Pembayaran</h3>
                            <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between text-slate-600 font-medium">
                                    <span>Sewa Dasar ({booking.total_periods} hari)</span>
                                    <span className="font-bold text-slate-900">{money(booking.base_amount)}</span>
                                </div>

                                <div className="flex justify-between text-slate-600 font-medium">
                                    <span>Wajib Deposit</span>
                                    <span className="font-bold text-slate-900">
                                        {Number(booking.deposit_amount) > 0 ? money(booking.deposit_amount) : 'Tanpa Deposit (Rp 0)'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-slate-600 font-medium pt-0.5 border-t border-slate-100 pt-2">
                                    <span>Status Deposit</span>
                                    {Number(booking.deposit_amount) <= 0 ? (
                                        <span className="font-bold text-slate-600">-</span>
                                    ) : booking.deposit_received ? (
                                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">Lunas / Diterima</span>
                                    ) : (
                                        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800">Belum Dibayar</span>
                                    )}
                                </div>

                                <div className="border-t border-slate-200/80 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
                                    <span>Total Tagihan Sewa</span>
                                    <span className="text-base text-[var(--brand-color)]">{money(booking.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deposit Payment Box */}
                        {booking.can_pay_deposit && booking.deposit_proof?.status !== 'pending' && (
                            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                        Pembayaran {Number(booking.deposit_amount) > 0 ? 'Deposit' : 'Tagihan'}
                                    </h3>
                                    <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-[10px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setDepositTab('transfer')}
                                            className={`rounded-lg px-2.5 py-1.5 transition ${depositTab === 'transfer' ? 'bg-white text-[var(--brand-color)] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            Transfer Bank
                                        </button>
                                        {gateway_available && (
                                            <button
                                                type="button"
                                                onClick={() => setDepositTab('online')}
                                                className={`rounded-lg px-2.5 py-1.5 transition ${depositTab === 'online' ? 'bg-white text-[var(--brand-color)] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                            >
                                                Midtrans Snap
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {!isVerified ? (
                                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3.5 font-semibold text-center">
                                        Silakan verifikasi nomor WhatsApp Anda di atas untuk membuka opsi pembayaran.
                                    </p>
                                ) : (
                                    <>
                                        {depositTab === 'transfer' && (
                                            <form onSubmit={submitProof} className="space-y-4" noValidate>
                                                {Object.keys(proofForm.errors).length > 0 && (
                                                    <div className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-250 font-semibold">
                                                        <p className="font-bold text-rose-950">Gagal mengunggah bukti:</p>
                                                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                                                            {Object.values(proofForm.errors).map((err, idx) => (
                                                                <li key={idx}>{err}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilih Rekening Tujuan Transfer</label>
                                                    {company_bank_accounts.length > 0 ? (
                                                        <select
                                                            className={fieldClassName}
                                                            value={proofForm.data.company_bank_account_id}
                                                            onChange={(e) => proofForm.setData('company_bank_account_id', e.target.value)}
                                                        >
                                                            <option value="">-- Pilih Rekening Bank Tujuan --</option>
                                                            {company_bank_accounts.map((acc) => (
                                                                <option key={acc.id} value={acc.id}>
                                                                    {acc.bank_name ? `${acc.bank_name} - ` : ''}{acc.account_number ? `${acc.account_number} ` : ''}(a.n. {acc.account_holder || acc.name})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                            Transfer ke rekening bank resmi lalu unggah bukti transfer di bawah.
                                                        </p>
                                                    )}
                                                </div>

                                                {(() => {
                                                    const selectedBank = company_bank_accounts.find(
                                                        (a) => String(a.id) === proofForm.data.company_bank_account_id
                                                    ) || company_bank_accounts[0];

                                                    if (!selectedBank) return null;

                                                    return (
                                                        <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-200 space-y-2">
                                                            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                                                                <span className="uppercase tracking-wider text-[10px]">
                                                                    {selectedBank.bank_name || 'Bank Transfer'}
                                                                </span>
                                                                <span className="text-[10px]">a.n. {selectedBank.account_holder || selectedBank.name}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
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
                                                                        className="rounded-lg bg-emerald-600/10 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-600/20"
                                                                    >
                                                                        {copiedAccount ? 'Tersalin ✓' : 'Salin'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-emerald-700 font-semibold leading-relaxed">
                                                                Silakan transfer tepat sejumlah <b className="text-emerald-900 font-black">{money(Number(booking.deposit_amount) > 0 ? booking.deposit_amount : booking.total_amount)}</b>.
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                                <div>
                                                    <label className="text-xs font-bold text-slate-700 block">
                                                        File Bukti Transfer (Foto / PDF, Maks 5MB) <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => proofForm.setData('deposit_proof', e.target.files?.[0] ?? null)}
                                                        className="mt-1 text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                                    />
                                                    {proofForm.errors.deposit_proof && (
                                                        <p className="text-xs text-rose-600 mt-1 font-bold">{proofForm.errors.deposit_proof}</p>
                                                    )}
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={proofForm.processing}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3.5 text-sm font-extrabold text-white shadow-md transition disabled:opacity-50"
                                                >
                                                    {proofForm.processing ? 'Mengunggah Bukti Transfer...' : 'Kirim Bukti Pembayaran'}
                                                </button>
                                            </form>
                                        )}

                                        {depositTab === 'online' && (
                                            <form onSubmit={pay} className="space-y-3">
                                                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                                                    Anda akan diarahkan ke gerbang pembayaran online Midtrans Snap untuk menyelesaikan penahanan deposit.
                                                </p>
                                                <button
                                                    type="submit"
                                                    disabled={payForm.processing}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3.5 text-sm font-extrabold text-white shadow-md transition disabled:opacity-50"
                                                >
                                                    Bayar Deposit Online ({money(booking.deposit_amount)})
                                                </button>
                                            </form>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Pickup Request & Digital Contract Section */}
                        {booking.status === 'confirmed' && (
                            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 border-l-4 border-l-[var(--brand-color)] shadow-sm space-y-4">
                                <div>
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--brand-color)]">
                                        Pickup Kendaraan & Kontrak
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
                                        {booking.pickup_request?.requested_at
                                            ? 'Permohonan pickup dan tanda tangan digital telah dikirim'
                                            : 'Lakukan konfirmasi serah terima unit di depot & tandatangani kontrak sewa digital'}
                                    </p>
                                </div>

                                {booking.pickup_request?.requested_at ? (
                                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                                            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Permohonan Pickup & Kontrak Digital Terkirim
                                        </div>
                                        <p className="leading-relaxed">
                                            Tanda tangan dan persetujuan kontrak digital Anda sudah tercatat di sistem. Silakan tunjukkan layar ini kepada petugas depot untuk serah terima kunci.
                                        </p>
                                        {booking.pickup_request.customer_signature_url && (
                                            <div className="pt-2">
                                                <span className="text-[10px] font-bold text-slate-500 block mb-1">Tanda Tangan Digital Anda:</span>
                                                <div className="rounded-lg bg-white p-2 border border-slate-200 inline-block">
                                                    <img
                                                        src={booking.pickup_request.customer_signature_url}
                                                        alt="Tanda Tangan"
                                                        className="h-16 max-w-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : !isVerified ? (
                                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3.5 font-semibold text-center">
                                        Silakan verifikasi nomor WhatsApp Anda di atas untuk mengisi kontrak digital & permohonan pickup.
                                    </p>
                                ) : !booking.pickup_request?.can_request ? (
                                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1 font-semibold">
                                        <p className="font-bold text-sm text-amber-955">
                                            {Number(booking.deposit_amount) > 0 ? 'Deposit Belum Selesai' : 'Invoice Belum Lunas'}
                                        </p>
                                        <p className="leading-relaxed font-medium">
                                            Selesaikan seluruh tagihan atau deposit di atas terlebih dahulu untuk mengajukan pickup.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={submitPickupRequest} className="space-y-4 pt-1" noValidate>
                                        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-2">
                                            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-amber-950 font-semibold leading-relaxed">
                                                <input
                                                    type="checkbox"
                                                    checked={pickupForm.data.terms_agreed}
                                                    onChange={(e) => pickupForm.setData('terms_agreed', e.target.checked)}
                                                    className="mt-0.5 rounded border-amber-300 text-[var(--brand-color)] focus:ring-[var(--brand-color)]"
                                                    required
                                                />
                                                <span>
                                                    Saya menyatakan menyetujui seluruh ketentuan sewa, bertanggung jawab penuh menjaga kondisi fisik kendaraan, serta mematuhi batas waktu pengembalian.
                                                </span>
                                            </label>
                                            {pickupForm.errors.terms_agreed && (
                                                <p className="text-xs text-rose-600 font-bold">{pickupForm.errors.terms_agreed}</p>
                                            )}
                                        </div>

                                        <div>
                                            <DigitalSignaturePad
                                                value={pickupForm.data.customer_signature}
                                                onChange={(val) => pickupForm.setData('customer_signature', val)}
                                            />
                                            {pickupForm.errors.customer_signature && (
                                                <p className="text-xs text-rose-600 mt-1 font-bold">{pickupForm.errors.customer_signature}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block">Catatan Penjemputan (Opsional)</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: Sudah di stasiun depot"
                                                className={fieldClassName}
                                                value={pickupForm.data.pickup_notes}
                                                onChange={(e) => pickupForm.setData('pickup_notes', e.target.value)}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={pickupForm.processing}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3.5 text-sm font-extrabold text-white shadow-md disabled:opacity-50 transition"
                                        >
                                            {pickupForm.processing ? 'Mengirim...' : 'Submit Permohonan Pickup & TTD'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Additional Actions: Request Extend */}
                        {booking.can_request_extend && (
                            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Perpanjangan Sewa</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isVerified) {
                                                alert('Verifikasi nomor WhatsApp Anda terlebih dahulu');
                                                return;
                                            }
                                            setShowExtend(!showExtend);
                                        }}
                                        className={`text-xs font-bold underline ${!isVerified ? 'text-slate-400 cursor-not-allowed' : 'text-[var(--brand-color)]'}`}
                                    >
                                        {showExtend ? 'Batal' : 'Ajukan Perpanjangan'}
                                    </button>
                                </div>

                                {booking.extend_request && (
                                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-700 font-semibold shadow-inner">
                                        Status Pengajuan: <b className="text-slate-900">{booking.extend_request.status.toUpperCase()}</b> ({booking.extend_request.requested_end_date})
                                    </div>
                                )}

                                {showExtend && isVerified && (
                                    <form onSubmit={requestExtend} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block">Tanggal Selesai Baru</label>
                                            <input
                                                type="date"
                                                className={fieldClassName}
                                                value={extendForm.data.new_end_date}
                                                onChange={(e) => extendForm.setData('new_end_date', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block">Catatan Pendukung (Opsional)</label>
                                            <input
                                                type="text"
                                                placeholder="Alasan perpanjangan sewa..."
                                                className={fieldClassName}
                                                value={extendForm.data.notes}
                                                onChange={(e) => extendForm.setData('notes', e.target.value)}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={extendForm.processing}
                                            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-xs font-extrabold text-white transition disabled:opacity-50 shadow-md"
                                        >
                                            {extendForm.processing ? 'Mengirim...' : 'Kirim Pengajuan Perpanjangan'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Cancel Booking Section */}
                        {booking.cancel?.can_cancel && (
                            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 border-l-4 border-l-rose-500 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700">Batalkan Reservasi</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isVerified) {
                                                alert('Verifikasi nomor WhatsApp Anda terlebih dahulu');
                                                return;
                                            }
                                            setShowCancel(!showCancel);
                                        }}
                                        className={`text-xs font-bold underline ${!isVerified ? 'text-slate-400 cursor-not-allowed' : 'text-rose-600'}`}
                                    >
                                        {showCancel ? 'Kembali' : 'Ajukan Pembatalan'}
                                    </button>
                                </div>

                                {showCancel && isVerified && (
                                    <form onSubmit={handleOpenCancelModal} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block">Alasan Pembatalan</label>
                                            <input
                                                type="text"
                                                className={fieldClassName}
                                                placeholder="Masukkan alasan pembatalan..."
                                                value={cancelForm.data.cancelled_reason}
                                                onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={cancelForm.processing}
                                            className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-3 text-xs font-extrabold text-white transition disabled:opacity-50 shadow-md"
                                        >
                                            Minta Konfirmasi Pembatalan
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                    </div>

                </div>
            </div>

            {/* Cancel Reservation Confirmation Modal */}
            <Modal show={showConfirmCancelModal} onClose={() => setShowConfirmCancelModal(false)} maxWidth="md">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Konfirmasi Pembatalan</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Apakah Anda yakin ingin membatalkan reservasi ini?</p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs space-y-2 text-slate-700 font-semibold shadow-inner">
                        <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                            <span className="text-slate-400 uppercase text-[9px] tracking-wider">Kode Booking:</span>
                            <span className="font-mono font-extrabold text-slate-900">{booking.code}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                            <span className="text-slate-400 uppercase text-[9px] tracking-wider">Kendaraan:</span>
                            <span className="font-extrabold text-slate-900">{booking.vehicle?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 uppercase text-[9px] tracking-wider">Alasan Batal:</span>
                            <span className="font-extrabold text-slate-800 text-right max-w-[200px] truncate">{cancelForm.data.cancelled_reason || '-'}</span>
                        </div>
                    </div>

                    {booking.cancel?.charge_fee && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-1 font-semibold">
                            <p className="font-bold text-rose-950 uppercase text-[9px] tracking-wider">Biaya Pembatalan</p>
                            <p>Pembatalan ini akan dikenakan denda sebesar <b>{money(booking.cancel.fee_amount)}</b>.</p>
                        </div>
                    )}

                    <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                        Setelah disetujui, reservasi Anda akan langsung dibatalkan dan kendaraan akan dirilis kembali agar dapat dipesan oleh customer lain.
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            disabled={cancelForm.processing}
                            onClick={() => setShowConfirmCancelModal(false)}
                            className="rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Batal / Kembali
                        </button>
                        <button
                            type="button"
                            disabled={cancelForm.processing}
                            onClick={executeCancel}
                            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-md disabled:opacity-50 transition"
                        >
                            {cancelForm.processing ? 'Memproses...' : 'Ya, Batalkan'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
