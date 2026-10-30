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
    onClose?: () => void;
}

export default function AiDynamicPricingPanel({
    analyzeUrl,
    applyUrl,
    canUpdate = true,
    onClose,
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
        <div className="flex flex-col h-full max-h-[85vh] bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/20">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 px-6 py-4 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-md shadow-indigo-500/20">
                        ⚡
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                {t('rental.ai.dynamic_pricing_title', undefined, 'AI Smart Dynamic Pricing & Fleet Optimizer')}
                            </h3>
                            <span className="rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:from-indigo-950/80 dark:to-purple-950/80 dark:text-indigo-300">
                                Gemini 1.5 Flash
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('rental.ai.dynamic_pricing_subtitle', undefined, 'Analisis okupansi armada riil, pola lonjakan akhir pekan, dan optimasi pendapatan sewa.')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleRunAnalysis}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
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

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white transition"
                            title="Tutup Modal"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Alerts */}
                {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                        ⚠️ {error}
                    </div>
                )}
                {appliedMessage && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {appliedMessage}
                    </div>
                )}

                {/* Empty State */}
                {!pricingData && !loading && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-3xl dark:bg-indigo-900/40 shadow-sm">
                            📈
                        </div>
                        <h4 className="mt-4 text-base font-black text-slate-900 dark:text-white">
                            Siap Mengoptimalkan Tarif Rental & Okupansi Armada
                        </h4>
                        <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            Mesin AI akan memindai riwayat pemesanan 30 hari terakhir, memetakan lonjakan permintaan akhir pekan, serta mendeteksi unit yang sering menganggur untuk memberikan strategi kenaikan omzet dan rekomendasi harga optimal.
                        </p>
                        <button
                            type="button"
                            onClick={handleRunAnalysis}
                            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700"
                        >
                            <span>✨</span>
                            <span>Mulai Analisis AI Sekarang</span>
                        </button>
                    </div>
                )}

                {/* Results View */}
                {pricingData && (
                    <div className="space-y-6">
                        {/* KPI Metrics Row */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Utilization */}
                            <div className="rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-xs dark:border-indigo-900/40 dark:bg-slate-800/90">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        📊 Utilisasi Armada
                                    </span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">
                                        {pricingData.fleet_utilization_percent}%
                                    </span>
                                </div>
                                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            pricingData.fleet_utilization_percent >= 70
                                                ? 'bg-emerald-500'
                                                : pricingData.fleet_utilization_percent >= 45
                                                  ? 'bg-indigo-500'
                                                  : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${Math.min(100, pricingData.fleet_utilization_percent)}%` }}
                                    />
                                </div>
                                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span>Hari Kerja: <strong>{pricingData.metrics.weekday_utilization_percent}%</strong></span>
                                    <span>Weekend: <strong>{pricingData.metrics.weekend_utilization_percent}%</strong></span>
                                </div>
                            </div>

                            {/* Revenue Uplift */}
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                        🚀 Potensi Kenaikan Omzet
                                    </span>
                                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                                        +{pricingData.estimated_revenue_uplift_percent}%
                                    </span>
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                                    Kombinasi kenaikan tarif lonjakan akhir pekan & promosi unit idle untuk meningkatkan utilisasi.
                                </p>
                            </div>

                            {/* Fleet Breakdown */}
                            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/90 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        🚗 Total Armada
                                    </span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">
                                        {pricingData.metrics.total_vehicles} Unit
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded-xl bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                        {pricingData.metrics.booked_vehicles_count} Tersewa / Aktif
                                    </span>
                                    {pricingData.idle_vehicles && pricingData.idle_vehicles.length > 0 ? (
                                        <span className="rounded-xl bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            {pricingData.idle_vehicles.length} Menganggur
                                        </span>
                                    ) : (
                                        <span className="rounded-xl bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            Semua Terutilisasi
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* AI Strategic Narrative Banner */}
                        {pricingData.summary && (
                            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white p-5 shadow-xs dark:border-indigo-900/50 dark:from-slate-800/95 dark:via-slate-800/80 dark:to-indigo-950/30">
                                {/* Subtle decorative background glow */}
                                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-indigo-500/10 blur-xl dark:bg-indigo-500/15" />

                                <div className="relative flex items-start sm:items-center gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-xl font-bold text-white shadow-md shadow-indigo-500/25">
                                        💡
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                                                Ringkasan Strategi AI Gemini
                                            </h4>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/90 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Wawasan Real-Time
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-[13px] font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
                                            {pricingData.summary}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recommendations & Idle Vehicles Split Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left: Recommendations */}
                            <div className="lg:col-span-7 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        ⭐ Rekomendasi Penyesuaian Tarif ({pricingData.recommendations.length})
                                    </h4>
                                    <span className="text-[11px] text-slate-400">
                                        Klik "Terapkan" untuk langsung memperbarui tarif
                                    </span>
                                </div>

                                {pricingData.recommendations.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-850">
                                        Tidak ada rekomendasi penyesuaian baru saat ini. Tarif eksisting sudah optimal.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pricingData.recommendations.map((rec) => {
                                            const isSurge = rec.type === 'surge' || rec.adjustment_percent > 0;
                                            const isApplying = applyingId === rec.id;

                                            return (
                                                <div
                                                    key={rec.id}
                                                    className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/90 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span
                                                            className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                                                                isSurge
                                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                                                                    : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'
                                                            }`}
                                                        >
                                                            {isSurge ? '🚀 Surge Pricing' : '🏷️ Promo Okupansi'}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-slate-400">
                                                            Tingkat Akurasi: {Math.round(rec.confidence * 100)}%
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                                            {rec.title}
                                                        </h5>
                                                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                                            {rec.reason}
                                                        </p>
                                                    </div>

                                                    {/* Price Comparison & Apply Action */}
                                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/60">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Katalog Sekarang</span>
                                                                <span className="font-bold text-slate-500 line-through text-xs">
                                                                    {formatMoney(rec.current_rate)}
                                                                </span>
                                                            </div>
                                                            <span className="text-slate-300 text-sm">→</span>
                                                            <div>
                                                                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">Rekomendasi AI</span>
                                                                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm font-mono">
                                                                    {formatMoney(rec.suggested_rate)}
                                                                </span>
                                                            </div>
                                                            <span
                                                                className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                                                                    rec.adjustment_percent > 0
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
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
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
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Right: Idle Vehicles */}
                            <div className="lg:col-span-5 space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                    <span>⚠️</span>
                                    <span>Armada Menganggur ({pricingData.idle_vehicles?.length || 0})</span>
                                </h4>

                                {(!pricingData.idle_vehicles || pricingData.idle_vehicles.length === 0) ? (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                                        ✨ Tidak ada unit armada yang menganggur berkepanjangan. Semua armada memiliki tingkat okupansi yang sehat!
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {pricingData.idle_vehicles.map((v) => (
                                            <div
                                                key={v.vehicle_id}
                                                className="rounded-2xl border border-amber-200/80 bg-white p-3.5 shadow-2xs dark:border-amber-900/50 dark:bg-slate-800"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h6 className="font-black text-slate-900 dark:text-white text-xs">{v.name}</h6>
                                                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">{v.plate_number}</p>
                                                    </div>
                                                    <span className="rounded-xl bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                        Idle {v.days_idle} hari
                                                    </span>
                                                </div>

                                                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2 text-xs dark:bg-slate-900/50">
                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Saran Promo Cepat:</span>
                                                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                                                        {formatMoney(v.suggested_promo_rate)} / hari
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-200/80 px-6 py-3.5 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}
