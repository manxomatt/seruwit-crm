import { useState } from 'react';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';

export interface AiDetectedDamage {
    panel: string;
    damage_type: string;
    severity: 'minor' | 'moderate' | 'severe' | string;
    description: string;
    confidence_score: number;
    photo_index?: number | null;
    suggested_repair_cost: number;
    is_new_damage: boolean;
}

export interface AiInspectionData {
    id: number;
    inspection_type: string;
    model_used: string;
    extracted_odometer: number | null;
    extracted_fuel_level: string | null;
    condition_summary: string | null;
    overall_status: 'clean' | 'minor_damage' | 'severe_damage' | string;
    detected_damages: AiDetectedDamage[];
    created_at?: string;
    created_by_user?: { id: number; name: string } | null;
}

interface Props {
    inspection: AiInspectionData | null;
    canInspect: boolean;
    inspectUrl: string;
    applyDamageUrl?: string;
    hasReturnPhotos: boolean;
}

export default function AiHandoverInspectionPanel({
    inspection,
    canInspect,
    inspectUrl,
    applyDamageUrl,
    hasReturnPhotos,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [loading, setLoading] = useState(false);
    const [applyingDamageId, setApplyingDamageId] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleRunInspection = () => {
        if (loading) return;
        setLoading(true);
        setErrorMsg(null);

        router.post(
            inspectUrl,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setLoading(false),
                onError: (errors) => {
                    setLoading(false);
                    const firstError = Object.values(errors)[0];
                    if (firstError) setErrorMsg(firstError as string);
                },
                onFinish: () => setLoading(false),
            }
        );
    };

    const handleApplyDamage = (damage: AiDetectedDamage, index: number) => {
        if (!applyDamageUrl || applyingDamageId !== null) return;
        setApplyingDamageId(index);

        router.post(
            applyDamageUrl,
            {
                description: `[AI] ${damage.description} (${damage.panel})`,
                amount: damage.suggested_repair_cost || 0,
            },
            {
                preserveScroll: true,
                onSuccess: () => setApplyingDamageId(null),
                onError: () => setApplyingDamageId(null),
                onFinish: () => setApplyingDamageId(null),
            }
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'clean':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {t('rental.ai.clean_badge')}
                    </span>
                );
            case 'minor_damage':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {t('rental.ai.minor_damage_badge')}
                    </span>
                );
            case 'severe_damage':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {t('rental.ai.severe_damage_badge')}
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 p-4 dark:border-indigo-900/50 dark:from-gray-800/80 dark:via-gray-800 dark:to-indigo-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/80 pb-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:bg-indigo-500 dark:shadow-none">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {t('rental.ai.inspection_title')}
                            </h4>
                            {inspection && getStatusBadge(inspection.overall_status)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('rental.ai.inspection_subtitle')}
                        </p>
                    </div>
                </div>

                {canInspect && hasReturnPhotos && (
                    <button
                        type="button"
                        onClick={handleRunInspection}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        {loading ? (
                            <>
                                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {t('rental.ai.scanning')}
                            </>
                        ) : (
                            t('rental.ai.btn_scan_existing')
                        )}
                    </button>
                )}
            </div>

            {errorMsg && (
                <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    {errorMsg}
                </div>
            )}

            {inspection ? (
                <div className="mt-3 space-y-3">
                    {/* Ringkasan & Extracted Metrics */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {inspection.extracted_odometer !== null && (
                            <div className="rounded-lg border border-gray-200/80 bg-white/80 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                    {t('rental.ai.extracted_odometer')}
                                </span>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {inspection.extracted_odometer.toLocaleString()} km
                                </p>
                            </div>
                        )}
                        {inspection.extracted_fuel_level && (
                            <div className="rounded-lg border border-gray-200/80 bg-white/80 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                    {t('rental.ai.extracted_fuel')}
                                </span>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {inspection.extracted_fuel_level}
                                </p>
                            </div>
                        )}
                        <div className="rounded-lg border border-gray-200/80 bg-white/80 p-2.5 shadow-sm sm:col-span-1 dark:border-gray-700 dark:bg-gray-800">
                            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                {t('rental.ai.summary')}
                            </span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                                {inspection.condition_summary || '-'}
                            </p>
                        </div>
                    </div>

                    {/* Detected Damages List */}
                    {inspection.detected_damages && inspection.detected_damages.length > 0 ? (
                        <div className="space-y-2">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                ⚠️ {t('rental.ai.damage_detected_title')} ({inspection.detected_damages.length})
                            </h5>
                            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
                                {inspection.detected_damages.map((damage, index) => (
                                    <div key={index} className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {damage.panel}
                                                </span>
                                                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                    {damage.damage_type} ({damage.severity})
                                                </span>
                                                <span className="text-[11px] text-gray-400">
                                                    Confidence: {Math.round(damage.confidence_score * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                {damage.description}
                                            </p>
                                            {damage.suggested_repair_cost > 0 && (
                                                <p className="font-medium text-amber-700 dark:text-amber-400">
                                                    {t('rental.ai.suggested_cost')}: {formatMoney(damage.suggested_repair_cost)}
                                                </p>
                                            )}
                                        </div>

                                        {applyDamageUrl && (
                                            <button
                                                type="button"
                                                onClick={() => handleApplyDamage(damage, index)}
                                                disabled={applyingDamageId === index}
                                                className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-950/50 dark:text-rose-300"
                                            >
                                                {applyingDamageId === index ? (
                                                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                ) : (
                                                    '➕ ' + t('rental.ai.create_damage_claim')
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/80 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="text-base">✅</span>
                            <div>
                                <p className="font-semibold">{t('rental.ai.clean_title')}</p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{t('rental.ai.clean_desc')}</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {hasReturnPhotos
                        ? 'Klik tombol di atas untuk menjalankan analisis foto serah terima dengan AI.'
                        : 'Hasil analisis AI akan muncul setelah foto pengembalian (return) diunggah.'}
                </div>
            )}
        </div>
    );
}
