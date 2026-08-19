import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { FormEventHandler, useMemo, useState } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import {
    type FormData,
    type RateTier,
    type TierFormLabels,
    type TierType,
    tierSummaryLabel,
} from './shared';

export { tierSummaryLabel } from './shared';

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

    // Scope selection: 'all' | 'class' | 'vehicle'
    const initialScope = form.data.vehicle_id
        ? 'vehicle'
        : form.data.rental_class
            ? 'class'
            : 'all';

    const [scopeType, setScopeType] = useState<'all' | 'class' | 'vehicle'>(initialScope);
    const [tierTab, setTierTab] = useState<TierType>('period_volume');

    const handleScopeChange = (newScope: 'all' | 'class' | 'vehicle') => {
        setScopeType(newScope);
        if (newScope === 'all') {
            form.setData({
                ...form.data,
                vehicle_id: '',
                rental_class: '',
            });
        } else if (newScope === 'class') {
            form.setData({
                ...form.data,
                vehicle_id: '',
            });
        } else if (newScope === 'vehicle') {
            form.setData({
                ...form.data,
                rental_class: '',
            });
        }
    };

    const periodTiers = form.data.tiers.filter((t) => t.tier_type === 'period_volume');
    const loyaltyTiers = form.data.tiers.filter((t) => t.tier_type === 'loyalty_count');
    const activeTiers = tierTab === 'period_volume' ? periodTiers : loyaltyTiers;

    const baseRate = Number(form.data.rate_per_period) || 0;
    const periodLabel = form.data.period_type === 'daily'
        ? 'Hari'
        : form.data.period_type === 'weekly'
            ? 'Minggu'
            : 'Bulan';

    // Live preview simulations
    const simulatedEstimates = useMemo(() => {
        if (baseRate <= 0) return null;
        if (form.data.period_type === 'daily') {
            return [
                { periods: 1, label: '1 Hari (Standar)', amount: baseRate },
                { periods: 3, label: '3 Hari (Weekend)', amount: baseRate * 3 },
                { periods: 7, label: '7 Hari (Mingguan)', amount: baseRate * 7 },
                { periods: 30, label: '30 Hari (Bulanan)', amount: baseRate * 30 },
            ];
        }
        if (form.data.period_type === 'weekly') {
            return [
                { periods: 1, label: '1 Minggu', amount: baseRate },
                { periods: 2, label: '2 Minggu', amount: baseRate * 2 },
                { periods: 4, label: '4 Minggu (~1 Bulan)', amount: baseRate * 4 },
            ];
        }
        return [
            { periods: 1, label: '1 Bulan', amount: baseRate },
            { periods: 3, label: '3 Bulan (Triwulan)', amount: baseRate * 3 },
            { periods: 6, label: '6 Bulan (Semester)', amount: baseRate * 6 },
            { periods: 12, label: '1 Tahun (Tahunan)', amount: baseRate * 12 },
        ];
    }, [baseRate, form.data.period_type]);

    return (
        <form onSubmit={onSubmit} className="space-y-6 pb-24">
            {/* 1. Target Kendaraan & Identitas Tarif */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        1
                    </span>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            Identitas Tarif & Cakupan Kendaraan
                        </h3>
                        <p className="text-xs text-slate-500">
                            Tentukan nama tarif dan untuk kendaraan mana saja tarif ini akan berlaku secara otomatis.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Nama Tarif */}
                    <div>
                        <InputLabel htmlFor="name" value={`${labels.rateName} *`} />
                        <TextInput
                            id="name"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="Contoh: Tarif Harian Standar Avanza, Promo Akhir Pekan, Tarif Korporat"
                            className="mt-1.5 w-full !rounded-2xl font-bold shadow-2xs"
                            required
                        />
                        <InputError message={form.errors.name} className="mt-1" />
                    </div>

                    {/* Scope Selector Pills */}
                    <div>
                        <InputLabel value="Cakupan Penerapan Tarif *" />
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {/* Option 1: Global */}
                            <button
                                type="button"
                                onClick={() => handleScopeChange('all')}
                                className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                                    scopeType === 'all'
                                        ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/40'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                                    <span className="text-base">🌐</span>
                                    <span>Semua Armada (Global)</span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    Berlaku umum untuk semua mobil yang tidak punya tarif khusus.
                                </p>
                            </button>

                            {/* Option 2: By Rental Class */}
                            <button
                                type="button"
                                onClick={() => handleScopeChange('class')}
                                className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                                    scopeType === 'class'
                                        ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/40'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                                    <span className="text-base">🏷️</span>
                                    <span>Berdasarkan Kelas Rental</span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    Berlaku untuk semua armada dalam kategori/kelas yang sama (misal: SUV, MPV).
                                </p>
                            </button>

                            {/* Option 3: By Specific Vehicle */}
                            <button
                                type="button"
                                onClick={() => handleScopeChange('vehicle')}
                                className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                                    scopeType === 'vehicle'
                                        ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/40'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                                    <span className="text-base">🚗</span>
                                    <span>Kendaraan Spesifik</span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    Berlaku eksklusif hanya untuk satu nomor polisi unit tertentu.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Scope Conditional Inputs */}
                    {scopeType === 'class' && (
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                            <InputLabel htmlFor="rental_class" value={`${labels.rentalClass} *`} />
                            <Select
                                id="rental_class"
                                className="mt-1.5"
                                value={form.data.rental_class}
                                onChange={(value) => form.setData('rental_class', value)}
                                placeholder="Pilih Kelas Rental (MPV, SUV, Sedan, Van, dll.)"
                                options={rentalClassOptions}
                            />
                            <InputError message={form.errors.rental_class} className="mt-1" />
                        </div>
                    )}

                    {scopeType === 'vehicle' && (
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                            <InputLabel htmlFor="vehicle_id" value={`${labels.specificVehicle} *`} />
                            <Select
                                id="vehicle_id"
                                className="mt-1.5"
                                value={form.data.vehicle_id}
                                onChange={(value) => form.setData('vehicle_id', value)}
                                placeholder="Cari nama mobil atau nomor plat..."
                                options={vehicleOptions}
                            />
                            <InputError message={form.errors.vehicle_id} className="mt-1" />
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Skema Tarif Pokok & Deposit */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        2
                    </span>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            Skema Tarif Pokok & Deposit Jaminan
                        </h3>
                        <p className="text-xs text-slate-500">
                            Tentukan harga dasar sewa per periode, batas minimal sewa, dan nominal uang jaminan.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Inputs (7 cols) */}
                    <div className="space-y-4 lg:col-span-7">
                        {/* Period Type Segment Selector */}
                        <div>
                            <InputLabel value={`${labels.periodType} *`} />
                            <div className="mt-1.5 grid grid-cols-3 gap-2">
                                {periodOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => form.setData('period_type', opt.value)}
                                        className={`rounded-2xl border px-3 py-2.5 text-xs font-bold transition ${
                                            form.data.period_type === opt.value
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {opt.value === 'daily' ? '📅 ' : opt.value === 'weekly' ? '📆 ' : '🗓️ '}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rate Per Period */}
                        <div>
                            <InputLabel htmlFor="rate_per_period" value={`Harga Sewa Pokok (Rp / ${periodLabel}) *`} />
                            <div className="mt-1.5">
                                <MoneyInput
                                    id="rate_per_period"
                                    value={form.data.rate_per_period}
                                    onChange={(value) => form.setData('rate_per_period', value)}
                                    className="w-full !rounded-2xl font-mono text-base font-bold shadow-2xs"
                                    placeholder="0"
                                />
                            </div>
                            <InputError message={form.errors.rate_per_period} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Min Periods */}
                            <div>
                                <InputLabel htmlFor="min_periods" value={labels.minPeriods} />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="min_periods"
                                        type="number"
                                        min="1"
                                        value={form.data.min_periods}
                                        onChange={(e) => form.setData('min_periods', e.target.value)}
                                        className="w-full !rounded-2xl pr-16 font-mono font-bold shadow-2xs"
                                        placeholder="1"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-bold text-slate-400">
                                        {periodLabel}
                                    </span>
                                </div>
                                <InputError message={form.errors.min_periods} className="mt-1" />
                            </div>

                            {/* Deposit Amount */}
                            <div>
                                <InputLabel htmlFor="deposit_amount" value={labels.deposit} />
                                <div className="mt-1.5">
                                    <MoneyInput
                                        id="deposit_amount"
                                        value={form.data.deposit_amount}
                                        onChange={(value) => form.setData('deposit_amount', value)}
                                        className="w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="mt-1 text-[11px] text-slate-400">Isi Rp 0 jika tarif ini bebas deposit.</p>
                                <InputError message={form.errors.deposit_amount} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Right Live Simulation Box (5 cols) */}
                    <div className="lg:col-span-5">
                        <div className="h-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850/60 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-slate-300">
                                    <span>💡</span>
                                    <span>Simulasi Estimasi Tarif Pokok:</span>
                                </div>

                                {simulatedEstimates ? (
                                    <div className="mt-3 space-y-2">
                                        {simulatedEstimates.map((sim, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between rounded-xl bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-800"
                                            >
                                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                                    {sim.label}
                                                </span>
                                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                                    {formatMoney(sim.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-6 flex flex-col items-center justify-center text-center text-xs text-slate-400">
                                        <span className="text-2xl mb-1">💰</span>
                                        <span>Masukkan harga sewa pokok di samping untuk melihat simulasi kalkulasi.</span>
                                    </div>
                                )}
                            </div>

                            <p className="mt-4 text-[10px] text-slate-400 leading-tight">
                                * Simulasi belum termasuk diskon bertingkat (tier pricing) atau potongan loyalty pelanggan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Ketentuan Jarak, Denda & Masa Berlaku */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        3
                    </span>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            Ketentuan Jarak, Denda & Masa Berlaku
                        </h3>
                        <p className="text-xs text-slate-500">
                            Aturan batasan kilometer, biaya kelebihan jarak, denda keterlambatan, dan masa aktif tarif.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* KM Limit */}
                    <div>
                        <InputLabel htmlFor="km_limit" value={`Batas Jarak (${labels.kmLimit})`} />
                        <div className="relative mt-1.5">
                            <TextInput
                                id="km_limit"
                                type="number"
                                min="0"
                                value={form.data.km_limit_per_period}
                                onChange={(e) => form.setData('km_limit_per_period', e.target.value)}
                                className="w-full !rounded-2xl pr-14 font-mono font-bold shadow-2xs"
                                placeholder="Unlimited"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-bold text-slate-400">
                                KM
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">Kosongkan jika bebas kilometer (unlimited).</p>
                    </div>

                    {/* Excess KM Rate */}
                    <div>
                        <InputLabel htmlFor="excess_km_rate" value={labels.excessKmRate} />
                        <div className="mt-1.5">
                            <MoneyInput
                                id="excess_km_rate"
                                value={form.data.excess_km_rate}
                                onChange={(value) => form.setData('excess_km_rate', value)}
                                className="w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                placeholder="0"
                            />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">Biaya per kilometer jika melebihi batas.</p>
                    </div>

                    {/* Late Fee */}
                    <div>
                        <InputLabel htmlFor="late_fee_per_day" value={`${labels.lateFeePerDay} *`} />
                        <div className="mt-1.5">
                            <MoneyInput
                                id="late_fee_per_day"
                                value={form.data.late_fee_per_day}
                                onChange={(value) => form.setData('late_fee_per_day', value)}
                                className="w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                placeholder="0"
                            />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">Denda per hari keterlambatan kembali.</p>
                    </div>

                    {/* Valid From */}
                    <div>
                        <InputLabel htmlFor="valid_from" value={labels.validFrom} />
                        <TextInput
                            id="valid_from"
                            type="date"
                            value={form.data.valid_from}
                            onChange={(e) => form.setData('valid_from', e.target.value)}
                            className="mt-1.5 w-full !rounded-2xl font-bold shadow-2xs"
                        />
                        <InputError message={form.errors.valid_from} className="mt-1" />
                    </div>

                    {/* Valid To */}
                    <div>
                        <InputLabel htmlFor="valid_to" value={labels.validTo} />
                        <TextInput
                            id="valid_to"
                            type="date"
                            value={form.data.valid_to}
                            onChange={(e) => form.setData('valid_to', e.target.value)}
                            className="mt-1.5 w-full !rounded-2xl font-bold shadow-2xs"
                        />
                        <InputError message={form.errors.valid_to} className="mt-1" />
                    </div>

                    {/* Priority */}
                    <div>
                        <InputLabel htmlFor="priority" value="Prioritas Aturan (Priority)" />
                        <TextInput
                            id="priority"
                            type="number"
                            min="0"
                            value={form.data.priority}
                            onChange={(e) => form.setData('priority', e.target.value)}
                            className="mt-1.5 w-full !rounded-2xl font-mono font-bold shadow-2xs"
                            placeholder="0"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">Angka lebih tinggi diprioritaskan saat overlap.</p>
                    </div>
                </div>

                {/* Active Status Switch */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-850/60">
                    <label className="flex cursor-pointer items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {labels.rateActive}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Tarif aktif dapat dipilih dan digunakan otomatis dalam kalkulator pemesanan rental.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                            className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                </div>
            </div>

            {/* 4. Diskon Bertingkat (Tier Pricing & Loyalty System) */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                {/* Header & Tabs */}
                <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 text-base font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                4
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {labels.tiersHead}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Diskon otomatis berdasarkan lama sewa (volume) atau jumlah transaksi pelanggan (loyalty).
                                </p>
                            </div>
                        </div>

                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700 ring-1 ring-purple-600/20 dark:bg-purple-950/60 dark:text-purple-300">
                            {form.data.tiers.length} Tier Terdaftar
                        </span>
                    </div>

                    {/* Tab Buttons */}
                    <div className="mt-6 flex gap-2 border-b border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setTierTab('period_volume')}
                            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                                tierTab === 'period_volume'
                                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            <span>📅</span>
                            <span>{labels.tierPeriodTab}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {periodTiers.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTierTab('loyalty_count')}
                            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                                tierTab === 'loyalty_count'
                                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            <span>⭐</span>
                            <span>{labels.tierLoyaltyTab}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {loyaltyTiers.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Tier Content */}
                <div className="p-6 space-y-4">
                    {/* Guidance Alert */}
                    <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
                        {tierTab === 'period_volume' ? (
                            <p>
                                💡 <b>Tier Durasi Sewa:</b> Berlaku jika pelanggan menyewa dalam rentang jumlah periode tertentu (misal sewa <b>≥ 4 {periodLabel}</b> mendapat diskon 10%).
                            </p>
                        ) : (
                            <p>
                                ⭐ <b>Tier Pelanggan Loyal:</b> Berlaku jika customer telah menyelesaikan sejumlah transaksi sewa sebelumnya (misal setelah <b>3x sewa</b> mendapat diskon 5% selamanya).
                            </p>
                        )}
                    </div>

                    {activeTiers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-850/40">
                            <span className="text-3xl mb-2">🎯</span>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{labels.tierEmpty}</p>
                            <p className="mt-1 text-xs text-slate-400 max-w-sm">
                                {tierTab === 'period_volume'
                                    ? `Tambahkan tier agar harga sewa ${periodLabel} menjadi lebih murah untuk durasi yang lebih lama.`
                                    : 'Tambahkan tier loyalty untuk memberikan penghargaan kepada pelanggan setia.'}
                            </p>
                            <button
                                type="button"
                                onClick={() => onAddTier(tierTab)}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700"
                            >
                                ＋ {labels.tierAdd} ({tierTab === 'period_volume' ? 'Periode' : 'Loyalty'})
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                                        className={`overflow-hidden rounded-2xl border shadow-xs transition ${
                                            tier.is_active
                                                ? 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                                                : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-850'
                                        }`}
                                    >
                                        {/* Tier Card Header */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-850/50">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white shadow-2xs">
                                                    {localIdx + 1}
                                                </span>
                                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                    {tierSummaryLabel(tier)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    <input
                                                        type="checkbox"
                                                        checked={tier.is_active}
                                                        onChange={(e) => onUpdateTier(actualIdx, 'is_active', e.target.checked)}
                                                        className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span>{labels.tierActive}</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveTier(actualIdx)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                                                >
                                                    🗑️ {labels.tierDelete}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tier Inputs Grid */}
                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                {/* Min Threshold */}
                                                <div>
                                                    <InputLabel
                                                        value={tierTab === 'period_volume' ? `Min. ${periodLabel}` : 'Min. Selesai Rental'}
                                                        className="mb-1 text-xs"
                                                    />
                                                    <TextInput
                                                        type="number"
                                                        min="0"
                                                        value={tier.min_threshold}
                                                        onChange={(e) => onUpdateTier(actualIdx, 'min_threshold', e.target.value)}
                                                        placeholder="1"
                                                        className="w-full !rounded-xl font-mono font-bold shadow-2xs text-xs"
                                                    />
                                                </div>

                                                {/* Max Threshold */}
                                                <div>
                                                    <InputLabel
                                                        value={tierTab === 'period_volume' ? `Maks. ${periodLabel}` : 'Maks. Selesai Rental'}
                                                        className="mb-1 text-xs"
                                                    />
                                                    <TextInput
                                                        type="number"
                                                        min="0"
                                                        placeholder="Unlimited (∞)"
                                                        value={tier.max_threshold}
                                                        onChange={(e) => onUpdateTier(actualIdx, 'max_threshold', e.target.value)}
                                                        className="w-full !rounded-xl font-mono font-bold shadow-2xs text-xs"
                                                    />
                                                </div>

                                                {/* Modifier: Diskon Persen */}
                                                <div>
                                                    <InputLabel value="Diskon (%)" className="mb-1 text-xs" />
                                                    <div className="relative">
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={tier.discount_percent}
                                                            onChange={(e) => {
                                                                onUpdateTier(actualIdx, 'discount_percent', e.target.value);
                                                                if (e.target.value) {
                                                                    onUpdateTier(actualIdx, 'rate_per_period', '');
                                                                    onUpdateTier(actualIdx, 'discount_flat', '');
                                                                }
                                                            }}
                                                            placeholder="0"
                                                            className={`w-full !rounded-xl pr-7 font-mono font-bold text-xs shadow-2xs ${
                                                                hasPercent ? 'border-sky-500 ring-2 ring-sky-500/20' : ''
                                                            }`}
                                                        />
                                                        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs font-bold text-slate-400">
                                                            %
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Modifier: Fixed Rate */}
                                                <div>
                                                    <InputLabel value={`Fixed Rate (Rp / ${periodLabel})`} className="mb-1 text-xs" />
                                                    <MoneyInput
                                                        value={tier.rate_per_period}
                                                        onChange={(v) => {
                                                            onUpdateTier(actualIdx, 'rate_per_period', v);
                                                            if (v) {
                                                                onUpdateTier(actualIdx, 'discount_percent', '');
                                                                onUpdateTier(actualIdx, 'discount_flat', '');
                                                            }
                                                        }}
                                                        placeholder="0"
                                                        className={`w-full !rounded-xl font-mono font-bold text-xs shadow-2xs ${
                                                            hasFixed ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            {!hasFixed && !hasPercent && !hasFlat && (
                                                <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                                    ⚠️ Masukkan nominal diskon (% / Flat) atau Fixed Rate untuk mengaktifkan tier ini.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => onAddTier(tierTab)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-3 text-xs font-black text-indigo-700 shadow-2xs transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"
                                >
                                    <span>＋</span>
                                    <span>Tambah Tier {tierTab === 'period_volume' ? 'Durasi Sewa' : 'Loyalty'} Lainnya</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/95">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    <SecondaryButton
                        type="button"
                        onClick={onCancel}
                        className="rounded-2xl px-5 py-2.5 text-xs font-bold shadow-2xs"
                    >
                        ← {labels.cancel}
                    </SecondaryButton>

                    <PrimaryButton
                        type="submit"
                        disabled={form.processing}
                        className="rounded-2xl px-6 py-3 text-sm font-black shadow-md bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                    >
                        {form.processing ? 'Menyimpan Tarif...' : `💾 ${label}`}
                    </PrimaryButton>
                </div>
            </div>
        </form>
    );
}
