import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTrans } from '@/hooks/useTrans';
import { router } from '@inertiajs/react';
import React, { useState } from 'react';

export interface KycAssessmentData {
    status: 'verified' | 'flagged' | 'rejected' | 'unclear';
    risk_level: 'low' | 'medium' | 'high';
    risk_score: number;
    summary: string;
    ktp?: {
        nik?: string;
        name?: string;
        birth_date?: string;
        address?: string;
        religion?: string;
        occupation?: string;
        confidence?: number;
    } | null;
    sim?: {
        license_number?: string;
        license_type?: string;
        name?: string;
        expires_at?: string;
        is_expired?: boolean;
        confidence?: number;
    } | null;
    checks?: {
        name_match_score?: number;
        sim_valid_for_rental?: boolean;
        is_blacklisted?: boolean;
        issues?: string[];
    };
    raw_response?: Record<string, unknown>;
    scanned_at?: string;
}

interface Props {
    assessment: KycAssessmentData | null;
    hasKtp: boolean;
    hasSim: boolean;
    aiScanKycUrl: string;
    aiSyncKycPartnerUrl?: string;
    canUpdate: boolean;
}

export default function AiKycVerificationCard({
    assessment,
    hasKtp,
    hasSim,
    aiScanKycUrl,
    aiSyncKycPartnerUrl,
    canUpdate,
}: Props) {
    const { t } = useTrans();
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleRunKyc = () => {
        if (loading) return;
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        router.post(
            aiScanKycUrl,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLoading(false);
                    setSuccessMsg(t('rental.ai.kyc_success', undefined, 'Verifikasi KYC dokumen berhasil dilakukan.'));
                },
                onError: (errors) => {
                    setLoading(false);
                    const msg = Object.values(errors)[0] || t('rental.ai.inspection_failed', undefined, 'Gagal menjalankan verifikasi.');
                    setErrorMsg(String(msg));
                },
            }
        );
    };

    const handleSyncPartner = () => {
        if (syncing || !aiSyncKycPartnerUrl) return;
        setSyncing(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        router.post(
            aiSyncKycPartnerUrl,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSyncing(false);
                    setSuccessMsg(t('rental.ai.sync_partner_success', undefined, 'Data identitas berhasil disinkronkan ke profil pelanggan.'));
                },
                onError: (errors) => {
                    setSyncing(false);
                    const msg = Object.values(errors)[0] || 'Gagal sinkronisasi data.';
                    setErrorMsg(String(msg));
                },
            }
        );
    };

    const riskBadge = (level: string, score: number) => {
        if (level === 'low') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Low Risk (Skor {score}/100) • Aman
                </span>
            );
        }
        if (level === 'medium') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Medium Risk (Skor {score}/100) • Perhatian
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100/80 px-3 py-1 text-xs font-bold text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-600" />
                High Risk (Skor {score}/100) • Berbahaya
            </span>
        );
    };

    return (
        <div className="rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 p-5 sm:p-6 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/30">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-4 dark:border-indigo-900/50">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-base text-white shadow-md shadow-indigo-500/20">
                        🪪
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                {t('rental.ai.kyc_title', undefined, 'AI Smart KYC & Customer Risk Assessment')}
                            </h3>
                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                                Gemini Vision
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('rental.ai.kyc_subtitle', undefined, 'Verifikasi keaslian KTP/SIM, masa berlaku, kesesuaian nama, dan deteksi risiko fraud.')}
                        </p>
                    </div>
                </div>

                {assessment && riskBadge(assessment.risk_level, assessment.risk_score)}
            </div>

            {/* Notifications */}
            {errorMsg && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                    ❌ {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    ✅ {successMsg}
                </div>
            )}

            {/* Body State */}
            {!assessment ? (
                <div className="mt-5 rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-6 text-center dark:border-indigo-800/60 dark:bg-slate-900/60">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {hasKtp || hasSim
                            ? t('rental.ai.documents_ready_hint', undefined, 'Dokumen KTP/SIM telah diunggah. Jalankan AI KYC untuk memverifikasi profil dan masa berlaku SIM.')
                            : t('rental.ai.no_documents_uploaded', undefined, 'Belum ada dokumen KTP atau SIM yang diunggah untuk rental ini.')}
                    </p>
                    {canUpdate && (hasKtp || hasSim) && (
                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={handleRunKyc}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-sky-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Memindai & Menganalisis Dokumen...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>{t('rental.ai.btn_run_kyc', undefined, 'Jalankan Verifikasi AI KYC')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-5 space-y-4">
                    {/* Summary banner */}
                    <div className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm dark:border-indigo-900/40 dark:bg-slate-900/80">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {assessment.summary}
                        </p>

                        {/* Checklist items */}
                        {assessment.checks && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kesesuaian Nama</span>
                                    <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                        {Math.round((assessment.checks.name_match_score ?? 1) * 100)}% Cocok
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Validitas SIM Sewa</span>
                                    <p className={`mt-0.5 font-bold ${assessment.checks.sim_valid_for_rental ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {assessment.checks.sim_valid_for_rental ? '✅ Berlaku s/d Sewa Selesai' : '❌ Kedaluwarsa / Tidak Cukup'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Blacklist</span>
                                    <p className={`mt-0.5 font-bold ${assessment.checks.is_blacklisted ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {assessment.checks.is_blacklisted ? '⚠️ Terdaftar Blacklist' : '✅ Bersih'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Issues if any */}
                        {assessment.checks?.issues && assessment.checks.issues.length > 0 && (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/40">
                                <span className="font-bold text-amber-900 dark:text-amber-300">Catatan Risiko:</span>
                                <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-800 dark:text-amber-400">
                                    {assessment.checks.issues.map((issue, i) => (
                                        <li key={i}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Extracted Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* KTP Box */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🇮🇩</span>
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                                        Data KTP (e-KTP)
                                    </h4>
                                </div>
                                {assessment.ktp?.confidence && (
                                    <span className="text-[10px] text-slate-400">
                                        Akurasi: {Math.round(assessment.ktp.confidence * 100)}%
                                    </span>
                                )}
                            </div>

                            {assessment.ktp ? (
                                <dl className="mt-3 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <dt className="text-slate-400">NIK:</dt>
                                        <dd className="font-mono font-bold text-slate-900 dark:text-white">
                                            {assessment.ktp.nik || '-'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-400">Nama:</dt>
                                        <dd className="font-bold text-slate-900 dark:text-white">
                                            {assessment.ktp.name || '-'}
                                        </dd>
                                    </div>
                                    {assessment.ktp.birth_date && (
                                        <div className="flex justify-between">
                                            <dt className="text-slate-400">Tgl Lahir:</dt>
                                            <dd className="text-slate-800 dark:text-slate-200">{assessment.ktp.birth_date}</dd>
                                        </div>
                                    )}
                                    {assessment.ktp.address && (
                                        <div className="pt-1">
                                            <dt className="text-slate-400">Alamat:</dt>
                                            <dd className="mt-0.5 text-slate-700 dark:text-slate-300 line-clamp-2">
                                                {assessment.ktp.address}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p className="mt-3 text-xs italic text-slate-400">Dokumen KTP tidak terdeteksi atau tidak diunggah.</p>
                            )}
                        </div>

                        {/* SIM Box */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🚗</span>
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                                        Data SIM ({assessment.sim?.license_type || 'SIM Nasional'})
                                    </h4>
                                </div>
                                {assessment.sim?.confidence && (
                                    <span className="text-[10px] text-slate-400">
                                        Akurasi: {Math.round(assessment.sim.confidence * 100)}%
                                    </span>
                                )}
                            </div>

                            {assessment.sim ? (
                                <dl className="mt-3 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <dt className="text-slate-400">Nomor SIM:</dt>
                                        <dd className="font-mono font-bold text-slate-900 dark:text-white">
                                            {assessment.sim.license_number || '-'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-400">Nama:</dt>
                                        <dd className="font-bold text-slate-900 dark:text-white">
                                            {assessment.sim.name || '-'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-400">Masa Berlaku:</dt>
                                        <dd className={`font-bold ${assessment.sim.is_expired ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                            {assessment.sim.expires_at || '-'} {assessment.sim.is_expired && '(Expired)'}
                                        </dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="mt-3 text-xs italic text-slate-400">Dokumen SIM tidak terdeteksi atau tidak diunggah.</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {canUpdate && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <span className="text-[11px] text-slate-400">
                                Dipindai pada: {assessment.scanned_at ? new Date(assessment.scanned_at).toLocaleString('id-ID') : '-'}
                            </span>

                            <div className="flex items-center gap-2.5">
                                {aiSyncKycPartnerUrl && (assessment.ktp || assessment.sim) && (
                                    <button
                                        type="button"
                                        onClick={handleSyncPartner}
                                        disabled={syncing}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                    >
                                        {syncing ? 'Menyinkronkan...' : '🔄 Sinkronkan ke Profil Pelanggan'}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleRunKyc}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    {loading ? 'Memindai...' : '✨ Pindai Ulang Dokumen'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
