import DynamicLayout from '@/Layouts/DynamicLayout';
import LeafletMap from '@/Components/Map/LeafletMap';
import VehicleMarker from '@/Components/Map/VehicleMarker';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import ImageUploader from '@/Components/ImageUploader';
import SignaturePad from '@/Components/SignaturePad';
import MoneyInput from '@/Components/MoneyInput';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { formatDateTimeDmYHi, formatDateDmY } from '@/utils/date';
import { formatSpeedKph, toLatLng } from '@/utils/geo';
import { Head, Link, router, useForm, usePage, usePoll } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';
import ConfirmPaymentPanel, {
    type CompanyBankAccountOption,
    type DepositPaymentMethod,
} from '../../../ConfirmPayment/ConfirmPaymentPanel';
import HandoverPhotoPicker from '../../../HandoverPhotoPicker';
import AiHandoverInspectionPanel, { type AiInspectionData } from '../../../Components/AiHandoverInspectionPanel';
import AiKycVerificationCard, { type KycAssessmentData } from '../../../Components/AiKycVerificationCard';
import PostConfirmPanel from '../../../PostConfirm/PostConfirmPanel';
import PostConfirmStepper from '../../../PostConfirm/PostConfirmStepper';
import PayInvoicesModal from '../../../PostConfirm/PayInvoicesModal';
import type { PostConfirmAction, PostConfirmProgress, PostConfirmStepId } from '../../../PostConfirm/types';
import { POST_CONFIRM_STEPS } from '../../../PostConfirm/types';
import RentalNav from '../../../RentalNav';
import {
    ChecklistToggleCard,
    DetailRow,
    EmptyBlock,
    FuelLevelPicker,
    ModalHeader,
    PaymentBadge,
    SectionCard,
    StatCard,
    StatusBadge,
} from './ShowUi';

interface Extension { id: number; original_end_date: string; new_end_date: string; extended_periods: number; additional_amount: string; notes: string | null; }
interface ExtensionRequest {
    id: number;
    requested_end_date: string;
    estimated_periods: number;
    estimated_amount: string;
    status: string;
    channel: string | null;
    notes: string | null;
}
interface Damage { id: number; description: string; amount: string; photo_path: string | null; reported_at: string; }
interface AddonCharge {
    id: number;
    addon_code: string | null;
    description: string;
    amount: number;
    is_invoiced: boolean;
    can_delete: boolean;
}
interface AddonCodeOption { value: string; label: string; }
interface LivePosition {
    latitude: string;
    longitude: string;
    speed_kph: string | null;
    recorded_at: string | null;
}
interface GpsSummary {
    distance_km: number;
    points: number;
    odometer_km: number | null;
    from: string;
    to: string;
}
interface PaymentInvoice {
    id: number;
    code: string;
    status: string;
    issue_date: string | null;
    due_date: string | null;
    total: number;
    amount_paid: number;
    balance: number;
}
interface HandoverEvidence {
    checkout_photos: string[];
    checkout_signature_url: string | null;
    checkout_staff_signature_url?: string | null;
    return_photos: string[];
    return_signature_url: string | null;
}
interface PaymentSummary {
    status: string;
    total_invoiced: number;
    total_paid: number;
    balance_due: number;
    invoices: PaymentInvoice[];
}
interface Rental {
    id: number; code: string; status: string; is_overdue: boolean;
    start_date: string; end_date: string; actual_return_date: string | null;
    period_type: string; total_periods: number;
    rate_per_period: string; km_limit_per_period: number | null; excess_km_rate: string | null;
    deposit_amount: string; deposit_returned: boolean;
    deposit_status: string;
    deposit_applied_amount: string;
    deposit_refunded_amount: string;
    deposit_settled_at: string | null;
    deposit_received_at: string | null;
    deposit_payment_method: string | null;
    late_fee_per_day: string | null;
    overdue_days: number | null;
    late_fee_amount: string;
    pickup_location: string | { id: number; code: string; name: string; address: string | null; city: string | null } | null;
    return_location: string | { id: number; code: string; name: string; address: string | null; city: string | null } | null;
    one_way_fee_amount: string | null;
    insurance_package_id: number | null;
    insurance_package?: { id: number; code: string; name: string; deductible_amount: string | number } | null;
    fuel_policy_notes: string | null;
    base_amount: string; excess_km: number | null; excess_amount: string; total_amount: string;
    start_odometer: number | null; end_odometer: number | null;
    start_fuel_level: string | null;
    end_fuel_level: string | null;
    checkout_checklist: Record<string, boolean> | null;
    return_checklist: Record<string, boolean> | null;
    checkout_notes: string | null;
    return_notes: string | null;
    notes: string | null; cancelled_reason: string | null;
    confirmed_at: string | null; checked_out_at: string | null; returned_at: string | null; completed_at: string | null;
    deposit_proof_path?: string | null;
    deposit_proof_uploaded_at?: string | null;
    deposit_proof_status?: string | null;
    deposit_proof_approved_at?: string | null;
    deposit_proof_rejected_reason?: string | null;
    deposit_company_bank_account_id?: number | null;
    depositCompanyBankAccount?: { id: number; name: string; bank_name?: string | null; account_number?: string | null; account_holder?: string | null } | null;
    pickup_requested_at?: string | null;
    pickup_request_status?: string | null;
    pickup_customer_signature_path?: string | null;
    pickup_terms_agreed?: boolean;
    pickup_notes?: string | null;
    applied_period_tier_id?: number | null;
    applied_loyalty_tier_id?: number | null;
    applied_period_tier?: {
        id: number; tier_type: 'period_volume' | 'loyalty_count';
        min_threshold: string | null; max_threshold: string | null;
        rate_per_period: string | null; discount_percent: string | null; discount_flat: string | null;
        priority: number | string; is_active: boolean;
    } | null;
    applied_loyalty_tier?: {
        id: number; tier_type: 'period_volume' | 'loyalty_count';
        min_threshold: string | null; max_threshold: string | null;
        rate_per_period: string | null; discount_percent: string | null; discount_flat: string | null;
        priority: number | string; is_active: boolean;
    } | null;
    period_pricing_snapshot?: Array<{
        period: number; from_date: string; to_date: string;
        rate_applied: number; tier_label?: string | null;
    }> | null;
    tier_discount_amount?: string | null;
    vehicle: { id: number; name: string; plate_number: string; type: string; status: string; photo_url: string | null; };
    partner: { id: number; name: string; code: string; phone: string | null; };
    driver: { id: number; name: string; phone: string | null; } | null;
    confirmed_by: { id: number; name: string; } | null;
    extensions: Extension[];
    extension_requests?: ExtensionRequest[];
    damages: Damage[];
    passenger_ktp_path?: string | null;
    passenger_sim_path?: string | null;
    ai_kyc_assessment?: KycAssessmentData | null;
}

interface VehicleSwapRow {
    id: number;
    from_vehicle: string | null;
    to_vehicle: string | null;
    odometer_km: number | null;
    notes: string | null;
    swapped_at: string | null;
    swapped_by: string | null;
}

interface SwapVehicleOption {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

interface Props {
    rental: Rental;
    addonCharges: AddonCharge[];
    addonCodes: AddonCodeOption[];
    swapVehicles?: SwapVehicleOption[];
    vehicleSwaps?: VehicleSwapRow[];
    trackingEnabled: boolean;
    hasGpsDevice: boolean;
    livePosition: LivePosition | null;
    gpsSummary: GpsSummary | null;
    payment: PaymentSummary;
    invoicingEnabled: boolean;
    checklistItems: string[];
    fuelLevels: string[];
    handoverEvidence?: HandoverEvidence;
    depositProofUrl?: string | null;
    pickupCustomerSignatureUrl?: string | null;
    gatewayEnabled?: boolean;
    canPayDepositOnline?: boolean;
    companyBankAccounts?: CompanyBankAccountOption[];
    postConfirm?: PostConfirmProgress;
    aiInspectionEnabled?: boolean;
    aiKycEnabled?: boolean;
    latestAiInspection?: AiInspectionData | null;
    aiInspectLiveUrl?: string;
    aiInspectExistingUrl?: string;
    aiApplyDamageUrl?: string;
    aiScanKycUrl?: string;
    aiSyncKycPartnerUrl?: string;
}

function emptyChecklist(items: string[]): Record<string, boolean> {
    return Object.fromEntries(items.map((key) => [key, true]));
}

/** Text snapshot column can be overwritten by the Location relation in JSON — normalize for display. */
function locationDisplay(value: unknown): string {
    if (value == null || value === '') {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object') {
        const loc = value as { name?: string; address?: string | null; city?: string | null };
        return [loc.address, loc.city].filter(Boolean).join(', ') || loc.name || '';
    }
    return String(value);
}

export default function Show({
    rental,
    addonCharges = [],
    addonCodes = [],
    swapVehicles = [],
    vehicleSwaps = [],
    trackingEnabled,
    hasGpsDevice,
    livePosition,
    gpsSummary,
    payment,
    invoicingEnabled,
    checklistItems,
    fuelLevels,
    handoverEvidence = {
        checkout_photos: [],
        checkout_signature_url: null,
        return_photos: [],
        return_signature_url: null,
    },
    depositProofUrl = null,
    pickupCustomerSignatureUrl = null,
    canPayDepositOnline = false,
    companyBankAccounts = [],
    postConfirm = { visible: false, current_step: null, steps: [] },
    aiInspectionEnabled = true,
    aiKycEnabled = true,
    latestAiInspection = null,
    aiInspectLiveUrl,
    aiInspectExistingUrl,
    aiApplyDamageUrl,
    aiScanKycUrl,
    aiSyncKycPartnerUrl,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const page = usePage();
    const confirmErrors = (page.props.errors ?? {}) as Partial<
        Record<'payment_method' | 'company_bank_account_id' | 'deposit' | 'vehicle_id', string>
    >;
    const [modal, setModal] = useState<'cancel' | 'no_show' | 'checkout' | 'return' | 'extend' | 'damage' | 'addon' | 'deposit' | 'swap' | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [showConfirmPayment, setShowConfirmPayment] = useState(false);
    const [showApproveProofModal, setShowApproveProofModal] = useState(false);
    const [approvingProof, setApprovingProof] = useState(false);
    const [showRejectProofModal, setShowRejectProofModal] = useState(false);
    const [showPayInvoicesModal, setShowPayInvoicesModal] = useState(false);
    const [payingInvoices, setPayingInvoices] = useState(false);
    const [confirmPaymentMethod, setConfirmPaymentMethod] = useState<DepositPaymentMethod>('cash');
    const [confirmBankAccountId, setConfirmBankAccountId] = useState('');
    const [liveScanning, setLiveScanning] = useState(false);
    const [liveAiResult, setLiveAiResult] = useState<AiInspectionData | null>(null);
    const [liveScanError, setLiveScanError] = useState<string | null>(null);
    const [lifecycleStep, setLifecycleStep] = useState<PostConfirmStepId>(
        postConfirm.current_step && POST_CONFIRM_STEPS.includes(postConfirm.current_step)
            ? postConfirm.current_step
            : 7,
    );

    useEffect(() => {
        if (postConfirm.visible && postConfirm.current_step && POST_CONFIRM_STEPS.includes(postConfirm.current_step)) {
            setLifecycleStep(postConfirm.current_step);
        }
    }, [postConfirm.visible, postConfirm.current_step]);

    useEffect(() => {
        if (!showConfirmPayment) {
            return;
        }

        document.getElementById('rental-confirm-payment')?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }, [showConfirmPayment]);

    const cancelForm = useForm({ cancelled_reason: '', charge_fee: false as boolean });
    const noShowForm = useForm({ cancelled_reason: '', charge_fee: false as boolean });
    const rejectProofForm = useForm({ rejected_reason: 'Bukti transfer tidak terbaca atau nominal tidak sesuai' });
    const extendForm = useForm({ new_end_date: '', notes: '' });
    const swapForm = useForm({ to_vehicle_id: '', odometer_km: '', notes: '' });
    const damageForm = useForm({ description: '', amount: '', photo_path: '' });
    const addonForm = useForm({
        addon_code: addonCodes[0]?.value ?? 'other',
        amount: '',
        description: '',
    });
    const depositForm = useForm({
        deposit_applied_amount: '0',
        deposit_refunded_amount: String(rental.deposit_amount ?? '0'),
    });

    const action = (name: string, extra: Record<string, unknown> = {}) =>
        router.post(prefixedRoute(`rental.${name}`, rental.id), extra as any, { preserveScroll: true });

    const needsDepositOnConfirm =
        Number(rental.deposit_amount) > 0 && !rental.deposit_received_at;

    const openConfirmPayment = () => {
        setShowConfirmPayment(true);
    };

    const submitConfirm = (depositCollected: boolean) => {
        setConfirming(true);
        const payload = depositCollected
            ? {
                deposit_collected: true,
                payment_method: confirmPaymentMethod,
                ...(confirmBankAccountId !== ''
                    ? { company_bank_account_id: Number(confirmBankAccountId) }
                    : {}),
            }
            : {};

        router.post(prefixedRoute('rental.confirm', rental.id), payload, {
            preserveScroll: true,
            onFinish: () => setConfirming(false),
            onSuccess: () => setShowConfirmPayment(false),
            onError: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const submitCancel: FormEventHandler = (e) => { e.preventDefault(); cancelForm.post(prefixedRoute('rental.cancel', rental.id), { onSuccess: () => setModal(null) }); };
    const submitNoShow: FormEventHandler = (e) => { e.preventDefault(); noShowForm.post(prefixedRoute('rental.no_show', rental.id), { onSuccess: () => setModal(null) }); };
    const submitExtend: FormEventHandler = (e) => { e.preventDefault(); extendForm.post(prefixedRoute('rental.extend', rental.id), { onSuccess: () => setModal(null) }); };
    const submitSwap: FormEventHandler = (e) => {
        e.preventDefault();
        swapForm.post(prefixedRoute('rental.swap', rental.id), { onSuccess: () => setModal(null) });
    };
    const submitDamage: FormEventHandler = (e) => { e.preventDefault(); damageForm.post(prefixedRoute('rental.damages.store', rental.id), { onSuccess: () => setModal(null) }); };
    const submitAddon: FormEventHandler = (e) => {
        e.preventDefault();
        addonForm.post(prefixedRoute('rental.addons.store', rental.id), {
            onSuccess: () => {
                setModal(null);
                addonForm.reset('amount', 'description');
            },
        });
    };
    const submitDeposit: FormEventHandler = (e) => {
        e.preventDefault();
        depositForm.post(prefixedRoute('rental.deposit.settle', rental.id), { onSuccess: () => setModal(null) });
    };

    const is = (s: string) => rental.status === s;
    const isLiveTracking = trackingEnabled && is('active');
    const depositHeld = rental.deposit_status !== 'settled' && Number(rental.deposit_amount) > 0;
    const upfrontPaymentPending = is('confirmed')
        && Number(rental.deposit_amount) <= 0
        && rental.deposit_proof_status !== 'approved'
        && (payment.balance_due > 0 || payment.status === 'unpaid' || payment.status === 'partial' || payment.status === 'draft');
    const canReceiveDeposit = depositHeld && !rental.deposit_received_at && (is('pending') || is('pending_reserved') || is('confirmed') || is('active') || is('returned'));
    const canSettleDeposit = depositHeld && !!rental.deposit_received_at && (is('returned') || is('completed'));
    const depositBlocksCheckout = is('confirmed') && ((depositHeld && !rental.deposit_received_at) || upfrontPaymentPending);
    const checkoutBlockedReason = upfrontPaymentPending
        ? 'Pelunasan tagihan pembayaran di muka harus diselesaikan sebelum checkout kendaraan.'
        : t('rental.errors.checkout_deposit_required');
    const canPrintContract = is('confirmed') || is('active') || is('returned') || is('completed');
    const canConfirm = (is('draft') || is('pending') || is('pending_reserved')) && rental.deposit_proof_status !== 'pending';
    const canCancel = is('draft') || is('pending') || is('pending_reserved') || is('confirmed');
    const canMarkFeePaid = is('cancelled') || is('no_show');
    const canPrintHandover = is('active') || is('returned') || is('completed');

    // Mirror trip Show: only refresh while the vehicle is out on an active rental.
    usePoll(20000, { only: ['livePosition'] }, { autoStart: isLiveTracking });

    const live = livePosition ? toLatLng(livePosition.latitude, livePosition.longitude) : null;
    const liveTone = Number(livePosition?.speed_kph ?? 0) > 3 ? 'moving' : 'idle';
    const recordedLabel = livePosition?.recorded_at
        ? formatDateTimeDmYHi(livePosition.recorded_at)
        : null;

    const periodLabel = t(`rental.period_type.${rental.period_type}`, undefined, rental.period_type);

    const handlePostConfirmAction = (name: PostConfirmAction) => {
        switch (name) {
            case 'receive_deposit':
                action('deposit.receive');
                break;
            case 'pay_deposit_online':
                action('deposit.pay_online');
                break;
            case 'settle_deposit':
                setModal('deposit');
                break;
            case 'checkout':
                router.visit(prefixedRoute('rental.checkout_page', rental.id));
                break;
            case 'return':
                router.visit(prefixedRoute('rental.return_page', rental.id));
                break;
            case 'complete':
                action('complete');
                break;
            case 'extend':
                setModal('extend');
                break;
            case 'swap':
                setModal('swap');
                break;
            case 'addon':
                setModal('addon');
                break;
            default:
                break;
        }
    };

    const handlePayInvoices = (data: {
        payment_date: string;
        amount: number;
        type: string;
        method: string;
        company_bank_account_id: number | null;
        reference_number: string | null;
        notes: string | null;
        allocations: Array<{ invoice_id: number; amount: number }>;
    }) => {
        setPayingInvoices(true);
        router.post(prefixedRoute('rental.invoices.pay', rental.id), data, {
            preserveScroll: true,
            onSuccess: () => {
                setShowPayInvoicesModal(false);
                setPayingInvoices(false);
            },
            onError: () => {
                setPayingInvoices(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const timelineSteps = [
        { label: t('rental.timeline.created'), date: rental.confirmed_at ? '' : t('rental.timeline.pending'), done: true },
        { label: t('rental.timeline.confirmed'), date: rental.confirmed_at ? formatDateTimeDmYHi(rental.confirmed_at) : null, by: rental.confirmed_by?.name, done: !!rental.confirmed_at },
        { label: t('rental.timeline.checked_out'), date: rental.checked_out_at ? formatDateTimeDmYHi(rental.checked_out_at) : null, done: !!rental.checked_out_at },
        { label: t('rental.timeline.returned'), date: rental.returned_at ? formatDateTimeDmYHi(rental.returned_at) : null, done: !!rental.returned_at },
        { label: t('rental.timeline.completed'), date: rental.completed_at ? formatDateTimeDmYHi(rental.completed_at) : null, done: !!rental.completed_at },
    ];

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            {t('rental.title', undefined, 'Modul Rental & Reservasi')}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <h2 className="font-mono text-xl font-black leading-tight text-slate-900 dark:text-white">
                                {rental.code}
                            </h2>
                            <StatusBadge
                                status={rental.status}
                                label={t(`rental.status.${rental.status}`, undefined, rental.status)}
                            />
                            {rental.is_overdue && (
                                <span className="inline-flex items-center rounded-xl bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-300">
                                    ⚠️ {t('rental.status.overdue', undefined, 'Terlambat')}
                                </span>
                            )}
                        </div>
                    </div>
                    <Link href={prefixedRoute('rental.index')}>
                        <SecondaryButton type="button" className="rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs">
                            ← {t('rental.nav.back_to_list', undefined, 'Kembali ke Daftar')}
                        </SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('rental.pages.show.title', { code: rental.code }, `Rental ${rental.code}`)} />

            <RentalNav />

            <div className="space-y-6">
                {/* 1. Hero Identity & Action Card */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-6 border-b border-slate-100 p-6 dark:border-slate-800 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start">
                            {/* Vehicle Photo Container */}
                            <div className="relative shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700 sm:h-44 sm:w-64">
                                {rental.vehicle.photo_url ? (
                                    <img
                                        src={rental.vehicle.photo_url}
                                        alt={rental.vehicle.name}
                                        className="h-44 w-full object-cover sm:h-44 sm:w-64"
                                    />
                                ) : (
                                    <div className="flex h-44 w-full items-center justify-center px-4 text-center text-xs text-slate-400 sm:h-44 sm:w-64">
                                        🚗 {t('rental.availability.no_photo', undefined, 'Tanpa Foto')}
                                    </div>
                                )}
                                {rental.vehicle.rental_class && (
                                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                                        {t(`fleet.rental_class.${rental.vehicle.rental_class}`, undefined, rental.vehicle.rental_class)}
                                    </span>
                                )}
                            </div>

                            {/* Details & Status */}
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge
                                        status={rental.status}
                                        label={t(`rental.status.${rental.status}`, undefined, rental.status)}
                                    />
                                    {invoicingEnabled && (
                                        <PaymentBadge
                                            status={payment.status}
                                            label={t(`rental.payment.${payment.status}`, undefined, payment.status)}
                                        />
                                    )}
                                    {depositHeld && !rental.deposit_received_at && (
                                        <span className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300">
                                            🛡️ {t('rental.deposit.not_received', undefined, 'Deposit Belum Diterima')}
                                        </span>
                                    )}
                                    {depositHeld && rental.deposit_received_at && rental.deposit_status !== 'settled' && (
                                        <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            🛡️ {t('rental.deposit.received', undefined, 'Deposit Diterima')}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                        {rental.vehicle.name}
                                    </h1>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {rental.vehicle.plate_number}
                                        </span>
                                        <span>·</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            👤 {rental.partner.name}
                                        </span>
                                        {rental.driver && (
                                            <>
                                                <span>·</span>
                                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                                    👨‍✈️ {rental.driver.name}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Interval Dates Bar */}
                                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        📅 {formatDateDmY(rental.start_date)}
                                    </span>
                                    <span className="text-slate-400">➔</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {formatDateDmY(rental.end_date)}
                                    </span>
                                    <span className="ml-1 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        {rental.total_periods} {periodLabel}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex shrink-0 items-center justify-start gap-2 flex-nowrap overflow-x-auto pb-1 sm:pb-0 lg:justify-end">
                            {canPrintContract && (
                                <a href={prefixedRoute('rental.pdf.contract', rental.id)} target="_blank" rel="noreferrer" className="shrink-0">
                                    <SecondaryButton type="button" className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs">
                                        📄 {t('rental.actions.print_contract', undefined, 'Cetak Kontrak')}
                                    </SecondaryButton>
                                </a>
                            )}
                            {canPrintHandover && (
                                <a href={prefixedRoute('rental.pdf.handover', rental.id)} target="_blank" rel="noreferrer" className="shrink-0">
                                    <SecondaryButton type="button" className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs">
                                        📋 {t('rental.actions.print_handover', undefined, 'Cetak BA Serah Terima')}
                                    </SecondaryButton>
                                </a>
                            )}
                            {(is('active') || is('returned')) && (
                                <SecondaryButton className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs" onClick={() => setModal('damage')}>
                                    🛠️ {t('rental.actions.add_damage', undefined, 'Tambah Damage')}
                                </SecondaryButton>
                            )}
                            {(is('draft') || is('pending') || is('pending_reserved') || is('confirmed')) && (
                                <Link href={prefixedRoute('rental.edit', rental.id)} className="shrink-0">
                                    <SecondaryButton className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs">
                                        ✏️ {t('common.edit', undefined, 'Edit')}
                                    </SecondaryButton>
                                </Link>
                            )}
                            {canCancel && (
                                <DangerButton className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs" onClick={() => setModal('cancel')}>
                                    {t('common.cancel', undefined, 'Batal')}
                                </DangerButton>
                            )}
                            {canConfirm && !showConfirmPayment && (
                                <PrimaryButton className="shrink-0 whitespace-nowrap text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-2xs" onClick={openConfirmPayment}>
                                    ✓ {t('rental.actions.confirm', undefined, 'Konfirmasi Sewa')}
                                </PrimaryButton>
                            )}
                            {is('confirmed') && (
                                <DangerButton className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs" onClick={() => setModal('no_show')}>
                                    {t('rental.actions.mark_no_show', undefined, 'No Show')}
                                </DangerButton>
                            )}
                            {!postConfirm.visible && canPayDepositOnline && (
                                <SecondaryButton className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs" onClick={() => action('deposit.pay_online')}>
                                    💳 {t('receivables.gateway.pay_deposit', undefined, 'Bayar Deposit Online')}
                                </SecondaryButton>
                            )}
                            {!postConfirm.visible && is('confirmed') && (
                                <>
                                    {canReceiveDeposit && (
                                        <PrimaryButton className="shrink-0 whitespace-nowrap text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-2xs" onClick={() => action('deposit.receive')}>
                                            🛡️ {t('rental.actions.receive_deposit', undefined, 'Terima Deposit')}
                                        </PrimaryButton>
                                    )}
                                    {depositBlocksCheckout ? (
                                        <PrimaryButton
                                            className="shrink-0 whitespace-nowrap text-xs font-bold bg-blue-600 opacity-50 cursor-not-allowed shadow-2xs"
                                            disabled
                                            title={checkoutBlockedReason || undefined}
                                        >
                                            🚗 {t('rental.actions.checkout', undefined, 'Checkout (Serah Terima)')}
                                        </PrimaryButton>
                                    ) : (
                                        <Link href={prefixedRoute('rental.checkout_page', rental.id)} className="shrink-0">
                                            <PrimaryButton className="shrink-0 whitespace-nowrap text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-2xs">
                                                🚗 {t('rental.actions.checkout', undefined, 'Checkout (Serah Terima)')}
                                            </PrimaryButton>
                                        </Link>
                                    )}
                                </>
                            )}
                            {!postConfirm.visible && is('active') && (
                                <>
                                    <SecondaryButton className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs" onClick={() => setModal('extend')}>
                                        ⏱️ {t('rental.actions.extend', undefined, 'Perpanjang')}
                                    </SecondaryButton>
                                    <Link href={prefixedRoute('rental.return_page', rental.id)} className="shrink-0">
                                        <PrimaryButton className="shrink-0 whitespace-nowrap text-xs font-bold bg-purple-600 hover:bg-purple-700 shadow-2xs">
                                            🏁 {t('rental.actions.return', undefined, 'Kembalikan Mobil')}
                                        </PrimaryButton>
                                    </Link>
                                </>
                            )}
                            {!postConfirm.visible && is('returned') && (
                                <PrimaryButton className="shrink-0 whitespace-nowrap text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-2xs" onClick={() => action('complete')}>
                                    ✓ {t('rental.actions.complete', undefined, 'Selesaikan Sewa')}
                                </PrimaryButton>
                            )}
                            {canMarkFeePaid && (
                                <SecondaryButton className="shrink-0 whitespace-nowrap text-xs font-bold shadow-2xs" onClick={() => action('mark_fee_paid')}>
                                    {t('rental.actions.mark_fee_paid', undefined, 'Tandai Biaya Lunas')}
                                </SecondaryButton>
                            )}
                        </div>
                    </div>

                    {/* KPI Stat Cards Bar */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-4 dark:bg-slate-850/50 sm:grid-cols-4 sm:p-6">
                        <StatCard
                            label={t('rental.fields.total_amount', undefined, 'Total Biaya Sewa')}
                            value={formatMoney(rental.total_amount)}
                            icon="💳"
                            tone="indigo"
                            hint={
                                rental.tier_discount_amount && Number(rental.tier_discount_amount) > 0
                                    ? `Diskon Tier: −${formatMoney(rental.tier_discount_amount)}`
                                    : undefined
                            }
                        />
                        <StatCard
                            label={t('rental.fields.deposit', undefined, 'Deposit Jaminan')}
                            value={formatMoney(rental.deposit_amount)}
                            icon="🛡️"
                            hint={
                                Number(rental.deposit_amount) <= 0
                                    ? t('rental.deposit.none', undefined, 'Tanpa Deposit')
                                    : rental.deposit_received_at
                                        ? t('rental.deposit.received', undefined, 'Deposit Diterima')
                                        : t('rental.deposit.not_received', undefined, 'Belum Diterima')
                            }
                            tone={
                                Number(rental.deposit_amount) <= 0 || rental.deposit_received_at
                                    ? 'success'
                                    : 'danger'
                            }
                        />
                        <StatCard
                            label={t('rental.fields.period', undefined, 'Durasi Sewa')}
                            value={`${rental.total_periods} ${periodLabel}`}
                            icon="🗓️"
                            hint={`${formatDateDmY(rental.start_date)} → ${formatDateDmY(rental.end_date)}`}
                        />
                        {invoicingEnabled ? (
                            <StatCard
                                label={t('rental.fields.balance_due', undefined, 'Sisa Tagihan')}
                                value={formatMoney(payment.balance_due)}
                                icon="💰"
                                hint={t(`rental.payment.${payment.status}`, undefined, payment.status)}
                                tone={payment.balance_due > 0 ? 'warning' : 'success'}
                            />
                        ) : (
                            <StatCard
                                label={t('rental.fields.base_amount', undefined, 'Tarif Pokok')}
                                value={formatMoney(rental.base_amount)}
                                icon="💵"
                            />
                        )}
                    </div>
                </section>

                {showConfirmPayment && canConfirm && (
                    <ConfirmPaymentPanel
                        rentalCode={rental.code}
                        depositAmount={rental.deposit_amount}
                        needsDeposit={needsDepositOnConfirm}
                        canPayOnline={!!canPayDepositOnline}
                        confirming={confirming}
                        paymentMethod={confirmPaymentMethod}
                        companyBankAccountId={confirmBankAccountId}
                        companyBankAccounts={companyBankAccounts}
                        errors={confirmErrors}
                        onPaymentMethodChange={setConfirmPaymentMethod}
                        onCompanyBankAccountChange={setConfirmBankAccountId}
                        onConfirmWithDeposit={() => submitConfirm(true)}
                        onConfirmLater={() => submitConfirm(false)}
                        onPayOnline={() => action('deposit.pay_online')}
                        onCancel={() => setShowConfirmPayment(false)}
                    />
                )}

                {postConfirm.visible && (
                    <div className="space-y-3">
                        <PostConfirmStepper
                            progress={postConfirm}
                            step={lifecycleStep}
                            onStepChange={setLifecycleStep}
                        />
                        <PostConfirmPanel
                            step={lifecycleStep}
                            rentalStatus={rental.status}
                            depositAmount={rental.deposit_amount}
                            depositReceived={!!rental.deposit_received_at}
                            depositBlocksCheckout={depositBlocksCheckout}
                            canReceiveDeposit={canReceiveDeposit}
                            canSettleDeposit={canSettleDeposit}
                            canPayDepositOnline={canPayDepositOnline}
                            canPrintContract={canPrintContract}
                            canPrintHandover={canPrintHandover}
                            payment={payment}
                            invoicingEnabled={invoicingEnabled}
                            rentalId={rental.id}
                            rentalCode={rental.code}
                            partnerId={rental.partner?.id ?? 0}
                            companyBankAccounts={companyBankAccounts}
                            onAction={handlePostConfirmAction}
                            onPayInvoices={handlePayInvoices}
                            payInvoicesProcessing={payingInvoices}
                        />
                    </div>
                )}

                {depositBlocksCheckout && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-2xs dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                        <p className="font-bold">{checkoutBlockedReason}</p>
                        {Number(rental.deposit_amount) > 0 ? (
                            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                                {t('rental.modals.confirm_deposit_body', {
                                    code: rental.code,
                                    amount: formatMoney(rental.deposit_amount),
                                }, 'Selesaikan penerimaan deposit jaminan terlebih dahulu.')}
                            </p>
                        ) : (
                            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                                Selesaikan pelunasan tagihan pembayaran di muka di bawah ini agar proses checkout dapat dilakukan.
                            </p>
                        )}
                    </div>
                )}

                {/* Deposit Proof Verification Card */}
                {rental.deposit_proof_status === 'pending' && (
                    <div className="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 p-6 dark:border-amber-800 dark:bg-slate-900 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3 dark:border-amber-800/80">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-xl bg-amber-200/80 px-2.5 py-0.5 text-xs font-black text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                                    Pending Verification
                                </span>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    {Number(rental.deposit_amount) > 0
                                        ? `Verifikasi Bukti Transfer Manual Deposit (${formatMoney(rental.deposit_amount)})`
                                        : `Verifikasi Bukti Transfer Pembayaran Sewa (${formatMoney(rental.total_amount)})`}
                                </h3>
                            </div>
                            {rental.deposit_proof_uploaded_at && (
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Diunggah: {formatDateTimeDmYHi(rental.deposit_proof_uploaded_at)}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                                <div>
                                    <span className="font-semibold text-slate-500">Rekening Tujuan:</span>{' '}
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {rental.depositCompanyBankAccount
                                            ? `${rental.depositCompanyBankAccount.bank_name || ''} ${rental.depositCompanyBankAccount.name} (${rental.depositCompanyBankAccount.account_number || ''})`
                                            : 'Transfer Bank'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-500">
                                        {Number(rental.deposit_amount) > 0 ? 'Jumlah Deposit:' : 'Jumlah Pembayaran Sewa:'}
                                    </span>{' '}
                                    <span className="font-black text-indigo-700 dark:text-indigo-400 text-sm">
                                        {formatMoney(Number(rental.deposit_amount) > 0 ? rental.deposit_amount : rental.total_amount)}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-500">Metode:</span> Transfer Bank Manual
                                </div>
                            </div>

                            {depositProofUrl && (
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Pratinjau Bukti Transfer:</span>
                                    <a
                                        href={depositProofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block overflow-hidden rounded-2xl border border-slate-200 shadow-2xs transition hover:opacity-90 dark:border-slate-700"
                                    >
                                        <img
                                            src={depositProofUrl}
                                            alt="Bukti Transfer Deposit"
                                            className="h-32 w-auto object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                        <span className="block p-1.5 text-center text-[11px] font-bold text-indigo-600 underline dark:text-indigo-400">
                                            Buka Dokumen Bukti Transfer ↗
                                        </span>
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-amber-200/80 dark:border-amber-800/80">
                            <DangerButton type="button" onClick={() => setShowRejectProofModal(true)} className="text-xs font-bold">
                                Tolak Bukti Transfer
                            </DangerButton>
                            <PrimaryButton
                                type="button"
                                onClick={() => setShowApproveProofModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-xs font-bold"
                            >
                                {Number(rental.deposit_amount) > 0
                                    ? 'Setujui & Konfirmasi Deposit'
                                    : 'Setujui & Konfirmasi Pembayaran'}
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Customer Pickup Request & Contract Signature Card */}
                {rental.pickup_requested_at && rental.status === 'confirmed' && (
                    <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-sky-50/90 p-6 dark:border-blue-800/80 dark:bg-slate-900 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/80 pb-3 dark:border-blue-800/80">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-xl bg-blue-200/80 px-2.5 py-0.5 text-xs font-black text-blue-900 dark:bg-blue-900/60 dark:text-blue-200">
                                    Siap Serah Terima (Pickup)
                                </span>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    Permohonan Pickup & Kontrak Digital Pelanggan
                                </h3>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Waktu Pengajuan: {formatDateTimeDmYHi(rental.pickup_requested_at)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                                <div>
                                    <span className="font-semibold text-slate-500">Persetujuan Syarat & Kontrak:</span>{' '}
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        ✓ Disetujui oleh Penyewa ({rental.partner?.name})
                                    </span>
                                </div>
                                {rental.pickup_notes && (
                                    <div>
                                        <span className="font-semibold text-slate-500">Catatan Pelanggan:</span>{' '}
                                        <span className="italic text-slate-900 dark:text-white">{rental.pickup_notes}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="font-semibold text-slate-500">Status Pembayaran Deposit:</span>{' '}
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        {Number(rental.deposit_amount) > 0 ? `Lunas (${formatMoney(rental.deposit_amount)})` : '-'}
                                    </span>
                                </div>
                            </div>

                            {pickupCustomerSignatureUrl && (
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Tanda Tangan Digital Pelanggan:</span>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-2 text-center dark:border-slate-700 dark:bg-slate-800">
                                        <img
                                            src={pickupCustomerSignatureUrl}
                                            alt="Tanda Tangan Digital Pelanggan"
                                            className="h-20 max-w-full object-contain mx-auto"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-200/80 dark:border-blue-800/80">
                            <PrimaryButton
                                type="button"
                                onClick={() => setModal('checkout')}
                                className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-xs font-bold"
                            >
                                🚗 Proses Pickup & Serahkan Kendaraan (Checkout)
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Live GPS Map Card */}
                {(isLiveTracking || live || (trackingEnabled && hasGpsDevice)) && (
                    <SectionCard
                        title={isLiveTracking && live ? t('rental.sections.live_location', undefined, 'Posisi & Pelacakan GPS Real-Time') : t('rental.sections.last_location', undefined, 'Lokasi Terakhir Kendaraan')}
                        icon="🛰️"
                        action={
                            <div className="flex flex-wrap items-center gap-3">
                                {isLiveTracking && live && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                        {t('rental.tracking.live', undefined, 'Live GPS Aktif')}
                                    </span>
                                )}
                                {trackingEnabled && hasGpsDevice && gpsSummary && (
                                    <Link
                                        href={prefixedRoute('tracking.history', {
                                            vehicle_id: rental.vehicle.id,
                                            from: gpsSummary.from,
                                            to: gpsSummary.to,
                                        })}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                    >
                                        {t('rental.tracking.view_trail', undefined, 'Lihat Jejak Rute ↗')}
                                    </Link>
                                )}
                            </div>
                        }
                    >
                        {live ? (
                            <div className="space-y-3">
                                {recordedLabel && (
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        ⚡ Kecepatan: {formatSpeedKph(livePosition?.speed_kph)}
                                        {` — Terakhir aktif: ${recordedLabel}`}
                                    </p>
                                )}
                                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <LeafletMap bounds={[live]} height="320px">
                                        <VehicleMarker
                                            position={live}
                                            label={`${rental.vehicle.name} (${rental.vehicle.plate_number})`}
                                            tone={liveTone}
                                        >
                                            <>
                                                <br />
                                                {formatSpeedKph(livePosition?.speed_kph)}
                                                {recordedLabel && (
                                                    <>
                                                        <br />
                                                        <span className="text-slate-500">{recordedLabel}</span>
                                                    </>
                                                )}
                                            </>
                                        </VehicleMarker>
                                    </LeafletMap>
                                </div>
                                {isLiveTracking && (
                                    <p className="text-[11px] text-slate-400">{t('rental.tracking.hint_active', undefined, 'Peta memperbarui koordinat secara berkala.')}</p>
                                )}
                                {gpsSummary && (
                                    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 sm:grid-cols-3">
                                        <p className="font-medium">📍 Jarak Tempuh: <strong>{gpsSummary.distance_km.toLocaleString('id-ID')} km</strong></p>
                                        <p className="font-medium">
                                            📊 Odometer:{' '}
                                            <strong>
                                                {gpsSummary.odometer_km !== null
                                                    ? `${gpsSummary.odometer_km.toLocaleString('id-ID')} km`
                                                    : 'Menunggu sinkronisasi'}
                                            </strong>
                                        </p>
                                        <p className="font-medium">📡 Titik GPS: <strong>{gpsSummary.points} log</strong></p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyBlock>
                                {!trackingEnabled
                                    ? t('rental.tracking.unavailable', undefined, 'Modul pelacakan GPS tidak aktif.')
                                    : !hasGpsDevice
                                        ? t('rental.tracking.no_device', undefined, 'Unit ini belum terpasang perangkat GPS.')
                                        : t('rental.tracking.no_fix', undefined, 'Belum ada sinyal koordinat GPS.')}
                            </EmptyBlock>
                        )}
                    </SectionCard>
                )}

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
                    {/* Left Column (3 of 5 cols) */}
                    <div className="space-y-6 lg:col-span-3">
                        {/* 1. Booking Details Card */}
                        <SectionCard title={t('rental.sections.booking_details', undefined, 'Detail Reservasi & Rute')} icon="📍">
                            <dl>
                                <DetailRow label={t('rental.fields.vehicle', undefined, 'Armada Kendaraan')}>
                                    {rental.vehicle.name}{' '}
                                    <span className="font-mono text-slate-500">({rental.vehicle.plate_number})</span>
                                </DetailRow>
                                <DetailRow label={t('rental.fields.customer', undefined, 'Penyewa / Pelanggan')}>{rental.partner.name}</DetailRow>
                                {rental.driver && (
                                    <DetailRow label={t('rental.fields.driver', undefined, 'Supir (Driver)')}>{rental.driver.name}</DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.period', undefined, 'Periode Sewa')}>
                                    {formatDateDmY(rental.start_date)} → {formatDateDmY(rental.end_date)} ({rental.total_periods} {periodLabel})
                                </DetailRow>
                                {rental.actual_return_date && (
                                    <DetailRow label={t('rental.fields.actual_return', undefined, 'Pengembalian Aktual')}>{formatDateDmY(rental.actual_return_date)}</DetailRow>
                                )}
                                {locationDisplay(rental.pickup_location) && (
                                    <DetailRow label={t('rental.fields.pickup_location', undefined, 'Lokasi Penyerahan (Pickup)')}>
                                        {locationDisplay(rental.pickup_location)}
                                    </DetailRow>
                                )}
                                {locationDisplay(rental.return_location) && (
                                    <DetailRow label={t('rental.fields.return_location', undefined, 'Lokasi Pengembalian (Return)')}>
                                        {locationDisplay(rental.return_location)}
                                    </DetailRow>
                                )}
                                {Number(rental.one_way_fee_amount ?? 0) > 0 && (
                                    <DetailRow label={t('rental.fields.one_way_fee', undefined, 'Biaya One-Way (Relokasi)')}>
                                        {formatMoney(rental.one_way_fee_amount)}
                                    </DetailRow>
                                )}
                                {rental.insurance_package && (
                                    <DetailRow label={t('rental.fields.insurance_package', undefined, 'Paket Asuransi')}>
                                        {rental.insurance_package.name}
                                    </DetailRow>
                                )}
                                {rental.fuel_policy_notes && (
                                    <DetailRow label={t('rental.fields.fuel_policy_notes', undefined, 'Kebijakan BBM')}>
                                        {rental.fuel_policy_notes}
                                    </DetailRow>
                                )}
                            </dl>
                        </SectionCard>

                        {/* AI KYC Verification Card */}
                        {aiKycEnabled && (
                            <AiKycVerificationCard
                                assessment={rental.ai_kyc_assessment ?? null}
                                hasKtp={Boolean(rental.passenger_ktp_path)}
                                hasSim={Boolean(rental.passenger_sim_path)}
                                aiScanKycUrl={aiScanKycUrl || ''}
                                aiSyncKycPartnerUrl={aiSyncKycPartnerUrl}
                                canUpdate={!is('cancelled') && !is('cancelled_paid')}
                            />
                        )}

                        {/* 2. Pricing Snapshot Card */}
                        <SectionCard title={t('rental.sections.pricing_snapshot', undefined, 'Rincian Tarif & Potongan Harga')} icon="💳">
                            <dl>
                                <DetailRow label={t('rental.fields.rate', undefined, 'Tarif Pokok')}>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="tabular-nums font-bold">
                                            {formatMoney(rental.rate_per_period)} / {periodLabel}
                                        </span>
                                        {(() => {
                                            const pTier = rental.applied_period_tier;
                                            const lTier = rental.applied_loyalty_tier;
                                            if (!pTier && !lTier) return null;
                                            const tierLabel = (t: NonNullable<typeof pTier>) => {
                                                const max = t.max_threshold ? `-${t.max_threshold}` : '+';
                                                const range = `${t.min_threshold ?? 0}${max}`;
                                                let mod = '';
                                                if (String(t.rate_per_period ?? '').trim() !== '') mod = `Fixed ${Number(t.rate_per_period).toLocaleString('id-ID')}`;
                                                else if (String(t.discount_percent ?? '').trim() !== '') mod = `-${t.discount_percent}%`;
                                                else if (String(t.discount_flat ?? '').trim() !== '') mod = `-Rp ${Number(t.discount_flat).toLocaleString('id-ID')}`;
                                                return `${range}${mod ? ' · ' + mod : ''}`;
                                            };
                                            return (
                                                <div className="flex flex-wrap items-center gap-1">
                                                    {pTier && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900"
                                                            title={`Tier Periode Sewa: ${tierLabel(pTier)}`}
                                                        >
                                                            <span>📅</span>
                                                            <span>{tierLabel(pTier)}</span>
                                                        </span>
                                                    )}
                                                    {lTier && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900"
                                                            title={`Tier Loyalty: ${tierLabel(lTier)}`}
                                                        >
                                                            <span>⭐</span>
                                                            <span>{tierLabel(lTier)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </DetailRow>
                                {rental.km_limit_per_period && (
                                    <DetailRow label={t('rental.fields.km_limit', undefined, 'Batas Jarak')}>
                                        {t('rental.rates.km', { km: rental.km_limit_per_period }, `${rental.km_limit_per_period} km`)} / {periodLabel}
                                    </DetailRow>
                                )}
                                {rental.excess_km_rate && (
                                    <DetailRow label={t('rental.fields.excess_km_rate', undefined, 'Tarif Kelebihan Jarak')}>
                                        <span className="tabular-nums">{formatMoney(rental.excess_km_rate)} / km</span>
                                    </DetailRow>
                                )}
                                {rental.late_fee_per_day && (
                                    <DetailRow label={t('rental.fields.late_fee_per_day', undefined, 'Denda Keterlambatan')}>
                                        <span className="tabular-nums">{formatMoney(rental.late_fee_per_day)} / hari</span>
                                    </DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.deposit', undefined, 'Deposit Jaminan')}>
                                    <span className="tabular-nums">{formatMoney(rental.deposit_amount)}</span>
                                    <span className="ml-2 text-xs font-normal text-slate-500">
                                        ({t(`rental.deposit.${rental.deposit_status}`, undefined, rental.deposit_status)})
                                    </span>
                                </DetailRow>
                                {rental.deposit_status === 'settled' && Number(rental.deposit_amount) > 0 && (
                                    <>
                                        <DetailRow label={t('rental.deposit.applied', undefined, 'Deposit Digunakan')}>
                                            <span className="tabular-nums">{formatMoney(rental.deposit_applied_amount)}</span>
                                        </DetailRow>
                                        <DetailRow label={t('rental.deposit.refunded', undefined, 'Deposit Dikembalikan')}>
                                            <span className="tabular-nums">{formatMoney(rental.deposit_refunded_amount)}</span>
                                        </DetailRow>
                                    </>
                                )}
                                {rental.tier_discount_amount && Number(rental.tier_discount_amount) > 0 && (
                                    <DetailRow label={t('rental.fields.tier_discount', undefined, 'Potongan Tier Harga')}>
                                        <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">− {formatMoney(rental.tier_discount_amount)}</span>
                                    </DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.base_amount', undefined, 'Total Pokok Sewa')}>
                                    <span className="tabular-nums">{formatMoney(rental.base_amount)}</span>
                                </DetailRow>
                                {Number(rental.excess_amount) > 0 && (
                                    <DetailRow label={t('rental.fields.excess_km', { km: rental.excess_km ?? 0 }, `Kelebihan Jarak (${rental.excess_km} km)`)}>
                                        <span className="tabular-nums text-rose-600">{formatMoney(rental.excess_amount)}</span>
                                    </DetailRow>
                                )}
                                {Number(rental.late_fee_amount) > 0 && (
                                    <DetailRow label={t('rental.fields.late_fee', { days: rental.overdue_days ?? 0 }, `Denda Terlambat (${rental.overdue_days} hari)`)}>
                                        <span className="tabular-nums text-rose-600">{formatMoney(rental.late_fee_amount)}</span>
                                    </DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.total_amount', undefined, 'Total Biaya Keseluruhan')}>
                                    <span className="text-base font-black tabular-nums text-indigo-600 dark:text-indigo-400">{formatMoney(rental.total_amount)}</span>
                                </DetailRow>
                            </dl>

                            {rental.period_pricing_snapshot && rental.period_pricing_snapshot.length > 0 && (
                                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                                    <details className="group" open>
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/60">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4 text-slate-500 transition group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                                <span>
                                                    {t('rental.sections.period_breakdown', undefined, 'Rincian Periode & Rate Terpakai')}
                                                </span>
                                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs dark:bg-slate-700 dark:text-slate-300">
                                                    {rental.period_pricing_snapshot.length} periode
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-400">Klik untuk expand</span>
                                        </summary>
                                        <div className="border-t border-slate-100 dark:border-slate-800">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                                    <thead className="bg-white/60 dark:bg-slate-800/60">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">#</th>
                                                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                {t('rental.fields.date_range', undefined, 'Tanggal')}
                                                            </th>
                                                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                {t('rental.fields.rate_applied', undefined, 'Rate Terpakai')}
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                {t('rental.fields.tier_applied', undefined, 'Keterangan Tier')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                                        {rental.period_pricing_snapshot.map((row) => (
                                                            <tr key={row.period} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50">
                                                                <td className="whitespace-nowrap px-3 py-2 text-xs">
                                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white dark:bg-slate-700">
                                                                        {row.period}
                                                                    </span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                                                                    <div className="font-bold tabular-nums">{formatDateDmY(row.from_date)}</div>
                                                                    <div className="text-[11px] text-slate-400">s/d {formatDateDmY(row.to_date)}</div>
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-black tabular-nums text-slate-900 dark:text-white">
                                                                    {formatMoney(row.rate_applied)}
                                                                </td>
                                                                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                                                                    {row.tier_label ? (
                                                                        <code className="rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-inset ring-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900">
                                                                            {row.tier_label}
                                                                        </code>
                                                                    ) : (
                                                                        <span className="text-slate-400">— (Base Rate)</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            )}
                        </SectionCard>

                        {/* 3. Invoicing & Billing Card */}
                        {invoicingEnabled && (
                            <SectionCard
                                title={t('rental.sections.billing', undefined, 'Status Tagihan & Invoicing')}
                                icon="🧾"
                                action={
                                    <PaymentBadge
                                        status={payment.status}
                                        label={t(`rental.payment.${payment.status}`, undefined, payment.status)}
                                    />
                                }
                            >
                                <dl>
                                    <DetailRow label={t('rental.fields.invoiced', undefined, 'Total Ditagihkan')}>
                                        <span className="tabular-nums font-bold">{formatMoney(payment.total_invoiced)}</span>
                                    </DetailRow>
                                    <DetailRow label={t('rental.fields.paid', undefined, 'Total Terbayar')}>
                                        <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(payment.total_paid)}</span>
                                    </DetailRow>
                                    <DetailRow label={t('rental.fields.balance_due', undefined, 'Sisa Tagihan')}>
                                        <span className="tabular-nums font-black text-amber-600 dark:text-amber-400">{formatMoney(payment.balance_due)}</span>
                                    </DetailRow>
                                </dl>
                                {payment.invoices.length > 0 ? (
                                    <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                                        {payment.invoices.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                                                <div>
                                                    <Link
                                                        href={prefixedRoute('invoicing.invoices.show', inv.id)}
                                                        className="font-mono font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                    >
                                                        {inv.code}
                                                    </Link>
                                                    <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        {inv.status}
                                                    </span>
                                                    {inv.due_date && (
                                                        <span className="ml-2 text-[11px] text-slate-400">
                                                            Jatuh tempo: {formatDateDmY(inv.due_date)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="tabular-nums font-black text-slate-900 dark:text-white">{formatMoney(inv.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <EmptyBlock>{t('rental.payment.none', undefined, 'Belum ada faktur tagihan yang diterbitkan.')}</EmptyBlock>
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {/* 4. Handover & Inspections */}
                        {(rental.start_odometer != null || rental.end_odometer != null || rental.checkout_checklist || rental.return_checklist) && (
                            <SectionCard title={t('rental.sections.handover', undefined, 'Serah Terima & BAST Kendaraan')} icon="🚗">
                                <dl>
                                    {rental.start_odometer != null && (
                                        <DetailRow label={t('rental.fields.checkout', undefined, 'Odometer Berangkat')}>
                                            <span className="tabular-nums font-bold">
                                                {t('rental.rates.km', { km: rental.start_odometer.toLocaleString() }, `${rental.start_odometer.toLocaleString()} km`)}
                                            </span>
                                            {rental.start_fuel_level && (
                                                <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    ⛽ {t(`rental.fuel.${rental.start_fuel_level}`, undefined, rental.start_fuel_level)}
                                                </span>
                                            )}
                                        </DetailRow>
                                    )}
                                    {rental.end_odometer != null && (
                                        <DetailRow label={t('rental.fields.return', undefined, 'Odometer Kembali')}>
                                            <span className="tabular-nums font-bold">
                                                {t('rental.rates.km', { km: rental.end_odometer.toLocaleString() }, `${rental.end_odometer.toLocaleString()} km`)}
                                            </span>
                                            {rental.end_fuel_level && (
                                                <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    ⛽ {t(`rental.fuel.${rental.end_fuel_level}`, undefined, rental.end_fuel_level)}
                                                </span>
                                            )}
                                        </DetailRow>
                                    )}
                                </dl>
                                {rental.checkout_checklist && (
                                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {t('rental.checklist.checkout', undefined, 'Checklist Saat Penyerahan (Checkout)')}
                                        </p>
                                        <ul className="grid gap-1.5 sm:grid-cols-2">
                                            {checklistItems.map((key) => (
                                                <li key={`out-${key}`} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <span className={rental.checkout_checklist?.[key] ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                                                        {rental.checkout_checklist?.[key] ? '✓' : '✗'}
                                                    </span>{' '}
                                                    {t(`rental.checklist.items.${key}`, undefined, key)}
                                                </li>
                                            ))}
                                        </ul>
                                        {rental.checkout_notes && <p className="mt-2 text-xs italic text-slate-500">{rental.checkout_notes}</p>}
                                        {handoverEvidence.checkout_photos.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {handoverEvidence.checkout_photos.map((url) => (
                                                    <a key={url} href={url} target="_blank" rel="noreferrer">
                                                        <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {handoverEvidence.checkout_signature_url && (
                                            <img src={handoverEvidence.checkout_signature_url} alt="" className="mt-3 h-16 rounded-xl border border-slate-200 bg-white dark:border-slate-700" />
                                        )}
                                    </div>
                                )}
                                {rental.return_checklist && (
                                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {t('rental.checklist.return', undefined, 'Checklist Saat Pengembalian (Return)')}
                                        </p>
                                        <ul className="grid gap-1.5 sm:grid-cols-2">
                                            {checklistItems.map((key) => (
                                                <li key={`in-${key}`} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <span className={rental.return_checklist?.[key] ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                                                        {rental.return_checklist?.[key] ? '✓' : '✗'}
                                                    </span>{' '}
                                                    {t(`rental.checklist.items.${key}`, undefined, key)}
                                                </li>
                                            ))}
                                        </ul>
                                        {rental.return_notes && <p className="mt-2 text-xs italic text-slate-500">{rental.return_notes}</p>}
                                        {handoverEvidence.return_photos.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {handoverEvidence.return_photos.map((url) => (
                                                    <a key={url} href={url} target="_blank" rel="noreferrer">
                                                        <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {handoverEvidence.return_signature_url && (
                                            <img src={handoverEvidence.return_signature_url} alt="" className="mt-3 h-16 rounded-xl border border-slate-200 bg-white dark:border-slate-700" />
                                        )}
                                    </div>
                                )}

                                {aiInspectionEnabled && (
                                    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        <AiHandoverInspectionPanel
                                            inspection={latestAiInspection}
                                            canInspect={is('active') || is('returned') || is('completed')}
                                            inspectUrl={aiInspectExistingUrl || ''}
                                            applyDamageUrl={aiApplyDamageUrl}
                                            hasReturnPhotos={(handoverEvidence?.return_photos?.length ?? 0) > 0}
                                        />
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {/* 5. Extensions & Swaps */}
                        {(rental.extension_requests?.length ?? 0) > 0 && (
                            <SectionCard title={t('rental.sections.extension_requests', undefined, 'Permohonan Perpanjangan Sewa')} icon="⏱️">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rental.extension_requests!.map((req) => (
                                        <div key={req.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-between gap-3 text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        ➔ {formatDateDmY(req.requested_end_date)}
                                                    </span>
                                                    <span className="ml-2 font-medium text-slate-400">
                                                        (+{req.estimated_periods} {periodLabel})
                                                    </span>
                                                    {req.channel && (
                                                        <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {t(`rental.channel.${req.channel}`, undefined, req.channel)}
                                                        </span>
                                                    )}
                                                    {req.notes && (
                                                        <p className="mt-1 text-xs italic text-slate-500">{req.notes}</p>
                                                    )}
                                                </div>
                                                <span className="tabular-nums font-black text-indigo-600 dark:text-indigo-400">
                                                    {formatMoney(req.estimated_amount)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <PrimaryButton
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            prefixedRoute('rental.extension_requests.approve', [
                                                                rental.id,
                                                                req.id,
                                                            ]),
                                                            {},
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    {t('rental.actions.approve', undefined, 'Setujui')}
                                                </PrimaryButton>
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            prefixedRoute('rental.extension_requests.reject', [
                                                                rental.id,
                                                                req.id,
                                                            ]),
                                                            {},
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                    className="text-xs font-bold text-rose-600 hover:bg-rose-50"
                                                >
                                                    {t('rental.actions.reject', undefined, 'Tolak')}
                                                </SecondaryButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {rental.extensions.length > 0 && (
                            <SectionCard title={t('rental.sections.extensions', undefined, 'Riwayat Perpanjangan')} icon="⏱️">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rental.extensions.map((ext) => (
                                        <div key={ext.id} className="flex items-center justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0">
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white">{formatDateDmY(ext.original_end_date)} → {formatDateDmY(ext.new_end_date)}</span>
                                                <span className="ml-2 text-slate-400">(+{ext.extended_periods} {periodLabel})</span>
                                            </div>
                                            <span className="tabular-nums font-black text-slate-900 dark:text-white">{formatMoney(ext.additional_amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {vehicleSwaps.length > 0 && (
                            <SectionCard title={t('rental.sections.vehicle_swaps', undefined, 'Riwayat Pergantian Unit (Swap)')} icon="🔄">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {vehicleSwaps.map((swap) => (
                                        <div key={swap.id} className="py-3 text-xs first:pt-0 last:pb-0">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {swap.from_vehicle} ➔ {swap.to_vehicle}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                {formatDateTimeDmYHi(swap.swapped_at)}
                                                {swap.swapped_by ? ` · Petugas: ${swap.swapped_by}` : ''}
                                                {swap.odometer_km != null ? ` · ${swap.odometer_km} km` : ''}
                                            </p>
                                            {swap.notes && <p className="mt-1 italic text-slate-500">{swap.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {/* 6. Addons & Damages */}
                        {addonCharges.length > 0 && (
                            <SectionCard title={t('rental.sections.addons', undefined, 'Layanan Tambahan & Biaya Opsional')} icon="📦">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {addonCharges.map((charge) => (
                                        <div key={charge.id} className="flex items-center justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{charge.description}</p>
                                                <p className="text-[11px] text-slate-400">
                                                    {charge.addon_code
                                                        ? t(`rental.addon.codes.${charge.addon_code}`, undefined, charge.addon_code)
                                                        : t('rental.addon.codes.other', undefined, 'Lainnya')}
                                                    {charge.is_invoiced ? ` · ${t('rental.addon.invoiced', undefined, 'Sudah Diterbitkan Invoice')}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="tabular-nums font-black text-slate-900 dark:text-white">{formatMoney(charge.amount)}</span>
                                                {charge.can_delete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => router.delete(prefixedRoute('rental.addons.destroy', [rental.id, charge.id]), { preserveScroll: true })}
                                                        className="text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {rental.damages.length > 0 && (
                            <SectionCard title={t('rental.sections.damages', undefined, 'Laporan Kerusakan & Klaim')} icon="⚠️">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rental.damages.map((dmg) => (
                                        <div key={dmg.id} className="flex items-start justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0">
                                            <div className="flex flex-1 gap-3">
                                                {dmg.photo_path && (
                                                    <a href={dmg.photo_path} target="_blank" rel="noreferrer" className="shrink-0">
                                                        <img src={dmg.photo_path} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                                    </a>
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-900 dark:text-white">{dmg.description}</p>
                                                    <p className="text-[11px] text-slate-400">{formatDateTimeDmYHi(dmg.reported_at)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="tabular-nums font-black text-rose-600 dark:text-rose-400">{formatMoney(dmg.amount)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => router.delete(prefixedRoute('rental.damages.destroy', [rental.id, dmg.id]), { preserveScroll: true })}
                                                    className="text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </div>

                    {/* Right Column (2 of 5 cols) */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Timeline */}
                        <SectionCard title={t('rental.sections.timeline', undefined, 'Alur & Status Perjalanan')} icon="🧭">
                            <ol className="relative space-y-0 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                                {timelineSteps.map((step, i) => (
                                    <li key={i} className="relative mb-6 ml-4 last:mb-0">
                                        <div
                                            className={`absolute -left-[1.35rem] mt-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                                                step.done ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                            }`}
                                        />
                                        <p className={`text-xs font-black ${step.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                            {step.label}
                                        </p>
                                        {step.date && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{step.date}</p>}
                                        {step.by && (
                                            <p className="text-[11px] text-slate-400">Oleh: <strong>{step.by}</strong></p>
                                        )}
                                    </li>
                                ))}
                                {(rental.status === 'cancelled' || rental.status === 'cancelled_paid') && (
                                    <li className="relative mb-0 ml-4">
                                        <div className="absolute -left-[1.35rem] mt-1 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />
                                        <p className="text-xs font-black text-rose-600 dark:text-rose-400">{t('rental.timeline.cancelled', undefined, 'Dibatalkan')}</p>
                                        {rental.cancelled_reason && (
                                            <p className="mt-0.5 text-[11px] text-slate-400">Alasan: {rental.cancelled_reason}</p>
                                        )}
                                    </li>
                                )}
                            </ol>
                        </SectionCard>

                        {/* Notes */}
                        {rental.notes && (
                            <SectionCard title={t('rental.sections.notes', undefined, 'Catatan & Instruksi Khusus')} icon="📝">
                                <p className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                    {rental.notes}
                                </p>
                            </SectionCard>
                        )}

                        {/* Quick Facts */}
                        <SectionCard title={t('rental.sections.quick_facts', undefined, 'Ringkasan Cepat')} subtitle={t('rental.sections.quick_facts_hint', undefined, 'Informasi operasional')} icon="ℹ️">
                            <dl>
                                <DetailRow label={t('rental.fields.code', undefined, 'Kode Rental')} compact>
                                    <span className="font-mono">{rental.code}</span>
                                </DetailRow>
                                <DetailRow label={t('rental.fields.status', undefined, 'Status')} compact>
                                    <StatusBadge
                                        status={rental.status}
                                        label={t(`rental.status.${rental.status}`, undefined, rental.status)}
                                    />
                                </DetailRow>
                                {rental.confirmed_by && (
                                    <DetailRow label={t('rental.timeline.confirmed', undefined, 'Dikonfirmasi')} compact>{rental.confirmed_by.name}</DetailRow>
                                )}
                                {rental.partner.phone && (
                                    <DetailRow label={t('rental.fields.phone', undefined, 'Kontak Pelanggan')} compact>{rental.partner.phone}</DetailRow>
                                )}
                            </dl>
                        </SectionCard>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Modal: Batal Rental */}
            <Modal show={modal === 'cancel'} onClose={() => setModal(null)} maxWidth="md">
                <form onSubmit={submitCancel} className="space-y-4 p-6">
                    <ModalHeader
                        tone="danger"
                        icon="🚫"
                        title={t('rental.modals.cancel', undefined, 'Batalkan Reservasi')}
                        subtitle={`Booking ${rental.code} • ${rental.partner?.name || ''}`}
                        onClose={() => setModal(null)}
                    />

                    <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-3.5 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                        <p className="font-semibold">⚠️ Perhatian Pembatalan</p>
                        <p className="mt-0.5 opacity-90">
                            Pembatalan akan menghentikan proses rental dan melepaskan unit kendaraan kembali ke jadwal ketersediaan.
                        </p>
                    </div>

                    <div>
                        <InputLabel htmlFor="cancelled_reason" value={`${t('rental.fields.cancel_reason', undefined, 'Alasan Pembatalan')} *`} />
                        <textarea
                            id="cancelled_reason"
                            rows={3}
                            value={cancelForm.data.cancelled_reason}
                            onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)}
                            placeholder="Tuliskan alasan pembatalan rental ini..."
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            required
                        />
                        <InputError message={cancelForm.errors.cancelled_reason} className="mt-1" />
                    </div>

                    <ChecklistToggleCard
                        label={t('rental.modals.cancel_fee_hint', undefined, 'Kenakan Biaya Pembatalan (Cancellation Fee)')}
                        checked={cancelForm.data.charge_fee}
                        onChange={(checked) => cancelForm.setData('charge_fee', checked)}
                    />

                    <div className="flex justify-end gap-2.5 pt-2">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>
                            {t('rental.nav.back', undefined, 'Kembali')}
                        </SecondaryButton>
                        <DangerButton disabled={cancelForm.processing} className="rounded-xl px-4 py-2">
                            {cancelForm.processing
                                ? 'Memproses...'
                                : cancelForm.data.charge_fee
                                    ? t('rental.actions.cancel_with_fee', undefined, 'Batalkan & Kenakan Biaya')
                                    : t('rental.actions.cancel_rental', undefined, 'Ya, Batalkan Rental')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: No-Show */}
            <Modal show={modal === 'no_show'} onClose={() => setModal(null)} maxWidth="md">
                <form onSubmit={submitNoShow} className="space-y-4 p-6">
                    <ModalHeader
                        tone="amber"
                        icon="⚠️"
                        title={t('rental.modals.no_show', undefined, 'Tandai Sebagai No-Show')}
                        subtitle={`Booking ${rental.code} • Pelanggan tidak hadir`}
                        onClose={() => setModal(null)}
                    />

                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                        <p className="font-semibold">Informasi No-Show</p>
                        <p className="mt-0.5 opacity-90">
                            Tandai jika pelanggan tidak datang pada jadwal pengambilan kendaraan tanpa konfirmasi pembatalan sebelumnya.
                        </p>
                    </div>

                    <div>
                        <InputLabel htmlFor="no_show_reason" value={t('rental.fields.cancel_reason', undefined, 'Catatan / Alasan')} />
                        <textarea
                            id="no_show_reason"
                            rows={3}
                            value={noShowForm.data.cancelled_reason}
                            onChange={(e) => noShowForm.setData('cancelled_reason', e.target.value)}
                            placeholder="Catatan tambahan no-show (opsional)..."
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-amber-500 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <ChecklistToggleCard
                        label={t('rental.modals.no_show_fee_hint', undefined, 'Kenakan Biaya No-Show (No-Show Fee)')}
                        checked={noShowForm.data.charge_fee}
                        onChange={(checked) => noShowForm.setData('charge_fee', checked)}
                    />

                    <div className="flex justify-end gap-2.5 pt-2">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>
                            {t('rental.nav.back', undefined, 'Kembali')}
                        </SecondaryButton>
                        <DangerButton disabled={noShowForm.processing} className="rounded-xl px-4 py-2 bg-amber-600 hover:bg-amber-700 focus:ring-amber-500">
                            {noShowForm.processing
                                ? 'Memproses...'
                                : noShowForm.data.charge_fee
                                    ? t('rental.actions.no_show_with_fee', undefined, 'Tandai No-Show & Kenakan Biaya')
                                    : t('rental.actions.mark_no_show', undefined, 'Tandai No-Show')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Extend */}
            <Modal show={modal === 'extend'} onClose={() => setModal(null)} maxWidth="md">
                <form onSubmit={submitExtend} className="space-y-4 p-6">
                    <ModalHeader
                        tone="primary"
                        icon="🗓️"
                        title={t('rental.modals.extend', undefined, 'Perpanjang Masa Sewa')}
                        subtitle={`Booking ${rental.code} • ${rental.vehicle.name}`}
                        onClose={() => setModal(null)}
                    />

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs dark:border-slate-700 dark:bg-slate-800/60 space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tanggal Mulai:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{formatDateDmY(rental.start_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Jadwal Selesai Saat Ini:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{formatDateDmY(rental.end_date)}</span>
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="new_end_date" value={`${t('rental.fields.new_end_date', undefined, 'Tanggal Selesai Baru')} *`} />
                        <TextInput
                            id="new_end_date"
                            type="date"
                            min={rental.end_date}
                            value={extendForm.data.new_end_date}
                            onChange={(e) => extendForm.setData('new_end_date', e.target.value)}
                            className="mt-1 w-full !rounded-xl"
                            required
                        />
                        <InputError message={extendForm.errors.new_end_date} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="extend_notes" value={t('rental.fields.notes', undefined, 'Catatan Perpanjangan')} />
                        <textarea
                            id="extend_notes"
                            rows={2}
                            value={extendForm.data.notes}
                            onChange={(e) => extendForm.setData('notes', e.target.value)}
                            placeholder="Alasan / catatan perpanjangan..."
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <PrimaryButton disabled={extendForm.processing} className="rounded-xl px-5 py-2">
                            {extendForm.processing ? 'Menyimpan...' : t('rental.actions.extend', undefined, 'Perpanjang Rental')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Swap Kendaraan */}
            <Modal show={modal === 'swap'} onClose={() => setModal(null)} maxWidth="md">
                <form onSubmit={submitSwap} className="space-y-4 p-6">
                    <ModalHeader
                        tone="purple"
                        icon="🔄"
                        title={t('rental.modals.swap', undefined, 'Tukar Unit Kendaraan')}
                        subtitle={`Tukar unit ${rental.vehicle.name} (${rental.vehicle.plate_number})`}
                        onClose={() => setModal(null)}
                    />

                    <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-3.5 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
                        <p className="font-semibold">Unit Saat Ini:</p>
                        <p className="font-bold text-sm mt-0.5">{rental.vehicle.name} — {rental.vehicle.plate_number}</p>
                    </div>

                    <div>
                        <InputLabel htmlFor="to_vehicle_id" value={`${t('rental.fields.swap_to_vehicle', undefined, 'Pilih Unit Kendaraan Pengganti')} *`} />
                        <Select
                            id="to_vehicle_id"
                            options={[
                                { value: '', label: t('rental.placeholders.select_vehicle', undefined, '-- Pilih Kendaraan Tersedia --') },
                                ...swapVehicles.map((v) => ({
                                    value: String(v.id),
                                    label: `${v.name} — ${v.plate_number}`,
                                })),
                            ]}
                            value={swapForm.data.to_vehicle_id}
                            onChange={(value) => swapForm.setData('to_vehicle_id', value)}
                            className="mt-1 w-full !rounded-xl"
                        />
                        <InputError message={swapForm.errors.to_vehicle_id} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="swap_odometer" value={`${t('rental.fields.swap_odometer', undefined, 'Odometer Saat Tukar')} (KM)`} />
                        <div className="relative mt-1">
                            <TextInput
                                id="swap_odometer"
                                type="number"
                                min={0}
                                value={swapForm.data.odometer_km}
                                onChange={(e) => swapForm.setData('odometer_km', e.target.value)}
                                className="w-full !rounded-xl pr-12 font-mono"
                                placeholder="0"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                                KM
                            </span>
                        </div>
                        <InputError message={swapForm.errors.odometer_km} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="swap_notes" value={t('rental.fields.notes', undefined, 'Alasan Penukaran Unit')} />
                        <textarea
                            id="swap_notes"
                            rows={2}
                            value={swapForm.data.notes}
                            onChange={(e) => swapForm.setData('notes', e.target.value)}
                            placeholder="Contoh: Kendaraan perlu servis rutin / upgrade unit..."
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <PrimaryButton disabled={swapForm.processing} className="rounded-xl px-5 py-2 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500">
                            {swapForm.processing ? 'Memproses Tukar...' : t('rental.actions.swap_vehicle', undefined, 'Konfirmasi Tukar Unit')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Damage */}
            <Modal show={modal === 'damage'} onClose={() => setModal(null)} maxWidth="md">
                <form onSubmit={submitDamage} className="space-y-4 p-6">
                    <ModalHeader
                        tone="danger"
                        icon="💥"
                        title={t('rental.modals.damage', undefined, 'Laporkan Kerusakan Kendaraan')}
                        subtitle={`Booking ${rental.code} • ${rental.vehicle.name}`}
                        onClose={() => setModal(null)}
                    />

                    <div>
                        <InputLabel htmlFor="damage_desc" value={`${t('rental.fields.description', undefined, 'Deskripsi Kerusakan')} *`} />
                        <textarea
                            id="damage_desc"
                            rows={2}
                            value={damageForm.data.description}
                            onChange={(e) => damageForm.setData('description', e.target.value)}
                            placeholder="Contoh: Goresan pada pintu kanan belakang..."
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            required
                        />
                        <InputError message={damageForm.errors.description} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="damage_amount" value={`${t('rental.fields.repair_cost', undefined, 'Estimasi Biaya Perbaikan')} *`} />
                        <MoneyInput
                            id="damage_amount"
                            value={damageForm.data.amount}
                            onChange={(value) => damageForm.setData('amount', value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={damageForm.errors.amount} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel value={t('rental.fields.damage_photo', undefined, 'Foto Bukti Kerusakan')} />
                        <ImageUploader
                            value={damageForm.data.photo_path}
                            onChange={(value) => damageForm.setData('photo_path', value)}
                            className="mt-1"
                        />
                        <InputError message={damageForm.errors.photo_path} className="mt-1" />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <PrimaryButton disabled={damageForm.processing} className="rounded-xl px-5 py-2 bg-rose-600 hover:bg-rose-700 focus:ring-rose-500">
                            {damageForm.processing ? 'Menyimpan...' : t('rental.actions.save_damage', undefined, 'Simpan Kerusakan')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Addon */}
            <Modal show={modal === 'addon'} onClose={() => setModal(null)} maxWidth="md">
                <form onSubmit={submitAddon} className="space-y-4 p-6">
                    <ModalHeader
                        tone="primary"
                        icon="➕"
                        title={t('rental.modals.addon', undefined, 'Tambah Layanan Tambahan (Addon)')}
                        subtitle={`Booking ${rental.code} • Layanan / Biaya Ekstra`}
                        onClose={() => setModal(null)}
                    />

                    <div>
                        <InputLabel htmlFor="addon_code" value={`${t('rental.fields.addon_code', undefined, 'Pilih Jenis Layanan')} *`} />
                        <Select
                            id="addon_code"
                            className="mt-1 w-full !rounded-xl"
                            value={addonForm.data.addon_code}
                            onChange={(value) => addonForm.setData('addon_code', value)}
                            placeholder={t('rental.placeholders.select_addon_code', undefined, '-- Pilih Layanan --')}
                            searchable
                            maxVisibleOptions={Math.max(addonCodes.length, 1)}
                            options={addonCodes.map((option) => ({
                                value: option.value,
                                label: option.label || t(`rental.addon.codes.${option.value}`, undefined, option.value),
                            }))}
                        />
                        <InputError message={addonForm.errors.addon_code} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="addon_amount" value={`${t('rental.fields.addon_amount', undefined, 'Nominal Biaya')} *`} />
                        <MoneyInput
                            id="addon_amount"
                            value={addonForm.data.amount}
                            onChange={(value) => addonForm.setData('amount', value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={addonForm.errors.amount} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="addon_desc" value={t('rental.fields.addon_description', undefined, 'Keterangan Tambahan')} />
                        <TextInput
                            id="addon_desc"
                            value={addonForm.data.description}
                            onChange={(e) => addonForm.setData('description', e.target.value)}
                            className="mt-1 w-full !rounded-xl"
                            placeholder={t('rental.placeholders.addon_description', undefined, 'Catatan atau detail layanan...')}
                        />
                        <InputError message={addonForm.errors.description} className="mt-1" />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <PrimaryButton disabled={addonForm.processing} className="rounded-xl px-5 py-2">
                            {addonForm.processing ? 'Menyimpan...' : t('rental.actions.save_addon', undefined, 'Tambahkan Layanan')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Settle Deposit */}
            <Modal show={modal === 'deposit'} onClose={() => setModal(null)} maxWidth="md">
                <form onSubmit={submitDeposit} className="space-y-4 p-6">
                    <ModalHeader
                        tone="emerald"
                        icon="💰"
                        title={t('rental.modals.deposit', undefined, 'Penyelesaian Deposit (Settlement)')}
                        subtitle={`Booking ${rental.code} • Total Ditahan: ${formatMoney(rental.deposit_amount)}`}
                        onClose={() => setModal(null)}
                    />

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs dark:border-slate-700 dark:bg-slate-800/60 space-y-2">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                            <span>Total Deposit Ditahan:</span>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">{formatMoney(rental.deposit_amount)}</span>
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="deposit_applied" value={t('rental.fields.deposit_applied', undefined, 'Dipotong untuk Tagihan / Kerusakan (Rp)')} />
                        <MoneyInput
                            id="deposit_applied"
                            value={depositForm.data.deposit_applied_amount}
                            onChange={(applied) => {
                                const deposit = Number(rental.deposit_amount);
                                const refunded = Math.max(0, deposit - Number(applied || 0));
                                depositForm.setData({
                                    deposit_applied_amount: applied,
                                    deposit_refunded_amount: String(refunded),
                                });
                            }}
                            className="mt-1 w-full"
                        />
                        <InputError message={depositForm.errors.deposit_applied_amount} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="deposit_refunded" value={t('rental.fields.deposit_refunded', undefined, 'Dikembalikan ke Pelanggan (Rp)')} />
                        <MoneyInput
                            id="deposit_refunded"
                            value={depositForm.data.deposit_refunded_amount}
                            onChange={(value) => depositForm.setData('deposit_refunded_amount', value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={depositForm.errors.deposit_refunded_amount} className="mt-1" />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <PrimaryButton disabled={depositForm.processing} className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500">
                            {depositForm.processing ? 'Menyimpan...' : t('rental.actions.settle_deposit', undefined, 'Selesaikan Deposit')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Approve Transfer Proof */}
            {showApproveProofModal && (
                <Modal show onClose={() => setShowApproveProofModal(false)} maxWidth="md">
                    <div className="p-6 space-y-4">
                        <ModalHeader
                            tone="emerald"
                            icon="✅"
                            title="Konfirmasi Persetujuan Bukti Transfer"
                            subtitle={`Verifikasi pembayaran untuk ${rental.code}`}
                            onClose={() => setShowApproveProofModal(false)}
                        />

                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/80 space-y-2 text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500">Kode Reservasi:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{rental.code}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Pemesan:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{rental.partner?.name || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">{Number(rental.deposit_amount) > 0 ? 'Nominal Deposit:' : 'Nominal Pembayaran Sewa:'}</span>
                                <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">{formatMoney(Number(rental.deposit_amount) > 0 ? rental.deposit_amount : rental.total_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Rekening Tujuan:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {rental.depositCompanyBankAccount
                                        ? `${rental.depositCompanyBankAccount.bank_name || ''} - ${rental.depositCompanyBankAccount.account_number || ''}`
                                        : 'Transfer Bank'}
                                </span>
                            </div>
                        </div>

                        {/* List Dampak Aksi */}
                        <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/50 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                            <p className="font-bold mb-1">Dampak setelah bukti transfer disetujui:</p>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                <span>Status bukti transfer diubah menjadi <b>Disetujui (Approved)</b></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                <span>{Number(rental.deposit_amount) > 0 ? 'Pembayaran deposit otomatis dicatat ke sistem' : 'Pembayaran sewa otomatis dicatat ke sistem'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                <span>Status reservasi otomatis berubah menjadi <b>Dikonfirmasi (Open)</b></span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <SecondaryButton type="button" onClick={() => setShowApproveProofModal(false)}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton
                                type="button"
                                disabled={approvingProof}
                                onClick={() => {
                                    setApprovingProof(true);
                                    router.post(prefixedRoute('rental.approve_deposit_proof', rental.id), {}, {
                                        onFinish: () => {
                                            setApprovingProof(false);
                                            setShowApproveProofModal(false);
                                        },
                                    });
                                }}
                                className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                            >
                                {approvingProof ? 'Memproses...' : (Number(rental.deposit_amount) > 0 ? 'Ya, Setujui Deposit' : 'Ya, Setujui Pembayaran')}
                            </PrimaryButton>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal: Reject Transfer Proof */}
            {showRejectProofModal && (
                <Modal show onClose={() => setShowRejectProofModal(false)} maxWidth="md">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            rejectProofForm.post(prefixedRoute('rental.reject_deposit_proof', rental.id), {
                                onSuccess: () => setShowRejectProofModal(false),
                            });
                        }}
                        className="p-6 space-y-4"
                    >
                        <ModalHeader
                            tone="danger"
                            icon="❌"
                            title="Tolak Bukti Transfer"
                            subtitle={`Pembayaran untuk ${rental.code}`}
                            onClose={() => setShowRejectProofModal(false)}
                        />

                        <div>
                            <InputLabel value="Alasan Penolakan *" />
                            <textarea
                                rows={3}
                                className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                value={rejectProofForm.data.rejected_reason}
                                onChange={(e) => rejectProofForm.setData('rejected_reason', e.target.value)}
                                placeholder="Contoh: Bukti transfer tidak terbaca / nominal tidak sesuai"
                                required
                            />
                            <InputError message={rejectProofForm.errors.rejected_reason} className="mt-1" />
                        </div>
                        <div className="flex justify-end gap-2.5 pt-2">
                            <SecondaryButton type="button" onClick={() => setShowRejectProofModal(false)}>
                                Batal
                            </SecondaryButton>
                            <DangerButton type="submit" disabled={rejectProofForm.processing} className="rounded-xl px-4 py-2">
                                {rejectProofForm.processing ? 'Menolak...' : 'Tolak Bukti Transfer'}
                            </DangerButton>
                        </div>
                    </form>
                </Modal>
            )}

            {showPayInvoicesModal && (
                <PayInvoicesModal
                    show={showPayInvoicesModal}
                    rentalCode={rental.code}
                    invoices={payment.invoices ?? []}
                    partnerId={rental.partner?.id ?? 0}
                    companyBankAccounts={companyBankAccounts}
                    onClose={() => setShowPayInvoicesModal(false)}
                    onSubmit={handlePayInvoices}
                    processing={false}
                    errors={confirmErrors}
                />
            )}
        </DynamicLayout>
    );
}
