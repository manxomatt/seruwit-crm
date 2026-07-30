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
import { ChangeEvent, FormEventHandler, useState } from 'react';
import RentalNav from '../../../RentalNav';

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
    pickup_location: string | null;
    return_location: string | null;
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
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', confirmed: 'bg-blue-100 text-blue-700',
    active: 'bg-amber-100 text-amber-700', returned: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS: Record<string, string> = {
    none: 'bg-gray-100 text-gray-600',
    draft: 'bg-slate-100 text-slate-700',
    unpaid: 'bg-red-100 text-red-700',
    partial: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
};

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
    canPayDepositOnline = false,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [modal, setModal] = useState<'cancel' | 'checkout' | 'return' | 'extend' | 'damage' | 'addon' | 'deposit' | 'swap' | null>(null);

    const cancelForm = useForm({ cancelled_reason: '' });
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

    const submitCancel: FormEventHandler = (e) => { e.preventDefault(); cancelForm.post(prefixedRoute('rental.cancel', rental.id), { onSuccess: () => setModal(null) }); };
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
    const canReceiveDeposit = depositHeld && !rental.deposit_received_at && (is('confirmed') || is('active') || is('returned'));
    const canSettleDeposit = depositHeld && !!rental.deposit_received_at && (is('returned') || is('completed'));
    const canPrintContract = !is('draft') && !is('cancelled');
    const canPrintHandover = is('active') || is('returned') || is('completed');

    // Mirror trip Show: only refresh while the vehicle is out on an active rental.
    usePoll(20000, { only: ['livePosition'] }, { autoStart: isLiveTracking });

    const live = livePosition ? toLatLng(livePosition.latitude, livePosition.longitude) : null;
    const liveTone = Number(livePosition?.speed_kph ?? 0) > 3 ? 'moving' : 'idle';
    const recordedLabel = livePosition?.recorded_at
        ? formatDateTimeDmYHi(livePosition.recorded_at)
        : null;

    const periodLabel = t(`rental.period_type.${rental.period_type}`, undefined, rental.period_type);

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
                    <div className="flex items-center gap-3">
                        <h2 className="font-mono text-xl font-semibold text-gray-800">{rental.code}</h2>
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[rental.status]}`}>
                            {t(`rental.status.${rental.status}`, undefined, rental.status)}
                        </span>
                        {rental.is_overdue && (
                            <span className="inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                {t('rental.status.overdue')}
                            </span>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={t('rental.pages.show.title', { code: rental.code })} />

            <RentalNav />

            <div className="mb-6 flex flex-wrap justify-end gap-2">
                        {canPrintContract && (
                            <a href={prefixedRoute('rental.pdf.contract', rental.id)} target="_blank" rel="noreferrer">
                                <SecondaryButton type="button">{t('rental.actions.print_contract')}</SecondaryButton>
                            </a>
                        )}
                        {canPrintHandover && (
                            <a href={prefixedRoute('rental.pdf.handover', rental.id)} target="_blank" rel="noreferrer">
                                <SecondaryButton type="button">{t('rental.actions.print_handover')}</SecondaryButton>
                            </a>
                        )}
                        {(is('draft') || is('confirmed')) && (
                            <Link href={prefixedRoute('rental.edit', rental.id)}>
                                <SecondaryButton>{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        {is('draft') && <PrimaryButton onClick={() => action('confirm')}>{t('rental.actions.confirm')}</PrimaryButton>}
                        {canPayDepositOnline && (
                            <SecondaryButton onClick={() => action('deposit.pay_online')}>{t('receivables.gateway.pay_deposit')}</SecondaryButton>
                        )}
                        {is('confirmed') && (
                            <>
                                {canReceiveDeposit && (
                                    <SecondaryButton onClick={() => action('deposit.receive')}>{t('rental.actions.receive_deposit')}</SecondaryButton>
                                )}
                                <SecondaryButton onClick={() => setModal('addon')}>{t('rental.actions.add_addon')}</SecondaryButton>
                                <PrimaryButton onClick={() => setModal('checkout')}>{t('rental.actions.checkout')}</PrimaryButton>
                            </>
                        )}
                        {is('active') && (
                            <>
                                {canReceiveDeposit && (
                                    <SecondaryButton onClick={() => action('deposit.receive')}>{t('rental.actions.receive_deposit')}</SecondaryButton>
                                )}
                                <SecondaryButton onClick={() => setModal('extend')}>{t('rental.actions.extend')}</SecondaryButton>
                                <SecondaryButton onClick={() => setModal('swap')}>{t('rental.actions.swap_vehicle')}</SecondaryButton>
                                <SecondaryButton onClick={() => setModal('addon')}>{t('rental.actions.add_addon')}</SecondaryButton>
                                <SecondaryButton onClick={() => setModal('damage')}>{t('rental.actions.add_damage')}</SecondaryButton>
                                <PrimaryButton onClick={() => setModal('return')}>{t('rental.actions.return')}</PrimaryButton>
                            </>
                        )}
                        {is('returned') && (
                            <>
                                {canReceiveDeposit && (
                                    <SecondaryButton onClick={() => action('deposit.receive')}>{t('rental.actions.receive_deposit')}</SecondaryButton>
                                )}
                                <SecondaryButton onClick={() => setModal('addon')}>{t('rental.actions.add_addon')}</SecondaryButton>
                                <SecondaryButton onClick={() => setModal('damage')}>{t('rental.actions.add_damage')}</SecondaryButton>
                                {canSettleDeposit && (
                                    <SecondaryButton onClick={() => setModal('deposit')}>{t('rental.actions.settle_deposit')}</SecondaryButton>
                                )}
                                <PrimaryButton onClick={() => action('complete')}>{t('rental.actions.complete')}</PrimaryButton>
                            </>
                        )}
                        {is('completed') && canSettleDeposit && (
                            <SecondaryButton onClick={() => setModal('deposit')}>{t('rental.actions.settle_deposit')}</SecondaryButton>
                        )}
                        {(is('draft') || is('confirmed')) && (
                            <DangerButton onClick={() => setModal('cancel')}>{t('common.cancel')}</DangerButton>
                        )}
            </div>

                {/* Vehicle position — primary visual while the unit is out */}
                <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-gray-700">
                                {isLiveTracking && live
                                    ? t('rental.sections.live_location')
                                    : t('rental.sections.last_location')}
                            </h2>
                            {isLiveTracking && live && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    {t('rental.tracking.live')}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {live && (
                                <p className="text-xs text-gray-500">
                                    {formatSpeedKph(livePosition?.speed_kph)}
                                    {recordedLabel ? ` — ${t('rental.tracking.last_seen', { time: recordedLabel })}` : ''}
                                </p>
                            )}
                            {trackingEnabled && hasGpsDevice && gpsSummary && (
                                <Link
                                    href={prefixedRoute('tracking.history', {
                                        vehicle_id: rental.vehicle.id,
                                        from: gpsSummary.from,
                                        to: gpsSummary.to,
                                    })}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                                >
                                    {t('rental.tracking.view_trail')}
                                </Link>
                            )}
                        </div>
                    </div>

                    {live ? (
                        <div className="p-4">
                            <LeafletMap bounds={[live]} height="360px">
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
                                <p className="mt-2 text-xs text-gray-400">{t('rental.tracking.hint_active')}</p>
                            )}
                            {gpsSummary && (
                                <div className="mt-3 grid grid-cols-1 gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600 sm:grid-cols-3">
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
                        <div className="px-4 py-10 text-center">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500">
                                {!trackingEnabled
                                    ? t('rental.tracking.unavailable')
                                    : !hasGpsDevice
                                      ? t('rental.tracking.no_device')
                                      : t('rental.tracking.no_fix')}
                            </p>
                            {trackingEnabled && hasGpsDevice && gpsSummary && gpsSummary.points > 0 && (
                                <Link
                                    href={prefixedRoute('tracking.history', {
                                        vehicle_id: rental.vehicle.id,
                                        from: gpsSummary.from,
                                        to: gpsSummary.to,
                                    })}
                                    className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                >
                                    {t('rental.tracking.view_trail')}
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Booking info */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.booking_details')}</h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                <dt className="text-gray-500">{t('rental.fields.vehicle')}</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.vehicle.name} <span className="text-gray-400">({rental.vehicle.plate_number})</span></dd>
                                <dt className="text-gray-500">{t('rental.fields.customer')}</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.partner.name}</dd>
                                {rental.driver && <><dt className="text-gray-500">{t('rental.fields.driver')}</dt><dd className="text-gray-900 dark:text-white">{rental.driver.name}</dd></>}
                                <dt className="text-gray-500">{t('rental.fields.period')}</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.start_date} → {rental.end_date} ({rental.total_periods} {periodLabel})</dd>
                                {rental.actual_return_date && <><dt className="text-gray-500">{t('rental.fields.actual_return')}</dt><dd className="text-gray-900 dark:text-white">{rental.actual_return_date}</dd></>}
                                {rental.pickup_location && <><dt className="text-gray-500">{t('rental.fields.pickup_location')}</dt><dd className="text-gray-900 dark:text-white">{rental.pickup_location}</dd></>}
                                {rental.return_location && <><dt className="text-gray-500">{t('rental.fields.return_location')}</dt><dd className="text-gray-900 dark:text-white">{rental.return_location}</dd></>}
                                {Number(rental.one_way_fee_amount ?? 0) > 0 && (
                                    <>
                                        <dt className="text-gray-500">{t('rental.fields.one_way_fee')}</dt>
                                        <dd className="text-gray-900 dark:text-white">Rp {Number(rental.one_way_fee_amount).toLocaleString('id-ID')}</dd>
                                    </>
                                )}
                                {rental.insurance_package && (
                                    <>
                                        <dt className="text-gray-500">{t('rental.fields.insurance_package')}</dt>
                                        <dd className="text-gray-900 dark:text-white">{rental.insurance_package.name}</dd>
                                    </>
                                )}
                                {rental.fuel_policy_notes && <><dt className="text-gray-500">{t('rental.fields.fuel_policy_notes')}</dt><dd className="text-gray-900 dark:text-white">{rental.fuel_policy_notes}</dd></>}
                            </dl>
                        </div>

                        {/* Pricing */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.pricing_snapshot')}</h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                <dt className="text-gray-500">{t('rental.fields.rate')}</dt>
                                <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.rate_per_period)} / {periodLabel}</dd>
                                {rental.km_limit_per_period && <><dt className="text-gray-500">{t('rental.fields.km_limit')}</dt><dd className="tabular-nums text-gray-900 dark:text-white">{t('rental.rates.km', { km: rental.km_limit_per_period })} / {periodLabel}</dd></>}
                                {rental.excess_km_rate && <><dt className="text-gray-500">{t('rental.fields.excess_km_rate')}</dt><dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.excess_km_rate)} / km</dd></>}
                                {rental.late_fee_per_day && <><dt className="text-gray-500">{t('rental.fields.late_fee_per_day')}</dt><dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.late_fee_per_day)} / day</dd></>}
                                <dt className="text-gray-500">{t('rental.fields.deposit')}</dt>
                                <dd className="tabular-nums text-gray-900 dark:text-white">
                                    {formatMoney(rental.deposit_amount)}{' '}
                                    <span className={`ml-1 text-xs ${rental.deposit_status === 'settled' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {t(`rental.deposit.${rental.deposit_status}`, undefined, rental.deposit_status)}
                                    </span>
                                    {depositHeld && rental.deposit_received_at && (
                                        <span className="ml-1 text-xs text-green-600">{t('rental.deposit.received')}</span>
                                    )}
                                    {depositHeld && !rental.deposit_received_at && (
                                        <span className="ml-1 text-xs text-red-600">{t('rental.deposit.not_received')}</span>
                                    )}
                                </dd>
                                {rental.deposit_status === 'settled' && Number(rental.deposit_amount) > 0 && (
                                    <>
                                        <dt className="text-gray-500">{t('rental.deposit.applied')}</dt>
                                        <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.deposit_applied_amount)}</dd>
                                        <dt className="text-gray-500">{t('rental.deposit.refunded')}</dt>
                                        <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.deposit_refunded_amount)}</dd>
                                    </>
                                )}
                                <dt className="text-gray-500 font-medium">{t('rental.fields.base_amount')}</dt>
                                <dd className="tabular-nums font-medium text-gray-900 dark:text-white">{formatMoney(rental.base_amount)}</dd>
                                {Number(rental.excess_amount) > 0 && (
                                    <>
                                        <dt className="text-gray-500">{t('rental.fields.excess_km', { km: rental.excess_km ?? 0 })}</dt>
                                        <dd className="tabular-nums text-red-600">{formatMoney(rental.excess_amount)}</dd>
                                    </>
                                )}
                                {Number(rental.late_fee_amount) > 0 && (
                                    <>
                                        <dt className="text-gray-500">{t('rental.fields.late_fee', { days: rental.overdue_days ?? 0 })}</dt>
                                        <dd className="tabular-nums text-red-600">{formatMoney(rental.late_fee_amount)}</dd>
                                    </>
                                )}
                                <dt className="border-t border-gray-100 pt-2 text-gray-700 font-semibold dark:border-gray-700">{t('rental.fields.total_amount')}</dt>
                                <dd className="border-t border-gray-100 pt-2 tabular-nums text-gray-900 font-semibold dark:border-gray-700 dark:text-white">{formatMoney(rental.total_amount)}</dd>
                            </dl>
                        </div>

                        {/* Billing */}
                        {invoicingEnabled && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.billing')}</h2>
                                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[payment.status] ?? PAYMENT_COLORS.none}`}>
                                        {t(`rental.payment.${payment.status}`, undefined, payment.status)}
                                    </span>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                    <dt className="text-gray-500">{t('rental.fields.invoiced')}</dt>
                                    <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(payment.total_invoiced)}</dd>
                                    <dt className="text-gray-500">{t('rental.fields.paid')}</dt>
                                    <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(payment.total_paid)}</dd>
                                    <dt className="text-gray-500 font-medium">{t('rental.fields.balance_due')}</dt>
                                    <dd className="tabular-nums font-medium text-gray-900 dark:text-white">{formatMoney(payment.balance_due)}</dd>
                                </dl>
                                {payment.invoices.length > 0 && (
                                    <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                                        {payment.invoices.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
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
                                )}
                            </div>
                        )}

                        {/* Odometer / handover */}
                        {(rental.start_odometer || rental.end_odometer || rental.checkout_checklist || rental.return_checklist) && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.handover')}</h2>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                    {rental.start_odometer != null && (
                                        <>
                                            <dt className="text-gray-500">{t('rental.fields.checkout')}</dt>
                                            <dd className="tabular-nums text-gray-900 dark:text-white">
                                                {t('rental.rates.km', { km: rental.start_odometer.toLocaleString() })}
                                                {rental.start_fuel_level && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        BBM: {t(`rental.fuel.${rental.start_fuel_level}`, undefined, rental.start_fuel_level)}
                                                    </span>
                                                )}
                                            </dd>
                                        </>
                                    )}
                                    {rental.end_odometer != null && (
                                        <>
                                            <dt className="text-gray-500">{t('rental.fields.return')}</dt>
                                            <dd className="tabular-nums text-gray-900 dark:text-white">
                                                {t('rental.rates.km', { km: rental.end_odometer.toLocaleString() })}
                                                {rental.end_fuel_level && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        BBM: {t(`rental.fuel.${rental.end_fuel_level}`, undefined, rental.end_fuel_level)}
                                                    </span>
                                                )}
                                            </dd>
                                        </>
                                    )}
                                </dl>
                                {rental.checkout_checklist && (
                                    <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t('rental.checklist.checkout')}</p>
                                        <ul className="grid gap-1 sm:grid-cols-2">
                                            {checklistItems.map((key) => (
                                                <li key={`out-${key}`} className="text-xs text-gray-700 dark:text-gray-300">
                                                    <span className={rental.checkout_checklist?.[key] ? 'text-green-600' : 'text-red-600'}>
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
                                                        <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {handoverEvidence.checkout_signature_url && (
                                            <img src={handoverEvidence.checkout_signature_url} alt="" className="mt-3 h-16 rounded border border-gray-200 bg-white dark:border-gray-600" />
                                        )}
                                    </div>
                                )}
                                {rental.return_checklist && (
                                    <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t('rental.checklist.return')}</p>
                                        <ul className="grid gap-1 sm:grid-cols-2">
                                            {checklistItems.map((key) => (
                                                <li key={`in-${key}`} className="text-xs text-gray-700 dark:text-gray-300">
                                                    <span className={rental.return_checklist?.[key] ? 'text-green-600' : 'text-red-600'}>
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
                                                        <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {handoverEvidence.return_signature_url && (
                                            <img src={handoverEvidence.return_signature_url} alt="" className="mt-3 h-16 rounded border border-gray-200 bg-white dark:border-gray-600" />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Extensions */}
                        {rental.extensions.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.extensions')}</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {rental.extensions.map((ext) => (
                                        <div key={ext.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                            <div>
                                                <span className="text-gray-900 dark:text-white">{ext.original_end_date} → {ext.new_end_date}</span>
                                                <span className="ml-2 text-gray-400">(+{ext.extended_periods} {periodLabel})</span>
                                            </div>
                                            <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatMoney(ext.additional_amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vehicle swaps */}
                        {vehicleSwaps.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.vehicle_swaps')}</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {vehicleSwaps.map((swap) => (
                                        <div key={swap.id} className="px-4 py-3 text-sm">
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
                            </div>
                        )}

                        {/* Add-ons */}
                        {addonCharges.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.addons')}</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {addonCharges.map((charge) => (
                                        <div key={charge.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
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
                                                        className="text-xs text-gray-400 hover:text-red-600"
                                                    >
                                                        {t('rental.actions.remove')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Damages */}
                        {rental.damages.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.damages')}</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {rental.damages.map((dmg) => (
                                        <div key={dmg.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                                            <div className="flex flex-1 gap-3">
                                                {dmg.photo_path && (
                                                    <a href={dmg.photo_path} target="_blank" rel="noreferrer" className="shrink-0">
                                                        <img src={dmg.photo_path} alt="" className="h-14 w-14 rounded object-cover ring-1 ring-gray-200" />
                                                    </a>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-gray-900 dark:text-white">{dmg.description}</p>
                                                    <p className="text-xs text-gray-400">{formatDateTimeDmYHi(dmg.reported_at)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="tabular-nums text-red-600">{formatMoney(dmg.amount)}</span>
                                                <button
                                                    onClick={() => router.delete(prefixedRoute('rental.damages.destroy', [rental.id, dmg.id]), { preserveScroll: true })}
                                                    className="text-xs text-gray-400 hover:text-red-600"
                                                >
                                                    {t('rental.actions.remove')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column — timeline */}
                    <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.timeline')}</h2>
                            <ol className="relative border-l border-gray-200 dark:border-gray-700">
                                {timelineSteps.map((step, i) => (
                                    <li key={i} className="mb-4 ml-4">
                                        <div className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border ${step.done ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'}`} />
                                        <p className={`text-sm font-medium ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step.label}</p>
                                        {step.date && <p className="text-xs text-gray-400">{step.date}</p>}
                                        {step.by && <p className="text-xs text-gray-400">{t('rental.timeline.by', { name: step.by })}</p>}
                                    </li>
                                ))}
                                {rental.status === 'cancelled' && (
                                    <li className="mb-4 ml-4">
                                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-red-500 bg-red-500" />
                                        <p className="text-sm font-medium text-red-600">{t('rental.timeline.cancelled')}</p>
                                        {rental.cancelled_reason && <p className="text-xs text-gray-400">{rental.cancelled_reason}</p>}
                                    </li>
                                )}
                            </ol>
                        </div>
                        {rental.notes && (
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.notes')}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{rental.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

            {/* Modals */}
            <Modal show={modal === 'cancel'} onClose={() => setModal(null)}>
                <form onSubmit={submitCancel} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.cancel')}</h2>
                    <InputLabel htmlFor="cancelled_reason" value={`${t('rental.fields.cancel_reason')} *`} />
                    <textarea id="cancelled_reason" rows={3} value={cancelForm.data.cancelled_reason} onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <InputError message={cancelForm.errors.cancelled_reason} className="mt-1" />
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('rental.nav.back')}</SecondaryButton>
                        <DangerButton disabled={cancelForm.processing}>{t('rental.actions.cancel_rental')}</DangerButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'checkout'} onClose={() => setModal(null)}>
                <form onSubmit={submitCheckout} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.checkout')}</h2>
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
                        <PrimaryButton disabled={checkoutForm.processing}>{t('rental.actions.checkout')}</PrimaryButton>
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
