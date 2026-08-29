import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';
import React from 'react';

export interface OnboardingOverview {
    has_fleet: boolean;
    has_partners: boolean;
    vehicles_count: number;
    partners_count: number;
    can_create_vehicle: boolean;
    can_create_partner: boolean;
}

interface Props {
    onboarding?: OnboardingOverview;
}

export default function DashboardOnboardingCTA({ onboarding }: Props): JSX.Element | null {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    if (!onboarding) {
        return null;
    }

    const {
        has_fleet,
        has_partners,
        vehicles_count,
        partners_count,
        can_create_vehicle,
        can_create_partner,
    } = onboarding;

    const needsFleet = has_fleet && vehicles_count === 0;
    const needsPartners = has_partners && partners_count === 0;

    // If both are already filled (or neither module is active), don't show the CTA
    if (!needsFleet && !needsPartners) {
        return null;
    }

    const totalSteps = (has_fleet ? 1 : 0) + (has_partners ? 1 : 0);
    const completedSteps =
        (has_fleet && vehicles_count > 0 ? 1 : 0) +
        (has_partners && partners_count > 0 ? 1 : 0);
    const progressPercent = Math.round((completedSteps / Math.max(totalSteps, 1)) * 100);

    return (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6">
                {/* Header Badge & Title */}
                <div className="flex flex-col items-start gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-400/30 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span>{t('dashboard.onboarding.badge', undefined, 'PANDUAN SETUP AWAL')}</span>
                    </div>

                    <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">
                        {t('dashboard.onboarding.title', undefined, 'Siapkan Data Armada & Kontak Bisnis Anda')}
                    </h2>

                    <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-300">
                        {t(
                            'dashboard.onboarding.desc',
                            undefined,
                            'Daftarkan unit kendaraan armada dan kontak pelanggan/vendor untuk mengaktifkan fitur reservasi sewa, pelacakan live GPS, dan penagihan invoice otomatis.',
                        )}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300">
                            {t('dashboard.onboarding.progress_label', undefined, 'Kelengkapan Data Utama')}
                        </span>
                        <span className="text-indigo-300 font-extrabold">{progressPercent}% Selesai</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${Math.max(progressPercent, 5)}%` }}
                        />
                    </div>
                </div>

                {/* 2 Interactive Step Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Step 1: Fleet Vehicles */}
                    {has_fleet && (
                        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:bg-white/[0.07]">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-xl ring-1 ring-indigo-400/30">
                                        🚗
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                            vehicles_count > 0
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                                : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                        }`}
                                    >
                                        {vehicles_count > 0
                                            ? t('dashboard.onboarding.step_fleet_done', { count: vehicles_count }, `${vehicles_count} Unit Terdaftar`)
                                            : t('dashboard.onboarding.step_fleet_empty', undefined, 'Belum Ada Unit')}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-extrabold text-white">
                                        {t('dashboard.onboarding.step_fleet_title', undefined, '1. Daftarkan Unit Kendaraan')}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                        {t(
                                            'dashboard.onboarding.step_fleet_desc',
                                            undefined,
                                            'Masukkan data unit mobil, bus, atau truk lengkap dengan plat nomor, tipe, dan kapasitas.',
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/10">
                                {vehicles_count === 0 ? (
                                    can_create_vehicle ? (
                                        <Link
                                            href={prefixedRoute('fleet.vehicles.create')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            <span>🚗</span>
                                            <span>{t('dashboard.onboarding.step_fleet_cta', undefined, 'Tambah Kendaraan')}</span>
                                            <span>➔</span>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('fleet.vehicles.index')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-slate-200 transition"
                                        >
                                            <span>{t('dashboard.onboarding.step_fleet_view', undefined, 'Lihat Armada')}</span>
                                            <span>➔</span>
                                        </Link>
                                    )
                                ) : (
                                    <Link
                                        href={prefixedRoute('fleet.vehicles.index')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/30 px-4 py-2.5 text-xs font-bold transition"
                                    >
                                        <span>✓ {t('dashboard.onboarding.step_fleet_done', { count: vehicles_count }, `${vehicles_count} Unit Siap`)}</span>
                                        <span>•</span>
                                        <span>{t('dashboard.onboarding.step_fleet_view', undefined, 'Lihat Armada')} ➔</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Partners / Contacts */}
                    {has_partners && (
                        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:bg-white/[0.07]">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-xl ring-1 ring-sky-400/30">
                                        👥
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                            partners_count > 0
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                                : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                        }`}
                                    >
                                        {partners_count > 0
                                            ? t('dashboard.onboarding.step_partners_done', { count: partners_count }, `${partners_count} Kontak Terdaftar`)
                                            : t('dashboard.onboarding.step_partners_empty', undefined, 'Belum Ada Kontak')}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-extrabold text-white">
                                        {t('dashboard.onboarding.step_partners_title', undefined, '2. Daftarkan Kontak & Mitra')}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                        {t(
                                            'dashboard.onboarding.step_partners_desc',
                                            undefined,
                                            'Tambahkan data customer, penyewa, supir armada, vendor bengkel, atau rekanan bisnis.',
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/10">
                                {partners_count === 0 ? (
                                    can_create_partner ? (
                                        <Link
                                            href={prefixedRoute('partners.create')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            <span>👥</span>
                                            <span>{t('dashboard.onboarding.step_partners_cta', undefined, 'Tambah Kontak')}</span>
                                            <span>➔</span>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('partners.index')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-slate-200 transition"
                                        >
                                            <span>{t('dashboard.onboarding.step_partners_view', undefined, 'Lihat Kontak')}</span>
                                            <span>➔</span>
                                        </Link>
                                    )
                                ) : (
                                    <Link
                                        href={prefixedRoute('partners.index')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/30 px-4 py-2.5 text-xs font-bold transition"
                                    >
                                        <span>✓ {t('dashboard.onboarding.step_partners_done', { count: partners_count }, `${partners_count} Kontak Tersimpan`)}</span>
                                        <span>•</span>
                                        <span>{t('dashboard.onboarding.step_partners_view', undefined, 'Lihat Kontak')} ➔</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3 Unlocked Benefits */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                        {t('dashboard.onboarding.benefits_title', undefined, 'Fitur yang Otomatis Aktif Setelah Data Lengkap:')}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-start gap-2.5">
                            <span className="text-base">⚡</span>
                            <div>
                                <h5 className="text-xs font-extrabold text-white">
                                    {t('dashboard.onboarding.benefit_rental', undefined, 'Booking & Invoice Rental')}
                                </h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {t(
                                        'dashboard.onboarding.benefit_rental_desc',
                                        undefined,
                                        'Pilih unit dan customer secara instan saat membuat reservasi sewa.',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="text-base">🗺️</span>
                            <div>
                                <h5 className="text-xs font-extrabold text-white">
                                    {t('dashboard.onboarding.benefit_tracking', undefined, 'Live Tracking GPS')}
                                </h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {t(
                                        'dashboard.onboarding.benefit_tracking_desc',
                                        undefined,
                                        'Pantau pergerakan posisi kendaraan, kecepatan, dan status mesin di peta.',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="text-base">📑</span>
                            <div>
                                <h5 className="text-xs font-extrabold text-white">
                                    {t('dashboard.onboarding.benefit_finance', undefined, 'Akuntansi & Statement')}
                                </h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {t(
                                        'dashboard.onboarding.benefit_finance_desc',
                                        undefined,
                                        'Riwayat transaksi, piutang, dan invoice pelanggan tercatat rapi terintegrasi.',
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
