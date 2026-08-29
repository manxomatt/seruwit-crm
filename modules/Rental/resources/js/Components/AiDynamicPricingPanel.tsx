import React, { useState } from 'react';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';
import { csrfToken } from '../ReservationWizard/types';

export interface PricingRecommendation {
    id: string;
    type: 'surge' | 'discount_promo' | 'duration_rule' | string;
    target_type: string;
    target_identifier: string;
    target_label: string;
    current_rate: number;
    suggested_rate: number;
    adjustment_percent: number;
    confidence: number;
    title: string;
    reason: string;
    action_payload: {
        action: string;
        rental_rate_id?: number | null;
        rental_class?: string | null;
        vehicle_id?: number | null;
        new_rate_per_period: number;
        [key: string]: any;
    };
}

export interface IdleVehicle {
    vehicle_id: number;
    name: string;
    plate_number: string;
    rental_class: string | null;
    days_idle: number;
    suggested_promo_rate: number;
}

export interface DynamicPricingData {
    fleet_utilization_percent: number;
    estimated_revenue_uplift_percent: number;
    summary: string;
    metrics: {
        total_vehicles: number;
        active_fleet_count: number;
        booked_vehicles_count: number;
        overall_utilization_percent: number;
        weekday_utilization_percent: number;
        weekend_utilization_percent: number;
        class_breakdown?: Record<string, {
            label: string;
            total_units: number;
            utilization_percent: number;
            avg_daily_rate: number;
        }>;
    };
    recommendations: PricingRecommendation[];
    idle_vehicles?: IdleVehicle[];
    generated_at?: string;
}

interface Props {
    analyzeUrl: string;
    applyUrl: string;
    canUpdate?: boolean;
}

export default function AiDynamicPricingPanel({
    analyzeUrl,
    applyUrl,
    canUpdate = true,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [loading, setLoading] = useState(false);
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [pricingData, setPricingData] = useState<DynamicPricingData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

    const handleRunAnalysis = async () => {
        setLoading(true);
        setError(null);
        setAppliedMessage(null);

        try {
            const response = await fetch(analyzeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    lookback_days: 30,
                    forecast_days: 30,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success && data.result) {
                setPricingData(data.result);
            } else {
                setError(data.message || 'Gagal menghasilkan rekomendasi harga AI.');
            }
        } catch {
            setError('Terjadi kesalahan jaringan saat memanggil AI Dynamic Pricing.');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyRecommendation = async (rec: PricingRecommendation) => {
        if (!canUpdate || applyingId) return;
        setApplyingId(rec.id);
        setError(null);
        setAppliedMessage(null);

        try {
            const response = await fetch(applyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    action_payload: rec.action_payload,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setAppliedMessage(`✅ ${data.message}`);
                // Refresh rates list in inertia without page reload
                router.reload({ preserveScroll: true });
            } else {
                setError(data.message || 'Gagal menerapkan rekomendasi tarif.');
            }
        } catch {
            setError('Terjadi kesalahan saat menerapkan rekomendasi.');
        } finally {
            setApplyingId(null);
        }
    };

    return (
        <div className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 shadow-sm transition dark:border-indigo-900/60 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/30">
            {/* Header */}
            <div className="border-b border-indigo-100/80 p-5 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-md shadow-indigo-500/20">
                        ⚡
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                {t('rental.ai.dynamic_pricing_title', undefined, 'AI Dynamic Pricing')}
                            </h3>
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                                Gemini
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {t('rental.ai.dynamic_pricing_subtitle', undefined, 'Analisis okupansi armada riil & optimasi tarif sewa.')}
                        </p>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleRunAnalysis}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>{t('rental.ai.analyzing_pricing', undefined, 'Menganalisis Okupansi…')}</span>
                            </>
                        ) : (
                            <>
                                <span>✨</span>
                                <span>{pricingData ? t('rental.ai.btn_reanalyze_pricing', undefined, 'Analisis Ulang AI') : t('rental.ai.btn_analyze_pricing', undefined, 'Jalankan Analisis AI')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error or Success Alert */}
            {error && (
                <div className="mx-5 mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                    ⚠️ {error}
                </div>
            )}
            {appliedMessage && (
                <div className="mx-5 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {appliedMessage}
                </div>
            )}

            {/* Initial Empty State */}
            {!pricingData && !loading && (
                <div className="p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-xl dark:bg-indigo-900/40">
                        📈
                    </div>
                    <h4 className="mt-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                        Optimalkan Tarif Rental
                    </h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        Klik <strong>"Jalankan Analisis AI"</strong> di atas untuk memindai riwayat booking 30 hari dan memperoleh saran surge pricing atau promo diskon unit menganggur.
                    </p>
                </div>
            )}

            {/* Analyzed Results */}
            {pricingData && (
                <div className="space-y-4 p-5">
                    {/* KPI Metrics Stacks */}
                    <div className="space-y-3">
                        {/* Utilization */}
                        <div className="rounded-2xl border border-indigo-100 bg-white/95 p-3.5 shadow-2xs dark:border-indigo-900/40 dark:bg-slate-800/80">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    📊 Utilisasi Armada
                                </span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {pricingData.fleet_utilization_percent}%
                                </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div
                                    className={`h-full rounded-full ${
                                        pricingData.fleet_utilization_percent >= 70
                                            ? 'bg-emerald-500'
                                            : pricingData.fleet_utilization_percent >= 45
                                              ? 'bg-indigo-500'
                                              : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, pricingData.fleet_utilization_percent)}%` }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                <span>Hari Kerja: {pricingData.metrics.weekday_utilization_percent}%</span>
                                <span>Weekend: {pricingData.metrics.weekend_utilization_percent}%</span>
                            </div>
                        </div>

                        {/* Revenue Uplift */}
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/30">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                    🚀 Potensi Kenaikan Omzet
                                </span>
                                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                                    +{pricingData.estimated_revenue_uplift_percent}%
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                                Berdasarkan penyesuaian tarif lonjakan akhir pekan & promo unit idle.
                            </p>
                        </div>

                        {/* Fleet Active Count */}
                        <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    🚗 Total Armada
                                </span>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {pricingData.metrics.total_vehicles} Unit
                                </p>
                            </div>
                            {pricingData.idle_vehicles && pricingData.idle_vehicles.length > 0 ? (
                                <span className="rounded-xl bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    {pricingData.idle_vehicles.length} Menganggur
                                </span>
                            ) : (
                                <span className="rounded-xl bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                    Okupansi Baik
                                </span>
                            )}
                        </div>
                    </div>

                    {/* AI Strategy Narrative Box */}
                    {pricingData.summary && (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                            <div className="flex items-start gap-2">
                                <span className="text-sm">💡</span>
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                                        Strategi AI
                                    </h4>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                        {pricingData.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recommendations List */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Rekomendasi Tarif ({pricingData.recommendations.length})
                        </h4>

                        <div className="space-y-3">
                            {pricingData.recommendations.map((rec) => {
                                const isSurge = rec.type === 'surge' || rec.adjustment_percent > 0;
                                const isApplying = applyingId === rec.id;

                                return (
                                    <div
                                        key={rec.id}
                                        className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/90 space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-1.5">
                                            <span
                                                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                                                    isSurge
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                                                        : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'
                                                }`}
                                            >
                                                {isSurge ? '🚀 Surge' : '🏷️ Promo'}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-400">
                                                Akurasi: {Math.round(rec.confidence * 100)}%
                                            </span>
                                        </div>

                                        <div>
                                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                                {rec.title}
                                            </h5>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                                                {rec.reason}
                                            </p>
                                        </div>

                                        {/* Price Comparison */}
                                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs dark:bg-slate-900/60">
                                            <div>
                                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Katalog</span>
                                                <span className="font-bold text-slate-500 line-through">
                                                    {formatMoney(rec.current_rate)}
                                                </span>
                                            </div>
                                            <span className="text-slate-300">→</span>
                                            <div>
                                                <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">Saran AI</span>
                                                <span className="font-black text-indigo-600 dark:text-indigo-400">
                                                    {formatMoney(rec.suggested_rate)}
                                                </span>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    isSurge
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                }`}
                                            >
                                                {rec.adjustment_percent > 0 ? `+${rec.adjustment_percent}%` : `${rec.adjustment_percent}%`}
                                            </span>
                                        </div>

                                        {canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => handleApplyRecommendation(rec)}
                                                disabled={isApplying}
                                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {isApplying ? (
                                                    <>
                                                        <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                        </svg>
                                                        <span>Menerapkan…</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>⚡</span>
                                                        <span>Terapkan Tarif Ini</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Idle Vehicles List */}
                    {pricingData.idle_vehicles && pricingData.idle_vehicles.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-2">
                            <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                                <span>⚠️</span>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider">
                                    Unit Menganggur ({pricingData.idle_vehicles.length})
                                </h4>
                            </div>

                            <div className="space-y-1.5">
                                {pricingData.idle_vehicles.map((v) => (
                                    <div
                                        key={v.vehicle_id}
                                        className="rounded-xl border border-amber-200/80 bg-white p-2.5 text-xs shadow-2xs dark:border-amber-900/50 dark:bg-slate-800"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{v.name}</span>
                                            <span className="font-mono text-[10px] text-slate-500">{v.plate_number}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                                            <span>Saran Promo:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatMoney(v.suggested_promo_rate)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
