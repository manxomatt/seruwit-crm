import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
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
    'mt-1 w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10';

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    pending_reserved: { label: 'Menunggu Deposit', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    pending: { label: 'Kedaluwarsa', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
    confirmed: { label: 'Reservasi Dikonfirmasi', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
    active: { label: 'Sedang Disewa (Aktif)', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    returned: { label: 'Telah Dikembalikan', color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
    completed: { label: 'Sewa Selesai', color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-500' },
    cancelled: { label: 'Reservasi Dibatalkan', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
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
                        Hapus / Ulangi
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
                Gunakan jari atau kursor Anda pada kotak di atas untuk membubuhkan tanda tangan serah terima unit.
            </p>
        </div>
    );
}

export default function BookingView({ brand, booking, gateway_available, company_bank_accounts = [] }: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
    const [showCancel, setShowCancel] = useState(false);
    const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
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
        setDevOtpCode(null);
        setVerificationError(null);
        try {
            const url = typeof route === 'function' && route().has('book.rental.otp')
                ? route('book.rental.otp')
                : '/book/rental/otp';
            const { data } = await axios.post(url, { booker_phone: phone });
            if (data.already_verified) {
                setDevOtpCode(null);
                setOtpHint('Nomor WhatsApp Anda sudah terverifikasi ✓');
                router.reload({ only: ['booking'] });
            } else {
                if (data.debug_code) {
                    const codeStr = String(data.debug_code);
                    setDevOtpCode(codeStr);
                    setVerificationCode(codeStr);
                    setOtpHint(`Mode Development: Kode OTP adalah ${codeStr} (tidak dikirim ke HP).`);
                } else {
                    setDevOtpCode(null);
                    setOtpHint(data.message || 'OTP berhasil dikirim ke WhatsApp Anda.');
                }
            }
        } catch (err: any) {
            setDevOtpCode(null);
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
            return { label: 'Menunggu Konfirmasi Bukti Transfer', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' };
        }
        if (booking.status === 'pending_reserved') {
            if (Number(booking.deposit_amount) <= 0) {
                return { label: 'Menunggu Pelunasan', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' };
            }
            return { label: 'Menunggu Pembayaran Deposit', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' };
        }
        return statusBadgeConfig[booking.status] || {
            label: booking.status,
            color: 'text-slate-800',
            bg: 'bg-slate-100 border-slate-200',
            dot: 'bg-slate-400',
        };
    };

    const statusBadge = getStatusBadge();
    const brandColor = brand.color || '#0f766e';
    const isVerified = booking.booker_phone_verified;

    return (
        <div 
            className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col justify-between"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`Reservasi #${booking.code} · ${brand.name}`} />

            <div>
                {/* Modern Crisp Glass Navbar */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
                        <Link href={route('book.rental.search')} className="flex items-center gap-3 group">
                            {brand.logo_url ? (
                                <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="h-10 w-10 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105"
                                />
                            ) : (
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs transition-transform duration-200 group-hover:scale-105"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">{brand.name}</h1>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Showroom & Rental Resmi</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link
                                href={route('book.rental.search')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 shadow-2xs"
                            >
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Sewa Baru</span>
                            </Link>

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 transition hover:bg-emerald-100 shadow-2xs"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                    WhatsApp CS
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Layout Container */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
                    
                    {/* Visual 4-Stage Stepper */}
                    <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Tahap 1</span>
                                <div className="text-xs font-black">Booking Dibuat ✓</div>
                            </div>
                            <div className={`p-3 rounded-xl border space-y-0.5 ${isVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest block ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>Tahap 2</span>
                                <div className="text-xs font-black">{isVerified ? 'Verifikasi Selesai ✓' : 'Verifikasi WhatsApp'}</div>
                            </div>
                            <div className={`p-3 rounded-xl border space-y-0.5 ${booking.deposit_received ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Tahap 3</span>
                                <div className="text-xs font-black">{booking.deposit_received ? 'Deposit Diterima ✓' : 'Pelunasan Deposit'}</div>
                            </div>
                            <div className={`p-3 rounded-xl border space-y-0.5 ${booking.pickup_request?.requested_at ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Tahap 4</span>
                                <div className="text-xs font-black">{booking.pickup_request?.requested_at ? 'Siap Serah Terima ✓' : 'Serah Terima Unit'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Flash Notifications */}
                    {(flash?.error || flash?.success) && (
                        <div className={`rounded-2xl p-4 text-sm font-bold shadow-sm ${flash.error ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
                            {flash.error || flash.success}
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        
                        {/* Left Column: Booking Info & Documents */}
                        <div className="flex-1 w-full space-y-6">
                            
                            {/* Booking Code Card */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">KODE BOOKING</span>
                                    <h2 className="text-3xl font-mono font-black tracking-wider text-slate-900 mt-0.5">{booking.code}</h2>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black border ${statusBadge.bg} ${statusBadge.color}`}>
                                        <span className={`h-2 w-2 rounded-full ${statusBadge.dot}`} />
                                        {statusBadge.label}
                                    </span>
                                </div>
                            </div>

                            {/* Urgent Hold Countdown Banner */}
                            {booking.status === 'pending_reserved' && booking.deposit_proof?.status !== 'pending' && (
                                <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white shadow-sm space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                                                <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black tracking-tight">
                                                    {Number(booking.deposit_amount) <= 0 ? 'Menunggu Pelunasan' : 'Batas Waktu Penahanan Unit'}
                                                </h3>
                                                <p className="text-xs text-amber-100 font-medium">Selesaikan sebelum batas waktu berakhir</p>
                                            </div>
                                        </div>
                                        {booking.reserved_until && (
                                            <div className="text-right font-mono text-base font-black bg-black/25 px-3.5 py-1.5 rounded-xl border border-white/20">
                                                {formatDeadlineTime(booking.reserved_until)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Vehicle Detail Card */}
                            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
                                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-5">
                                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                                        {booking.vehicle?.photo_url ? (
                                            <img src={booking.vehicle.photo_url} alt={booking.vehicle.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unit Ready</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{booking.vehicle?.name ?? 'Kendaraan'}</h3>
                                        <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">{booking.vehicle?.plate_number}</p>
                                    </div>
                                </div>

                                {/* Schedule & Depot Grid */}
                                <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-1">
                                            <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Mulai Sewa</span>
                                            <span className="font-black text-slate-900 text-sm block">{booking.start_date ?? '—'}</span>
                                            {booking.pickup_location && (
                                                <span className="block text-[11px] text-slate-500 font-medium">{booking.pickup_location}</span>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-1">
                                            <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Selesai Sewa</span>
                                            <span className="font-black text-slate-900 text-sm block">{booking.end_date ?? '—'}</span>
                                            {booking.return_location && (
                                                <span className="block text-[11px] text-slate-500 font-medium">{booking.return_location}</span>
                                            )}
                                        </div>
                                    </div>

                                    {booking.insurance_package && (
                                        <div className="flex items-center justify-between rounded-xl bg-teal-50 p-3 border border-teal-200 text-teal-900 text-xs">
                                            <span>Paket Proteksi: <b className="font-black">{booking.insurance_package.name}</b></span>
                                            <span className="font-black">{money(booking.insurance_package.amount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents Upload Section */}
                            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Dokumen Verifikasi (KTP & SIM)</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Wajib diunggah sebelum serah terima unit di cabang.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isVerified) {
                                                alert('Verifikasi nomor WhatsApp Anda terlebih dahulu');
                                                return;
                                            }
                                            setShowDocs(!showDocs);
                                        }}
                                        className={`text-xs font-black underline ${!isVerified ? 'text-slate-400 cursor-not-allowed' : 'text-slate-900'}`}
                                    >
                                        {showDocs ? 'Sembunyikan' : 'Kelola Dokumen'}
                                    </button>
                                </div>

                                <div className="flex gap-2.5 text-xs">
                                    <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents?.ktp_uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                        KTP: {booking.documents?.ktp_uploaded ? 'Terunggah ✓' : 'Belum'}
                                    </span>
                                    <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents?.sim_uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                        SIM A: {booking.documents?.sim_uploaded ? 'Terunggah ✓' : 'Belum'}
                                    </span>
                                </div>

                                {showDocs && isVerified && (
                                    <form onSubmit={uploadDocuments} className="mt-4 pt-4 border-t border-slate-100 space-y-4" noValidate>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Foto KTP Penyewa
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => docsForm.setData('ktp', e.target.files?.[0] ?? null)}
                                                    className="text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Foto SIM A Penyewa
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => docsForm.setData('sim', e.target.files?.[0] ?? null)}
                                                    className="text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={docsForm.processing}
                                            className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            {docsForm.processing ? 'Mengunggah...' : 'Simpan Dokumen'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Actions, Verification, & Payment */}
                        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
                            
                            {/* Central Verification Card */}
                            {!isVerified && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 shadow-xs space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-200 font-bold text-lg">
                                            🔒
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                                                Verifikasi Akses Pemesan
                                            </h3>
                                            <p className="text-xs text-amber-800 leading-relaxed mt-0.5 font-medium">
                                                Verifikasi nomor WhatsApp <b>{booking.booker_phone}</b> untuk membuka menu pembayaran dan serah terima unit.
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleVerifyPageOtp} className="space-y-3 pt-1">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="6 Digit OTP"
                                                className="w-full rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-black text-slate-800 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                maxLength={6}
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void sendOtp(booking.booker_phone || '')}
                                                disabled={sendingPageOtp}
                                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 text-xs font-black uppercase transition disabled:opacity-50 shrink-0"
                                            >
                                                {sendingPageOtp ? 'Kirim...' : 'Kirim OTP'}
                                            </button>
                                        </div>

                                        {devOtpCode && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 shadow-2xs space-y-2 text-left">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-black text-white shadow-2xs">
                                                            ⚡
                                                        </span>
                                                        <div>
                                                            <span className="font-black text-amber-900 block leading-tight">Mode Development</span>
                                                            <span className="text-[11px] text-amber-700 font-medium">Kode OTP:</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-sm font-black bg-white px-2.5 py-1 rounded-lg border border-amber-300 tracking-widest text-slate-900 shadow-xs shrink-0">
                                                        {devOtpCode}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-1 rounded-lg border border-amber-200/80 font-semibold flex items-center gap-1">
                                                    <span>✓</span>
                                                    <span>Kode OTP telah diisikan otomatis.</span>
                                                </div>
                                            </div>
                                        )}

                                        {otpHint && !devOtpCode && (
                                            <p className="rounded-lg bg-teal-50 p-2 text-xs font-bold text-teal-800 border border-teal-200 text-center">
                                                {otpHint}
                                            </p>
                                        )}

                                        {verificationError && (
                                            <p className="text-xs text-rose-600 font-bold text-center">{verificationError}</p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={verifyingOtp}
                                            className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase text-white transition disabled:opacity-50 shadow-sm"
                                        >
                                            {verifyingOtp ? 'Memverifikasi...' : 'Buka Kunci Akses'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Pricing & Deposit Summary */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-2 border-slate-100">
                                    Rincian Tagihan
                                </h3>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between text-slate-600 font-medium">
                                        <span>Sewa ({booking.total_periods} hari)</span>
                                        <span className="font-black text-slate-900">{money(booking.base_amount)}</span>
                                    </div>

                                    <div className="flex justify-between text-slate-600 font-medium">
                                        <span>Wajib Deposit</span>
                                        <span className="font-black text-slate-900">
                                            {Number(booking.deposit_amount) > 0 ? money(booking.deposit_amount) : 'Tanpa Deposit'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-slate-600 font-medium pt-1 border-t border-slate-100">
                                        <span>Status Deposit</span>
                                        {Number(booking.deposit_amount) <= 0 ? (
                                            <span className="font-bold text-slate-500">-</span>
                                        ) : booking.deposit_received ? (
                                            <span className="rounded-full bg-emerald-100 px-3 py-0.5 font-bold text-emerald-800">Lunas / Diterima</span>
                                        ) : (
                                            <span className="rounded-full bg-amber-100 px-3 py-0.5 font-bold text-amber-800">Belum Dibayar</span>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                                        <span>Total Tagihan</span>
                                        <span className="text-base text-slate-900">{money(booking.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deposit Payment Box */}
                            {booking.can_pay_deposit && booking.deposit_proof?.status !== 'pending' && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-md space-y-4">
                                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            Pembayaran {Number(booking.deposit_amount) > 0 ? 'Deposit' : 'Sewa'}
                                        </h3>
                                        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-[10px] font-bold">
                                            <button
                                                type="button"
                                                onClick={() => setDepositTab('transfer')}
                                                className={`rounded-lg px-3 py-1.5 transition ${depositTab === 'transfer' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                                            >
                                                Transfer Bank
                                            </button>
                                            {gateway_available && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDepositTab('online')}
                                                    className={`rounded-lg px-3 py-1.5 transition ${depositTab === 'online' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                                                >
                                                    Midtrans Snap
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {!isVerified ? (
                                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4 font-semibold text-center leading-relaxed">
                                            Verifikasi nomor WhatsApp Anda di atas untuk membuka opsi pembayaran.
                                        </p>
                                    ) : (
                                        <>
                                            {depositTab === 'transfer' && (
                                                <form onSubmit={submitProof} className="space-y-4" noValidate>
                                                    {(() => {
                                                        const selectedBank = company_bank_accounts.find(
                                                            (a) => String(a.id) === proofForm.data.company_bank_account_id
                                                        ) || company_bank_accounts[0];

                                                        if (!selectedBank) return null;

                                                        return (
                                                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                                                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                                    <span className="uppercase tracking-wider text-[10px]">
                                                                        {selectedBank.bank_name || 'Bank Transfer'}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500">a.n. {selectedBank.account_holder || selectedBank.name}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-mono text-lg font-black text-slate-900 tracking-wider">
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
                                                                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                                                                        >
                                                                            {copiedAccount ? 'Tersalin ✓' : 'Salin Rekening'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                                                                    Transfer nominal: <b className="text-slate-950 font-black">{money(Number(booking.deposit_amount) > 0 ? booking.deposit_amount : booking.total_amount)}</b>
                                                                </p>
                                                            </div>
                                                        );
                                                    })()}

                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                            Upload Bukti Transfer (Foto / PDF) *
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => proofForm.setData('deposit_proof', e.target.files?.[0] ?? null)}
                                                            className="text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                                                        />
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={proofForm.processing}
                                                        className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase tracking-wider text-white shadow-sm transition disabled:opacity-50"
                                                    >
                                                        {proofForm.processing ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                                                    </button>
                                                </form>
                                            )}

                                            {depositTab === 'online' && (
                                                <form onSubmit={pay} className="space-y-3">
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                        Anda akan diarahkan ke gerbang pembayaran online Midtrans Snap untuk menyelesaikan transaksi.
                                                    </p>
                                                    <button
                                                        type="submit"
                                                        disabled={payForm.processing}
                                                        className="w-full h-11 flex items-center justify-center rounded-xl text-xs font-black uppercase text-white shadow-sm transition"
                                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                                    >
                                                        Bayar Online ({money(booking.deposit_amount)})
                                                    </button>
                                                </form>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Pickup Request & Digital Signature */}
                            {booking.status === 'confirmed' && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-md space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                        Kontrak & Serah Terima Unit
                                    </h3>

                                    {booking.pickup_request?.requested_at ? (
                                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-2">
                                            <div className="font-bold text-emerald-900">Permohonan Serah Terima Terkirim ✓</div>
                                            <p className="leading-relaxed">Tunjukkan layar ini kepada petugas cabang untuk serah terima kunci kendaraan.</p>
                                        </div>
                                    ) : !isVerified ? (
                                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4 font-semibold text-center">
                                            Verifikasi nomor WhatsApp di atas untuk mengisi kontrak digital.
                                        </p>
                                    ) : (
                                        <form onSubmit={submitPickupRequest} className="space-y-4" noValidate>
                                            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 space-y-2">
                                                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-amber-950 font-bold leading-relaxed">
                                                    <input
                                                        type="checkbox"
                                                        checked={pickupForm.data.terms_agreed}
                                                        onChange={(e) => pickupForm.setData('terms_agreed', e.target.checked)}
                                                        className="mt-0.5 rounded border-amber-300 text-slate-900 focus:ring-slate-900"
                                                        required
                                                    />
                                                    <span>
                                                        Saya menyetujui seluruh ketentuan sewa & mematuhi batas waktu pengembalian.
                                                    </span>
                                                </label>
                                            </div>

                                            <DigitalSignaturePad
                                                value={pickupForm.data.customer_signature}
                                                onChange={(val) => pickupForm.setData('customer_signature', val)}
                                            />

                                            <button
                                                type="submit"
                                                disabled={pickupForm.processing}
                                                className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase tracking-wider text-white shadow-sm transition disabled:opacity-50"
                                            >
                                                {pickupForm.processing ? 'Mengirim...' : 'Submit Tanda Tangan & Ambil Unit'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Additional Actions: Request Extend */}
                            {booking.can_request_extend && (
                                <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Perpanjangan Sewa</h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isVerified) {
                                                    alert('Verifikasi WhatsApp terlebih dahulu');
                                                    return;
                                                }
                                                setShowExtend(!showExtend);
                                            }}
                                            className={`text-xs font-bold underline ${!isVerified ? 'text-slate-400 cursor-not-allowed' : 'text-slate-900'}`}
                                        >
                                            {showExtend ? 'Tutup' : 'Ajukan Perpanjangan'}
                                        </button>
                                    </div>

                                    {showExtend && isVerified && (
                                        <form onSubmit={requestExtend} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-700 block">Tanggal Selesai Baru</label>
                                                <input
                                                    type="date"
                                                    className={fieldClassName}
                                                    value={extendForm.data.new_end_date}
                                                    onChange={(e) => extendForm.setData('new_end_date', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={extendForm.processing}
                                                className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase text-white transition disabled:opacity-50"
                                            >
                                                {extendForm.processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Cancel Booking Section */}
                            {booking.cancel?.can_cancel && (
                                <div className="rounded-2xl bg-white p-5 border border-slate-200 border-l-4 border-l-rose-500 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-rose-700">Batalkan Reservasi</h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isVerified) {
                                                    alert('Verifikasi WhatsApp terlebih dahulu');
                                                    return;
                                                }
                                                setShowCancel(!showCancel);
                                            }}
                                            className={`text-xs font-bold underline ${!isVerified ? 'text-slate-400 cursor-not-allowed' : 'text-rose-600'}`}
                                        >
                                            {showCancel ? 'Tutup' : 'Ajukan Batal'}
                                        </button>
                                    </div>

                                    {showCancel && isVerified && (
                                        <form onSubmit={handleOpenCancelModal} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-700 block">Alasan Pembatalan</label>
                                                <input
                                                    type="text"
                                                    className={fieldClassName}
                                                    placeholder="Alasan pembatalan..."
                                                    value={cancelForm.data.cancelled_reason}
                                                    onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={cancelForm.processing}
                                                className="w-full h-11 flex items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black uppercase text-white transition disabled:opacity-50 shadow-sm"
                                            >
                                                Konfirmasi Pembatalan
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Grounded Deep Slate Footer */}
            <footer className="mt-16 bg-slate-900 text-slate-400 border-t border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {/* Column 1: Brand Info */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <span 
                                    className="block h-3 w-3 rounded-full shadow-xs"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                />
                                <span className="font-black text-white tracking-tight text-sm">{brand.name}</span>
                            </div>
                            <p className="text-xs font-normal text-slate-400 leading-relaxed max-w-sm">
                                Layanan penyewaan kendaraan resmi, aman, dan berlisensi. Kami menghadirkan armada terawat dengan jaminan kenyamanan ekstra dan dukungan serah terima cabang yang luas.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-3 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">Navigasi Cepat</h4>
                            <ul className="space-y-2 text-xs font-medium text-slate-400">
                                <li>
                                    <Link href={route('book.rental.search')} className="hover:text-white transition-colors">
                                        Katalog Kendaraan
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('book.rental.history')} className="hover:text-white transition-colors">
                                        Riwayat & Cek Status
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Contact/Support */}
                        <div className="md:col-span-4 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">Pusat Bantuan</h4>
                            <div className="text-xs font-medium text-slate-400 space-y-2.5">
                                <p className="leading-relaxed">
                                    Butuh konsultasi armada atau konfirmasi pembayaran transfer? Hubungi tim support kami:
                                </p>
                                {brand.support_phone ? (
                                    <a
                                        href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-emerald-400 font-bold text-xs hover:underline"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                        WhatsApp Hotline: {brand.support_phone} ↗
                                    </a>
                                ) : (
                                    <span className="font-bold text-slate-300">Silakan hubungi cabang terdekat.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                        <div>
                            © 2026 {brand.name}. Seluruh Hak Cipta Dilindungi.
                        </div>
                        <div className="flex gap-4">
                            <span className="hover:text-slate-300 cursor-pointer">Syarat & Ketentuan</span>
                            <span className="hover:text-slate-300 cursor-pointer">Kebijakan Privasi</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Cancel Reservation Confirmation Modal */}
            <Modal show={showConfirmCancelModal} onClose={() => setShowConfirmCancelModal(false)} maxWidth="md">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-bold">
                            ⚠️
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Konfirmasi Pembatalan</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Yakin ingin membatalkan reservasi ini?</p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-2 text-slate-700 font-semibold">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span className="text-slate-400 uppercase text-[9px]">Kode Booking:</span>
                            <span className="font-mono font-black text-slate-900">{booking.code}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 uppercase text-[9px]">Kendaraan:</span>
                            <span className="font-black text-slate-900">{booking.vehicle?.name || '-'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            disabled={cancelForm.processing}
                            onClick={() => setShowConfirmCancelModal(false)}
                            className="rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={cancelForm.processing}
                            onClick={executeCancel}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-black uppercase text-white shadow-sm transition disabled:opacity-50"
                        >
                            {cancelForm.processing ? 'Memproses...' : 'Ya, Batalkan'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
