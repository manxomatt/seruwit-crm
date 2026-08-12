import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { FormEventHandler, useState } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import {
    type FormData,
    type RateTier,
    type TierFormLabels,
    type TierType,
    tierSummaryLabel,
} from './shared';

export { tierSummaryLabel } from './shared';

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

export interface RateFormProps {
    form: InertiaFormProps<FormData>;
    onSubmit: FormEventHandler;
    onCancel: () => void;
    label: string;
    periodOptions: Array<{ value: string; label: string }>;
    vehicleOptions: Array<{ value: string; label: string }>;
    rentalClassOptions: Array<{ value: string; label: string }>;
    labels: TierFormLabels;
    onUpdateTier: (idx: number, key: keyof RateTier, value: string | boolean) => void;
    onAddTier: (type: TierType) => void;
    onRemoveTier: (idx: number) => void;
}

export default function RateForm(props: RateFormProps): JSX.Element {
    const {
        form,
        onSubmit,
        onCancel,
        label,
        periodOptions,
        vehicleOptions,
        rentalClassOptions,
        labels,
        onUpdateTier,
        onAddTier,
        onRemoveTier,
    } = props;

    const [tierTab, setTierTab] = useState<TierType>('period_volume');
    const periodTiers = form.data.tiers.filter((t) => t.tier_type === 'period_volume');
    const loyaltyTiers = form.data.tiers.filter((t) => t.tier_type === 'loyalty_count');
    const activeTiers = tierTab === 'period_volume' ? periodTiers : loyaltyTiers;

    const thresholdLabelMin =
        tierTab === 'period_volume' ? labels.tierThresholdMin : 'Jumlah Rental Selesai (min)';
    const thresholdLabelMax =
        tierTab === 'period_volume' ? labels.tierThresholdMax : 'Jumlah Rental Selesai (maks)';

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Informasi Dasar Tarif</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <InputLabel htmlFor="name" value={`${labels.rateName} *`} />
                        <TextInput
                            id="name"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={form.errors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="period_type" value={`${labels.periodType} *`} />
                        <Select
                            id="period_type"
                            className="mt-1"
                            value={form.data.period_type}
                            onChange={(value) => form.setData('period_type', value)}
                            options={periodOptions}
                            searchable={false}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="rate_per_period" value={`${labels.ratePerPeriod} *`} />
                        <MoneyInput
                            id="rate_per_period"
                            value={form.data.rate_per_period}
                            onChange={(value) => form.setData('rate_per_period', value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={form.errors.rate_per_period} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="min_periods" value={labels.minPeriods} />
                        <TextInput
                            id="min_periods"
                            type="number"
                            min="1"
                            value={form.data.min_periods}
                            onChange={(e) => form.setData('min_periods', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={form.errors.min_periods} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="deposit_amount" value={labels.deposit} />
                        <MoneyInput
                            id="deposit_amount"
                            value={form.data.deposit_amount}
                            onChange={(value) => form.setData('deposit_amount', value)}
                            className="mt-1 w-full"
                        />
                        <p className="mt-1 text-xs text-gray-500">Set ke Rp 0 jika tarif ini tanpa deposit.</p>
                    </div>
                    <div>
                        <InputLabel htmlFor="vehicle_id" value={labels.specificVehicle} />
                        <Select
                            id="vehicle_id"
                            className="mt-1"
                            value={form.data.vehicle_id}
                            onChange={(value) => form.setData('vehicle_id', value)}
                            placeholder={labels.anyVehicle}
                            options={vehicleOptions}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="rental_class" value={labels.rentalClass} />
                        <Select
                            id="rental_class"
                            className="mt-1"
                            value={form.data.rental_class}
                            onChange={(value) => form.setData('rental_class', value)}
                            placeholder={labels.anyClass}
                            options={rentalClassOptions}
                        />
                        <InputError message={form.errors.rental_class} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="vehicle_type" value={labels.vehicleType} />
                        <TextInput
                            id="vehicle_type"
                            value={form.data.vehicle_type}
                            onChange={(e) => form.setData('vehicle_type', e.target.value)}
                            className="mt-1 w-full"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="priority" value={labels.priority} />
                        <TextInput
                            id="priority"
                            type="number"
                            min="0"
                            value={form.data.priority}
                            onChange={(e) => form.setData('priority', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={form.errors.priority} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="valid_from" value={labels.validFrom} />
                        <TextInput
                            id="valid_from"
                            type="date"
                            value={form.data.valid_from}
                            onChange={(e) => form.setData('valid_from', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={form.errors.valid_from} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="valid_to" value={labels.validTo} />
                        <TextInput
                            id="valid_to"
                            type="date"
                            value={form.data.valid_to}
                            onChange={(e) => form.setData('valid_to', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={form.errors.valid_to} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="km_limit" value={labels.kmLimit} />
                        <TextInput
                            id="km_limit"
                            type="number"
                            min="0"
                            value={form.data.km_limit_per_period}
                            onChange={(e) => form.setData('km_limit_per_period', e.target.value)}
                            className="mt-1 w-full"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="excess_km_rate" value={labels.excessKmRate} />
                        <MoneyInput
                            id="excess_km_rate"
                            value={form.data.excess_km_rate}
                            onChange={(value) => form.setData('excess_km_rate', value)}
                            className="mt-1 w-full"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="late_fee_per_day" value={labels.lateFeePerDay} />
                        <MoneyInput
                            id="late_fee_per_day"
                            value={form.data.late_fee_per_day}
                            onChange={(value) => form.setData('late_fee_per_day', value)}
                            className="mt-1 w-full"
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                className="rounded"
                            />
                            {labels.rateActive}
                        </label>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <h3 className="text-sm font-semibold text-gray-800">{labels.tiersHead}</h3>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                            {form.data.tiers.length} tiers
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">{labels.tierLegend}</div>
                </div>

                <div className="flex gap-1 border-b border-gray-100 bg-gray-50/70 px-6 pt-3">
                    <button
                        type="button"
                        onClick={() => setTierTab('period_volume')}
                        className={`-mb-px border-b-2 px-4 py-2 text-xs font-semibold transition ${
                            tierTab === 'period_volume'
                                ? 'border-indigo-500 text-indigo-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span className="mr-1.5">📅</span>
                        {labels.tierPeriodTab}
                        <span className="ml-1.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                            {periodTiers.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTierTab('loyalty_count')}
                        className={`-mb-px border-b-2 px-4 py-2 text-xs font-semibold transition ${
                            tierTab === 'loyalty_count'
                                ? 'border-indigo-500 text-indigo-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span className="mr-1.5">⭐</span>
                        {labels.tierLoyaltyTab}
                        <span className="ml-1.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                            {loyaltyTiers.length}
                        </span>
                    </button>
                </div>

                <div className="space-y-3 px-6 py-5">
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4 text-[11px] leading-relaxed text-indigo-900 md:grid-cols-3">
                        <div>
                            <p className="font-semibold text-indigo-800">{labels.tierLegendPeriod}</p>
                            <p className="text-indigo-700/80">
                                Diskon/rate khusus jika jumlah periode sewa mencapai batas tier ini (misal: 4+ hari).
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-indigo-800">{labels.tierLegendLoyalty}</p>
                            <p className="text-indigo-700/80">
                                Diskon khusus customer loyal — hanya hitung rental status COMPLETED dengan rental_class SAMA.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-indigo-800">{labels.tierLegendPriority}</p>
                            <p className="text-indigo-700/80">
                                Modifier priority: <b>Fixed Rate</b> tertinggi → lalu <b>Percent %</b> → terakhir <b>Flat Rp</b>.
                                Kedua tipe tier (Period + Loyalty) saling bertumpuk (stacked).
                            </p>
                        </div>
                    </div>

                    {activeTiers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center">
                            <div className="mb-2 rounded-full bg-gray-100 p-3">
                                <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 7h-9M14 17H5M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500">{labels.tierEmpty}</p>
                            <p className="mt-1 text-xs text-gray-400">
                                {tierTab === 'period_volume'
                                    ? 'Misal sewa ≥4 hari harga per hari menjadi lebih murah'
                                    : 'Misal customer selesai rental ke-3 diskon otomatis selamanya'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeTiers.map((tier, localIdx) => {
                                const sameTypeList = form.data.tiers.filter((x) => x.tier_type === tier.tier_type);
                                const globalIdx = form.data.tiers.findIndex((t) => t === sameTypeList[localIdx]);
                                const actualIdx = globalIdx === -1 ? localIdx : globalIdx;
                                const hasFixed = String(tier.rate_per_period || '').trim() !== '';
                                const hasPercent = String(tier.discount_percent || '').trim() !== '';
                                const hasFlat = String(tier.discount_flat || '').trim() !== '';
                                return (
                                    <div
                                        key={localIdx}
                                        className={`rounded-xl border shadow-sm ${
                                            tier.is_active
                                                ? 'border-gray-200 bg-white'
                                                : 'border-gray-200 bg-gray-50 opacity-70'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-bold text-white">
                                                    {localIdx + 1}
                                                </span>
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {labels.tierPreview}:
                                                </span>
                                                <code className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-800">
                                                    {tierSummaryLabel(tier)}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={tier.is_active}
                                                        onChange={(e) => onUpdateTier(actualIdx, 'is_active', e.target.checked)}
                                                        className="h-3.5 w-3.5 rounded"
                                                    />
                                                    {labels.tierActive}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveTier(actualIdx)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50"
                                                >
                                                    <TrashIcon />
                                                    <span>{labels.tierDelete}</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-6">
                                            <div className="md:col-span-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <InputLabel value={thresholdLabelMin} className="mb-1 text-[11px]" />
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            value={tier.min_threshold}
                                                            onChange={(e) =>
                                                                onUpdateTier(actualIdx, 'min_threshold', e.target.value)
                                                            }
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value={thresholdLabelMax} className="mb-1 text-[11px]" />
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            placeholder={labels.tierUnlimited}
                                                            value={tier.max_threshold}
                                                            onChange={(e) =>
                                                                onUpdateTier(actualIdx, 'max_threshold', e.target.value)
                                                            }
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <InputLabel value={labels.modifierFixed} className="mb-1 text-[11px]" />
                                                <MoneyInput
                                                    value={tier.rate_per_period}
                                                    onChange={(v) => onUpdateTier(actualIdx, 'rate_per_period', v)}
                                                    className={`w-full ${hasFixed ? 'ring-2 ring-emerald-200' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value={labels.modifierPercent} className="mb-1 text-[11px]" />
                                                <div className="relative">
                                                    <TextInput
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={tier.discount_percent}
                                                        onChange={(e) =>
                                                            onUpdateTier(actualIdx, 'discount_percent', e.target.value)
                                                        }
                                                        className={`w-full pr-7 ${hasPercent ? 'ring-2 ring-sky-200' : ''}`}
                                                    />
                                                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-gray-400">
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <InputLabel value={labels.modifierFlat} className="mb-1 text-[11px]" />
                                                <MoneyInput
                                                    value={tier.discount_flat}
                                                    onChange={(v) => onUpdateTier(actualIdx, 'discount_flat', v)}
                                                    className={`w-full ${hasFlat ? 'ring-2 ring-amber-200' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value={labels.tierPriority} className="mb-1 text-[11px]" />
                                                <TextInput
                                                    type="number"
                                                    min="0"
                                                    max="999"
                                                    value={tier.priority}
                                                    onChange={(e) => onUpdateTier(actualIdx, 'priority', e.target.value)}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                        {!hasFixed && !hasPercent && !hasFlat && (
                                            <div className="border-t border-red-100 bg-red-50/60 px-4 py-2 text-[11px] text-red-700">
                                                ⚠ Pilih setidaknya SATU modifier: Fixed Rate / Percent / Flat
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex items-center justify-center pt-1">
                        <button
                            type="button"
                            onClick={() => onAddTier(tierTab)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            {labels.tierAdd}{' '}
                            {tierTab === 'period_volume' ? labels.tierPeriodTab : labels.tierLoyaltyTab}
                        </button>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                <SecondaryButton type="button" onClick={onCancel}>
                    {labels.cancel}
                </SecondaryButton>
                <PrimaryButton disabled={form.processing}>
                    {form.processing ? 'Menyimpan...' : label}
                </PrimaryButton>
            </div>
        </form>
    );
}
