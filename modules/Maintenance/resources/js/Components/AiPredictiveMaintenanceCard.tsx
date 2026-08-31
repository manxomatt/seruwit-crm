import React, { useState } from 'react';
import { useTrans } from '@/hooks/useTrans';
import { router } from '@inertiajs/react';

function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return meta?.content || '';
}

export interface ServiceForecast {
    vehicle_id: number;
    vehicle_name: string;
    plate_number: string;
    rental_class: string | null;
    current_odometer_km: number;
    km_per_day_run_rate: number;
    next_service_type: string;
    target_odometer_km: number | null;
    predicted_due_date: string | null;
    days_remaining: number | null;
    urgency: 'due_now' | 'due_soon' | 'normal' | string;
    reason: string;
    action_payload: {
        action: string;
        vehicle_id: number;
        title: string;
        category_id?: number | null;
        scheduled_date: string;
        priority: string;
        estimated_hours?: number | null;
        odometer_at_service?: number | null;
        [key: string]: any;
    };
}

export interface FleetAnomaly {
    id: string;
    vehicle_id: number;
    vehicle_name: string;
    plate_number: string;
    anomaly_type: string;
    severity: 'danger' | 'warning' | 'info' | string;
    title: string;
    description: string;
    recommendation: string;
}

export interface VehicleHealthInfo {
    score: number;
    status: 'good' | 'warning' | 'critical' | string;
    issues_count: number;
    primary_warning?: string | null;
}

export interface PredictiveMaintenanceData {
    fleet_health_score: number;
    fleet_risk_level: 'low' | 'medium' | 'high' | string;
    summary: string;
    vehicles_analyzed_count: number;
    critical_vehicles_count: number;
    service_forecasts: ServiceForecast[];
    anomalies: FleetAnomaly[];
    vehicle_health_scores: Record<string, VehicleHealthInfo>;
    generated_at?: string;
}

interface Props {
    analyzeUrl: string;
    createWoUrl: string;
    canCreateWo?: boolean;
}

export default function AiPredictiveMaintenanceCard({
    analyzeUrl,
    createWoUrl,
    canCreateWo = true,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [loading, setLoading] = useState(false);
    const [creatingWoVehicleId, setCreatingWoVehicleId] = useState<number | null>(null);
    const [predictiveData, setPredictiveData] = useState<PredictiveMaintenanceData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'forecasts' | 'anomalies'>('forecasts');

    const handleRunAnalysis = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(analyzeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    lookback_days: 60,
                    forecast_days: 30,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success && data.result) {
                setPredictiveData(data.result);
            } else {
                setError(data.message || 'Gagal menghasilkan prediksi maintenance AI.');
            }
        } catch {
            setError('Terjadi kesalahan jaringan saat memanggil AI Predictive Maintenance.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkOrder = async (forecast: ServiceForecast) => {
        if (!canCreateWo || creatingWoVehicleId) return;
        setCreatingWoVehicleId(forecast.vehicle_id);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(createWoUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    action_payload: forecast.action_payload,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setSuccessMessage(`✅ ${data.message}`);
                router.reload({ preserveScroll: true });
            } else {
                setError(data.message || 'Gagal membuat Work Order dari rekomendasi AI.');
            }
        } catch {
            setError('Terjadi kesalahan jaringan saat membuat Work Order.');
        } finally {
            setCreatingWoVehicleId(null);
        }
    };

    return (
        <div className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 shadow-sm transition dark:border-indigo-900/60 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/30">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-100/80 p-5 dark:border-indigo-900/40">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-md shadow-indigo-500/20">
                        🛡️
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                {t('maintenance.ai.predictive_title', undefined, 'AI Predictive Maintenance & Anomaly Detection')}
                            </h3>
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                                Gemini 1.5 Flash
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('maintenance.ai.predictive_subtitle', undefined, 'Prediksi waktu servis berbasis laju KM harian, deteksi anomali pemakaian, dan pencegahan risiko mogok.')}
                        </p>
                    </div>
                </div>

                <div className="w-full sm:w-auto shrink-0">
                    <button
                        type="button"
                        onClick={handleRunAnalysis}
                        disabled={loading}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-indigo-300 bg-white px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:shadow disabled:opacity-50 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-200 dark:hover:bg-slate-700"
                    >
                        {loading ? (
                            <>
                                <svg className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>{t('maintenance.ai.analyzing_fleet', undefined, 'Menganalisis Telemetri…')}</span>
                            </>
                        ) : (
                            <>
                                <span>✨</span>
                                <span>{predictiveData ? t('maintenance.ai.btn_reanalyze', undefined, 'Perbarui Prediksi AI') : t('maintenance.ai.btn_analyze', undefined, 'Jalankan Analisis AI')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error or Success Alerts */}
            {error && (
                <div className="mx-6 mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                    ⚠️ {error}
                </div>
            )}
            {successMessage && (
                <div className="mx-6 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {successMessage}
                </div>
            )}

            {/* Initial Empty State */}
            {!predictiveData && !loading && (
                <div className="px-6 py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl dark:bg-indigo-900/40">
                        🔮
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                        Pantau Kesehatan Armada & Cegah Kerusakan Dini dengan AI
                    </h4>
                    <p className="mx-auto mt-1 max-w-lg text-xs text-slate-500 dark:text-slate-400">
                        Klik tombol <strong>"Jalankan Analisis Prediktif AI"</strong> di atas untuk memindai laju KM/hari riil seluruh armada, memprediksi tanggal jatuh tempo servis berkala, dan mendeteksi anomali kerusakan berulang.
                    </p>
                </div>
            )}

            {/* Analyzed Results */}
            {predictiveData && (
                <div className="space-y-6 p-6">
                    {/* KPI Metrics */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
                        <div className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm dark:border-indigo-900/40 dark:bg-slate-800/80">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                🛡️ Skor Kesehatan Armada
                            </span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {predictiveData.fleet_health_score} / 100
                                </span>
                                <span
                                    className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                        predictiveData.fleet_risk_level === 'low'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                            : predictiveData.fleet_risk_level === 'medium'
                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                    }`}
                                >
                                    Risiko {predictiveData.fleet_risk_level.toUpperCase()}
                                </span>
                            </div>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div
                                    className={`h-full rounded-full ${
                                        predictiveData.fleet_health_score >= 80
                                            ? 'bg-emerald-500'
                                            : predictiveData.fleet_health_score >= 60
                                              ? 'bg-amber-500'
                                              : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, predictiveData.fleet_health_score)}%` }}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30">
                            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                🚨 Unit Perlu Perhatian Segera
                            </span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                                    {predictiveData.critical_vehicles_count} Unit
                                </span>
                                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                                    dari {predictiveData.vehicles_analyzed_count} unit aktif
                                </span>
                            </div>
                            <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-300">
                                Unit dengan servis jatuh tempo atau frekuensi insiden tinggi.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                🔮 Prediksi Servis Mendatang (30 Hari)
                            </span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {predictiveData.service_forecasts.length} Jadwal
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    terdeteksi via laju KM
                                </span>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                Rekomendasi servis oli, rem, dan perawatan berkala.
                            </p>
                        </div>
                    </div>

                    {/* AI Strategy Narrative */}
                    {predictiveData.summary && (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                            <div className="flex items-start gap-2.5">
                                <span className="text-base">💡</span>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                                        Diagnostik & Rekomendasi Perawatan AI
                                    </h4>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                        {predictiveData.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs Navigation */}
                    <div className="flex gap-3 border-b border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveTab('forecasts')}
                            className={`pb-2 text-xs font-bold transition ${
                                activeTab === 'forecasts'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            🚨 Prediksi Jadwal Servis ({predictiveData.service_forecasts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('anomalies')}
                            className={`pb-2 text-xs font-bold transition ${
                                activeTab === 'anomalies'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            ⚠️ Deteksi Anomali Pemakaian ({predictiveData.anomalies.length})
                        </button>
                    </div>

                    {/* Service Forecasts Tab */}
                    {activeTab === 'forecasts' && (
                        <div className="grid grid-cols-1 gap-3.5">
                            {predictiveData.service_forecasts.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                                    ✅ Tidak ada jadwal servis mendesak dalam 30 hari ke depan. Seluruh armada dalam batas aman.
                                </div>
                            ) : (
                                predictiveData.service_forecasts.map((f, idx) => {
                                    const isDueNow = f.urgency === 'due_now';
                                    const isDueSoon = f.urgency === 'due_soon';
                                    const isCreating = creatingWoVehicleId === f.vehicle_id;

                                    return (
                                        <div
                                            key={`${f.vehicle_id}_${idx}`}
                                            className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-800/90"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                                                            isDueNow
                                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                                                : isDueSoon
                                                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300'
                                                        }`}
                                                    >
                                                        {isDueNow ? '🚨 Segera Servis' : isDueSoon ? '⏳ Jatuh Tempo Mendatang' : '🗓️ Terjadwal'}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-slate-500">
                                                        Laju: {f.km_per_day_run_rate} KM/hari
                                                    </span>
                                                </div>

                                                <h5 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                                                    {f.vehicle_name} <span className="font-mono text-xs font-normal text-slate-500">({f.plate_number})</span>
                                                </h5>
                                                <p className="mt-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {f.next_service_type}
                                                </p>
                                                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                                    {f.reason}
                                                </p>

                                                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-900/60">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Odometer Saat Ini</span>
                                                        <p className="font-bold text-slate-700 dark:text-slate-300">{f.current_odometer_km.toLocaleString()} KM</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Target Servis</span>
                                                        <p className="font-bold text-slate-700 dark:text-slate-300">{f.target_odometer_km ? `${f.target_odometer_km.toLocaleString()} KM` : '-'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase">Prediksi Tanggal</span>
                                                        <p className="font-bold text-indigo-600 dark:text-indigo-400">{f.predicted_due_date || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {canCreateWo && (
                                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCreateWorkOrder(f)}
                                                        disabled={isCreating}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        {isCreating ? (
                                                            <>
                                                                <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                                <span>Membuat Work Order…</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>⚡</span>
                                                                <span>Buat Work Order Servis</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Anomalies Tab */}
                    {activeTab === 'anomalies' && (
                        <div className="space-y-3">
                            {predictiveData.anomalies.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                                    ✅ Tidak ada anomali telemetri atau lonjakan pemakaian abnormal yang terdeteksi.
                                </div>
                            ) : (
                                predictiveData.anomalies.map((anom) => (
                                    <div
                                        key={anom.id}
                                        className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/90"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                                        anom.severity === 'danger'
                                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                                    }`}
                                                >
                                                    {anom.severity.toUpperCase()}
                                                </span>
                                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {anom.title} — {anom.vehicle_name} ({anom.plate_number})
                                                </h5>
                                            </div>
                                        </div>
                                        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                                            {anom.description}
                                        </p>
                                        <div className="mt-2 rounded-xl bg-amber-50/60 p-2.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                            💡 <strong>Rekomendasi Tindakan:</strong> {anom.recommendation}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
