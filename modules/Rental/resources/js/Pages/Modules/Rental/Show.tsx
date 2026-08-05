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
import { formatDateTimeDmYHi } from '@/utils/date';
import { formatSpeedKph, toLatLng } from '@/utils/geo';
import { Head, Link, router, useForm, usePoll } from '@inertiajs/react';
import { ChangeEvent, FormEventHandler, useEffect, useState } from 'react';
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

async function filesToDataUrls(files: FileList | null): Promise<string[]> {
    if (! files || files.length === 0) {
        return [];
    }

    const urls: string[] = [];
    for (const file of Array.from(files)) {
        urls.push(await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }));
    }

    return urls;
}

interface Extension { id: number; original_end_date: string; new_end_date: string; extended_periods: number; additional_amount: string; notes: string | null; }
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
    vehicle: { id: number; name: string; plate_number: string; type: string; status: string; };
    partner: { id: number; name: string; code: string; phone: string | null; };
    driver: { id: number; name: string; phone: string | null; } | null;
    confirmed_by: { id: number; name: string; } | null;
    extensions: Extension[];
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
    gatewayEnabled?: boolean;
    canPayDepositOnline?: boolean;
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
    canPayDepositOnline = false,
    postConfirm = { visible: false, current_step: null, steps: [] },
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [modal, setModal] = useState<'confirm' | 'cancel' | 'no_show' | 'checkout' | 'return' | 'extend' | 'damage' | 'addon' | 'deposit' | 'swap' | null>(null);
    const [confirming, setConfirming] = useState(false);
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

    const cancelForm = useForm({ cancelled_reason: '', charge_fee: false as boolean });
    const noShowForm = useForm({ cancelled_reason: '', charge_fee: false as boolean });
    const checkoutForm = useForm({
        start_odometer: '',
        start_fuel_level: 'full',
        checkout_checklist: emptyChecklist(checklistItems),
        checkout_notes: '',
        checkout_photos: [] as string[],
        checkout_signature: null as string | null,
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

    const submitConfirm = (depositCollected: boolean) => {
        setConfirming(true);
        router.post(
            prefixedRoute('rental.confirm', rental.id),
            depositCollected
                ? { deposit_collected: true, payment_method: 'cash' }
                : {},
            {
                preserveScroll: true,
                onFinish: () => setConfirming(false),
                onSuccess: () => setModal(null),
            },
        );
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
    const canReceiveDeposit = depositHeld && !rental.deposit_received_at && (is('pending') || is('pending_reserved') || is('confirmed') || is('active') || is('returned'));
    const canSettleDeposit = depositHeld && !!rental.deposit_received_at && (is('returned') || is('completed'));
    const depositBlocksCheckout = is('confirmed') && depositHeld && !rental.deposit_received_at;
    const canPrintContract = is('confirmed') || is('active') || is('returned') || is('completed');
    const canConfirm = is('draft') || is('pending') || is('pending_reserved');
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

                        {/* Toolbar */}
                        <div className="flex shrink-0 flex-col items-stretch gap-2 lg:items-end">
                            <div className="flex flex-nowrap items-center justify-end gap-2 overflow-x-auto">
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
                            </div>

                            <div className="flex flex-nowrap items-center justify-end gap-2 overflow-x-auto">
                                {(is('draft') || is('pending') || is('pending_reserved') || is('confirmed')) && (
                                    <Link href={prefixedRoute('rental.edit', rental.id)} className="shrink-0">
                                        <SecondaryButton>{t('common.edit')}</SecondaryButton>
                                    </Link>
                                )}
                                {is('confirmed') && (
                                    <DangerButton className="shrink-0" onClick={() => setModal('no_show')}>
                                        {t('rental.actions.mark_no_show')}
                                    </DangerButton>
                                )}
                                {canCancel && (
                                    <DangerButton className="shrink-0" onClick={() => setModal('cancel')}>
                                        {t('common.cancel')}
                                    </DangerButton>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2">
                                {canConfirm && (
                                    <PrimaryButton onClick={() => setModal('confirm')}>
                                        {t('rental.actions.confirm')}
                                    </PrimaryButton>
                                )}
                                {!postConfirm.visible && canPayDepositOnline && (
                                    <SecondaryButton onClick={() => action('deposit.pay_online')}>
                                        {t('receivables.gateway.pay_deposit')}
                                    </SecondaryButton>
                                )}
                                {!postConfirm.visible && is('confirmed') && (
                                    <>
                                        {canReceiveDeposit && (
                                            <PrimaryButton onClick={() => action('deposit.receive')}>
                                                {t('rental.actions.receive_deposit')}
                                            </PrimaryButton>
                                        )}
                                        <PrimaryButton
                                            onClick={() => setModal('checkout')}
                                            disabled={depositBlocksCheckout}
                                            title={depositBlocksCheckout ? t('rental.errors.checkout_deposit_required') : undefined}
                                            className={depositBlocksCheckout ? 'opacity-50' : undefined}
                                        >
                                            {t('rental.actions.checkout')}
                                        </PrimaryButton>
                                    </>
                                )}
                                {!postConfirm.visible && is('active') && (
                                    <>
                                        <SecondaryButton onClick={() => setModal('extend')}>{t('rental.actions.extend')}</SecondaryButton>
                                        <PrimaryButton onClick={() => setModal('return')}>{t('rental.actions.return')}</PrimaryButton>
                                    </>
                                )}
                                {!postConfirm.visible && is('returned') && (
                                    <PrimaryButton onClick={() => action('complete')}>{t('rental.actions.complete')}</PrimaryButton>
                                )}
                                {canMarkFeePaid && (
                                    <SecondaryButton onClick={() => action('mark_fee_paid')}>{t('rental.actions.mark_fee_paid')}</SecondaryButton>
                                )}
                            </div>
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
                        <p className="font-medium">{t('rental.errors.checkout_deposit_required')}</p>
                        <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                            {t('rental.modals.confirm_deposit_body', {
                                code: rental.code,
                                amount: formatMoney(rental.deposit_amount),
                            })}
                        </p>
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
                                    <span className="tabular-nums">
                                        {formatMoney(rental.rate_per_period)} / {periodLabel}
                                    </span>
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
                                            className={`absolute -left-[1.4rem] mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-gray-800 ${
                                                step.done ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
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
            <Modal show={modal === 'confirm'} onClose={() => !confirming && setModal(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('rental.modals.confirm')}
                    </h2>

                    {needsDepositOnConfirm ? (
                        <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <p>
                                {t('rental.modals.confirm_deposit_body', {
                                    code: rental.code,
                                    amount: formatMoney(rental.deposit_amount),
                                })}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                {t('rental.modals.confirm_deposit_hint')}
                            </p>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                            {t('rental.modals.confirm_body', { code: rental.code })}
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setModal(null)}
                            disabled={confirming}
                        >
                            {t('rental.nav.back')}
                        </SecondaryButton>
                        {needsDepositOnConfirm ? (
                            <>
                                <SecondaryButton
                                    type="button"
                                    onClick={() => submitConfirm(false)}
                                    disabled={confirming}
                                >
                                    {t('rental.actions.pay_deposit_later')}
                                </SecondaryButton>
                                <PrimaryButton
                                    type="button"
                                    onClick={() => submitConfirm(true)}
                                    disabled={confirming}
                                >
                                    {confirming
                                        ? t('rental.actions.confirming')
                                        : t('rental.actions.deposit_collected')}
                                </PrimaryButton>
                            </>
                        ) : (
                            <PrimaryButton
                                type="button"
                                onClick={() => submitConfirm(false)}
                                disabled={confirming}
                            >
                                {confirming
                                    ? t('rental.actions.confirming')
                                    : t('rental.actions.confirm_rental')}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </Modal>

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
                <form onSubmit={submitCheckout} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.checkout')}</h2>
                    {checkoutForm.errors.deposit && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                            {checkoutForm.errors.deposit}
                        </div>
                    )}
                    {depositBlocksCheckout && (
                        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            {t('rental.errors.checkout_deposit_required')}
                        </div>
                    )}
                    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
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
                            <div className="space-y-1.5">
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
                            <InputLabel htmlFor="checkout_photos" value={`${t('rental.fields.checkout_photos')} *`} />
                            <input
                                id="checkout_photos"
                                type="file"
                                accept="image/*"
                                multiple
                                className="mt-1 block w-full text-sm text-gray-600 dark:text-gray-300"
                                onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                                    checkoutForm.setData('checkout_photos', await filesToDataUrls(e.target.files));
                                }}
                            />
                            <InputError message={checkoutForm.errors.checkout_photos} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={`${t('rental.fields.signature')} *`} />
                            <SignaturePad
                                className="mt-1"
                                value={checkoutForm.data.checkout_signature}
                                onChange={(value) => checkoutForm.setData('checkout_signature', value)}
                            />
                            <InputError message={checkoutForm.errors.checkout_signature} className="mt-1" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
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
                            <InputLabel htmlFor="return_photos" value={`${t('rental.fields.return_photos')} *`} />
                            <input
                                id="return_photos"
                                type="file"
                                accept="image/*"
                                multiple
                                className="mt-1 block w-full text-sm text-gray-600 dark:text-gray-300"
                                onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                                    returnForm.setData('return_photos', await filesToDataUrls(e.target.files));
                                }}
                            />
                            <InputError message={returnForm.errors.return_photos} className="mt-1" />
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
                                onChange={(e) => swapForm.setData('to_vehicle_id', e.target.value)}
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
                            <InputLabel value={`${t('rental.fields.addon_code')} *`} />
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={addonForm.data.addon_code}
                                onChange={(e) => addonForm.setData('addon_code', e.target.value)}
                            >
                                {addonCodes.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
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
        </DynamicLayout>
    );
}
