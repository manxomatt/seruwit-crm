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
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/80 via-sky-50/40 to-slate-50/90 p-6 sm:p-8 shadow-sm transition-all duration-300 dark:border-indigo-900/40 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900">
            {/* Ambient Soft Colorful Glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-300/30 to-purple-300/25 blur-3xl dark:from-indigo-600/10 dark:to-purple-600/10" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-300/30 to-teal-300/25 blur-3xl dark:from-sky-600/10 dark:to-teal-600/10" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-600/5" />

            <div className="relative z-10 flex flex-col gap-6">
                {/* Header Badge, Title & Description */}
                <div className="flex flex-col items-start gap-2.5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-500/20 backdrop-blur-md dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-400/30">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse dark:bg-indigo-400" />
                        <span>{t('dashboard.onboarding.badge', undefined, 'PANDUAN SETUP AWAL')}</span>
                    </div>

                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-white">
                        {t('dashboard.onboarding.title', undefined, 'Siapkan Data Armada & Kontak Bisnis Anda')}
                    </h2>

                    <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {t(
                            'dashboard.onboarding.desc',
                            undefined,
                            'Daftarkan unit kendaraan armada dan kontak pelanggan/vendor untuk mengaktifkan fitur reservasi sewa, pelacakan live GPS, dan penagihan invoice otomatis.',
                        )}
                    </p>
                </div>

                {/* Progress Bar Card */}
                <div className="rounded-2xl border border-indigo-100/80 bg-white/80 p-4 sm:p-5 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="mb-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                            {t('dashboard.onboarding.progress_label', undefined, 'Kelengkapan Data Utama')}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-extrabold text-indigo-700 ring-1 ring-indigo-500/20 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-400/30">
                            {progressPercent}% Selesai
                        </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60 dark:bg-slate-700/60 dark:ring-slate-700/60">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-700 shadow-sm"
                            style={{ width: `${Math.max(progressPercent, 6)}%` }}
                        />
                    </div>
                </div>

                {/* 2 Interactive Step Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Step 1: Fleet Vehicles */}
                    {has_fleet && (
                        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-800/90 dark:hover:border-indigo-800/60">
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/15 group-hover:scale-105 transition-transform duration-300 dark:bg-indigo-950/60 dark:text-indigo-400 dark:ring-indigo-400/30">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
                                        </svg>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${
                                            vehicles_count > 0
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                                                : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                vehicles_count > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`}
                                        />
                                        {vehicles_count > 0
                                            ? t('dashboard.onboarding.step_fleet_done', { count: vehicles_count }, `${vehicles_count} Unit Terdaftar`)
                                            : t('dashboard.onboarding.step_fleet_empty', undefined, 'Belum Ada Unit')}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                        {t('dashboard.onboarding.step_fleet_title', undefined, '1. Daftarkan Unit Kendaraan')}
                                    </h4>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {t(
                                            'dashboard.onboarding.step_fleet_desc',
                                            undefined,
                                            'Masukkan data unit mobil, bus, atau truk lengkap dengan plat nomor, tipe, dan kapasitas.',
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                {vehicles_count === 0 ? (
                                    can_create_vehicle ? (
                                        <Link
                                            href={prefixedRoute('fleet.vehicles.create')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow shadow-indigo-500/20 transition-all active:scale-[0.99]"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            <span>{t('dashboard.onboarding.step_fleet_cta', undefined, 'Tambah Kendaraan')}</span>
                                            <svg className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('fleet.vehicles.index')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all"
                                        >
                                            <span>{t('dashboard.onboarding.step_fleet_view', undefined, 'Lihat Armada')}</span>
                                            <svg className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>
                                    )
                                ) : (
                                    <Link
                                        href={prefixedRoute('fleet.vehicles.index')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 dark:border-emerald-800/40 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all"
                                    >
                                        <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                        <span>{t('dashboard.onboarding.step_fleet_done', { count: vehicles_count }, `${vehicles_count} Unit Siap`)}</span>
                                        <span className="text-emerald-400">&bull;</span>
                                        <span>{t('dashboard.onboarding.step_fleet_view', undefined, 'Lihat Armada')}</span>
                                        <svg className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Partners / Contacts */}
                    {has_partners && (
                        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-sky-200 hover:shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-800/90 dark:hover:border-sky-800/60">
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/15 group-hover:scale-105 transition-transform duration-300 dark:bg-sky-950/60 dark:text-sky-400 dark:ring-sky-400/30">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6 0 3.375 3.375 0 016 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                        </svg>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${
                                            partners_count > 0
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                                                : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                partners_count > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`}
                                        />
                                        {partners_count > 0
                                            ? t('dashboard.onboarding.step_partners_done', { count: partners_count }, `${partners_count} Kontak Terdaftar`)
                                            : t('dashboard.onboarding.step_partners_empty', undefined, 'Belum Ada Kontak')}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                        {t('dashboard.onboarding.step_partners_title', undefined, '2. Daftarkan Kontak & Mitra')}
                                    </h4>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {t(
                                            'dashboard.onboarding.step_partners_desc',
                                            undefined,
                                            'Tambahkan data customer, penyewa, supir armada, vendor bengkel, atau rekanan bisnis.',
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                {partners_count === 0 ? (
                                    can_create_partner ? (
                                        <Link
                                            href={prefixedRoute('partners.create')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow shadow-sky-500/20 transition-all active:scale-[0.99]"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            <span>{t('dashboard.onboarding.step_partners_cta', undefined, 'Tambah Kontak')}</span>
                                            <svg className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('partners.index')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all"
                                        >
                                            <span>{t('dashboard.onboarding.step_partners_view', undefined, 'Lihat Kontak')}</span>
                                            <svg className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>
                                    )
                                ) : (
                                    <Link
                                        href={prefixedRoute('partners.index')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 dark:border-emerald-800/40 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all"
                                    >
                                        <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                        <span>{t('dashboard.onboarding.step_partners_done', { count: partners_count }, `${partners_count} Kontak Tersimpan`)}</span>
                                        <span className="text-emerald-400">&bull;</span>
                                        <span>{t('dashboard.onboarding.step_partners_view', undefined, 'Lihat Kontak')}</span>
                                        <svg className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3 Unlocked Benefits */}
                <div className="rounded-2xl border border-indigo-100/70 bg-white/70 p-4 sm:p-5 backdrop-blur-sm shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5 flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                        <span>{t('dashboard.onboarding.benefits_title', undefined, 'Fitur yang Otomatis Aktif Setelah Data Lengkap:')}</span>
                    </p>
                    <div className="grid gap-3.5 sm:grid-cols-3">
                        <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800/60 transition-colors">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 ring-1 ring-purple-500/20 dark:bg-purple-950/60 dark:text-purple-400 dark:ring-purple-400/30">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.248v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.248V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                                </svg>
                            </div>
                            <div>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {t('dashboard.onboarding.benefit_rental', undefined, 'Booking & Invoice Rental')}
                                </h5>
                                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    {t(
                                        'dashboard.onboarding.benefit_rental_desc',
                                        undefined,
                                        'Pilih unit dan customer secara instan saat membuat reservasi sewa.',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800/60 transition-colors">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-950/60 dark:text-sky-400 dark:ring-sky-400/30">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                            </div>
                            <div>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {t('dashboard.onboarding.benefit_tracking', undefined, 'Live Tracking GPS')}
                                </h5>
                                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    {t(
                                        'dashboard.onboarding.benefit_tracking_desc',
                                        undefined,
                                        'Pantau pergerakan posisi kendaraan, kecepatan, dan status mesin di peta.',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800/60 transition-colors">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-400/30">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <div>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {t('dashboard.onboarding.benefit_finance', undefined, 'Akuntansi & Statement')}
                                </h5>
                                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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
