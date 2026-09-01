import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

export interface SubscriptionTierRow {
    id: number;
    name: string;
    min_vehicles: number;
    max_vehicles: number;
    price_per_vehicle: number;
}

export interface SubscriptionNextTier {
    id: number;
    name: string;
    min_vehicles: number;
    price_per_vehicle: number;
    vehicles_needed: number;
}

export interface SubscriptionOverview {
    subscription_type: string | null;
    vehicle_count: number;
    total_fleet?: number;
    active_fleet?: number;
    expired_fleet?: number;
    expiring_fleet?: number;
    is_billed_quota: boolean;
    active_tier_id: number | null;
    next_tier?: SubscriptionNextTier | null;
    price_per_vehicle: number | null;
    monthly_estimate: number | null;
    currency_symbol: string;
    tiers: SubscriptionTierRow[];
}

interface Props {
    subscription: SubscriptionOverview;
}

function formatNumber(value: number, localeTag: string): string {
    return new Intl.NumberFormat(localeTag === 'id' ? 'id-ID' : 'en-US').format(value);
}

function formatMoney(value: number, symbol: string, localeTag: string): string {
    return `${symbol} ${formatNumber(Math.round(value), localeTag)}`;
}

export default function SubscriptionPricingSection({ subscription }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const actualCount = subscription.vehicle_count > 0 ? subscription.vehicle_count : (subscription.total_fleet ?? 0);
    const [simulatedCount, setSimulatedCount] = useState<number>(actualCount > 0 ? actualCount : 5);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
    const [isExpanded, setIsExpanded] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('dashboard_pricing_expanded');
            return saved !== null ? saved === 'true' : true;
        } catch {
            return true;
        }
    });

    const toggleExpanded = () => {
        setIsExpanded((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('dashboard_pricing_expanded', String(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    // Find tier for any vehicle count
    const getTierForCount = (count: number): SubscriptionTierRow | undefined => {
        return subscription.tiers.find((tier) => count >= tier.min_vehicles && count <= tier.max_vehicles)
            ?? subscription.tiers[subscription.tiers.length - 1];
    };

    const simulatedTier = useMemo(() => getTierForCount(simulatedCount), [simulatedCount, subscription.tiers]);
    const currentTier = useMemo(
        () => subscription.tiers.find((ti) => ti.id === subscription.active_tier_id) ?? getTierForCount(actualCount),
        [subscription.active_tier_id, actualCount, subscription.tiers]
    );

    const baseTier = subscription.tiers[0] ?? null;
    const basePrice = baseTier ? baseTier.price_per_vehicle : (simulatedTier?.price_per_vehicle ?? 20000);

    // Calculate simulated price & discounts
    const simPricePerVehicle = simulatedTier?.price_per_vehicle ?? basePrice;
    const simMonthlyTotal = simulatedCount * simPricePerVehicle;
    // 20% discount for annual billing
    const annualDiscountPercent = 20;
    const simAnnualTotal = simMonthlyTotal * 12 * (1 - annualDiscountPercent / 100);
    const simEffectivePerMonth = billingPeriod === 'annual' ? simAnnualTotal / 12 : simMonthlyTotal;

    // Savings compared to base tier
    const volumeSavingsPercent = basePrice > simPricePerVehicle
        ? Math.round(((basePrice - simPricePerVehicle) / basePrice) * 100)
        : 0;

    // Next tier progress
    const nextTier = subscription.next_tier;
    const progressPercent = useMemo(() => {
        if (!nextTier || !currentTier) return 100;
        const currentTierSpan = nextTier.min_vehicles - currentTier.min_vehicles;
        if (currentTierSpan <= 0) return 100;
        const currentProgress = actualCount - currentTier.min_vehicles;
        return Math.min(100, Math.max(10, Math.round((currentProgress / currentTierSpan) * 100)));
    }, [actualCount, nextTier, currentTier]);

    const presets = [
        { label: '5 Unit', value: 5 },
        { label: '15 Unit', value: 15 },
        { label: '30 Unit', value: 30 },
        { label: '50 Unit', value: 50 },
        { label: '100+ Unit', value: 100 },
    ];

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/50 p-6 sm:p-8 shadow-sm transition-all dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
            {/* Background Decorative Accents */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/10 blur-3xl dark:from-indigo-600/15 dark:to-teal-600/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 blur-3xl dark:from-emerald-600/15 dark:to-indigo-600/15" />

            {/* Header section */}
            <div className={`relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isExpanded ? 'border-b border-slate-200/80 pb-6 dark:border-slate-800' : ''}`}>
                <div className="flex-1 cursor-pointer select-none" onClick={toggleExpanded}>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-500/20">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                            {t('dashboard.subscription.title', undefined, 'Paket & Harga per Kendaraan')}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                            ⚡ Pay As You Go (PAYG)
                        </span>

                        {!isExpanded && currentTier && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span>👑 {currentTier.name}</span>
                                <span>·</span>
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    {formatMoney(currentTier.price_per_vehicle, subscription.currency_symbol, localeTag)}/unit
                                </span>
                                {subscription.monthly_estimate != null && (
                                    <>
                                        <span>·</span>
                                        <span>Est: {formatMoney(subscription.monthly_estimate, subscription.currency_symbol, localeTag)}/bln</span>
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                            Tarif Berjenjang Sesuai Skala Armada
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                        Semakin banyak unit kendaraan terdaftar di sistem, semakin hemat tarif per unitnya secara otomatis tanpa perlu komitmen paket kaku.
                    </p>
                </div>

                {/* Quick actions & Collapse Toggle */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                        href={route('module.fleet.vehicles.index')}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-98 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        <span>⚡ Kelola Armada</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>

                    {/* Collapse / Expand Toggle Button */}
                    <button
                        type="button"
                        onClick={toggleExpanded}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                        title={isExpanded ? 'Ciutkan Panel' : 'Buka Detail & Simulator'}
                    >
                        <span>{isExpanded ? 'Ciutkan' : 'Buka Detail'}</span>
                        <svg
                            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Collapsible Body */}
            {isExpanded && (
                <div className="transition-all duration-300">

            {/* Current Snapshot Metrics */}
            <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-3">
                {/* Metric 1: Current Tier */}
                <div className="group relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-xs transition hover:shadow-md dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            {t('dashboard.subscription.current_tier', undefined, 'Tier Aktif Anda')}
                        </span>
                        <span className="rounded-full bg-indigo-600/10 p-1.5 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                            👑
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        {currentTier?.name ?? t('dashboard.subscription.no_tier', undefined, 'Belum Ada Tier')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Kapasitas:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                            {currentTier ? `${formatNumber(currentTier.min_vehicles, localeTag)} – ${currentTier.max_vehicles >= 100000 ? 'Tak Terbatas' : formatNumber(currentTier.max_vehicles, localeTag)} Unit` : '—'}
                        </strong>
                    </p>
                </div>

                {/* Metric 2: Rate Per Vehicle */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Tarif Efektif per Unit
                        </span>
                        <span className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                            🏷️
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                            {subscription.price_per_vehicle != null
                                ? formatMoney(subscription.price_per_vehicle, subscription.currency_symbol, localeTag)
                                : (currentTier ? formatMoney(currentTier.price_per_vehicle, subscription.currency_symbol, localeTag) : '—')}
                        </p>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                            / unit / bln
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        {volumeSavingsPercent > 0 ? `✓ Hemat ${volumeSavingsPercent}% dibanding Tier Dasar` : '✓ Seluruh Fitur Modul Lengkap'}
                    </p>
                </div>

                {/* Metric 3: Total Monthly Estimate */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {t('dashboard.subscription.monthly_estimate', undefined, 'Estimasi Investasi Bulanan')}
                        </span>
                        <span className="rounded-full bg-teal-500/10 p-1.5 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400">
                            💳
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                        {subscription.monthly_estimate != null
                            ? formatMoney(subscription.monthly_estimate, subscription.currency_symbol, localeTag)
                            : (currentTier ? formatMoney(actualCount * currentTier.price_per_vehicle, subscription.currency_symbol, localeTag) : '—')}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                            {formatNumber(actualCount, localeTag)} {t('dashboard.subscription.vehicles', undefined, 'armada')}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {subscription.is_billed_quota ? 'Kuota Berlangganan' : 'Armada Terdaftar'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Next Tier Upgrade Callout */}
            {nextTier && nextTier.vehicles_needed > 0 && (
                <div className="relative z-10 mt-4 overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-4 dark:border-teal-900/60 dark:from-teal-950/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🎯</span>
                                <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                                    Buka Diskon Lebih Hemat di Tier Berikutnya:{' '}
                                    <span className="underline decoration-teal-500 underline-offset-2">{nextTier.name}</span>
                                </p>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                Tambahkan <strong className="text-teal-700 dark:text-teal-300 font-extrabold">{nextTier.vehicles_needed} unit kendaraan lagi</strong> untuk menikmati tarif hemat <strong className="text-slate-900 dark:text-white font-extrabold">{formatMoney(nextTier.price_per_vehicle, subscription.currency_symbol, localeTag)}</strong>/unit/bulan.
                            </p>
                        </div>
                        <div className="w-full sm:w-48 shrink-0">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                <span>Progress ke {nextTier.name}</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Interactive Fleet Simulator ── */}
            <div className="relative z-10 mt-8 rounded-2xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-indigo-100 p-1 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                🎛️
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                Simulator Estimasi Biaya Armada
                            </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Geser slider atau pilih tombol cepat untuk melihat simulasi kalkulasi tarif dan penghematan.
                        </p>
                    </div>

                    {/* Period Switcher (Monthly vs Annual) */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                        <button
                            type="button"
                            onClick={() => setBillingPeriod('monthly')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${billingPeriod === 'monthly'
                                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                        >
                            Bulanan
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingPeriod('annual')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${billingPeriod === 'annual'
                                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                        >
                            <span>Tahunan</span>
                            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-12 items-center">
                    {/* Slider & Presets (Left / Top) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="fleet-slider" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Jumlah Armada yang Disimulasikan:
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1 text-sm font-black text-white shadow-xs">
                                    {simulatedCount} Unit
                                </span>
                                {actualCount > 0 && simulatedCount !== actualCount && (
                                    <button
                                        type="button"
                                        onClick={() => setSimulatedCount(actualCount)}
                                        className="text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                        title="Kembalikan ke jumlah armada saat ini"
                                    >
                                        ↺ Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Interactive Range Slider */}
                        <input
                            id="fleet-slider"
                            type="range"
                            min="1"
                            max="120"
                            step="1"
                            value={simulatedCount}
                            onChange={(e) => setSimulatedCount(parseInt(e.target.value, 10))}
                            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
                        />

                        {/* Preset Chips */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-semibold text-slate-400">Pilihan Cepat:</span>
                            {presets.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => setSimulatedCount(preset.value)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${simulatedCount === preset.value
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            {actualCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSimulatedCount(actualCount)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${simulatedCount === actualCount
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        }`}
                                >
                                    Armada Saya ({actualCount} Unit)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Simulation Result Card (Right / Bottom) */}
                    <div className="lg:col-span-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 p-5 dark:border-indigo-900/50 dark:from-slate-800/80 dark:to-slate-900">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Tier Hasil Simulasi:</span>
                            <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                                {simulatedTier?.name ?? 'Tier Standar'}
                            </span>
                        </div>

                        <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-slate-700/80 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400">Tarif per Kendaraan:</span>
                                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                    {formatMoney(simPricePerVehicle, subscription.currency_symbol, localeTag)} / bln
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400">
                                    {billingPeriod === 'annual' ? 'Total Biaya Tahunan (-20%):' : 'Total Estimasi per Bulan:'}
                                </span>
                                <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                                    {billingPeriod === 'annual'
                                        ? formatMoney(simAnnualTotal, subscription.currency_symbol, localeTag)
                                        : formatMoney(simMonthlyTotal, subscription.currency_symbol, localeTag)}
                                </span>
                            </div>

                            {billingPeriod === 'annual' && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold text-right">
                                    (Setara {formatMoney(simEffectivePerMonth, subscription.currency_symbol, localeTag)}/bulan)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tier Cards Matrix ── */}
            <div className="relative z-10 mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                            <span>📋</span>
                            <span>Daftar Seluruh Tier Harga Volume</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Klik pada salah satu kartu tier untuk langsung mensimulasikan biaya pada skala armada tersebut.
                        </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                        {subscription.tiers.length} Level Tarif Tersedia
                    </span>
                </div>

                <div className={`grid gap-6 sm:gap-6 lg:gap-7 ${
                    subscription.tiers.length === 1
                        ? 'grid-cols-1 max-w-md mx-auto'
                        : subscription.tiers.length === 2
                        ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
                        : subscription.tiers.length === 3
                        ? 'grid-cols-1 md:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                    {subscription.tiers.map((tier, idx) => {
                        const isUserActive = tier.id === subscription.active_tier_id;
                        const isSimulated = simulatedTier?.id === tier.id;

                        // Tier level theme configurations
                        const tierThemes = [
                            {
                                icon: '🚀',
                                levelTag: 'Tier 1',
                                badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                                accentBorder: 'border-slate-300 dark:border-slate-700',
                                highlightBg: 'from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/90',
                            },
                            {
                                icon: '⚡',
                                levelTag: 'Tier 2',
                                badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
                                accentBorder: 'border-blue-300 dark:border-blue-700',
                                highlightBg: 'from-blue-50/40 to-white dark:from-blue-950/30 dark:to-slate-900',
                            },
                            {
                                icon: '🏢',
                                levelTag: 'Tier 3',
                                badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
                                accentBorder: 'border-indigo-300 dark:border-indigo-700',
                                highlightBg: 'from-indigo-50/40 to-white dark:from-indigo-950/30 dark:to-slate-900',
                            },
                            {
                                icon: '👑',
                                levelTag: 'Tier 4',
                                badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                                accentBorder: 'border-amber-300 dark:border-amber-700',
                                highlightBg: 'from-amber-50/40 to-white dark:from-amber-950/30 dark:to-slate-900',
                            },
                        ];
                        const theme = tierThemes[idx % tierThemes.length];

                        // Tier discount compared to base tier
                        const tierDiscount = basePrice > tier.price_per_vehicle
                            ? Math.round(((basePrice - tier.price_per_vehicle) / basePrice) * 100)
                            : 0;

                        // Click to simulate middle of range
                        const handleTierClick = () => {
                            const target = tier.max_vehicles >= 100000
                                ? Math.max(tier.min_vehicles, 60)
                                : Math.round((tier.min_vehicles + tier.max_vehicles) / 2);
                            setSimulatedCount(target);
                        };

                        return (
                            <div
                                key={tier.id}
                                onClick={handleTierClick}
                                className={`group relative flex flex-col justify-between rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
                                    isUserActive
                                        ? 'border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/80 via-white to-indigo-50/30 shadow-lg ring-4 ring-indigo-500/10 dark:border-indigo-500 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900'
                                        : isSimulated
                                        ? 'border-2 border-teal-500 bg-gradient-to-b from-teal-50/70 via-white to-teal-50/20 shadow-md ring-4 ring-teal-500/10 dark:border-teal-500 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900'
                                        : 'border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700'
                                }`}
                            >
                                {/* Top Header Badge Row */}
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-lg">{theme.icon}</span>
                                            <span className={`rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${theme.badgeBg}`}>
                                                {theme.levelTag}
                                            </span>
                                        </div>

                                        {isUserActive ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                Tier Aktif
                                            </span>
                                        ) : isSimulated ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                                🎯 Simulasi
                                            </span>
                                        ) : tierDiscount > 0 ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                                                Hemat {tierDiscount}%
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Tier Name */}
                                    <h5 className="mt-3 text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {tier.name}
                                    </h5>

                                    {/* Capacity Badge */}
                                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <span>🚗</span>
                                        <span>
                                            {formatNumber(tier.min_vehicles, localeTag)} –{' '}
                                            {tier.max_vehicles >= 100000
                                                ? t('dashboard.subscription.unlimited', undefined, 'Tanpa batas')
                                                : `${formatNumber(tier.max_vehicles, localeTag)} Unit`}
                                        </span>
                                    </div>
                                </div>

                                {/* Price Section */}
                                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Tarif per Kendaraan
                                    </p>
                                    <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                                            {formatMoney(tier.price_per_vehicle, subscription.currency_symbol, localeTag)}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-400">
                                            / unit / bln
                                        </span>
                                    </div>

                                    {/* Annual equivalent note */}
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {billingPeriod === 'annual' ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                {formatMoney(tier.price_per_vehicle * 0.8, subscription.currency_symbol, localeTag)} / bln (bayar tahunan)
                                            </span>
                                        ) : (
                                            <span>Semua modul & fitur aktif</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Transparency & Support */}
            <div className="relative z-10 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <span>
                        Tanpa biaya lisensi tersembunyi. Skema Pay-As-You-Go berlaku fleksibel per unit aktif.
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={route('module.subscription.index')}
                        className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
                    >
                        Lihat Rincian Billing & Langganan →
                    </Link>
                </div>
            </div>
                </div>
            )}
        </div>
    );
}
