import DynamicLayout from '@/Layouts/DynamicLayout';
import LeafletMap from '@/Components/Map/LeafletMap';
import VehicleMarker from '@/Components/Map/VehicleMarker';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatMoney } from '@/utils/money';
import { formatDateTimeDmYHi, formatDateDmY } from '@/utils/date';
import { formatSpeedKph, toLatLng } from '@/utils/geo';
import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ConfirmPaymentPanel, {
    type CompanyBankAccountOption,
    type DepositPaymentMethod,
} from '../../../ConfirmPayment/ConfirmPaymentPanel';
import HandoverPhotoPicker from '../../../HandoverPhotoPicker';
import { type AiInspectionData } from '../../../Components/AiHandoverInspectionPanel';
import PostConfirmPanel from '../../../PostConfirm/PostConfirmPanel';
import PostConfirmStepper from '../../../PostConfirm/PostConfirmStepper';
import PayInvoicesModal from '../../../PostConfirm/PayInvoicesModal';
import type { PostConfirmAction, PostConfirmProgress, PostConfirmStepId } from '../../../PostConfirm/types';
import { POST_CONFIRM_STEPS } from '../../../PostConfirm/types';
import RentalNav from '../../../RentalNav';
import {
    EmptyBlock,
    PaymentBadge,
    SectionCard,
    StatCard,
    StatusBadge,
} from './ShowUi';
import LifecycleModals from './Show/modals/LifecycleModals';
import type { LifecycleModalName } from './Show/modals/LifecycleModals';
import ApproveDepositProofModal from './Show/modals/ApproveDepositProofModal';
import RejectDepositProofModal from './Show/modals/RejectDepositProofModal';
import RentalSections from './Show/RentalSections';
import type {
    AddonCharge,
    AddonCodeOption,
    HandoverEvidence,
    PaymentSummary,
    Rental,
    SwapVehicleOption,
    VehicleSwapRow,
} from './Show/types';

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
    const [modal, setModal] = useState<LifecycleModalName>(null);
    const [confirming, setConfirming] = useState(false);
    const [showConfirmPayment, setShowConfirmPayment] = useState(false);
    const [showApproveProofModal, setShowApproveProofModal] = useState(false);
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

                <RentalSections
                    rental={rental}
                    periodLabel={periodLabel}
                    payment={payment}
                    invoicingEnabled={invoicingEnabled}
                    addonCharges={addonCharges}
                    vehicleSwaps={vehicleSwaps}
                    checklistItems={checklistItems}
                    handoverEvidence={handoverEvidence}
                    aiKycEnabled={aiKycEnabled}
                    aiInspectionEnabled={aiInspectionEnabled}
                    latestAiInspection={latestAiInspection}
                    aiScanKycUrl={aiScanKycUrl}
                    aiSyncKycPartnerUrl={aiSyncKycPartnerUrl}
                    aiInspectExistingUrl={aiInspectExistingUrl}
                    aiApplyDamageUrl={aiApplyDamageUrl}
                />
            </div>

            <LifecycleModals
                active={modal}
                rental={rental}
                swapVehicles={swapVehicles}
                addonCodes={addonCodes}
                onClose={() => setModal(null)}
            />

            {showApproveProofModal && (
                <ApproveDepositProofModal rental={rental} onClose={() => setShowApproveProofModal(false)} />
            )}

            {showRejectProofModal && (
                <RejectDepositProofModal rental={rental} onClose={() => setShowRejectProofModal(false)} />
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
