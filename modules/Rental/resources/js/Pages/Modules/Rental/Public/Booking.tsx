import { Head, Link, useForm, usePage, router, usePoll } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Modal from '@/Components/Modal';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
    terms_url?: string | null;
    privacy_url?: string | null;
}

interface CompanyBankAccount {
    id: number;
    name: string;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
}

interface TimelineItem {
    key: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'pending';
    timestamp: string | null;
}

interface Booking {
    code: string;
    public_token: string;
    status: string;
    channel: string;
    service_type?: string;
    booker_phone: string | null;
    booker_phone_verified: boolean;
    start_date: string | null;
    end_date: string | null;
    pickup_time?: string | null;
    return_time?: string | null;
    period_type: string;
    total_periods: number;
    rate_per_period: number;
    base_amount: number;
    deposit_amount: number;
    deposit_received: boolean;
    driver_fee_amount?: number;
    delivery_type?: string;
    delivery_address?: string | null;
    delivery_landmark?: string | null;
    delivery_fee?: number;
    return_delivery_type?: string;
    return_delivery_address?: string | null;
    return_delivery_fee?: number;
    total_amount: number;
    pickup_location: string | null;
    return_location: string | null;
    reserved_until: string | null;
    status_hint?: string | null;
    cancelled_reason: string | null;
    emergency_contact?: {
        name: string | null;
        phone: string | null;
        relation: string | null;
    };
    social_media_account?: string | null;
    contract?: {
        signed: boolean;
        signed_at: string | null;
        signature_url: string | null;
    };
    driver?: {
        id: number;
        name: string;
        phone: string | null;
        photo_url: string | null;
    } | null;
    pdf_urls?: {
        contract: string | null;
        handover: string | null;
    };
    tracking_timeline?: TimelineItem[];
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
        has_conflict?: boolean;
        notes?: string | null;
        staff_notes?: string | null;
        reviewed_at?: string | null;
        created_at?: string | null;
    } | null;
    has_pending_extend?: boolean;
    extensions_history?: Array<{
        id: number;
        original_end_date: string;
        new_end_date: string;
        extended_periods: number;
        additional_amount: number;
        notes?: string | null;
        created_at?: string | null;
    }>;
    documents: {
        ktp_uploaded: boolean;
        sim_uploaded: boolean;
        guarantor_uploaded?: boolean;
        guarantor_doc_type?: string | null;
        ktp_url: string | null;
        sim_url: string | null;
        guarantor_url?: string | null;
        ai_ocr_enabled?: boolean;
        ai_kyc_assessment?: {
            status?: string;
            risk_level?: string;
            summary?: string;
            ktp?: {
                nik?: string;
                name?: string;
                birth_date?: string;
                address?: string;
            };
            sim?: {
                license_number?: string;
                expires_at?: string;
                is_expired?: boolean;
            };
        } | null;
        partner_identity?: {
            id_number?: string | null;
            license_number?: string | null;
            license_expires_at?: string | null;
        };
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
    can_self_return?: boolean;
    ai_inspection_enabled?: boolean;
    handover_checklist_keys?: string[];
    fuel_levels?: string[];
    checkout_details?: {
        start_odometer?: number | null;
        start_fuel_level?: string | null;
        checkout_photos?: string[];
        checkout_signed_at?: string | null;
    };
    return_details?: {
        returned_at?: string | null;
        actual_return_date?: string | null;
        end_odometer?: number | null;
        end_fuel_level?: string | null;
        excess_km?: number | null;
        excess_amount?: number;
        overdue_days?: number;
        late_fee_amount?: number;
        return_notes?: string | null;
        return_checklist?: Record<string, boolean>;
        return_photos?: string[];
        return_signature_url?: string | null;
    };
    deposit_refund?: {
        has_deposit: boolean;
        deposit_amount: number;
        deposit_received: boolean;
        deposit_status: string;
        deposit_applied_amount: number;
        deposit_refunded_amount: number;
        deposit_settled_at: string | null;
        refund_status: 'not_applicable' | 'pending_deposit' | 'pending_return' | 'bank_submitted' | 'pending_bank_info' | 'in_review' | 'approved' | 'refunded' | 'forfeited' | string;
        bank_name: string | null;
        account_number: string | null;
        account_name: string | null;
        bank_submitted_at: string | null;
        refund_proof_url: string | null;
        refund_notes: string | null;
        refunded_at: string | null;
        can_submit_bank: boolean;
    };
    can_order_addons?: boolean;
    available_addons?: AvailableAddon[];
    ordered_addons?: OrderedAddon[];
}

export interface AvailableAddon {
    code: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    price_type: 'daily' | 'flat';
    unit_price: number;
    calculated_total: number;
    max_quantity: number;
    is_already_added: boolean;
}

export interface OrderedAddon {
    id: number;
    addon_code: string | null;
    description: string;
    amount: number;
    is_invoiced: boolean;
    created_at?: string;
}

interface Props {
    brand: Brand;
    booking: Booking;
    gateway_available: boolean;
    company_bank_accounts?: CompanyBankAccount[];
    require_otp?: boolean;
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
    confirmed: { label: 'Siap diambil', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
    active: { label: 'Sedang disewa', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
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
                Gunakan jari atau kursor Anda pada kotak di atas untuk menandatangani kontrak.
            </p>
        </div>
    );
}

export default function BookingView({ brand, booking, gateway_available, company_bank_accounts = [], require_otp = true }: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    usePoll(15000);

    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
    const [showCancel, setShowCancel] = useState(false);
    const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [extendQuoteLoading, setExtendQuoteLoading] = useState(false);
    const [extendQuoteData, setExtendQuoteData] = useState<{
        current_end_date: string;
        new_end_date: string;
        extended_periods: number;
        rate_per_period: number;
        additional_amount: number;
        estimated_new_total: number;
        has_conflict: boolean;
        conflict_message: string;
    } | null>(null);
    const [extendQuoteError, setExtendQuoteError] = useState<string | null>(null);
    const [showCancelExtendConfirm, setShowCancelExtendConfirm] = useState(false);
    const [cancellingExtend, setCancellingExtend] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [depositTab, setDepositTab] = useState<'transfer' | 'online'>('transfer');
    const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
    const [linkCopied, setLinkCopied] = useState(false);

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
        guarantor_doc: File | null;
        guarantor_doc_type: string;
        id_number: string;
        license_number: string;
        license_expires_at: string;
        birth_date: string;
    }>({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        ktp: null,
        sim: null,
        guarantor_doc: null,
        guarantor_doc_type: booking.documents?.guarantor_doc_type || 'flight_ticket',
        id_number: booking.documents?.partner_identity?.id_number || '',
        license_number: booking.documents?.partner_identity?.license_number || '',
        license_expires_at: booking.documents?.partner_identity?.license_expires_at || '',
        birth_date: '',
    });

    const [scanningKtp, setScanningKtp] = useState(false);
    const [ktpOcrResult, setKtpOcrResult] = useState<any>(null);
    const [ktpOcrValidation, setKtpOcrValidation] = useState<any>(null);
    const [ktpOcrError, setKtpOcrError] = useState<string | null>(null);

    const [scanningSim, setScanningSim] = useState(false);
    const [simOcrResult, setSimOcrResult] = useState<any>(null);
    const [simOcrValidation, setSimOcrValidation] = useState<any>(null);
    const [simOcrError, setSimOcrError] = useState<string | null>(null);

    const scanDocumentOcr = async (file: File, docType: 'ktp' | 'sim') => {
        if (!file) return;

        if (docType === 'ktp') {
            setScanningKtp(true);
            setKtpOcrError(null);
        } else {
            setScanningSim(true);
            setSimOcrError(null);
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('doc_type', docType);

            const url = typeof route === 'function' && route().has('book.rental.booking.ocr')
                ? route('book.rental.booking.ocr', booking.public_token)
                : `/book/rental/booking/${booking.public_token}/ocr`;

            const { data } = await axios.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data.success && data.result) {
                if (docType === 'ktp') {
                    setKtpOcrResult(data.result);
                    setKtpOcrValidation(data.validation);
                    const nik = data.result.data?.nik || '';
                    const cleanNik = nik.replace(/[^0-9]/g, '');
                    if (cleanNik) docsForm.setData('id_number', cleanNik);
                    if (data.result.data?.birth_date) docsForm.setData('birth_date', data.result.data.birth_date);
                } else {
                    setSimOcrResult(data.result);
                    setSimOcrValidation(data.validation);
                    if (data.result.data?.license_number) docsForm.setData('license_number', data.result.data.license_number);
                    if (data.result.data?.expires_at) docsForm.setData('license_expires_at', data.result.data.expires_at);
                }
            } else {
                if (docType === 'ktp') setKtpOcrError(data.message || 'Gagal memindai KTP');
                else setSimOcrError(data.message || 'Gagal memindai SIM');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Gagal memproses OCR dokumen. Mohon pastikan foto cukup terang.';
            if (docType === 'ktp') setKtpOcrError(msg);
            else setSimOcrError(msg);
        } finally {
            if (docType === 'ktp') setScanningKtp(false);
            else setScanningSim(false);
        }
    };

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

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [scanningReturnPhotos, setScanningReturnPhotos] = useState(false);
    const [returnAiInspection, setReturnAiInspection] = useState<any>(null);
    const [returnAiError, setReturnAiError] = useState<string | null>(null);

    const returnForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        end_odometer: '',
        end_fuel_level: booking.checkout_details?.start_fuel_level || 'full',
        return_checklist: {
            exterior_body: true,
            interior: true,
            keys: true,
            documents: true,
        } as Record<string, boolean>,
        return_notes: '',
        return_photos: [] as string[],
        customer_signature: '',
    });

    const handleReturnPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remainingSlots = 5 - returnForm.data.return_photos.length;
        const toProcess = files.slice(0, remainingSlots);

        toProcess.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                if (dataUrl && dataUrl.startsWith('data:image/')) {
                    returnForm.setData('return_photos', (prev) => {
                        if (prev.length < 5) {
                            return [...prev, dataUrl];
                        }
                        return prev;
                    });
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeReturnPhoto = (idx: number) => {
        returnForm.setData('return_photos', returnForm.data.return_photos.filter((_, i) => i !== idx));
    };

    const runReturnAiInspection = async () => {
        if (returnForm.data.return_photos.length === 0) {
            setReturnAiError('Unggah minimal 1 foto kendaraan pengembalian terlebih dahulu.');
            return;
        }

        setScanningReturnPhotos(true);
        setReturnAiError(null);

        try {
            const url = typeof route === 'function' && route().has('book.rental.booking.inspect_return')
                ? route('book.rental.booking.inspect_return', booking.public_token)
                : `/book/rental/booking/${booking.public_token}/inspect-return`;

            const { data } = await axios.post(url, {
                return_photos: returnForm.data.return_photos,
            });

            if (data.success && data.inspection) {
                setReturnAiInspection(data.inspection);
                if (data.inspection.extracted_odometer) {
                    returnForm.setData('end_odometer', String(data.inspection.extracted_odometer));
                }
                if (data.inspection.extracted_fuel_level) {
                    returnForm.setData('end_fuel_level', data.inspection.extracted_fuel_level);
                }
            } else {
                setReturnAiError(data.message || 'Gagal menjalankan inspeksi AI.');
            }
        } catch (err: any) {
            setReturnAiError(err.response?.data?.message || 'Gagal memproses inspeksi visual AI.');
        } finally {
            setScanningReturnPhotos(false);
        }
    };

    const submitReturnRequest = (e: FormEvent) => {
        e.preventDefault();
        returnForm.clearErrors();

        if (returnForm.data.return_photos.length === 0) {
            returnForm.setError('return_photos', 'Unggah minimal 1 foto kondisi kendaraan pengembalian.');
            return;
        }

        if (!returnForm.data.customer_signature) {
            returnForm.setError('customer_signature', 'Silakan bubuhkan tanda tangan digital Anda pada kotak yang tersedia.');
            return;
        }

        const url = typeof route === 'function' && route().has('book.rental.booking.return')
            ? route('book.rental.booking.return', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/return`;

        returnForm.post(url, {
            preserveScroll: true,
            onSuccess: () => setShowReturnModal(false),
        });
    };

    const [showRefundModal, setShowRefundModal] = useState(false);
    const refundAccountForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        bank_name: booking.deposit_refund?.bank_name ?? 'BCA',
        custom_bank_name: '',
        account_number: booking.deposit_refund?.account_number ?? '',
        account_name: booking.deposit_refund?.account_name ?? '',
    });

    const submitRefundAccount = (e: FormEvent) => {
        e.preventDefault();
        const effectiveBankName = refundAccountForm.data.bank_name === 'LAINNYA'
            ? refundAccountForm.data.custom_bank_name
            : refundAccountForm.data.bank_name;

        refundAccountForm.transform((data) => ({
            ...data,
            bank_name: effectiveBankName,
        })).post(
            typeof route === 'function' && route().has('book.rental.booking.refund_account')
                ? route('book.rental.booking.refund_account', booking.public_token)
                : `/book/rental/booking/${booking.public_token}/refund-account`,
            {
                preserveScroll: true,
                onSuccess: () => setShowRefundModal(false),
            }
        );
    };

    const [showAddonsModal, setShowAddonsModal] = useState(false);
    const [selectedAddonCategory, setSelectedAddonCategory] = useState<string>('all');
    const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
    const [addonNotes, setAddonNotes] = useState<Record<string, string>>({});

    const addonsForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        items: [] as Array<{ code: string; quantity: number; notes?: string }>,
    });

    const submitAddons = (e: FormEvent) => {
        e.preventDefault();
        const selectedItems = Object.entries(addonQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([code, qty]) => ({
                code,
                quantity: qty,
                notes: addonNotes[code] || undefined,
            }));

        if (selectedItems.length === 0) {
            alert('Pilih minimal satu layanan atau aksesoris tambahan.');
            return;
        }

        addonsForm.transform((data) => ({
            ...data,
            booker_phone: booking.booker_phone ?? data.booker_phone,
            otp_code: isVerified ? '' : data.otp_code,
            items: selectedItems,
        })).post(
            typeof route === 'function' && route().has('book.rental.booking.addons')
                ? route('book.rental.booking.addons', booking.public_token)
                : `/book/rental/booking/${booking.public_token}/addons`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddonsModal(false);
                    setAddonQuantities({});
                    setAddonNotes({});
                },
            }
        );
    };

    const addonEmoji = (icon: string) => {
        switch (icon) {
            case 'baby': return '👶';
            case 'box': return '🧳';
            case 'camera': return '📹';
            case 'card': return '💳';
            case 'fuel': return '⛽';
            case 'user': return '👨‍✈️';
            case 'car': return '🚗';
            case 'shield': return '🛡️';
            default: return '📦';
        }
    };

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

    const isBalancePayable =
        (booking.status === 'active' || booking.status === 'confirmed') &&
        Number(booking.payment?.balance_due ?? 0) > 0;

    const pay = (e: FormEvent) => {
        e.preventDefault();
        if (isBalancePayable && booking.payment.invoices?.[0]?.id) {
            const url = typeof route === 'function' && route().has('book.rental.booking.pay_invoice')
                ? route('book.rental.booking.pay_invoice', booking.public_token)
                : `/book/rental/booking/${booking.public_token}/pay-invoice`;
            router.post(url, {
                booker_phone: booking.booker_phone,
                invoice_id: booking.payment.invoices[0].id,
            });
            return;
        }

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

    const handleNewEndDateChange = async (date: string) => {
        extendForm.setData('new_end_date', date);
        setExtendQuoteError(null);
        if (!date) {
            setExtendQuoteData(null);
            return;
        }

        setExtendQuoteLoading(true);
        try {
            const url = typeof route === 'function' && route().has('book.rental.booking.extend_quote')
                ? route('book.rental.booking.extend_quote', booking.public_token)
                : `/book/rental/booking/${booking.public_token}/extend-quote`;

            const { data } = await axios.post(url, {
                new_end_date: date,
            });

            if (data.success) {
                setExtendQuoteData(data);
            } else {
                setExtendQuoteError(data.message || 'Gagal menghitung simulasi perpanjangan');
                setExtendQuoteData(null);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat()[0] : 'Gagal memeriksa ketersediaan tanggal');
            setExtendQuoteError(typeof msg === 'string' ? msg : 'Gagal memeriksa ketersediaan tanggal');
            setExtendQuoteData(null);
        } finally {
            setExtendQuoteLoading(false);
        }
    };

    const requestExtend = (e: FormEvent) => {
        e.preventDefault();
        const url = typeof route === 'function' && route().has('book.rental.booking.extend_request')
            ? route('book.rental.booking.extend_request', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/extend-request`;
        extendForm.post(url, {
            onSuccess: () => {
                setShowExtend(false);
                setExtendQuoteData(null);
            },
        });
    };

    const cancelExtendRequest = () => {
        setCancellingExtend(true);
        const url = typeof route === 'function' && route().has('book.rental.booking.extend_request_cancel')
            ? route('book.rental.booking.extend_request_cancel', booking.public_token)
            : `/book/rental/booking/${booking.public_token}/extend-request/cancel`;

        router.post(url, {
            booker_phone: booking.booker_phone ?? '',
            otp_code: isVerified ? '' : verificationCode,
        }, {
            onFinish: () => {
                setCancellingExtend(false);
                setShowCancelExtendConfirm(false);
            },
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
    const isVerified = !require_otp || booking.booker_phone_verified;
    const paymentSettled =
        booking.deposit_received ||
        (Number(booking.deposit_amount) <= 0 &&
            booking.payment.balance_due <= 0 &&
            !['unpaid', 'partial', 'draft'].includes(booking.payment.status));
    const documentsReady = Boolean(booking.documents?.ktp_uploaded && booking.documents?.sim_uploaded);
    const contractSigned = Boolean(booking.pickup_request?.requested_at);
    const unitHandedOver = ['active', 'returned', 'completed'].includes(booking.status);

    const timeline = useMemo(() => booking.tracking_timeline || [], [booking.tracking_timeline]);
    const totalSteps = timeline.length || 7;
    const currentStepIndex = useMemo(() => timeline.findIndex((item) => item.status === 'current'), [timeline]);
    const completedCount = useMemo(() => timeline.filter((item) => item.status === 'completed').length, [timeline]);
    const activeIndex = currentStepIndex !== -1
        ? currentStepIndex
        : (completedCount === totalSteps ? totalSteps - 1 : Math.min(completedCount, totalSteps - 1));
    const activeItem = timeline[activeIndex] || null;
    const progressPercent = useMemo(() => {
        if (totalSteps === 0) return 0;
        if (completedCount === totalSteps) return 100;
        const base = (completedCount / totalSteps) * 100;
        const currentBonus = currentStepIndex !== -1 ? (0.5 / totalSteps) * 100 : 0;
        return Math.min(95, Math.round(base + currentBonus));
    }, [completedCount, totalSteps, currentStepIndex]);

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
                                href={route('book.rental.track')}
                                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 shadow-2xs"
                            >
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span>Lacak Pesanan</span>
                            </Link>

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
                    
                    {/* Visual Live Status Tracking Timeline */}
                    <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200">
                        {/* Header with Title and Live Indicator */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <div>
                                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                                        Progres Pemesanan & Status Kendaraan
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Pantau alur sewa mulai dari reservasi hingga penyelesaian & refund deposit
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-center">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
                                    <svg className="w-3 h-3 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    Live Polling Aktif
                                </span>
                            </div>
                        </div>

                        {/* Top Progress Bar & Percentage Summary */}
                        <div className="space-y-2 mb-5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">Status Saat Ini:</span>
                                    <span className="text-slate-900 font-black">
                                        {completedCount === totalSteps
                                            ? 'Semua Tahap Selesai (100%)'
                                            : `Tahap ${activeIndex + 1} dari ${totalSteps}: ${activeItem?.title || 'Sedang Berjalan'}`}
                                    </span>
                                </div>
                                <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded-full text-xs font-black">
                                    {progressPercent}% Selesai
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/80">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Timeline Stepper Cards: 7 Columns on Desktop, Swipeable on Mobile */}
                        {timeline && timeline.length > 0 ? (
                            <div className="flex overflow-x-auto snap-x scrollbar-thin pb-2 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                                {timeline.map((item, idx) => {
                                    const isDone = item.status === 'completed';
                                    const isCurrent = item.status === 'current';
                                    const hasValidTimestamp = item.timestamp && item.timestamp.trim() !== 'WIB' && item.timestamp.trim() !== '';

                                    return (
                                        <div
                                            key={item.key || `timeline-step-${idx}`}
                                            className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all min-w-[190px] sm:min-w-0 snap-start shrink-0 sm:shrink ${
                                                isDone
                                                    ? 'bg-emerald-50/70 border-emerald-250 text-emerald-950 shadow-2xs'
                                                    : isCurrent
                                                      ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30 text-amber-950 shadow-xs'
                                                      : 'bg-slate-50/70 border-slate-200/90 text-slate-500'
                                            }`}
                                        >
                                            <div>
                                                {/* Step Pill & Status Node */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <span
                                                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                                            isDone
                                                                ? 'bg-emerald-200/80 text-emerald-900'
                                                                : isCurrent
                                                                  ? 'bg-amber-200 text-amber-900'
                                                                  : 'bg-slate-200 text-slate-600'
                                                        }`}
                                                    >
                                                        Tahap {idx + 1}
                                                    </span>

                                                    {isDone && (
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-2xs">
                                                            ✓
                                                        </span>
                                                    )}
                                                    {isCurrent && (
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black ring-2 ring-amber-200 animate-pulse shadow-2xs">
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                    {!isDone && !isCurrent && (
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Step Title & Description */}
                                                <div className={`text-xs font-black leading-tight ${isDone ? 'text-emerald-950' : isCurrent ? 'text-amber-950' : 'text-slate-800'}`}>
                                                    {item.title}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                    {item.description}
                                                </div>
                                            </div>

                                            {/* Timestamp (with guard against blank 'WIB') */}
                                            {hasValidTimestamp && (
                                                <div className="text-[9px] font-mono font-bold text-slate-500 mt-2.5 pt-1.5 border-t border-slate-200/60 flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="truncate">{item.timestamp}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                {[
                                    { done: paymentSettled, current: false, label: paymentSettled ? 'Pembayaran selesai ✓' : 'Bayar' },
                                    { done: documentsReady, current: false, label: documentsReady ? 'Dokumen diunggah ✓' : 'Unggah KTP/SIM' },
                                    { done: contractSigned, current: paymentSettled && !contractSigned && booking.status === 'confirmed', label: contractSigned ? 'Kontrak ditandatangani ✓' : 'Tanda tangan kontrak' },
                                    { done: unitHandedOver, current: contractSigned && !unitHandedOver, label: unitHandedOver ? 'Unit sudah diserahkan ✓' : 'Datang ke depot' },
                                ].map((stage, index) => (
                                    <div
                                        key={`stage-${index}`}
                                        className={`p-3 rounded-xl border space-y-0.5 ${
                                            stage.done
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                                : stage.current
                                                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-widest block ${stage.done ? 'text-emerald-600' : stage.current ? 'text-amber-600' : 'text-slate-400'}`}>
                                            Tahap {index + 1}
                                        </span>
                                        <div className="text-xs font-black">{stage.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Active Stage Callout / Action Reminder */}
                        {activeItem && activeItem.status !== 'completed' && (
                            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/40 border border-amber-250 flex items-start sm:items-center justify-between gap-3 shadow-2xs">
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-black text-xs shadow-xs">
                                        {activeIndex + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                                                Langkah Saat Ini
                                            </span>
                                            <span className="text-xs sm:text-sm font-black text-slate-900">
                                                {activeItem.title}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                            {activeItem.description}
                                        </p>
                                    </div>
                                </div>
                                {activeItem.timestamp && activeItem.timestamp.trim() !== 'WIB' && (
                                    <div className="hidden md:block shrink-0 text-right">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                            Update Terakhir
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-700">
                                            {activeItem.timestamp}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        {completedCount === totalSteps && totalSteps > 0 && (
                            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-250 flex items-center gap-3 shadow-2xs">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-xs shadow-xs">
                                    ✓
                                </div>
                                <div>
                                    <div className="text-xs sm:text-sm font-black text-emerald-950">
                                        Semua Proses Sewa Selesai
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-0.5">
                                        Unit telah berhasil dikembalikan dan seluruh kewajiban sewa serta refund deposit telah terselesaikan. Terima kasih telah mempercayai kami!
                                    </p>
                                </div>
                            </div>
                        )}
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
                                    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void navigator.clipboard.writeText(window.location.href);
                                                setLinkCopied(true);
                                                window.setTimeout(() => setLinkCopied(false), 2000);
                                            }}
                                            className="text-xs font-bold text-slate-600 underline"
                                        >
                                            {linkCopied ? 'Tautan tersalin' : 'Salin tautan pesanan'}
                                        </button>
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`Kode booking ${booking.code}. Buka pesanan: ${window.location.href}`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-slate-600 underline"
                                        >
                                            Kirim ke WhatsApp saya
                                        </a>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 sm:items-end">
                                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black border ${statusBadge.bg} ${statusBadge.color}`}>
                                        <span className={`h-2 w-2 rounded-full ${statusBadge.dot}`} />
                                        {statusBadge.label}
                                    </span>
                                    {booking.status_hint && (
                                        <p className="max-w-[16rem] text-center text-[11px] font-semibold leading-snug text-slate-500 sm:text-right">
                                            {booking.status_hint}
                                        </p>
                                    )}
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

                            {/* Transfer Proof Pending Verification Banner */}
                            {booking.deposit_proof?.status === 'pending' && (
                                <div className="overflow-hidden rounded-2xl bg-amber-50 border border-amber-200 p-5 text-amber-950 shadow-xs space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200/60 text-lg">
                                            ⏳
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-amber-900">
                                                Bukti Transfer Sedang Diverifikasi
                                            </h3>
                                            <p className="text-xs text-amber-800">
                                                Bukti pembayaran Anda telah kami terima dan sedang diverifikasi oleh staf operasional.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Transfer Proof Rejected Banner */}
                            {booking.deposit_proof?.status === 'rejected' && (
                                <div className="overflow-hidden rounded-2xl bg-rose-50 border border-rose-200 p-5 text-rose-950 shadow-xs space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-200/60 text-lg">
                                            ⚠️
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-rose-900">
                                                Bukti Transfer Ditolak
                                            </h3>
                                            <p className="text-xs text-rose-800">
                                                {booking.deposit_proof.rejected_reason || 'Mohon unggah kembali bukti transfer yang valid dan sesuai nominal.'}
                                            </p>
                                        </div>
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
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-xs font-mono font-bold text-slate-400">{booking.vehicle?.plate_number}</span>
                                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                                                booking.service_type === 'with_driver'
                                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                                            }`}>
                                                {booking.service_type === 'with_driver' ? '👨‍✈️ Dengan Sopir' : '🔑 Lepas Kunci'}
                                            </span>
                                            {booking.delivery_type && booking.delivery_type !== 'depot' && (
                                                <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                                    ✈️ Antar {booking.delivery_type === 'airport' ? 'Bandara' : 'Lokasi'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule & Depot Grid */}
                                <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-1">
                                            <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Mulai Sewa</span>
                                            <span className="font-black text-slate-900 text-sm block">{booking.start_date ?? '—'}{booking.pickup_time ? ` · ${booking.pickup_time}` : ''}</span>
                                            {booking.pickup_location && (
                                                <span className="block text-[11px] text-slate-500 font-medium">{booking.pickup_location}</span>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-1">
                                            <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Selesai Sewa</span>
                                            <span className="font-black text-slate-900 text-sm block">{booking.end_date ?? '—'}{booking.return_time ? ` · ${booking.return_time}` : ''}</span>
                                            {booking.return_location && (
                                                <span className="block text-[11px] text-slate-500 font-medium">{booking.return_location}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delivery details if custom / airport */}
                                    {booking.delivery_address && (
                                        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-1">
                                            <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Titik Pengantaran Unit ({booking.delivery_type})</span>
                                            <span className="font-bold text-slate-900 text-xs block">{booking.delivery_address}</span>
                                            {booking.delivery_landmark && (
                                                <span className="block text-[11px] text-slate-500 font-medium">Patokan: {booking.delivery_landmark}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Emergency contact info */}
                                    {booking.emergency_contact?.name && (
                                        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-1">
                                            <span className="block font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Kontak Darurat Penjamin</span>
                                            <span className="font-bold text-slate-900 text-xs block">
                                                {booking.emergency_contact.name} ({booking.emergency_contact.relation || 'Kerabat'}) · {booking.emergency_contact.phone}
                                            </span>
                                            {booking.social_media_account && (
                                                <span className="block text-[11px] text-slate-500 font-medium">Medsos: {booking.social_media_account}</span>
                                            )}
                                        </div>
                                    )}

                                    {booking.insurance_package && (
                                        <div className="flex items-center justify-between rounded-xl bg-teal-50 p-3 border border-teal-200 text-teal-900 text-xs">
                                            <span>Paket Proteksi: <b className="font-black">{booking.insurance_package.name}</b></span>
                                            <span className="font-black">{money(booking.insurance_package.amount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Driver Assignment Card (if with_driver or driver assigned) */}
                            {booking.driver && (
                                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">👨‍✈️</span>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Sopir Ditugaskan</span>
                                                <h4 className="text-sm font-black text-white">Driver Siap Melayani Perjalanan Anda</h4>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                            Driver Siap
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {booking.driver.photo_url ? (
                                            <img
                                                src={booking.driver.photo_url}
                                                alt={booking.driver.name}
                                                className="h-14 w-14 rounded-2xl object-cover border-2 border-white/20"
                                            />
                                        ) : (
                                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
                                                {booking.driver.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-base font-black truncate">{booking.driver.name}</h5>
                                            <p className="text-xs text-slate-300 font-mono mt-0.5">{booking.driver.phone || 'Nomor HP via konfirmasi'}</p>
                                        </div>
                                    </div>

                                    {booking.driver.phone && (
                                        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2.5">
                                            <a
                                                href={`https://wa.me/${booking.driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo Pak ${booking.driver.name}, saya penyewa unit rental dengan kode ${booking.code}.`)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition shadow-sm"
                                            >
                                                <span>Chat WhatsApp Driver</span>
                                            </a>
                                            <a
                                                href={`tel:${booking.driver.phone}`}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-black text-white transition"
                                            >
                                                <span>Telepon</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Official Digital Documents (Contract & BAST Download Hub) */}
                            {booking.pdf_urls && (booking.pdf_urls.contract || booking.pdf_urls.handover) && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">📄</span>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Dokumen & Kontrak Digital</h4>
                                                <p className="text-xs text-slate-400">Unduh berkas legalitas resmi sewa kendaraan Anda</p>
                                            </div>
                                        </div>
                                        {booking.contract?.signed && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                ✓ TTD Digital Sah
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {booking.pdf_urls.contract && (
                                            <a
                                                href={booking.pdf_urls.contract}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-black text-xs">
                                                        PDF
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">Kontrak Sewa</div>
                                                        <div className="text-[10px] text-slate-400">Perjanjian & Tanda Tangan</div>
                                                    </div>
                                                </div>
                                                <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                        )}

                                        {booking.pdf_urls.handover && (
                                            <a
                                                href={booking.pdf_urls.handover}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                                        PDF
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">Berita Acara (BAST)</div>
                                                        <div className="text-[10px] text-slate-400">Kondisi Serah Terima Fisik</div>
                                                    </div>
                                                </div>
                                                <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Post-Booking Add-ons & Extra Accessories Hub */}
                            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg border border-amber-200/60 shadow-xs">
                                            📦
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                Katalog Add-on & Aksesoris Tambahan
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Perlengkapan dan layanan ekstra selama masa sewa kendaraan Anda
                                            </p>
                                        </div>
                                    </div>
                                    {booking.can_order_addons && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isVerified) {
                                                    alert('Verifikasi nomor WhatsApp Anda terlebih dahulu');
                                                    return;
                                                }
                                                setShowAddonsModal(true);
                                            }}
                                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black shadow-xs transition ${
                                                !isVerified
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                                            }`}
                                        >
                                            <span>+</span>
                                            <span>Pesan Layanan Tambahan</span>
                                        </button>
                                    )}
                                </div>

                                {/* Ordered Addons List */}
                                {booking.ordered_addons && booking.ordered_addons.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 p-1">
                                            {booking.ordered_addons.map((addon) => (
                                                <div key={addon.id} className="flex items-center justify-between p-3 text-xs">
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            <span>{addon.description}</span>
                                                            {addon.is_invoiced && (
                                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                    ✓ Masuk Tagihan
                                                                </span>
                                                            )}
                                                        </div>
                                                        {addon.created_at && (
                                                            <p className="text-[11px] text-slate-400">Dipesan: {addon.created_at}</p>
                                                        )}
                                                    </div>
                                                    <span className="font-black text-slate-900 tabular-nums text-sm">
                                                        {money(addon.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {booking.payment?.balance_due > 0 && (
                                            <div className="rounded-xl bg-blue-50 border border-blue-200/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
                                                <div className="flex items-center gap-2">
                                                    <span>💳</span>
                                                    <span>
                                                        Sisa tagihan (termasuk add-on): <strong>{money(booking.payment.balance_due)}</strong>
                                                    </span>
                                                </div>
                                                {booking.payment.can_pay_balance && (
                                                    <a
                                                        href="#section-payment"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            document.getElementById('section-payment')?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                        className="inline-flex items-center justify-center font-bold underline hover:text-blue-700"
                                                    >
                                                        Bayar Tagihan Sekarang ➔
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center space-y-2">
                                        <p className="text-xs text-slate-500">
                                            Belum ada aksesoris atau layanan tambahan yang dipesan.
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Tersedia kursi bayi (baby seat), roof box & rak bagasi, kamera dashcam 4K, kartu e-toll, prepaid BBM, hingga supir tambahan.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Documents Upload Section */}
                            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Dokumen Verifikasi (KTP & SIM)</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">KTP dan SIM keduanya wajib. Foto harus utuh, terang, dan tulisan masih terbaca.</p>
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

                                <div className="flex flex-wrap gap-2.5 text-xs">
                                    <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents?.ktp_uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                        KTP: {booking.documents?.ktp_uploaded ? 'Terunggah ✓' : 'Belum'}
                                    </span>
                                    <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents?.sim_uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                        SIM A: {booking.documents?.sim_uploaded ? 'Terunggah ✓' : 'Belum'}
                                    </span>
                                    <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents?.guarantor_uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                        Dokumen Penjamin: {booking.documents?.guarantor_uploaded ? 'Terunggah ✓' : 'Belum'}
                                    </span>
                                    {booking.documents?.ai_kyc_assessment && (
                                        <span className={`rounded-lg px-2.5 py-1 font-bold border ${booking.documents.ai_kyc_assessment.status === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                            e-KYC AI: {booking.documents.ai_kyc_assessment.status === 'verified' ? 'Terverifikasi ✓' : 'Perlu Review Staff'}
                                        </span>
                                    )}
                                    {!booking.documents?.ai_kyc_assessment && booking.documents?.partner_identity?.id_number && (
                                        <span className="rounded-lg px-2.5 py-1 font-bold border bg-slate-50 border-slate-200 text-slate-700">
                                            NIK: {booking.documents.partner_identity.id_number}
                                        </span>
                                    )}
                                </div>

                                {showDocs && isVerified && (
                                    <form onSubmit={uploadDocuments} className="mt-4 pt-4 border-t border-slate-100 space-y-4" noValidate>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Foto KTP Penyewa
                                                    {booking.documents?.ai_ocr_enabled !== false && (
                                                        <span className="ml-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                                            ⚡ Auto-Scan OCR
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        docsForm.setData('ktp', f);
                                                        if (f && (booking.documents?.ai_ocr_enabled !== false)) {
                                                            scanDocumentOcr(f, 'ktp');
                                                        }
                                                    }}
                                                    className="text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                                                />

                                                {scanningKtp && (
                                                    <div className="mt-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5">
                                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                                        <span className="text-xs font-semibold text-blue-800">
                                                            AI sedang memindai KTP & membaca NIK...
                                                        </span>
                                                    </div>
                                                )}

                                                {ktpOcrError && (
                                                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                                        ⚠️ {ktpOcrError}
                                                    </div>
                                                )}

                                                {ktpOcrResult && (
                                                    <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                                                <span className="text-emerald-600">✓</span> Hasil OCR KTP
                                                            </span>
                                                            {ktpOcrValidation?.checks?.nik_16_digits?.passed ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    16 Digit Valid
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                                                    Periksa NIK
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1.5 pt-1">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                                                    NIK (16 Digit)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    maxLength={16}
                                                                    value={docsForm.data.id_number}
                                                                    onChange={(e) => docsForm.setData('id_number', e.target.value)}
                                                                    placeholder="Contoh: 3201234567890001"
                                                                    className="w-full mt-0.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-slate-900 focus:outline-none"
                                                                />
                                                            </div>

                                                            {ktpOcrResult.data?.name && (
                                                                <div className="text-xs text-slate-600">
                                                                    <span className="text-slate-400">Nama di KTP:</span> <b>{ktpOcrResult.data.name}</b>
                                                                    {ktpOcrValidation?.checks?.name_match?.passed !== undefined && (
                                                                        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${ktpOcrValidation.checks.name_match.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                            {ktpOcrValidation.checks.name_match.passed ? 'Nama Sesuai' : 'Beda Nama'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {ktpOcrValidation?.warnings?.length > 0 && (
                                                                <div className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                                                                    {ktpOcrValidation.warnings[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Foto SIM A Penyewa
                                                    {booking.documents?.ai_ocr_enabled !== false && (
                                                        <span className="ml-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                                            ⚡ Auto-Scan OCR
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        docsForm.setData('sim', f);
                                                        if (f && (booking.documents?.ai_ocr_enabled !== false)) {
                                                            scanDocumentOcr(f, 'sim');
                                                        }
                                                    }}
                                                    className="text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                                                />

                                                {scanningSim && (
                                                    <div className="mt-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5">
                                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                                        <span className="text-xs font-semibold text-blue-800">
                                                            AI sedang memindai SIM & masa berlaku...
                                                        </span>
                                                    </div>
                                                )}

                                                {simOcrError && (
                                                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                                        ⚠️ {simOcrError}
                                                    </div>
                                                )}

                                                {simOcrResult && (
                                                    <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                                                <span className="text-emerald-600">✓</span> Hasil OCR SIM
                                                            </span>
                                                            {simOcrValidation?.checks?.sim_expiry?.passed ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    SIM Aktif
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                                                    {simOcrValidation?.checks?.sim_expiry?.is_expired ? 'SIM Kedaluwarsa' : 'Periksa Masa Berlaku'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                                                    Nomor SIM
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={docsForm.data.license_number}
                                                                    onChange={(e) => docsForm.setData('license_number', e.target.value)}
                                                                    placeholder="Nomor SIM"
                                                                    className="w-full mt-0.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-slate-900 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                                                    Masa Berlaku
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={docsForm.data.license_expires_at}
                                                                    onChange={(e) => docsForm.setData('license_expires_at', e.target.value)}
                                                                    className="w-full mt-0.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-slate-900 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        {simOcrValidation?.warnings?.length > 0 && (
                                                            <div className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-200">
                                                                {simOcrValidation.warnings[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Jenis Dokumen Penjamin
                                                </label>
                                                <select
                                                    value={docsForm.data.guarantor_doc_type}
                                                    onChange={(e) => docsForm.setData('guarantor_doc_type', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-slate-900 focus:outline-none"
                                                >
                                                    <option value="flight_ticket">Tiket Pesawat Pulang-Pergi</option>
                                                    <option value="hotel_booking">Voucher Reservasi Hotel</option>
                                                    <option value="employee_id">ID Card Karyawan / Kartu Nama</option>
                                                    <option value="family_card">Kartu Keluarga (KK)</option>
                                                    <option value="other">Dokumen Lainnya</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Unggah Dokumen Penjamin
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => docsForm.setData('guarantor_doc', e.target.files?.[0] ?? null)}
                                                    className="text-xs text-slate-600 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={docsForm.processing || scanningKtp || scanningSim}
                                            className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            {docsForm.processing ? 'Mengunggah & Memproses...' : 'Simpan Dokumen'}
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
                                        <span>Sewa ({booking.total_periods} {booking.period_type === 'weekly' ? 'minggu' : booking.period_type === 'monthly' ? 'bulan' : 'hari'})</span>
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

                            {/* Payment Box (Deposit / Extension / Balance) */}
                            {(booking.can_pay_deposit || isBalancePayable) && booking.deposit_proof?.status !== 'pending' && (
                                <div id="section-payment" className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-md space-y-4">
                                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            {isBalancePayable
                                                ? 'Pembayaran Tagihan / Perpanjangan Sewa'
                                                : (Number(booking.deposit_amount) > 0 ? 'Pembayaran Deposit' : 'Pembayaran Sewa')}
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
                                                    Bayar online
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

                                                        const payableAmount = isBalancePayable
                                                            ? Number(booking.payment.balance_due)
                                                            : (Number(booking.deposit_amount) > 0 ? Number(booking.deposit_amount) : Number(booking.total_amount));

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
                                                                    Transfer nominal: <b className="text-slate-950 font-black">{money(payableAmount)}</b>
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
                                                        Bayar online ({money(
                                                            isBalancePayable
                                                                ? Number(booking.payment.balance_due)
                                                                : (Number(booking.deposit_amount) > 0 ? Number(booking.deposit_amount) : Number(booking.total_amount))
                                                        )})
                                                    </button>
                                                </form>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Contract signature — not the physical handover */}
                            {booking.status === 'confirmed' && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-md space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            Tanda tangan kontrak
                                        </h3>
                                        <p className="text-[11px] font-medium leading-relaxed text-slate-500">
                                            Unit baru diserahkan setelah staf depot menyelesaikan serah terima.
                                        </p>
                                    </div>

                                    {booking.pickup_request?.requested_at ? (
                                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-950 space-y-2">
                                            <div className="font-bold">Kontrak ditandatangani ✓</div>
                                            <p className="leading-relaxed">Tunjukkan layar ini kepada staf depot. Unit belum diserahkan.</p>
                                            <p className="leading-relaxed font-medium">Datang ke depot sesuai jadwal. Staf yang akan menyerahkan kunci.</p>
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
                                                {pickupForm.processing ? 'Mengirim...' : 'Tanda tangani kontrak'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Self-Return Card (When Active) */}
                            {booking.status === 'active' && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
                                                🚗
                                            </span>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                    Pengembalian Unit Mandiri
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Selesaikan sewa & serah terima BAST akhir secara mandiri.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isVerified) {
                                                    alert('Verifikasi nomor WhatsApp terlebih dahulu');
                                                    return;
                                                }
                                                setShowReturnModal(!showReturnModal);
                                            }}
                                            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-black transition shadow-xs"
                                        >
                                            {showReturnModal ? 'Tutup Form' : 'Mulai Pengembalian'}
                                        </button>
                                    </div>

                                    {showReturnModal && isVerified && (
                                        <form onSubmit={submitReturnRequest} className="mt-4 pt-4 border-t border-emerald-100 space-y-5" noValidate>
                                            {/* Step 1: Upload Return Photos */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                                                        1. Foto Kondisi Pengembalian ({returnForm.data.return_photos.length}/5)
                                                    </label>
                                                    <span className="text-[10px] text-slate-400">
                                                        Wajib: 4 Sisi Mobil & Spidometer
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                    {returnForm.data.return_photos.map((src, i) => (
                                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                                                            <img src={src} alt={`Return photo ${i + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeReturnPhoto(i)}
                                                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow opacity-80 group-hover:opacity-100"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {returnForm.data.return_photos.length < 5 && (
                                                        <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white flex flex-col items-center justify-center cursor-pointer transition p-2 text-center">
                                                            <span className="text-xl">📸</span>
                                                            <span className="text-[10px] font-bold text-slate-600 mt-1">Tambah Foto</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={handleReturnPhotoUpload}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                                {returnForm.errors.return_photos && (
                                                    <p className="text-xs text-rose-600 font-medium">{returnForm.errors.return_photos}</p>
                                                )}
                                            </div>

                                            {/* Step 2: AI Fast-Scan Button & Results */}
                                            {booking.ai_inspection_enabled !== false && returnForm.data.return_photos.length > 0 && (
                                                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                                                            <span>✨</span> AI Vision Inspector
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={scanningReturnPhotos}
                                                            onClick={runReturnAiInspection}
                                                            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3 py-1 transition disabled:opacity-50"
                                                        >
                                                            {scanningReturnPhotos ? 'Menganalisis Foto...' : 'Pindai Odometer & Bodi'}
                                                        </button>
                                                    </div>

                                                    {scanningReturnPhotos && (
                                                        <div className="flex items-center gap-2 text-xs text-blue-800">
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                                            <span>AI sedang memeriksa odometer, sisa BBM, dan goresan bodi baru...</span>
                                                        </div>
                                                    )}

                                                    {returnAiError && (
                                                        <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                                                            {returnAiError}
                                                        </div>
                                                    )}

                                                    {returnAiInspection && (
                                                        <div className="space-y-2 pt-1 text-xs">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded font-bold border ${returnAiInspection.overall_status === 'clean' ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-amber-100 border-amber-300 text-amber-900'}`}>
                                                                    {returnAiInspection.overall_status === 'clean' ? 'Bodi Sesuai ✓' : 'Kerusakan Baru Terdeteksi'}
                                                                </span>
                                                                {returnAiInspection.extracted_odometer && (
                                                                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                                                                        Odo: {returnAiInspection.extracted_odometer} KM
                                                                    </span>
                                                                )}
                                                                {returnAiInspection.extracted_fuel_level && (
                                                                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                                                                        BBM: {returnAiInspection.extracted_fuel_level}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                                {returnAiInspection.condition_summary}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Step 3: Odometer & Fuel Inputs */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                        Odometer Akhir (KM)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={returnForm.data.end_odometer}
                                                        onChange={(e) => returnForm.setData('end_odometer', e.target.value)}
                                                        placeholder={booking.checkout_details?.start_odometer ? `Awal: ${booking.checkout_details.start_odometer} KM` : 'Contoh: 45200'}
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-slate-900 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                        Level BBM Akhir
                                                    </label>
                                                    <select
                                                        value={returnForm.data.end_fuel_level}
                                                        onChange={(e) => returnForm.setData('end_fuel_level', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-slate-900 focus:outline-none"
                                                    >
                                                        {(booking.fuel_levels || ['empty', '1/4', '1/2', '3/4', 'full']).map((lvl) => (
                                                            <option key={lvl} value={lvl}>{lvl.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Checklist */}
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                                                <span className="text-[11px] font-black uppercase text-slate-700 block">
                                                    2. Checklist Serah Terima
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(returnForm.data.return_checklist?.interior)}
                                                            onChange={(e) => returnForm.setData('return_checklist', { ...returnForm.data.return_checklist, interior: e.target.checked })}
                                                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                        />
                                                        <span>Interior Bersih & Rapi</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(returnForm.data.return_checklist?.keys)}
                                                            onChange={(e) => returnForm.setData('return_checklist', { ...returnForm.data.return_checklist, keys: e.target.checked })}
                                                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                        />
                                                        <span>Kunci Fisik & STNK Lengkap</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(returnForm.data.return_checklist?.documents)}
                                                            onChange={(e) => returnForm.setData('return_checklist', { ...returnForm.data.return_checklist, documents: e.target.checked })}
                                                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                        />
                                                        <span>Tidak Ada Barang Tertinggal</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(returnForm.data.return_checklist?.exterior_body)}
                                                            onChange={(e) => returnForm.setData('return_checklist', { ...returnForm.data.return_checklist, exterior_body: e.target.checked })}
                                                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                        />
                                                        <span>Bodi Kendaraan Sesuai</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Return Notes */}
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                    Catatan Pengembalian (Opsional)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Kunci dititipkan ke security lobby"
                                                    value={returnForm.data.return_notes}
                                                    onChange={(e) => returnForm.setData('return_notes', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
                                                />
                                            </div>

                                            {/* Digital Signature */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                                                    3. Tanda Tangan BAST Pengembalian
                                                </label>
                                                <DigitalSignaturePad
                                                    value={returnForm.data.customer_signature}
                                                    onChange={(val) => returnForm.setData('customer_signature', val)}
                                                />
                                                {returnForm.errors.customer_signature && (
                                                    <p className="text-xs text-rose-600 font-medium">{returnForm.errors.customer_signature}</p>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={returnForm.processing || scanningReturnPhotos}
                                                className="w-full h-11 flex items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-black uppercase text-white shadow-sm transition disabled:opacity-50"
                                            >
                                                {returnForm.processing ? 'Menyimpan Pengembalian...' : 'Selesaikan Pengembalian Unit'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Returned Summary Card (When Returned or Completed) */}
                            {(booking.status === 'returned' || booking.status === 'completed') && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
                                                ✓
                                            </span>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                    Unit Berhasil Dikembalikan
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    {booking.return_details?.returned_at || 'Pengembalian telah dicatat'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-xs font-bold">
                                            BAST Selesai
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                                        {booking.return_details?.end_odometer && (
                                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                <span className="text-[10px] text-slate-400 block font-bold uppercase">Odo Akhir</span>
                                                <span className="font-extrabold text-slate-800">{booking.return_details.end_odometer} KM</span>
                                            </div>
                                        )}
                                        {booking.return_details?.end_fuel_level && (
                                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                <span className="text-[10px] text-slate-400 block font-bold uppercase">BBM Akhir</span>
                                                <span className="font-extrabold text-slate-800">{booking.return_details.end_fuel_level.toUpperCase()}</span>
                                            </div>
                                        )}
                                        {booking.pdf_urls?.handover && (
                                            <a
                                                href={booking.pdf_urls.handover}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-blue-50 hover:bg-blue-100 p-2.5 rounded-xl border border-blue-200 text-blue-800 font-bold flex flex-col justify-center items-center text-center transition"
                                            >
                                                <span className="text-[10px] block uppercase font-bold text-blue-600">Unduh Dokumen</span>
                                                <span>PDF BAST Resmi</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Security Deposit Refund Hub Card */}
                            {booking.deposit_refund?.has_deposit && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 text-lg">
                                                💰
                                            </span>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                    Pusat Pengembalian Deposit (Refund Hub)
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Total Jaminan: <strong className="text-slate-800">{money(booking.deposit_refund.deposit_amount)}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        {(() => {
                                            const s = booking.deposit_refund.refund_status;
                                            if (s === 'refunded') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-700 shadow-2xs">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Dana Telah Ditransfer
                                                    </span>
                                                );
                                            }
                                            if (s === 'approved') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-300 px-3 py-1 text-xs font-black text-blue-700 shadow-2xs">
                                                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                                        Disetujui • Siap Ditransfer
                                                    </span>
                                                );
                                            }
                                            if (s === 'in_review') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-300 px-3 py-1 text-xs font-black text-purple-700 shadow-2xs">
                                                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                                                        Pemeriksaan E-Tilang & Denda
                                                    </span>
                                                );
                                            }
                                            if (s === 'pending_bank_info') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-black text-amber-700 shadow-2xs">
                                                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                                                        Perlu Rekening Refund
                                                    </span>
                                                );
                                            }
                                            if (s === 'bank_submitted') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-300 px-3 py-1 text-xs font-black text-teal-700 shadow-2xs">
                                                        <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                                                        Rekening Tersimpan
                                                    </span>
                                                );
                                            }
                                            if (s === 'forfeited') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-black text-slate-700 shadow-2xs">
                                                        Dipotong Pelunasan Sewa
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                                                    Ditahan Selama Sewa
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    {/* Calculation Summary Box */}
                                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-2">
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span>Uang Jaminan Deposit Awal:</span>
                                            <span className="font-bold text-slate-800">{money(booking.deposit_refund.deposit_amount)}</span>
                                        </div>
                                        {booking.deposit_refund.deposit_applied_amount > 0 && (
                                            <div className="flex justify-between items-center text-rose-600">
                                                <span>Potongan Biaya / Kerusakan / Denda:</span>
                                                <span className="font-bold">- {money(booking.deposit_refund.deposit_applied_amount)}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900 font-black">
                                            <span>Total Pengembalian Bersih:</span>
                                            <span className={`text-sm ${booking.deposit_refund.refund_status === 'refunded' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {money(booking.deposit_refund.deposit_status === 'settled'
                                                    ? booking.deposit_refund.deposit_refunded_amount
                                                    : booking.deposit_refund.deposit_amount)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Destination Bank Account Section */}
                                    {booking.deposit_refund.bank_name ? (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                                    <span>🏦</span> Rekening Tujuan Pengembalian:
                                                </span>
                                                {booking.deposit_refund.can_submit_bank && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!isVerified) {
                                                                alert('Mohon verifikasi nomor WhatsApp Anda terlebih dahulu.');
                                                                return;
                                                            }
                                                            setShowRefundModal(true);
                                                        }}
                                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                                                    >
                                                        Ubah Rekening
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-slate-900 font-bold text-sm">
                                                {booking.deposit_refund.bank_name} • {booking.deposit_refund.account_number}
                                            </div>
                                            <div className="text-slate-600 text-xs">
                                                Atas Nama: <strong className="text-slate-800">{booking.deposit_refund.account_name}</strong>
                                            </div>
                                            {booking.deposit_refund.bank_submitted_at && (
                                                <div className="text-[10px] text-slate-500 pt-1">
                                                    Diajukan pada {booking.deposit_refund.bank_submitted_at}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs space-y-3">
                                            <div className="flex items-start gap-2.5">
                                                <span className="text-lg">💳</span>
                                                <div>
                                                    <h4 className="font-bold text-amber-950">Rekening Pengembalian Belum Terdaftar</h4>
                                                    <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                                                        Agar dana deposit dapat langsung ditransfer kembali setelah masa sewa selesai, silakan daftarkan nomor rekening bank atau e-wallet Anda.
                                                    </p>
                                                </div>
                                            </div>
                                            {booking.deposit_refund.can_submit_bank && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!isVerified) {
                                                            alert('Mohon verifikasi nomor WhatsApp Anda terlebih dahulu.');
                                                            return;
                                                        }
                                                        setShowRefundModal(true);
                                                    }}
                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 text-xs shadow-xs transition"
                                                >
                                                    <span>Input Rekening Pengembalian Sekarang</span>
                                                    <span>→</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Transfer Receipt Proof Section (When Refunded) */}
                                    {booking.deposit_refund.refund_status === 'refunded' && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                                    <span>🧾</span> Bukti Transfer Pengembalian Dana
                                                </div>
                                                {booking.deposit_refund.refunded_at && (
                                                    <span className="text-[11px] text-slate-500">{booking.deposit_refund.refunded_at}</span>
                                                )}
                                            </div>
                                            {booking.deposit_refund.refund_notes && (
                                                <p className="text-[11px] text-slate-600 italic">
                                                    "{booking.deposit_refund.refund_notes}"
                                                </p>
                                            )}
                                            {booking.deposit_refund.refund_proof_url ? (
                                                <a
                                                    href={booking.deposit_refund.refund_proof_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs"
                                                >
                                                    <span>📎</span>
                                                    <span>Lihat Bukti Transfer Bank (Struk)</span>
                                                    <span>↗</span>
                                                </a>
                                            ) : (
                                                <p className="text-[11px] text-slate-500">
                                                    Transfer telah berhasil diselesaikan oleh tim Finance kami.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Additional policy information */}
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        ℹ️ <em>Kebijakan Pengembalian: Uang jaminan deposit diproses 1-3 hari kerja setelah unit dikembalikan untuk memastikan tidak ada denda e-tilang (ETLE) atau kerusakan tersembunyi.</em>
                                    </p>
                                </div>
                            )}

                            {/* Self-Service Rental Extension Hub Card */}
                            {(booking.can_request_extend || booking.extend_request || (booking.extensions_history && booking.extensions_history.length > 0)) && (
                                <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">⏱️</span>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                    Perpanjangan Sewa Mandiri
                                                </h3>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    Tambah durasi sewa armada langsung dari portal
                                                </p>
                                            </div>
                                        </div>
                                        {booking.extend_request?.status === 'pending' && (
                                            <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 animate-pulse">
                                                Menunggu Review
                                            </span>
                                        )}
                                        {booking.extend_request?.status === 'approved' && (
                                            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                                                Disetujui
                                            </span>
                                        )}
                                        {booking.extend_request?.status === 'rejected' && (
                                            <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-800">
                                                Ditolak
                                            </span>
                                        )}
                                    </div>

                                    {/* Pending Request Detail View */}
                                    {booking.extend_request && booking.extend_request.status === 'pending' && (
                                        <div className={`rounded-xl p-4 border text-xs space-y-3 ${
                                            booking.extend_request.has_conflict
                                                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                                                : 'bg-indigo-50/90 border-indigo-200 text-indigo-950'
                                        }`}>
                                            <div className="flex items-center justify-between font-bold">
                                                <span className="flex items-center gap-1.5">
                                                    <span>{booking.extend_request.has_conflict ? '⚠️' : '⏳'}</span>
                                                    <span>{booking.extend_request.has_conflict ? 'Pengajuan Menunggu Penyesuaian Armada' : 'Pengajuan Sedang Ditinjau Tim Operasional'}</span>
                                                </span>
                                                {booking.extend_request.created_at && (
                                                    <span className="text-[11px] text-slate-500">{booking.extend_request.created_at}</span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                                <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/60">
                                                    <span className="text-slate-500 block">Tanggal Selesai Baru</span>
                                                    <strong className="text-slate-900 text-xs">{booking.extend_request.requested_end_date}</strong>
                                                    <span className="text-slate-500 text-[10px] block mt-0.5">(+{booking.extend_request.estimated_periods} hari)</span>
                                                </div>
                                                <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/60">
                                                    <span className="text-slate-500 block">Estimasi Tagihan Tambahan</span>
                                                    <strong className="text-indigo-700 text-xs">{money(booking.extend_request.estimated_amount)}</strong>
                                                    <span className="text-slate-500 text-[10px] block mt-0.5">Sesuai tarif sewa aktif</span>
                                                </div>
                                            </div>

                                            {booking.extend_request.notes && (
                                                <p className="text-[11px] italic bg-white/60 p-2 rounded-lg border border-slate-200/40">
                                                    "{booking.extend_request.notes}"
                                                </p>
                                            )}

                                            {booking.extend_request.has_conflict ? (
                                                <div className="rounded-lg bg-amber-100/90 border border-amber-300 p-2.5 text-[11px] leading-relaxed text-amber-950 font-medium">
                                                    🛑 <strong>Perhatian:</strong> Tanggal yang Anda ajukan beririsan dengan pesanan pelanggan lain. Staf kami sedang memeriksa opsi alokasi unit armada pengganti. <strong>Mohon TIDAK melakukan transfer manual sebelum pengajuan ini disetujui staf.</strong>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] leading-relaxed text-emerald-900 font-medium">
                                                    ✅ <strong>Unit Bebas Bentrok:</strong> Kendaraan tersedia. Pengajuan sedang dalam antrean verifikasi staf operasional.
                                                </div>
                                            )}

                                            <div className="pt-1 flex items-center justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCancelExtendConfirm(true)}
                                                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
                                                >
                                                    <span>✕</span>
                                                    <span>Batalkan Pengajuan Ini</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recently Approved Banner */}
                                    {booking.extend_request && booking.extend_request.status === 'approved' && (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-950 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 font-black text-emerald-900">
                                                    <span>🎉</span> Perpanjangan Disetujui
                                                </div>
                                                {booking.extend_request.reviewed_at && (
                                                    <span className="text-[11px] text-emerald-700">{booking.extend_request.reviewed_at}</span>
                                                )}
                                            </div>
                                            <p className="text-xs leading-relaxed text-emerald-900">
                                                Sewa Anda telah resmi diperpanjang hingga <strong>{booking.extend_request.requested_end_date}</strong>.
                                            </p>
                                            {booking.extend_request.staff_notes && (
                                                <p className="text-[11px] italic bg-white/60 p-2 rounded-lg border border-emerald-200 text-emerald-800">
                                                    Catatan Staf: "{booking.extend_request.staff_notes}"
                                                </p>
                                            )}
                                            {booking.payment?.balance_due > 0 && (
                                                <div className="pt-1 flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-emerald-900">Sisa Tagihan Tambahan:</span>
                                                    <span className="font-black text-sm text-emerald-800">{money(booking.payment.balance_due)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Recently Rejected Banner */}
                                    {booking.extend_request && booking.extend_request.status === 'rejected' && (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-950 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 font-black text-rose-900">
                                                    <span>⚠️</span> Pengajuan Perpanjangan Belum Dapat Disetujui
                                                </div>
                                                {booking.extend_request.reviewed_at && (
                                                    <span className="text-[11px] text-rose-700">{booking.extend_request.reviewed_at}</span>
                                                )}
                                            </div>
                                            {booking.extend_request.staff_notes ? (
                                                <p className="text-xs leading-relaxed text-rose-900">
                                                    Alasan Staf: <em>"{booking.extend_request.staff_notes}"</em>
                                                </p>
                                            ) : (
                                                <p className="text-xs leading-relaxed text-rose-900">
                                                    Jadwal kendaraan tidak memungkinkan untuk diperpanjang pada tanggal tersebut.
                                                </p>
                                            )}
                                            <p className="text-[11px] font-medium text-rose-800">
                                                Harap mengembalikan armada sesuai jadwal batas sewa semula pada <strong>{booking.end_date}</strong>.
                                            </p>
                                        </div>
                                    )}

                                    {/* Extensions History (Past Approved Extensions) */}
                                    {booking.extensions_history && booking.extensions_history.length > 0 && (
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2 text-xs">
                                            <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                                                <span className="flex items-center gap-1">
                                                    <span>📜</span> Riwayat Perpanjangan Sewa
                                                </span>
                                                <span className="text-slate-400 font-normal">{booking.extensions_history.length} kali diperpanjang</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {booking.extensions_history.map((h) => (
                                                    <div key={h.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-[11px]">
                                                        <div>
                                                            <span className="font-bold text-slate-800">➔ {h.new_end_date}</span>
                                                            <span className="ml-2 text-slate-500 font-medium">(+{h.extended_periods} hari)</span>
                                                            {h.created_at && <span className="ml-2 text-slate-400 text-[10px]">{h.created_at}</span>}
                                                        </div>
                                                        <span className="font-black text-indigo-600 tabular-nums">{money(h.additional_amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Extension Form (Available when can_request_extend) */}
                                    {booking.can_request_extend && (
                                        <div className="pt-2 border-t border-slate-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {showExtend ? 'Formulir Perpanjangan Sewa' : 'Ingin menambah hari sewa kendaraan?'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!isVerified) {
                                                            alert('Verifikasi nomor WhatsApp terlebih dahulu');
                                                            return;
                                                        }
                                                        setShowExtend(!showExtend);
                                                    }}
                                                    className={`text-xs font-black uppercase tracking-wide px-3 py-1.5 rounded-lg transition ${
                                                        !isVerified
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : showExtend
                                                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                                                    }`}
                                                >
                                                    {showExtend ? 'Tutup Formulir' : '+ Ajukan Perpanjangan'}
                                                </button>
                                            </div>

                                            {showExtend && isVerified && (
                                                <form onSubmit={requestExtend} className="space-y-3 pt-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] font-bold text-slate-700 block">
                                                            Pilih Tanggal Selesai Baru <span className="text-rose-500">*</span>
                                                        </label>
                                                        <input
                                                            type="date"
                                                            className={fieldClassName}
                                                            min={booking.end_date || undefined}
                                                            value={extendForm.data.new_end_date}
                                                            onChange={(e) => void handleNewEndDateChange(e.target.value)}
                                                            required
                                                        />
                                                        <p className="text-[10px] text-slate-400">
                                                            Jadwal selesai saat ini: <strong className="text-slate-600">{booking.end_date}</strong>
                                                        </p>
                                                    </div>

                                                    {/* Loading State */}
                                                    {extendQuoteLoading && (
                                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                                            <span className="animate-spin text-base">⏳</span>
                                                            <span>Menghitung simulasi biaya & ketersediaan armada...</span>
                                                        </div>
                                                    )}

                                                    {/* Error Message */}
                                                    {extendQuoteError && (
                                                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                                                            ⚠️ {extendQuoteError}
                                                        </div>
                                                    )}

                                                    {/* Live Quotation Breakdown Card */}
                                                    {extendQuoteData && !extendQuoteLoading && (
                                                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-3 text-xs">
                                                            <div className="flex items-center justify-between font-bold text-indigo-950">
                                                                <span className="flex items-center gap-1.5">
                                                                    <span>📊</span> Rincian Simulasi Perpanjangan
                                                                </span>
                                                                <span className="text-[11px] text-indigo-700 font-black">+{extendQuoteData.extended_periods} Hari</span>
                                                            </div>

                                                            <div className="space-y-1.5 text-[11px] text-indigo-900 border-t border-indigo-200/60 pt-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-600">Durasi Tambahan:</span>
                                                                    <span className="font-bold">{extendQuoteData.extended_periods} Hari</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-600">Tarif per Hari:</span>
                                                                    <span className="font-bold">{money(extendQuoteData.rate_per_period)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs pt-1 border-t border-indigo-200/60 font-black text-indigo-950">
                                                                    <span>Subtotal Biaya Tambahan:</span>
                                                                    <span className="text-indigo-700">{money(extendQuoteData.additional_amount)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                                                                    <span>Estimasi Total Sewa Baru:</span>
                                                                    <span className="font-bold text-slate-800">{money(extendQuoteData.estimated_new_total)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Conflict / Availability Indicator */}
                                                            <div className={`rounded-lg p-2.5 text-[11px] leading-relaxed font-medium ${
                                                                extendQuoteData.has_conflict
                                                                    ? 'bg-amber-100 border border-amber-300 text-amber-950'
                                                                    : 'bg-emerald-100 border border-emerald-300 text-emerald-950'
                                                            }`}>
                                                                <div className="flex items-start gap-1.5">
                                                                    <span>{extendQuoteData.has_conflict ? '⚠️' : '✅'}</span>
                                                                    <span>{extendQuoteData.conflict_message}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-1">
                                                        <label className="text-[11px] font-bold text-slate-700 block">
                                                            Catatan / Keperluan Perpanjangan (Opsional)
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            className={fieldClassName}
                                                            placeholder="Contoh: Perjalanan dinas diperpanjang 2 hari, rute ke area luar kota."
                                                            value={extendForm.data.notes}
                                                            onChange={(e) => extendForm.setData('notes', e.target.value)}
                                                        />
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={extendForm.processing || !extendForm.data.new_end_date || extendQuoteLoading}
                                                        className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase tracking-wider text-white transition disabled:opacity-50 shadow-2xs"
                                                    >
                                                        {extendForm.processing
                                                            ? 'Mengirim Pengajuan...'
                                                            : extendQuoteData
                                                                ? `Kirim Pengajuan Perpanjangan (+${extendQuoteData.extended_periods} Hari)`
                                                                : 'Kirim Pengajuan Perpanjangan'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
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
                            <a href={brand.terms_url || `${route('book.rental.search')}#ketentuan`} className="hover:text-slate-300">Syarat & Ketentuan</a>
                            <a href={brand.privacy_url || `${route('book.rental.search')}#privasi`} className="hover:text-slate-300">Kebijakan Privasi</a>
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

            {/* Cancel Extension Request Confirmation Modal */}
            <Modal show={showCancelExtendConfirm} onClose={() => setShowCancelExtendConfirm(false)} maxWidth="sm">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800 font-bold text-lg">
                            ⚠️
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                Batalkan Pengajuan?
                            </h3>
                            <p className="text-xs text-slate-500">
                                Permohonan perpanjangan sewa
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                        Apakah Anda yakin ingin membatalkan pengajuan perpanjangan sewa hingga <strong>{booking.extend_request?.requested_end_date}</strong> (+{booking.extend_request?.estimated_periods} hari)?
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowCancelExtendConfirm(false)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Kembali
                        </button>
                        <button
                            type="button"
                            disabled={cancellingExtend}
                            onClick={cancelExtendRequest}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase px-4 py-2 transition disabled:opacity-50"
                        >
                            {cancellingExtend ? 'Membatalkan...' : 'Ya, Batalkan Pengajuan'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Refund Account Input Modal */}
            <Modal show={showRefundModal} onClose={() => setShowRefundModal(false)} maxWidth="md">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 text-base">
                                💳
                            </span>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                    Rekening Pengembalian Deposit
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    Booking #{booking.code} • Total: {money(booking.deposit_refund?.deposit_amount ?? 0)}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowRefundModal(false)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                        💡 <em>Pastikan nama lengkap sesuai dengan nama yang tercantum pada rekening bank atau aplikasi e-wallet Anda agar transfer tidak ditolak oleh sistem perbankan.</em>
                    </p>

                    <form onSubmit={submitRefundAccount} className="space-y-3.5 text-xs">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700">Bank / E-Wallet Tujuan *</label>
                            <select
                                value={refundAccountForm.data.bank_name}
                                onChange={(e) => refundAccountForm.setData('bank_name', e.target.value)}
                                className={`${fieldClassName} mt-1`}
                                required
                            >
                                <option value="BCA">Bank BCA</option>
                                <option value="MANDIRI">Bank Mandiri</option>
                                <option value="BRI">Bank BRI</option>
                                <option value="BNI">Bank BNI</option>
                                <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                                <option value="CIMB">Bank CIMB Niaga</option>
                                <option value="PERMATA">Bank Permata</option>
                                <option value="JAGO">Bank Jago</option>
                                <option value="SEABANK">SeaBank Indonesia</option>
                                <option value="DANA">E-Wallet DANA</option>
                                <option value="GOPAY">E-Wallet GoPay</option>
                                <option value="OVO">E-Wallet OVO</option>
                                <option value="SHOPEEPAY">E-Wallet ShopeePay</option>
                                <option value="LAINNYA">Bank Lainnya...</option>
                            </select>
                        </div>

                        {refundAccountForm.data.bank_name === 'LAINNYA' && (
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700">Nama Bank Lainnya *</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Bank Danamon / Bank BJB"
                                    value={refundAccountForm.data.custom_bank_name}
                                    onChange={(e) => refundAccountForm.setData('custom_bank_name', e.target.value)}
                                    className={`${fieldClassName} mt-1`}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold text-slate-700">Nomor Rekening / No. HP E-Wallet *</label>
                            <input
                                type="text"
                                placeholder="Contoh: 1234567890 atau 08123456789"
                                value={refundAccountForm.data.account_number}
                                onChange={(e) => refundAccountForm.setData('account_number', e.target.value)}
                                className={`${fieldClassName} mt-1 font-mono`}
                                required
                            />
                            {refundAccountForm.errors.account_number && (
                                <p className="text-[11px] text-rose-600 mt-1">{refundAccountForm.errors.account_number}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-700">Nama Lengkap Pemilik Rekening *</label>
                            <input
                                type="text"
                                placeholder="Nama sesuai buku tabungan / aplikasi"
                                value={refundAccountForm.data.account_name}
                                onChange={(e) => refundAccountForm.setData('account_name', e.target.value)}
                                className={`${fieldClassName} mt-1 uppercase`}
                                required
                            />
                            {refundAccountForm.errors.account_name && (
                                <p className="text-[11px] text-rose-600 mt-1">{refundAccountForm.errors.account_name}</p>
                            )}
                        </div>

                        {!isVerified && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2 text-amber-900">
                                <p className="text-[11px] font-bold">Verifikasi WhatsApp Diperlukan</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="6 digit kode OTP"
                                        maxLength={6}
                                        value={refundAccountForm.data.otp_code}
                                        onChange={(e) => refundAccountForm.setData('otp_code', e.target.value)}
                                        className={`${fieldClassName} font-mono text-center tracking-widest`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => sendOtp(booking.booker_phone || refundAccountForm.data.booker_phone)}
                                        disabled={sendingPageOtp}
                                        className="rounded-xl bg-slate-900 text-white font-bold px-3 py-1.5 text-xs whitespace-nowrap"
                                    >
                                        {sendingPageOtp ? '...' : 'Kirim OTP'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowRefundModal(false)}
                                className="rounded-xl border border-slate-250 bg-white px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={refundAccountForm.processing}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 shadow-xs transition disabled:opacity-50"
                            >
                                {refundAccountForm.processing ? 'Menyimpan...' : 'Simpan Rekening'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Post-Booking Add-ons & Extra Accessories Catalog Modal */}
            <Modal show={showAddonsModal} onClose={() => setShowAddonsModal(false)} maxWidth="2xl">
                <div className="p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 text-lg border border-amber-200">
                                📦
                            </span>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Katalog Add-on & Layanan Tambahan</h3>
                                <p className="text-xs text-slate-500">Booking {booking.code} • Periode sewa {booking.total_periods} {booking.period_type}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddonsModal(false)}
                            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Filter categories */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                        {[
                            { key: 'all', label: 'Semua Item' },
                            { key: 'accessory', label: '🧳 Aksesoris' },
                            { key: 'service', label: '👨‍✈️ Sopir & Layanan' },
                            { key: 'protection', label: '🛡️ Proteksi Asuransi' },
                            { key: 'comfort', label: '💳 Kenyamanan' },
                            { key: 'fuel', label: '⛽ BBM' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setSelectedAddonCategory(cat.key)}
                                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                                    selectedAddonCategory === cat.key
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submitAddons} className="space-y-4">
                        <div className="space-y-3">
                            {booking.available_addons
                                ?.filter((item) => selectedAddonCategory === 'all' || item.category === selectedAddonCategory)
                                .map((item) => {
                                    const qty = addonQuantities[item.code] || 0;
                                    const isSelected = qty > 0;

                                    return (
                                        <div
                                            key={item.code}
                                            className={`rounded-xl border p-4 transition ${
                                                item.is_already_added
                                                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                                                    : isSelected
                                                    ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-400/80 shadow-xs'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                                                        {addonEmoji(item.icon)}
                                                    </span>
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-xs font-black text-slate-900">{item.name}</h4>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                                {item.price_type === 'daily' ? 'Per Hari' : 'Sekali Sewa (Flat)'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-slate-900 tabular-nums">
                                                            {money(item.unit_price)}
                                                            <span className="text-[10px] font-medium text-slate-500">
                                                                {item.price_type === 'daily' ? ' /hari' : ' flat'}
                                                            </span>
                                                        </div>
                                                        {item.price_type === 'daily' && (
                                                            <div className="text-[10px] text-slate-400 tabular-nums">
                                                                {booking.total_periods} hari = {money(item.calculated_total)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {item.is_already_added ? (
                                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                            ✓ Sudah Dipesan
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-250 p-1 shadow-2xs">
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddonQuantities((prev) => ({ ...prev, [item.code]: Math.max(0, (prev[item.code] || 0) - 1) }))}
                                                                disabled={qty <= 0}
                                                                className="w-7 h-7 rounded flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-6 text-center font-black text-xs tabular-nums text-slate-800">
                                                                {qty}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddonQuantities((prev) => ({ ...prev, [item.code]: Math.min(item.max_quantity, (prev[item.code] || 0) + 1) }))}
                                                                disabled={qty >= item.max_quantity}
                                                                className="w-7 h-7 rounded flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Catatan / permintaan khusus untuk item ini (opsional)"
                                                        value={addonNotes[item.code] || ''}
                                                        onChange={(e) => setAddonNotes((prev) => ({ ...prev, [item.code]: e.target.value }))}
                                                        className="text-xs rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-slate-800 w-full sm:w-2/3 focus:border-amber-500 focus:outline-none"
                                                    />
                                                    <div className="text-right text-xs font-bold text-slate-600">
                                                        Subtotal: <strong className="text-slate-900">{money(item.calculated_total * qty)}</strong>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Order Summary & OTP */}
                        {(() => {
                            const selectedItems = Object.entries(addonQuantities)
                                .filter(([_, q]) => q > 0)
                                .map(([code, q]) => {
                                    const item = booking.available_addons?.find((a) => a.code === code);
                                    return {
                                        code,
                                        qty: q,
                                        total: item ? item.calculated_total * q : 0,
                                    };
                                });
                            const totalAmount = selectedItems.reduce((acc, curr) => acc + curr.total, 0);

                            return (
                                <div className="space-y-4 pt-2">
                                    <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-300">
                                                {selectedItems.length > 0
                                                    ? `${selectedItems.length} Layanan Dipilih`
                                                    : 'Pilih layanan di atas'}
                                            </p>
                                            <p className="text-base font-black tabular-nums text-white">
                                                Total Tambahan: {money(totalAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    {!isVerified && selectedItems.length > 0 && (
                                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2 text-amber-900">
                                            <p className="text-[11px] font-bold">Verifikasi WhatsApp Booker Diperlukan</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="6 digit kode OTP"
                                                    maxLength={6}
                                                    value={addonsForm.data.otp_code}
                                                    onChange={(e) => addonsForm.setData('otp_code', e.target.value)}
                                                    className={`${fieldClassName} font-mono text-center tracking-widest`}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => sendOtp(booking.booker_phone || addonsForm.data.booker_phone)}
                                                    disabled={sendingPageOtp}
                                                    className="rounded-xl bg-slate-900 text-white font-bold px-3 py-1.5 text-xs whitespace-nowrap shadow-xs"
                                                >
                                                    {sendingPageOtp ? '...' : 'Kirim OTP'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddonsModal(false)}
                                            className="rounded-xl border border-slate-250 bg-white px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={addonsForm.processing || selectedItems.length === 0}
                                            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-2.5 shadow-xs transition disabled:opacity-50"
                                        >
                                            {addonsForm.processing ? 'Memproses...' : `Konfirmasi Pemesanan (${money(totalAmount)})`}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </form>
                </div>
            </Modal>
        </div>
    );
}
