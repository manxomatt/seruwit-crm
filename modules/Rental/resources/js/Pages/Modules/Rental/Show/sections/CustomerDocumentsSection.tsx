import { Link } from '@inertiajs/react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import React, { useState } from 'react';
import AiKycVerificationCard from '../../../../../Components/AiKycVerificationCard';
import { SectionCard } from '../../ShowUi';
import UploadDocumentsModal from '../modals/UploadDocumentsModal';
import type { Rental } from '../types';

interface Props {
    rental: Rental;
    passengerKtpUrl?: string | null;
    passengerSimUrl?: string | null;
    uploadDocumentsUrl?: string | null;
    aiKycEnabled: boolean;
    aiScanKycUrl?: string | null;
    aiSyncKycPartnerUrl?: string | null;
}

export default function CustomerDocumentsSection({
    rental,
    passengerKtpUrl,
    passengerSimUrl,
    uploadDocumentsUrl,
    aiKycEnabled,
    aiScanKycUrl,
    aiSyncKycPartnerUrl,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [showUploadModal, setShowUploadModal] = useState(false);

    const partnerKycStatus = rental.partner?.kyc_status;
    const hasKtp = Boolean(rental.passenger_ktp_path && passengerKtpUrl);
    const hasSim = Boolean(rental.passenger_sim_path && passengerSimUrl);
    const canUpdate = rental.status !== 'cancelled' && rental.status !== 'cancelled_paid';

    const isPdf = (path?: string | null) => {
        if (!path) return false;
        return path.toLowerCase().endsWith('.pdf');
    };

    return (
        <SectionCard
            title={t('rental.documents.section_title', undefined, 'Dokumen Identitas Pelanggan (KTP & SIM)')}
            subtitle={t('rental.documents.section_subtitle', undefined, 'Verifikasi identitas penyewa dan izin mengemudi')}
            icon="🪪"
            action={
                uploadDocumentsUrl && canUpdate ? (
                    <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition"
                    >
                        <span>📁</span>
                        <span>{hasKtp || hasSim ? t('rental.documents.btn_update', undefined, 'Perbarui Dokumen') : t('rental.documents.btn_upload', undefined, 'Unggah Dokumen')}</span>
                    </button>
                ) : undefined
            }
        >
            <div className="space-y-6">
                {/* Partner KYC Status Alert Banner */}
                {rental.partner && (
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xs ${
                        partnerKycStatus === 'verified'
                            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                            : partnerKycStatus === 'pending'
                            ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30'
                            : partnerKycStatus === 'rejected'
                            ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/30'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-850/40'
                    }`}>
                        <div className="flex items-center gap-3">
                            <span className="text-xl">
                                {partnerKycStatus === 'verified' ? '🛡️' : partnerKycStatus === 'pending' ? '⏳' : partnerKycStatus === 'rejected' ? '❌' : '📋'}
                            </span>
                            <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Status KYC Pelanggan:</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                        partnerKycStatus === 'verified'
                                            ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                                            : partnerKycStatus === 'pending'
                                            ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-300 animate-pulse'
                                            : partnerKycStatus === 'rejected'
                                            ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-300'
                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {partnerKycStatus === 'verified'
                                            ? 'Terverifikasi'
                                            : partnerKycStatus === 'pending'
                                            ? 'Menunggu Review'
                                            : partnerKycStatus === 'rejected'
                                            ? 'Ditolak'
                                            : 'Belum Terverifikasi'}
                                    </span>
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {partnerKycStatus === 'pending'
                                        ? 'Pelanggan telah mengunggah KTP/SIM dan menunggu verifikasi admin.'
                                        : partnerKycStatus === 'verified'
                                        ? 'Identitas pelanggan telah diverifikasi valid.'
                                        : partnerKycStatus === 'rejected'
                                        ? 'Dokumen pelanggan sebelumnya ditolak.'
                                        : 'Dokumen belum diverifikasi.'}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={prefixedRoute('partners.show', rental.partner.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-750 transition shrink-0"
                        >
                            <span>Buka Verifikasi KYC di Kontak</span>
                            <span>↗</span>
                        </Link>
                    </div>
                )}

                {/* 2-Column Document Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* KTP Document Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🇮🇩</span>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                            {t('rental.documents.ktp_title', undefined, 'Kartu Tanda Penduduk (e-KTP)')}
                                        </h4>
                                        <p className="text-[11px] text-slate-400">
                                            {rental.partner.name}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                        hasKtp
                                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            : 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${hasKtp ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    {hasKtp ? t('rental.documents.uploaded', undefined, 'Terunggah') : t('rental.documents.not_uploaded', undefined, 'Belum Diunggah')}
                                </span>
                            </div>

                            {/* Content / Preview */}
                            <div className="mt-3">
                                {hasKtp && passengerKtpUrl ? (
                                    isPdf(rental.passenger_ktp_path) ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
                                            <span className="text-3xl">📄</span>
                                            <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Dokumen e-KTP (PDF)
                                            </p>
                                            <a
                                                href={passengerKtpUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                                            >
                                                <span>Buka Dokumen PDF ↗</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <a
                                                href={passengerKtpUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                                            >
                                                <img
                                                    src={passengerKtpUrl}
                                                    alt="KTP Pelanggan"
                                                    className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-black text-slate-900 shadow-md">
                                                        🔍 Lihat Ukuran Penuh ↗
                                                    </span>
                                                </div>
                                            </a>
                                            <div className="flex justify-end">
                                                <a
                                                    href={passengerKtpUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                                >
                                                    Buka Dokumen Asli ↗
                                                </a>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center dark:border-slate-800 dark:bg-slate-850/40">
                                        <span className="text-3xl opacity-50">🪪</span>
                                        <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            {t('rental.documents.ktp_missing', undefined, 'Pelanggan belum mengunggah foto e-KTP.')}
                                        </p>
                                        {uploadDocumentsUrl && canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => setShowUploadModal(true)}
                                                className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                            >
                                                + Unggah e-KTP Sekarang
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SIM Document Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🚗</span>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                            {t('rental.documents.sim_title', undefined, 'Surat Izin Mengemudi (SIM)')}
                                        </h4>
                                        <p className="text-[11px] text-slate-400">
                                            {rental.partner.name}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                        hasSim
                                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            : 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${hasSim ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    {hasSim ? t('rental.documents.uploaded', undefined, 'Terunggah') : t('rental.documents.not_uploaded', undefined, 'Belum Diunggah')}
                                </span>
                            </div>

                            {/* Content / Preview */}
                            <div className="mt-3">
                                {hasSim && passengerSimUrl ? (
                                    isPdf(rental.passenger_sim_path) ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
                                            <span className="text-3xl">📄</span>
                                            <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Dokumen SIM (PDF)
                                            </p>
                                            <a
                                                href={passengerSimUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                                            >
                                                <span>Buka Dokumen PDF ↗</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <a
                                                href={passengerSimUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                                            >
                                                <img
                                                    src={passengerSimUrl}
                                                    alt="SIM Pelanggan"
                                                    className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-black text-slate-900 shadow-md">
                                                        🔍 Lihat Ukuran Penuh ↗
                                                    </span>
                                                </div>
                                            </a>
                                            <div className="flex justify-end">
                                                <a
                                                    href={passengerSimUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                                >
                                                    Buka Dokumen Asli ↗
                                                </a>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center dark:border-slate-800 dark:bg-slate-850/40">
                                        <span className="text-3xl opacity-50">🚗</span>
                                        <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            {t('rental.documents.sim_missing', undefined, 'Pelanggan belum mengunggah foto SIM.')}
                                        </p>
                                        {uploadDocumentsUrl && canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => setShowUploadModal(true)}
                                                className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                            >
                                                + Unggah SIM Sekarang
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI KYC Verification Card (When AI KYC is Enabled) */}
                {aiKycEnabled && (
                    <div className="pt-2">
                        <AiKycVerificationCard
                            assessment={rental.ai_kyc_assessment ?? null}
                            hasKtp={Boolean(rental.passenger_ktp_path)}
                            hasSim={Boolean(rental.passenger_sim_path)}
                            aiScanKycUrl={aiScanKycUrl || ''}
                            aiSyncKycPartnerUrl={aiSyncKycPartnerUrl}
                            canUpdate={canUpdate}
                        />
                    </div>
                )}
            </div>

            {/* Modal for staff upload */}
            {showUploadModal && uploadDocumentsUrl && (
                <UploadDocumentsModal
                    show={showUploadModal}
                    rental={rental}
                    uploadUrl={uploadDocumentsUrl}
                    onClose={() => setShowUploadModal(false)}
                />
            )}
        </SectionCard>
    );
}
