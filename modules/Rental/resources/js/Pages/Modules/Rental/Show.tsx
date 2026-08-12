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
import PostConfirmPanel from '../../../PostConfirm/PostConfirmPanel';
import PostConfirmStepper from '../../../PostConfirm/PostConfirmStepper';
import type { PostConfirmAction, PostConfirmProgress, PostConfirmStepId } from '../../../PostConfirm/types';
import { POST_CONFIRM_STEPS } from '../../../PostConfirm/types';
import RentalNav from '../../../RentalNav';
import {
    DetailRow,
    EmptyBlock,
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
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const page = usePage();
    const confirmErrors = (page.props.errors ?? {}) as Partial<
        Record<'payment_method' | 'company_bank_account_id' | 'deposit', string>
    >;
    const [modal, setModal] = useState<'cancel' | 'no_show' | 'checkout' | 'return' | 'extend' | 'damage' | 'addon' | 'deposit' | 'swap' | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [showConfirmPayment, setShowConfirmPayment] = useState(false);
    const [showApproveProofModal, setShowApproveProofModal] = useState(false);
    const [approvingProof, setApprovingProof] = useState(false);
    const [showRejectProofModal, setShowRejectProofModal] = useState(false);
    const [confirmPaymentMethod, setConfirmPaymentMethod] = useState<DepositPaymentMethod>('cash');
    const [confirmBankAccountId, setConfirmBankAccountId] = useState('');
    const [lifecycleStep, setLifecycleStep] = useState<PostConfirmStepId>(
        postConfirm.current_step && POST_CONFIRM_STEPS.includes(postConfirm.current_step)
            ? postConfirm.current_step
            : 6,
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
    const checkoutForm = useForm({
        start_odometer: '',
        start_fuel_level: 'full',
        checkout_checklist: emptyChecklist(checklistItems),
        checkout_notes: '',
        checkout_photos: [] as string[],
        checkout_signature: null as string | null,
        checkout_staff_signature: null as string | null,
    });
    const returnForm = useForm({
        actual_return_date: '',
        end_odometer: '',
        end_fuel_level: 'full',
        return_checklist: emptyChecklist(checklistItems),
        return_notes: '',
        deposit_returned: false,
        return_photos: [] as string[],
        return_signature: null as string | null,
    });
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
        });
    };

    const submitCancel: FormEventHandler = (e) => { e.preventDefault(); cancelForm.post(prefixedRoute('rental.cancel', rental.id), { onSuccess: () => setModal(null) }); };
    const submitNoShow: FormEventHandler = (e) => { e.preventDefault(); noShowForm.post(prefixedRoute('rental.no_show', rental.id), { onSuccess: () => setModal(null) }); };
    const submitCheckout: FormEventHandler = (e) => { e.preventDefault(); checkoutForm.post(prefixedRoute('rental.checkout', rental.id), { onSuccess: () => setModal(null) }); };
    const submitReturn: FormEventHandler = (e) => { e.preventDefault(); returnForm.post(prefixedRoute('rental.return', rental.id), { onSuccess: () => setModal(null) }); };
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
                setModal('checkout');
                break;
            case 'return':
                setModal('return');
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
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('rental.title')}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <h2 className="font-mono text-xl font-semibold leading-tight text-gray-800 dark:text-white">
                                {rental.code}
                            </h2>
                            <StatusBadge
                                status={rental.status}
                                label={t(`rental.status.${rental.status}`, undefined, rental.status)}
                            />
                            {rental.is_overdue && (
                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950 dark:text-rose-200">
                                    {t('rental.status.overdue')}
                                </span>
                            )}
                        </div>
                    </div>
                    <Link href={prefixedRoute('rental.index')}>
                        <SecondaryButton type="button">{t('rental.nav.back_to_list')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('rental.pages.show.title', { code: rental.code })} />

            <RentalNav />

            <div className="space-y-6">
                {/* Hero identity */}
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-5 border-b border-gray-100 p-5 dark:border-gray-700 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start">
                            <div className="shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900/40 dark:ring-gray-600">
                                {rental.vehicle.photo_url ? (
                                    <img
                                        src={rental.vehicle.photo_url}
                                        alt={rental.vehicle.name}
                                        className="h-40 w-full object-cover sm:h-44 sm:w-64"
                                    />
                                ) : (
                                    <div className="flex h-40 w-full items-center justify-center px-4 text-center sm:h-44 sm:w-64">
                                        <p className="text-sm text-gray-400 dark:text-gray-500">
                                            {t('rental.availability.no_photo')}
                                        </p>
                                    </div>
                                )}
                            </div>

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
                                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                            {t('rental.deposit.not_received')}
                                        </span>
                                    )}
                                    {depositHeld && rental.deposit_received_at && rental.deposit_status !== 'settled' && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                            {t('rental.deposit.received')}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {rental.vehicle.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-mono font-medium text-gray-700 dark:text-gray-200">
                                            {rental.vehicle.plate_number}
                                        </span>
                                        <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                                        {rental.partner.name}
                                        {rental.driver && (
                                            <>
                                                <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                                                {rental.driver.name}
                                            </>
                                        )}
                                    </p>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {rental.start_date} → {rental.end_date}
                                    </span>
                                    <span className="ml-2 text-gray-500">
                                        ({rental.total_periods} {periodLabel})
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex max-w-full shrink-0 flex-nowrap items-center justify-end gap-2 overflow-x-auto lg:max-w-[min(100%,36rem)]">
                            {canPrintContract && (
                                <a href={prefixedRoute('rental.pdf.contract', rental.id)} target="_blank" rel="noreferrer" className="shrink-0">
                                    <SecondaryButton type="button">{t('rental.actions.print_contract')}</SecondaryButton>
                                </a>
                            )}
                            {canPrintHandover && (
                                <a href={prefixedRoute('rental.pdf.handover', rental.id)} target="_blank" rel="noreferrer" className="shrink-0">
                                    <SecondaryButton type="button">{t('rental.actions.print_handover')}</SecondaryButton>
                                </a>
                            )}
                            {(is('active') || is('returned')) && (
                                <SecondaryButton className="shrink-0" onClick={() => setModal('damage')}>
                                    {t('rental.actions.add_damage')}
                                </SecondaryButton>
                            )}
                            {(is('draft') || is('pending') || is('pending_reserved') || is('confirmed')) && (
                                <Link href={prefixedRoute('rental.edit', rental.id)} className="shrink-0">
                                    <SecondaryButton>{t('common.edit')}</SecondaryButton>
                                </Link>
                            )}
                            {canCancel && (
                                <DangerButton className="shrink-0" onClick={() => setModal('cancel')}>
                                    {t('common.cancel')}
                                </DangerButton>
                            )}
                            {canConfirm && !showConfirmPayment && (
                                <PrimaryButton className="shrink-0" onClick={openConfirmPayment}>
                                    {t('rental.actions.confirm')}
                                </PrimaryButton>
                            )}
                            {is('confirmed') && (
                                <DangerButton className="shrink-0" onClick={() => setModal('no_show')}>
                                    {t('rental.actions.mark_no_show')}
                                </DangerButton>
                            )}
                            {!postConfirm.visible && canPayDepositOnline && (
                                <SecondaryButton className="shrink-0" onClick={() => action('deposit.pay_online')}>
                                    {t('receivables.gateway.pay_deposit')}
                                </SecondaryButton>
                            )}
                            {!postConfirm.visible && is('confirmed') && (
                                <>
                                    {canReceiveDeposit && (
                                        <PrimaryButton className="shrink-0" onClick={() => action('deposit.receive')}>
                                            {t('rental.actions.receive_deposit')}
                                        </PrimaryButton>
                                    )}
                                    <PrimaryButton
                                        className={`shrink-0${depositBlocksCheckout ? ' opacity-50' : ''}`}
                                        onClick={() => setModal('checkout')}
                                        disabled={depositBlocksCheckout}
                                        title={depositBlocksCheckout ? checkoutBlockedReason : undefined}
                                    >
                                        {t('rental.actions.checkout')}
                                    </PrimaryButton>
                                </>
                            )}
                            {!postConfirm.visible && is('active') && (
                                <>
                                    <SecondaryButton className="shrink-0" onClick={() => setModal('extend')}>
                                        {t('rental.actions.extend')}
                                    </SecondaryButton>
                                    <PrimaryButton className="shrink-0" onClick={() => setModal('return')}>
                                        {t('rental.actions.return')}
                                    </PrimaryButton>
                                </>
                            )}
                            {!postConfirm.visible && is('returned') && (
                                <PrimaryButton className="shrink-0" onClick={() => action('complete')}>
                                    {t('rental.actions.complete')}
                                </PrimaryButton>
                            )}
                            {canMarkFeePaid && (
                                <SecondaryButton className="shrink-0" onClick={() => action('mark_fee_paid')}>
                                    {t('rental.actions.mark_fee_paid')}
                                </SecondaryButton>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-4 dark:bg-gray-900/40 sm:grid-cols-4 sm:px-6">
                        <StatCard
                            label={t('rental.fields.total_amount')}
                            value={formatMoney(rental.total_amount)}
                        />
                        <StatCard
                            label={t('rental.fields.deposit')}
                            value={formatMoney(rental.deposit_amount)}
                            hint={
                                Number(rental.deposit_amount) <= 0
                                    ? t('rental.deposit.none')
                                    : rental.deposit_received_at
                                        ? t('rental.deposit.received')
                                        : t('rental.deposit.not_received')
                            }
                            tone={
                                Number(rental.deposit_amount) <= 0 || rental.deposit_received_at
                                    ? 'success'
                                    : 'danger'
                            }
                        />
                        <StatCard
                            label={t('rental.fields.period')}
                            value={`${rental.total_periods} ${periodLabel}`}
                            hint={`${rental.start_date} → ${rental.end_date}`}
                        />
                        {invoicingEnabled ? (
                            <StatCard
                                label={t('rental.fields.balance_due')}
                                value={formatMoney(payment.balance_due)}
                                hint={t(`rental.payment.${payment.status}`, undefined, payment.status)}
                                tone={payment.balance_due > 0 ? 'warning' : 'success'}
                            />
                        ) : (
                            <StatCard
                                label={t('rental.fields.base_amount')}
                                value={formatMoney(rental.base_amount)}
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
                            onAction={handlePostConfirmAction}
                        />
                    </div>
                )}

                {depositBlocksCheckout && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                        <p className="font-medium">{checkoutBlockedReason}</p>
                        {Number(rental.deposit_amount) > 0 ? (
                            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                                {t('rental.modals.confirm_deposit_body', {
                                    code: rental.code,
                                    amount: formatMoney(rental.deposit_amount),
                                })}
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
                    <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 dark:border-amber-800 dark:bg-amber-950/40 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3 dark:border-amber-800/80">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                                    Pending Verification
                                </span>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    {Number(rental.deposit_amount) > 0
                                        ? `Verifikasi Bukti Transfer Manual Deposit (${formatMoney(rental.deposit_amount)})`
                                        : `Verifikasi Bukti Transfer Pembayaran Sewa (${formatMoney(rental.total_amount)})`}
                                </h3>
                            </div>
                            {rental.deposit_proof_uploaded_at && (
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Diunggah: {formatDateTimeDmYHi(rental.deposit_proof_uploaded_at)}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                                <div>
                                    <span className="font-semibold text-gray-500">Rekening Tujuan:</span>{' '}
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {rental.depositCompanyBankAccount
                                            ? `${rental.depositCompanyBankAccount.bank_name || ''} ${rental.depositCompanyBankAccount.name} (${rental.depositCompanyBankAccount.account_number || ''})`
                                            : 'Transfer Bank'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500">
                                        {Number(rental.deposit_amount) > 0 ? 'Jumlah Deposit:' : 'Jumlah Pembayaran Sewa:'}
                                    </span>{' '}
                                    <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                                        {formatMoney(Number(rental.deposit_amount) > 0 ? rental.deposit_amount : rental.total_amount)}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500">Metode:</span> Transfer Bank Manual
                                </div>
                            </div>

                            {depositProofUrl && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">Pratinjau Bukti Transfer:</span>
                                    <a
                                        href={depositProofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block overflow-hidden rounded-lg border border-gray-200 shadow-sm transition hover:opacity-90 dark:border-gray-700"
                                    >
                                        <img
                                            src={depositProofUrl}
                                            alt="Bukti Transfer Deposit"
                                            className="h-32 w-auto object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                        <span className="block p-1 text-center text-[11px] font-bold text-indigo-600 underline dark:text-indigo-400">
                                            Buka Dokumen Bukti Transfer ↗
                                        </span>
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-amber-200/80 dark:border-amber-800/80">
                            <DangerButton type="button" onClick={() => setShowRejectProofModal(true)}>
                                Tolak Bukti Transfer
                            </DangerButton>
                            <PrimaryButton
                                type="button"
                                onClick={() => setShowApproveProofModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
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
                    <div className="rounded-xl border border-blue-300 bg-blue-50/80 p-5 dark:border-blue-800 dark:bg-blue-950/40 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/80 pb-3 dark:border-blue-800/80">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-blue-200/80 px-2.5 py-0.5 text-xs font-bold text-blue-900 dark:bg-blue-900/60 dark:text-blue-200">
                                    Siap Serah Terima (Pickup)
                                </span>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Permohonan Pickup & Kontrak Digital Pelanggan
                                </h3>
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Waktu Pengajuan: {formatDateTimeDmYHi(rental.pickup_requested_at)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                                <div>
                                    <span className="font-semibold text-gray-500">Persetujuan Syarat & Kontrak:</span>{' '}
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        ✓ Disetujui oleh Penyewa ({rental.partner?.name})
                                    </span>
                                </div>
                                {rental.pickup_notes && (
                                    <div>
                                        <span className="font-semibold text-gray-500">Catatan Pelanggan:</span>{' '}
                                        <span className="italic text-gray-900 dark:text-white">{rental.pickup_notes}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="font-semibold text-gray-500">Status Pembayaran Deposit:</span>{' '}
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        {Number(rental.deposit_amount) > 0 ? `Lunas (${formatMoney(rental.deposit_amount)})` : '-'}
                                    </span>
                                </div>
                            </div>

                            {pickupCustomerSignatureUrl && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">Tanda Tangan Digital Pelanggan:</span>
                                    <div className="rounded-lg border border-gray-200 bg-white p-2 text-center dark:border-gray-700 dark:bg-gray-800">
                                        <img
                                            src={pickupCustomerSignatureUrl}
                                            alt="Tanda Tangan Digital Pelanggan"
                                            className="h-20 max-w-full object-contain mx-auto"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200/80 dark:border-blue-800/80">
                            <PrimaryButton
                                type="button"
                                onClick={() => setModal('checkout')}
                                className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            >
                                Proses Pickup & Serahkan Kendaraan (Checkout)
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Live map — show prominently when tracking is relevant */}
                {(isLiveTracking || live || (trackingEnabled && hasGpsDevice)) && (
                    <SectionCard
                        title={isLiveTracking && live ? t('rental.sections.live_location') : t('rental.sections.last_location')}
                        action={
                            <div className="flex flex-wrap items-center gap-3">
                                {isLiveTracking && live && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        {t('rental.tracking.live')}
                                    </span>
                                )}
                                {trackingEnabled && hasGpsDevice && gpsSummary && (
                                    <Link
                                        href={prefixedRoute('tracking.history', {
                                            vehicle_id: rental.vehicle.id,
                                            from: gpsSummary.from,
                                            to: gpsSummary.to,
                                        })}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                    >
                                        {t('rental.tracking.view_trail')}
                                    </Link>
                                )}
                            </div>
                        }
                    >
                        {live ? (
                            <div className="space-y-3">
                                {recordedLabel && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatSpeedKph(livePosition?.speed_kph)}
                                        {` — ${t('rental.tracking.last_seen', { time: recordedLabel })}`}
                                    </p>
                                )}
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
                                                    <span className="text-gray-500">{recordedLabel}</span>
                                                </>
                                            )}
                                        </>
                                    </VehicleMarker>
                                </LeafletMap>
                                {isLiveTracking && (
                                    <p className="text-xs text-gray-400">{t('rental.tracking.hint_active')}</p>
                                )}
                                {gpsSummary && (
                                    <div className="grid grid-cols-1 gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900/50 dark:text-gray-300 sm:grid-cols-3">
                                        <p>{t('rental.tracking.gps_km', { km: gpsSummary.distance_km.toLocaleString('id-ID') })}</p>
                                        <p>
                                            {gpsSummary.odometer_km !== null
                                                ? t('rental.tracking.odometer_km', { km: gpsSummary.odometer_km.toLocaleString('id-ID') })
                                                : t('rental.tracking.odometer_pending')}
                                        </p>
                                        <p>{t('rental.tracking.gps_points', { count: gpsSummary.points })}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyBlock>
                                {!trackingEnabled
                                    ? t('rental.tracking.unavailable')
                                    : !hasGpsDevice
                                        ? t('rental.tracking.no_device')
                                        : t('rental.tracking.no_fix')}
                            </EmptyBlock>
                        )}
                    </SectionCard>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <SectionCard title={t('rental.sections.booking_details')}>
                            <dl>
                                <DetailRow label={t('rental.fields.vehicle')}>
                                    {rental.vehicle.name}{' '}
                                    <span className="font-mono text-gray-500">({rental.vehicle.plate_number})</span>
                                </DetailRow>
                                <DetailRow label={t('rental.fields.customer')}>{rental.partner.name}</DetailRow>
                                {rental.driver && (
                                    <DetailRow label={t('rental.fields.driver')}>{rental.driver.name}</DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.period')}>
                                    {rental.start_date} → {rental.end_date} ({rental.total_periods} {periodLabel})
                                </DetailRow>
                                {rental.actual_return_date && (
                                    <DetailRow label={t('rental.fields.actual_return')}>{rental.actual_return_date}</DetailRow>
                                )}
                                {locationDisplay(rental.pickup_location) && (
                                    <DetailRow label={t('rental.fields.pickup_location')}>
                                        {locationDisplay(rental.pickup_location)}
                                    </DetailRow>
                                )}
                                {locationDisplay(rental.return_location) && (
                                    <DetailRow label={t('rental.fields.return_location')}>
                                        {locationDisplay(rental.return_location)}
                                    </DetailRow>
                                )}
                                {Number(rental.one_way_fee_amount ?? 0) > 0 && (
                                    <DetailRow label={t('rental.fields.one_way_fee')}>
                                        {formatMoney(rental.one_way_fee_amount)}
                                    </DetailRow>
                                )}
                                {rental.insurance_package && (
                                    <DetailRow label={t('rental.fields.insurance_package')}>
                                        {rental.insurance_package.name}
                                    </DetailRow>
                                )}
                                {rental.fuel_policy_notes && (
                                    <DetailRow label={t('rental.fields.fuel_policy_notes')}>
                                        {rental.fuel_policy_notes}
                                    </DetailRow>
                                )}
                            </dl>
                        </SectionCard>

                        <SectionCard title={t('rental.sections.pricing_snapshot')}>
                            <dl>
                                <DetailRow label={t('rental.fields.rate')}>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="tabular-nums">
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
                                                            className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-100"
                                                            title={`Tier Periode Sewa: ${tierLabel(pTier)}`}
                                                        >
                                                            <span>📅</span>
                                                            <span>{tierLabel(pTier)}</span>
                                                        </span>
                                                    )}
                                                    {lTier && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100"
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
                                    <DetailRow label={t('rental.fields.km_limit')}>
                                        {t('rental.rates.km', { km: rental.km_limit_per_period })} / {periodLabel}
                                    </DetailRow>
                                )}
                                {rental.excess_km_rate && (
                                    <DetailRow label={t('rental.fields.excess_km_rate')}>
                                        <span className="tabular-nums">{formatMoney(rental.excess_km_rate)} / km</span>
                                    </DetailRow>
                                )}
                                {rental.late_fee_per_day && (
                                    <DetailRow label={t('rental.fields.late_fee_per_day')}>
                                        <span className="tabular-nums">{formatMoney(rental.late_fee_per_day)} / day</span>
                                    </DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.deposit')}>
                                    <span className="tabular-nums">{formatMoney(rental.deposit_amount)}</span>
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                        {t(`rental.deposit.${rental.deposit_status}`, undefined, rental.deposit_status)}
                                    </span>
                                </DetailRow>
                                {rental.deposit_status === 'settled' && Number(rental.deposit_amount) > 0 && (
                                    <>
                                        <DetailRow label={t('rental.deposit.applied')}>
                                            <span className="tabular-nums">{formatMoney(rental.deposit_applied_amount)}</span>
                                        </DetailRow>
                                        <DetailRow label={t('rental.deposit.refunded')}>
                                            <span className="tabular-nums">{formatMoney(rental.deposit_refunded_amount)}</span>
                                        </DetailRow>
                                    </>
                                )}
                                {rental.tier_discount_amount && Number(rental.tier_discount_amount) > 0 && (
                                    <DetailRow label={t('rental.fields.tier_discount', undefined, 'Potongan Tier Harga')}>
                                        <span className="tabular-nums text-emerald-600">− {formatMoney(rental.tier_discount_amount)}</span>
                                    </DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.base_amount')}>
                                    <span className="tabular-nums">{formatMoney(rental.base_amount)}</span>
                                </DetailRow>
                                {Number(rental.excess_amount) > 0 && (
                                    <DetailRow label={t('rental.fields.excess_km', { km: rental.excess_km ?? 0 })}>
                                        <span className="tabular-nums text-rose-600">{formatMoney(rental.excess_amount)}</span>
                                    </DetailRow>
                                )}
                                {Number(rental.late_fee_amount) > 0 && (
                                    <DetailRow label={t('rental.fields.late_fee', { days: rental.overdue_days ?? 0 })}>
                                        <span className="tabular-nums text-rose-600">{formatMoney(rental.late_fee_amount)}</span>
                                    </DetailRow>
                                )}
                                <DetailRow label={t('rental.fields.total_amount')}>
                                    <span className="text-base font-semibold tabular-nums">{formatMoney(rental.total_amount)}</span>
                                </DetailRow>
                            </dl>

                            {rental.period_pricing_snapshot && rental.period_pricing_snapshot.length > 0 && (
                                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60">
                                    <details className="group" open>
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100/50">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4 text-gray-500 transition group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                                <span>
                                                    {t('rental.sections.period_breakdown', undefined, 'Rincian Periode & Rate Terpakai')}
                                                </span>
                                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
                                                    {rental.period_pricing_snapshot.length} periode
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-400">Klik untuk expand</span>
                                        </summary>
                                        <div className="border-t border-gray-100">
                                            <div className="overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-100">
                                                    <thead className="bg-white/60">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">#</th>
                                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                                                {t('rental.fields.date_range', undefined, 'Tanggal')}
                                                            </th>
                                                            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                                                {t('rental.fields.rate_applied', undefined, 'Rate Terpakai')}
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                                                {t('rental.fields.tier_applied', undefined, 'Keterangan Tier')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 bg-white">
                                                        {rental.period_pricing_snapshot.map((row) => (
                                                            <tr key={row.period} className="hover:bg-indigo-50/30">
                                                                <td className="whitespace-nowrap px-3 py-2 text-xs">
                                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-[10px] font-bold text-white">
                                                                        {row.period}
                                                                    </span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                                                                    <div className="font-medium tabular-nums">{formatDateDmY(row.from_date)}</div>
                                                                    <div className="text-[11px] text-gray-400">s/d {formatDateDmY(row.to_date)}</div>
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-semibold tabular-nums text-gray-900">
                                                                    {formatMoney(row.rate_applied)}
                                                                </td>
                                                                <td className="px-3 py-2 text-xs text-gray-600">
                                                                    {row.tier_label ? (
                                                                        <code className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-700 ring-1 ring-inset ring-sky-100">
                                                                            {row.tier_label}
                                                                        </code>
                                                                    ) : (
                                                                        <span className="text-gray-400">— (Base Rate)</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-50/80">
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                                {t('rental.fields.base_amount')}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-gray-900">
                                                                {formatMoney(rental.base_amount)}
                                                            </td>
                                                            <td />
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            )}
                        </SectionCard>

                        {invoicingEnabled && (
                            <SectionCard
                                title={t('rental.sections.billing')}
                                action={
                                    <PaymentBadge
                                        status={payment.status}
                                        label={t(`rental.payment.${payment.status}`, undefined, payment.status)}
                                    />
                                }
                            >
                                <dl>
                                    <DetailRow label={t('rental.fields.invoiced')}>
                                        <span className="tabular-nums">{formatMoney(payment.total_invoiced)}</span>
                                    </DetailRow>
                                    <DetailRow label={t('rental.fields.paid')}>
                                        <span className="tabular-nums">{formatMoney(payment.total_paid)}</span>
                                    </DetailRow>
                                    <DetailRow label={t('rental.fields.balance_due')}>
                                        <span className="tabular-nums">{formatMoney(payment.balance_due)}</span>
                                    </DetailRow>
                                </dl>
                                {payment.invoices.length > 0 ? (
                                    <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                                        {payment.invoices.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                                <div>
                                                    <Link
                                                        href={prefixedRoute('invoicing.invoices.show', inv.id)}
                                                        className="font-mono text-indigo-600 hover:underline dark:text-indigo-400"
                                                    >
                                                        {inv.code}
                                                    </Link>
                                                    <span className="ml-2 text-xs text-gray-400">{inv.status}</span>
                                                    {inv.due_date && (
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            {t('rental.fields.due_date')}: {inv.due_date}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatMoney(inv.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <EmptyBlock>{t('rental.payment.none')}</EmptyBlock>
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {(rental.start_odometer != null || rental.end_odometer != null || rental.checkout_checklist || rental.return_checklist) && (
                            <SectionCard title={t('rental.sections.handover')}>
                                <dl>
                                    {rental.start_odometer != null && (
                                        <DetailRow label={t('rental.fields.checkout')}>
                                            <span className="tabular-nums">
                                                {t('rental.rates.km', { km: rental.start_odometer.toLocaleString() })}
                                            </span>
                                            {rental.start_fuel_level && (
                                                <span className="ml-2 text-xs font-normal text-gray-500">
                                                    BBM: {t(`rental.fuel.${rental.start_fuel_level}`, undefined, rental.start_fuel_level)}
                                                </span>
                                            )}
                                        </DetailRow>
                                    )}
                                    {rental.end_odometer != null && (
                                        <DetailRow label={t('rental.fields.return')}>
                                            <span className="tabular-nums">
                                                {t('rental.rates.km', { km: rental.end_odometer.toLocaleString() })}
                                            </span>
                                            {rental.end_fuel_level && (
                                                <span className="ml-2 text-xs font-normal text-gray-500">
                                                    BBM: {t(`rental.fuel.${rental.end_fuel_level}`, undefined, rental.end_fuel_level)}
                                                </span>
                                            )}
                                        </DetailRow>
                                    )}
                                </dl>
                                {rental.checkout_checklist && (
                                    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t('rental.checklist.checkout')}</p>
                                        <ul className="grid gap-1 sm:grid-cols-2">
                                            {checklistItems.map((key) => (
                                                <li key={`out-${key}`} className="text-xs text-gray-700 dark:text-gray-300">
                                                    <span className={rental.checkout_checklist?.[key] ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {rental.checkout_checklist?.[key] ? '✓' : '✗'}
                                                    </span>{' '}
                                                    {t(`rental.checklist.items.${key}`)}
                                                </li>
                                            ))}
                                        </ul>
                                        {rental.checkout_notes && <p className="mt-2 text-xs text-gray-500">{rental.checkout_notes}</p>}
                                        {handoverEvidence.checkout_photos.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {handoverEvidence.checkout_photos.map((url) => (
                                                    <a key={url} href={url} target="_blank" rel="noreferrer">
                                                        <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-600" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {handoverEvidence.checkout_signature_url && (
                                            <img src={handoverEvidence.checkout_signature_url} alt="" className="mt-3 h-16 rounded-lg border border-gray-200 bg-white dark:border-gray-600" />
                                        )}
                                    </div>
                                )}
                                {rental.return_checklist && (
                                    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t('rental.checklist.return')}</p>
                                        <ul className="grid gap-1 sm:grid-cols-2">
                                            {checklistItems.map((key) => (
                                                <li key={`in-${key}`} className="text-xs text-gray-700 dark:text-gray-300">
                                                    <span className={rental.return_checklist?.[key] ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {rental.return_checklist?.[key] ? '✓' : '✗'}
                                                    </span>{' '}
                                                    {t(`rental.checklist.items.${key}`)}
                                                </li>
                                            ))}
                                        </ul>
                                        {rental.return_notes && <p className="mt-2 text-xs text-gray-500">{rental.return_notes}</p>}
                                        {handoverEvidence.return_photos.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {handoverEvidence.return_photos.map((url) => (
                                                    <a key={url} href={url} target="_blank" rel="noreferrer">
                                                        <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-600" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {handoverEvidence.return_signature_url && (
                                            <img src={handoverEvidence.return_signature_url} alt="" className="mt-3 h-16 rounded-lg border border-gray-200 bg-white dark:border-gray-600" />
                                        )}
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {(rental.extension_requests?.length ?? 0) > 0 && (
                            <SectionCard title={t('rental.sections.extension_requests')}>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {rental.extension_requests!.map((req) => (
                                        <div key={req.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-900 dark:text-white">
                                                        → {req.requested_end_date}
                                                    </span>
                                                    <span className="ml-2 text-gray-400">
                                                        (+{req.estimated_periods} {periodLabel})
                                                    </span>
                                                    {req.channel && (
                                                        <span className="ml-2 text-xs text-gray-400">
                                                            · {t(`rental.channel.${req.channel}`, undefined, req.channel)}
                                                        </span>
                                                    )}
                                                    {req.notes && (
                                                        <p className="mt-1 text-xs text-gray-500">{req.notes}</p>
                                                    )}
                                                </div>
                                                <span className="tabular-nums text-gray-700 dark:text-gray-300">
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
                                                >
                                                    {t('rental.actions.approve', undefined, 'Approve')}
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
                                                >
                                                    {t('rental.actions.reject', undefined, 'Reject')}
                                                </SecondaryButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {rental.extensions.length > 0 && (
                            <SectionCard title={t('rental.sections.extensions')}>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {rental.extensions.map((ext) => (
                                        <div key={ext.id} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                                            <div>
                                                <span className="text-gray-900 dark:text-white">{ext.original_end_date} → {ext.new_end_date}</span>
                                                <span className="ml-2 text-gray-400">(+{ext.extended_periods} {periodLabel})</span>
                                            </div>
                                            <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatMoney(ext.additional_amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {vehicleSwaps.length > 0 && (
                            <SectionCard title={t('rental.sections.vehicle_swaps')}>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {vehicleSwaps.map((swap) => (
                                        <div key={swap.id} className="py-3 text-sm first:pt-0 last:pb-0">
                                            <p className="text-gray-900 dark:text-white">
                                                {swap.from_vehicle} → {swap.to_vehicle}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {swap.swapped_at}
                                                {swap.swapped_by ? ` · ${swap.swapped_by}` : ''}
                                                {swap.odometer_km != null ? ` · ${swap.odometer_km} km` : ''}
                                            </p>
                                            {swap.notes && <p className="mt-1 text-gray-500">{swap.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {addonCharges.length > 0 && (
                            <SectionCard title={t('rental.sections.addons')}>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {addonCharges.map((charge) => (
                                        <div key={charge.id} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                                            <div>
                                                <p className="text-gray-900 dark:text-white">{charge.description}</p>
                                                <p className="text-xs text-gray-400">
                                                    {charge.addon_code
                                                        ? t(`rental.addon.codes.${charge.addon_code}`, undefined, charge.addon_code)
                                                        : t('rental.addon.codes.other')}
                                                    {charge.is_invoiced ? ` · ${t('rental.addon.invoiced')}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatMoney(charge.amount)}</span>
                                                {charge.can_delete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => router.delete(prefixedRoute('rental.addons.destroy', [rental.id, charge.id]), { preserveScroll: true })}
                                                        className="text-xs text-gray-400 hover:text-rose-600"
                                                    >
                                                        {t('rental.actions.remove')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {rental.damages.length > 0 && (
                            <SectionCard title={t('rental.sections.damages')}>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {rental.damages.map((dmg) => (
                                        <div key={dmg.id} className="flex items-start justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                                            <div className="flex flex-1 gap-3">
                                                {dmg.photo_path && (
                                                    <a href={dmg.photo_path} target="_blank" rel="noreferrer" className="shrink-0">
                                                        <img src={dmg.photo_path} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-600" />
                                                    </a>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-gray-900 dark:text-white">{dmg.description}</p>
                                                    <p className="text-xs text-gray-400">{formatDateTimeDmYHi(dmg.reported_at)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="tabular-nums text-rose-600">{formatMoney(dmg.amount)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => router.delete(prefixedRoute('rental.damages.destroy', [rental.id, dmg.id]), { preserveScroll: true })}
                                                    className="text-xs text-gray-400 hover:text-rose-600"
                                                >
                                                    {t('rental.actions.remove')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <SectionCard title={t('rental.sections.timeline')}>
                            <ol className="relative space-y-0 border-l border-gray-200 dark:border-gray-600">
                                {timelineSteps.map((step, i) => (
                                    <li key={i} className="relative mb-5 ml-4 last:mb-0">
                                        <div
                                            className={`absolute -left-[1.4rem] mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-gray-800 ${step.done ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                        />
                                        <p className={`text-sm font-medium ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                            {step.label}
                                        </p>
                                        {step.date && <p className="mt-0.5 text-xs text-gray-400">{step.date}</p>}
                                        {step.by && (
                                            <p className="text-xs text-gray-400">{t('rental.timeline.by', { name: step.by })}</p>
                                        )}
                                    </li>
                                ))}
                                {(rental.status === 'cancelled' || rental.status === 'cancelled_paid') && (
                                    <li className="relative mb-0 ml-4">
                                        <div className="absolute -left-[1.4rem] mt-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-white dark:ring-gray-800" />
                                        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{t('rental.timeline.cancelled')}</p>
                                        {rental.cancelled_reason && (
                                            <p className="mt-0.5 text-xs text-gray-400">{rental.cancelled_reason}</p>
                                        )}
                                    </li>
                                )}
                            </ol>
                        </SectionCard>

                        {rental.notes && (
                            <SectionCard title={t('rental.sections.notes')}>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                    {rental.notes}
                                </p>
                            </SectionCard>
                        )}

                        <SectionCard title={t('rental.sections.quick_facts')} subtitle={t('rental.sections.quick_facts_hint')}>
                            <dl>
                                <DetailRow label={t('rental.fields.code')}>
                                    <span className="font-mono">{rental.code}</span>
                                </DetailRow>
                                <DetailRow label={t('rental.fields.status')}>
                                    <StatusBadge
                                        status={rental.status}
                                        label={t(`rental.status.${rental.status}`, undefined, rental.status)}
                                    />
                                </DetailRow>
                                {rental.confirmed_by && (
                                    <DetailRow label={t('rental.timeline.confirmed')}>{rental.confirmed_by.name}</DetailRow>
                                )}
                                {rental.partner.phone && (
                                    <DetailRow label={t('rental.fields.phone')}>{rental.partner.phone}</DetailRow>
                                )}
                            </dl>
                        </SectionCard>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal show={modal === 'cancel'} onClose={() => setModal(null)}>
                <form onSubmit={submitCancel} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.cancel')}</h2>
                    <InputLabel htmlFor="cancelled_reason" value={`${t('rental.fields.cancel_reason')} *`} />
                    <textarea id="cancelled_reason" rows={3} value={cancelForm.data.cancelled_reason} onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <InputError message={cancelForm.errors.cancelled_reason} className="mt-1" />
                    <label className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            className="mt-0.5 rounded border-gray-300"
                            checked={cancelForm.data.charge_fee}
                            onChange={(e) => cancelForm.setData('charge_fee', e.target.checked)}
                        />
                        <span>{t('rental.modals.cancel_fee_hint')}</span>
                    </label>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('rental.nav.back')}</SecondaryButton>
                        <DangerButton disabled={cancelForm.processing}>
                            {cancelForm.data.charge_fee ? t('rental.actions.cancel_with_fee') : t('rental.actions.cancel_rental')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'no_show'} onClose={() => setModal(null)}>
                <form onSubmit={submitNoShow} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.no_show')}</h2>
                    <InputLabel htmlFor="no_show_reason" value={t('rental.fields.cancel_reason')} />
                    <textarea id="no_show_reason" rows={3} value={noShowForm.data.cancelled_reason} onChange={(e) => noShowForm.setData('cancelled_reason', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <label className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            className="mt-0.5 rounded border-gray-300"
                            checked={noShowForm.data.charge_fee}
                            onChange={(e) => noShowForm.setData('charge_fee', e.target.checked)}
                        />
                        <span>{t('rental.modals.no_show_fee_hint')}</span>
                    </label>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('rental.nav.back')}</SecondaryButton>
                        <DangerButton disabled={noShowForm.processing}>
                            {noShowForm.data.charge_fee ? t('rental.actions.no_show_with_fee') : t('rental.actions.mark_no_show')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'checkout'} onClose={() => setModal(null)}>
                <form onSubmit={submitCheckout} className="flex max-h-[90vh] flex-col p-6">
                    <h2 className="mb-4 shrink-0 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.checkout')}</h2>
                    {depositBlocksCheckout && (
                        <div className="mb-4 shrink-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            {t('rental.errors.checkout_deposit_required')}
                        </div>
                    )}
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                        <div>
                            <InputLabel htmlFor="start_odometer" value={t('rental.fields.start_odometer')} />
                            <TextInput id="start_odometer" type="number" min="0" value={checkoutForm.data.start_odometer} onChange={(e) => checkoutForm.setData('start_odometer', e.target.value)} className="mt-1 w-full" />
                            <InputError message={checkoutForm.errors.start_odometer} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="start_fuel_level" value={t('rental.fields.fuel_level')} />
                            <select
                                id="start_fuel_level"
                                value={checkoutForm.data.start_fuel_level}
                                onChange={(e) => checkoutForm.setData('start_fuel_level', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                {fuelLevels.map((level) => (
                                    <option key={level} value={level}>{t(`rental.fuel.${level}`, undefined, level)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('rental.checklist.checkout')}</p>
                            <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                                {checklistItems.map((key) => (
                                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={!!checkoutForm.data.checkout_checklist[key]}
                                            onChange={(e) => checkoutForm.setData('checkout_checklist', {
                                                ...checkoutForm.data.checkout_checklist,
                                                [key]: e.target.checked,
                                            })}
                                            className="rounded"
                                        />
                                        {t(`rental.checklist.items.${key}`)}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="checkout_notes" value={t('rental.fields.checkout_notes')} />
                            <textarea id="checkout_notes" rows={2} value={checkoutForm.data.checkout_notes} onChange={(e) => checkoutForm.setData('checkout_notes', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <HandoverPhotoPicker
                                id="checkout_photos"
                                label={t('rental.fields.checkout_photos')}
                                value={checkoutForm.data.checkout_photos}
                                onChange={(photos) => checkoutForm.setData('checkout_photos', photos)}
                                error={checkoutForm.errors.checkout_photos}
                            />
                        </div>
                    </div>
                    <div className="mt-4 shrink-0 space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Tanda Tangan Penyewa / Pelanggan */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <InputLabel value="Tanda Tangan Penyewa (Pelanggan) *" />
                                    {pickupCustomerSignatureUrl && (
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            ✓ Terverifikasi Kontrak PWA
                                        </span>
                                    )}
                                </div>
                                {pickupCustomerSignatureUrl ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
                                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                                            ✓ Tanda Tangan Digital PWA Pelanggan Terdaftar
                                        </p>
                                        <img
                                            src={pickupCustomerSignatureUrl}
                                            alt="Tanda Tangan Pelanggan"
                                            className="h-16 max-w-full object-contain mx-auto bg-white p-1 rounded border border-emerald-100 dark:border-emerald-900"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Otomatis digunakan. Gambar di bawah jika ingin memperbarui tanda tangan.
                                        </p>
                                    </div>
                                ) : null}
                                <SignaturePad
                                    className="mt-1"
                                    value={checkoutForm.data.checkout_signature || ''}
                                    onChange={(value) => checkoutForm.setData('checkout_signature', value)}
                                />
                                <InputError message={checkoutForm.errors.checkout_signature} className="mt-1" />
                            </div>

                            {/* Tanda Tangan Staf / Admin (Pihak Penyerah Kendaraan) */}
                            <div className="space-y-1.5">
                                <InputLabel value="Tanda Tangan Staf / Admin (Penyerah Unit) *" />
                                <SignaturePad
                                    className="mt-1"
                                    value={checkoutForm.data.checkout_staff_signature || ''}
                                    onChange={(value) => checkoutForm.setData('checkout_staff_signature', value)}
                                />
                                <InputError message={checkoutForm.errors.checkout_staff_signature} className="mt-1" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                            {depositBlocksCheckout ? (
                                <PrimaryButton
                                    type="button"
                                    onClick={() => {
                                        setModal(null);
                                        action('deposit.receive');
                                    }}
                                >
                                    {t('rental.actions.receive_deposit')}
                                </PrimaryButton>
                            ) : (
                                <PrimaryButton disabled={checkoutForm.processing}>{t('rental.actions.checkout')}</PrimaryButton>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'return'} onClose={() => setModal(null)}>
                <form onSubmit={submitReturn} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.return')}</h2>
                    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                        <div>
                            <InputLabel htmlFor="actual_return_date" value={`${t('rental.fields.return_date')} *`} />
                            <TextInput id="actual_return_date" type="date" value={returnForm.data.actual_return_date} onChange={(e) => returnForm.setData('actual_return_date', e.target.value)} className="mt-1 w-full" />
                            <InputError message={returnForm.errors.actual_return_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="end_odometer" value={t('rental.fields.end_odometer')} />
                            <TextInput id="end_odometer" type="number" min="0" value={returnForm.data.end_odometer} onChange={(e) => returnForm.setData('end_odometer', e.target.value)} className="mt-1 w-full" />
                            <InputError message={returnForm.errors.end_odometer} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="end_fuel_level" value={t('rental.fields.fuel_level')} />
                            <select
                                id="end_fuel_level"
                                value={returnForm.data.end_fuel_level}
                                onChange={(e) => returnForm.setData('end_fuel_level', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                {fuelLevels.map((level) => (
                                    <option key={level} value={level}>{t(`rental.fuel.${level}`, undefined, level)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('rental.checklist.return')}</p>
                            <div className="space-y-1.5">
                                {checklistItems.map((key) => (
                                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={!!returnForm.data.return_checklist[key]}
                                            onChange={(e) => returnForm.setData('return_checklist', {
                                                ...returnForm.data.return_checklist,
                                                [key]: e.target.checked,
                                            })}
                                            className="rounded"
                                        />
                                        {t(`rental.checklist.items.${key}`)}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="return_notes" value={t('rental.fields.return_notes')} />
                            <textarea id="return_notes" rows={2} value={returnForm.data.return_notes} onChange={(e) => returnForm.setData('return_notes', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <HandoverPhotoPicker
                                id="return_photos"
                                label={t('rental.fields.return_photos')}
                                value={returnForm.data.return_photos}
                                onChange={(photos) => returnForm.setData('return_photos', photos)}
                                error={returnForm.errors.return_photos}
                            />
                        </div>
                        <div>
                            <InputLabel value={`${t('rental.fields.signature')} *`} />
                            <SignaturePad
                                className="mt-1"
                                value={returnForm.data.return_signature}
                                onChange={(value) => returnForm.setData('return_signature', value)}
                            />
                            <InputError message={returnForm.errors.return_signature} className="mt-1" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input type="checkbox" checked={returnForm.data.deposit_returned} onChange={(e) => returnForm.setData('deposit_returned', e.target.checked)} className="rounded" />
                            {t('rental.fields.deposit_returned')}
                        </label>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={returnForm.processing}>{t('rental.actions.record_return')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'extend'} onClose={() => setModal(null)}>
                <form onSubmit={submitExtend} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.extend')}</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="new_end_date" value={`${t('rental.fields.new_end_date')} *`} />
                            <TextInput id="new_end_date" type="date" value={extendForm.data.new_end_date} onChange={(e) => extendForm.setData('new_end_date', e.target.value)} className="mt-1 w-full" />
                            <InputError message={extendForm.errors.new_end_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="extend_notes" value={t('rental.fields.notes')} />
                            <textarea id="extend_notes" rows={2} value={extendForm.data.notes} onChange={(e) => extendForm.setData('notes', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={extendForm.processing}>{t('rental.actions.extend')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'swap'} onClose={() => setModal(null)}>
                <form onSubmit={submitSwap} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.swap')}</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="to_vehicle_id" value={`${t('rental.fields.swap_to_vehicle')} *`} />
                            <Select
                                id="to_vehicle_id"
                                options={[
                                    { value: '', label: t('rental.placeholders.select_vehicle') },
                                    ...swapVehicles.map((v) => ({
                                        value: String(v.id),
                                        label: `${v.name} — ${v.plate_number}`,
                                    })),
                                ]}
                                value={swapForm.data.to_vehicle_id}
                                onChange={(value) => swapForm.setData('to_vehicle_id', value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={swapForm.errors.to_vehicle_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="swap_odometer" value={t('rental.fields.swap_odometer')} />
                            <TextInput
                                id="swap_odometer"
                                type="number"
                                min={0}
                                value={swapForm.data.odometer_km}
                                onChange={(e) => swapForm.setData('odometer_km', e.target.value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={swapForm.errors.odometer_km} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="swap_notes" value={t('rental.fields.notes')} />
                            <textarea
                                id="swap_notes"
                                rows={2}
                                value={swapForm.data.notes}
                                onChange={(e) => swapForm.setData('notes', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={swapForm.processing}>{t('rental.actions.swap_vehicle')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'damage'} onClose={() => setModal(null)}>
                <form onSubmit={submitDamage} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.damage')}</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="damage_desc" value={`${t('rental.fields.description')} *`} />
                            <textarea id="damage_desc" rows={2} value={damageForm.data.description} onChange={(e) => damageForm.setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <InputError message={damageForm.errors.description} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="damage_amount" value={`${t('rental.fields.repair_cost')} *`} />
                            <MoneyInput id="damage_amount" value={damageForm.data.amount} onChange={(value) => damageForm.setData('amount', value)} className="mt-1 w-full" />
                            <InputError message={damageForm.errors.amount} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={t('rental.fields.damage_photo')} />
                            <ImageUploader
                                value={damageForm.data.photo_path}
                                onChange={(value) => damageForm.setData('photo_path', value)}
                                className="mt-1"
                            />
                            <InputError message={damageForm.errors.photo_path} className="mt-1" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={damageForm.processing}>{t('rental.actions.save_damage')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'addon'} onClose={() => setModal(null)}>
                <form onSubmit={submitAddon} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.addon')}</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="addon_code" value={`${t('rental.fields.addon_code')} *`} />
                            <Select
                                id="addon_code"
                                className="mt-1 w-full"
                                value={addonForm.data.addon_code}
                                onChange={(value) => addonForm.setData('addon_code', value)}
                                placeholder={t('rental.placeholders.select_addon_code')}
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
                            <InputLabel htmlFor="addon_amount" value={`${t('rental.fields.addon_amount')} *`} />
                            <MoneyInput id="addon_amount" value={addonForm.data.amount} onChange={(value) => addonForm.setData('amount', value)} className="mt-1 w-full" />
                            <InputError message={addonForm.errors.amount} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="addon_desc" value={t('rental.fields.addon_description')} />
                            <TextInput id="addon_desc" value={addonForm.data.description} onChange={(e) => addonForm.setData('description', e.target.value)} className="mt-1 w-full" placeholder={t('rental.placeholders.addon_description')} />
                            <InputError message={addonForm.errors.description} className="mt-1" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={addonForm.processing}>{t('rental.actions.save_addon')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'deposit'} onClose={() => setModal(null)}>
                <form onSubmit={submitDeposit} className="p-6">
                    <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.deposit')}</h2>
                    <p className="mb-4 text-sm text-gray-500">
                        {t('rental.fields.deposit')}: {formatMoney(rental.deposit_amount)}
                    </p>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="deposit_applied" value={t('rental.fields.deposit_applied')} />
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
                            <InputLabel htmlFor="deposit_refunded" value={t('rental.fields.deposit_refunded')} />
                            <MoneyInput
                                id="deposit_refunded"
                                value={depositForm.data.deposit_refunded_amount}
                                onChange={(value) => depositForm.setData('deposit_refunded_amount', value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={depositForm.errors.deposit_refunded_amount} className="mt-1" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={depositForm.processing}>{t('rental.actions.settle_deposit')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {showApproveProofModal && (
                <Modal show onClose={() => setShowApproveProofModal(false)} maxWidth="md">
                    <div className="p-6 space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                    Konfirmasi Persetujuan Bukti Transfer
                                </h2>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                    Apakah Anda yakin ingin menyetujui {Number(rental.deposit_amount) > 0 ? 'pembayaran deposit ini?' : 'pembayaran sewa ini?'}
                                </p>
                            </div>
                        </div>

                        {/* Detail Ringkasan Transfer */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/80 space-y-2 text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500">Kode Reservasi:</span>
                                <span className="font-mono font-bold text-gray-900 dark:text-white">{rental.code}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Pemesan:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{rental.partner?.name || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">{Number(rental.deposit_amount) > 0 ? 'Nominal Deposit:' : 'Nominal Pembayaran Sewa:'}</span>
                                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">{formatMoney(Number(rental.deposit_amount) > 0 ? rental.deposit_amount : rental.total_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Rekening Tujuan:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {rental.depositCompanyBankAccount
                                        ? `${rental.depositCompanyBankAccount.bank_name || ''} - ${rental.depositCompanyBankAccount.account_number || ''}`
                                        : 'Transfer Bank'}
                                </span>
                            </div>
                        </div>

                        {/* List Dampak Aksi */}
                        <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/50 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                            <p className="font-bold mb-1">Dampak setelah bukti transfer disetujui:</p>
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span>Status bukti transfer diubah menjadi <b>Disetujui (Approved)</b></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span>{Number(rental.deposit_amount) > 0 ? 'Pembayaran deposit otomatis dicatat ke sistem akuntansi' : 'Pembayaran sewa otomatis dicatat ke sistem akuntansi'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span>Status reservasi otomatis berubah menjadi <b>Dikonfirmasi (Confirmed)</b></span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
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
                                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                            >
                                {approvingProof ? 'Memproses...' : (Number(rental.deposit_amount) > 0 ? 'Ya, Setujui & Konfirmasi Deposit' : 'Ya, Setujui & Konfirmasi Pembayaran')}
                            </PrimaryButton>
                        </div>
                    </div>
                </Modal>
            )}

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
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                    Tolak Bukti Transfer Deposit
                                </h2>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                    Masukkan alasan penolakan agar pemesan dapat mengunggah kembali bukti transfer yang valid.
                                </p>
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Alasan Penolakan *" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={rejectProofForm.data.rejected_reason}
                                onChange={(e) => rejectProofForm.setData('rejected_reason', e.target.value)}
                                placeholder="Contoh: Bukti transfer tidak terbaca / nominal tidak sesuai"
                                required
                            />
                            <InputError message={rejectProofForm.errors.rejected_reason} className="mt-1" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <SecondaryButton type="button" onClick={() => setShowRejectProofModal(false)}>
                                Batal
                            </SecondaryButton>
                            <DangerButton type="submit" disabled={rejectProofForm.processing}>
                                {rejectProofForm.processing ? 'Menolak...' : 'Tolak Bukti Transfer'}
                            </DangerButton>
                        </div>
                    </form>
                </Modal>
            )}
        </DynamicLayout>
    );
}
