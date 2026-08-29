import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';
import React, { useState } from 'react';

export interface PartnerSetupCounts {
    total: number;
    active: number;
    customers: number;
    suppliers: number;
    locations: number;
    missing_contact: number;
}

export interface PartnerSetupPermissions {
    create?: boolean;
}

interface Props {
    counts: PartnerSetupCounts;
    can?: PartnerSetupPermissions;
    mode?: 'full' | 'banner';
}

export default function PartnerOnboardingHero({ counts, can, mode = 'full' }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [collapsed, setCollapsed] = useState(false);

    const hasPartners = counts.total > 0;
    const hasRoles = counts.customers > 0 || counts.suppliers > 0;
    const hasLocations = counts.locations > 0;
    const hasMissingContact = counts.missing_contact > 0;

    const completedSteps = (hasPartners ? 1 : 0) + (hasRoles ? 1 : 0) + (hasLocations ? 1 : 0);
    const progressPercent = Math.round((completedSteps / 3) * 100);

    // Next recommended action
    const nextStep = !hasPartners
        ? {
              label: t('partners.dashboard.onboarding.step1_cta', undefined, 'Tambah Kontak Pertama'),
              route: 'partners.create',
              icon: '👥',
              stepName: t('partners.dashboard.onboarding.step1_title', undefined, '1. Daftarkan Kontak Utama'),
          }
        : !hasRoles
          ? {
                label: t('partners.dashboard.onboarding.step2_cta', undefined, 'Kelola Tipe Kontak'),
                route: 'partners.types.index',
                icon: '🏷️',
                stepName: t('partners.dashboard.onboarding.step2_title', undefined, '2. Tipe & Klasifikasi Kontak'),
            }
          : !hasLocations
            ? {
                  label: t('partners.dashboard.onboarding.step3_cta', undefined, 'Kelola Lokasi'),
                  route: 'partners.locations.index',
                  icon: '📍',
                  stepName: t('partners.dashboard.onboarding.step3_title', undefined, '3. Atur Lokasi & Rekening Bank'),
              }
            : null;

    // Missing entities for banner description
    const missingNames: string[] = [];
    if (!hasPartners) missingNames.push(t('partners.nav.list', undefined, 'Kontak'));
    if (!hasRoles) missingNames.push(t('partners.nav.types', undefined, 'Tipe Kontak'));
    if (!hasLocations) missingNames.push(t('partners.nav.locations', undefined, 'Lokasi'));

    /* =========================================================================
     * MODE: BANNER (Missing contact info alert or progressive setup)
     * ========================================================================= */
    if (mode === 'banner') {
        // Specialized banner when there are contacts with missing phone/email
        if (hasMissingContact) {
            return (
                <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 dark:border-amber-800/80 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30 p-5 shadow-sm transition-all">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl" />
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 max-w-2xl">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30 text-xl">
                                📇
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-amber-500/20 dark:bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30">
                                        {t('partners.dashboard.onboarding.missing_contact_badge', undefined, 'PERLU DILENGKAPI')}
                                    </span>
                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t(
                                            'partners.dashboard.onboarding.missing_contact_title',
                                            { count: counts.missing_contact },
                                            `${counts.missing_contact} Kontak Belum Memiliki Nomor Telepon / Email`,
                                        )}
                                    </h4>
                                </div>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {t(
                                        'partners.dashboard.onboarding.missing_contact_desc',
                                        undefined,
                                        'Kontak tanpa email atau nomor telepon tidak dapat menerima invoice otomatis, notifikasi reservasi, atau konfirmasi sewa.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <Link
                                href={`${prefixedRoute('partners.index')}?missing_contact=1`}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-amber-600/20 transition"
                            >
                                <span>{t('partners.dashboard.onboarding.missing_contact_cta', undefined, 'Lengkapi Data Kontak')}</span>
                                <span>➔</span>
                            </Link>
                            {can?.create && (
                                <Link
                                    href={prefixedRoute('partners.create')}
                                    className="inline-flex items-center gap-1 rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50/50 dark:hover:bg-slate-700 transition"
                                >
                                    <span>{t('partners.dashboard.onboarding.missing_contact_add_cta', undefined, 'Tambah Kontak Baru')}</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // Generic progressive setup banner
        return (
            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg transition-all dark:border-indigo-800/60 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-lg ring-1 ring-indigo-400/30">
                                👥
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">
                                        {t('partners.dashboard.onboarding.banner_title', undefined, 'Kelengkapan Direktori Kontak Belum Maksimal')}
                                    </h4>
                                    <span className="rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-400/30">
                                        {progressPercent}% Selesai
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300/90 mt-0.5">
                                    {t(
                                        'partners.dashboard.onboarding.banner_desc',
                                        { missing: missingNames.join(', ') },
                                        `Lengkapi data ${missingNames.join(', ')} untuk integrasi transaksi armada dan pengiriman tagihan otomatis.`,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {nextStep && (
                                <Link
                                    href={prefixedRoute(nextStep.route)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-500/30 transition active:scale-95"
                                >
                                    <span>{nextStep.icon}</span>
                                    <span>{nextStep.label}</span>
                                    <span>➔</span>
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={() => setCollapsed(!collapsed)}
                                className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition"
                            >
                                {collapsed ? 'Tampilkan Checklist ▼' : 'Sembunyikan ▲'}
                            </button>
                        </div>
                    </div>

                    {!collapsed && (
                        <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-3 border-t border-white/10">
                            {/* Step 1: Contacts */}
                            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
                                <div className="flex items-center gap-2.5">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${hasPartners ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                        {hasPartners ? '✓' : '1'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-200">
                                        {t('partners.dashboard.onboarding.step1_title', undefined, '1. Kontak Utama')}
                                    </span>
                                </div>
                                <span className={`text-[11px] font-bold ${hasPartners ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {hasPartners ? `${counts.total} Kontak` : 'Perlu Ditambah'}
                                </span>
                            </div>

                            {/* Step 2: Types */}
                            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
                                <div className="flex items-center gap-2.5">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${hasRoles ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                        {hasRoles ? '✓' : '2'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-200">
                                        {t('partners.dashboard.onboarding.step2_title', undefined, '2. Tipe & Peran')}
                                    </span>
                                </div>
                                <span className={`text-[11px] font-bold ${hasRoles ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {hasRoles ? 'Terkonfigurasi' : 'Perlu Diatur'}
                                </span>
                            </div>

                            {/* Step 3: Locations */}
                            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
                                <div className="flex items-center gap-2.5">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${hasLocations ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                        {hasLocations ? '✓' : '3'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-200">
                                        {t('partners.dashboard.onboarding.step3_title', undefined, '3. Lokasi & Rekening')}
                                    </span>
                                </div>
                                <span className={`text-[11px] font-bold ${hasLocations ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {hasLocations ? `${counts.locations} Lokasi` : 'Perlu Diatur'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* =========================================================================
     * MODE: FULL (Zero-State Onboarding Hero when no contacts registered)
     * ========================================================================= */
    return (
        <div className="space-y-6">
            {/* 1. Main Ambient Zero-State Card */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl dark:border-indigo-900/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 sm:p-8">
                {/* Glow lights */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
                <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="pointer-events-none absolute left-1/3 top-1/2 h-60 w-60 -translate-y-1/2 rounded-full bg-violet-600/15 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6">
                    {/* Header + Badge */}
                    <div className="flex flex-col items-start gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-400/30 backdrop-blur-md">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                            <span>{t('partners.dashboard.onboarding.badge', undefined, 'PANDUAN DATABASE KONTAK & MITRA BISNIS')}</span>
                        </div>

                        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                            {t('partners.dashboard.onboarding.title', undefined, 'Mulai Bangun Database Kontak, Pelanggan, & Vendor Anda')}
                        </h2>

                        <p className="max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
                            {t(
                                'partners.dashboard.onboarding.desc',
                                undefined,
                                'Daftarkan customer, supplier armada, dan mitra bisnis untuk mempercepat proses pembuatan reservasi sewa, penerbitan invoice, dan integrasi akuntansi.',
                            )}
                        </p>
                    </div>

                    {/* Setup Progress Bar */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                        <div className="mb-2 flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-300">
                                {t('partners.dashboard.onboarding.progress_label', undefined, 'Kelengkapan Direktori Kontak')}
                            </span>
                            <span className="text-indigo-300 font-extrabold">{progressPercent}% Selesai</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                                style={{ width: `${Math.max(progressPercent, 5)}%` }}
                            />
                        </div>
                        {nextStep && (
                            <p className="mt-2 text-xs text-slate-400 font-medium">
                                <span className="text-slate-300 font-bold">{t('partners.dashboard.onboarding.next_action', undefined, 'Langkah Selanjutnya:')}</span>{' '}
                                <span className="text-indigo-300">{nextStep.stepName}</span>
                            </p>
                        )}
                    </div>

                    {/* Primary CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        {can?.create && (
                            <Link
                                href={prefixedRoute('partners.create')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span>👥</span>
                                <span>{t('partners.dashboard.onboarding.primary_cta', undefined, 'Tambah Kontak Pertama')}</span>
                                <span>➔</span>
                            </Link>
                        )}
                        <Link
                            href={prefixedRoute('partners.index')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-md transition"
                        >
                            <span>📥</span>
                            <span>{t('partners.dashboard.onboarding.import_cta', undefined, 'Impor dari Excel / CSV')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* 2. Interactive 3 Steps Grid */}
            <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('partners.dashboard.onboarding.steps_title', undefined, '3 Langkah Mudah Memulai Manajemen Kontak:')}
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Step 1: Contacts */}
                    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-xl ring-1 ring-indigo-500/20">
                                    👥
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                        hasPartners
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50'
                                    }`}
                                >
                                    {hasPartners
                                        ? t('partners.dashboard.onboarding.step1_status_done', { count: counts.total }, `${counts.total} Kontak`)
                                        : t('partners.dashboard.onboarding.step1_status_empty', undefined, 'Belum Ada Kontak')}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('partners.dashboard.onboarding.step1_title', undefined, '1. Daftarkan Kontak Utama')}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {t(
                                        'partners.dashboard.onboarding.step1_desc',
                                        undefined,
                                        'Masukkan nama pelanggan perorangan, perusahaan, agen, atau vendor armada.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            {can?.create ? (
                                <Link
                                    href={prefixedRoute('partners.create')}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-300 transition"
                                >
                                    <span>{t('partners.dashboard.onboarding.step1_cta', undefined, 'Tambah Kontak')}</span>
                                    <span>➔</span>
                                </Link>
                            ) : (
                                <Link
                                    href={prefixedRoute('partners.index')}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                                >
                                    <span>{t('partners.dashboard.view_all', undefined, 'Lihat Daftar')}</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Types & Classification */}
                    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-xl ring-1 ring-violet-500/20">
                                    🏷️
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                        hasRoles
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    {hasRoles
                                        ? t('partners.dashboard.onboarding.step2_status_done', undefined, 'Tipe Terkonfigurasi')
                                        : t('partners.dashboard.onboarding.step2_status_empty', undefined, 'Perlu Ditentukan')}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('partners.dashboard.onboarding.step2_title', undefined, '2. Tipe & Klasifikasi Kontak')}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {t(
                                        'partners.dashboard.onboarding.step2_desc',
                                        undefined,
                                        'Kelompokkan mitra menjadi Customer, Supplier, VIP, Corporate, atau Agen.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                href={prefixedRoute('partners.types.index')}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 px-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-300 transition"
                            >
                                <span>{t('partners.dashboard.onboarding.step2_cta', undefined, 'Kelola Tipe Kontak')}</span>
                                <span>➔</span>
                            </Link>
                        </div>
                    </div>

                    {/* Step 3: Locations & Bank Accounts */}
                    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-xl ring-1 ring-amber-500/20">
                                    📍
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                        hasLocations
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    {hasLocations
                                        ? t('partners.dashboard.onboarding.step3_status_done', { count: counts.locations }, `${counts.locations} Lokasi`)
                                        : t('partners.dashboard.onboarding.step3_status_empty', undefined, 'Belum Ada Lokasi')}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('partners.dashboard.onboarding.step3_title', undefined, '3. Atur Lokasi & Rekening Bank')}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {t(
                                        'partners.dashboard.onboarding.step3_desc',
                                        undefined,
                                        'Tambahkan titik antar/jemput, cabang pool, dan rekening bank transaksi.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                href={prefixedRoute('partners.locations.index')}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-300 transition"
                            >
                                <span>{t('partners.dashboard.onboarding.step3_cta', undefined, 'Kelola Lokasi')}</span>
                                <span>➔</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Value Proposition Cards (What gets unlocked) */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('partners.dashboard.onboarding.features_title', undefined, 'Fitur Otomatis yang Terbuka Setelah Kontak Terdaftar:')}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Feature 1 */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-lg mb-2.5">
                            ⚡
                        </span>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {t('partners.dashboard.onboarding.feat1_title', undefined, 'Otomatisasi Reservasi & Rental')}
                        </h5>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'partners.dashboard.onboarding.feat1_desc',
                                undefined,
                                'Identitas penyewa, riwayat booking, dan syarat pembayaran terisi otomatis saat membuat invoice rental.',
                            )}
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-lg mb-2.5">
                            🚛
                        </span>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {t('partners.dashboard.onboarding.feat2_title', undefined, 'Manajemen Vendor & Armada')}
                        </h5>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'partners.dashboard.onboarding.feat2_desc',
                                undefined,
                                'Catat riwayat supplier suku cadang, bengkel rekanan, dan logistik armada terpusat.',
                            )}
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-lg mb-2.5">
                            📑
                        </span>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {t('partners.dashboard.onboarding.feat3_title', undefined, 'Partner Statement & Akuntansi')}
                        </h5>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'partners.dashboard.onboarding.feat3_desc',
                                undefined,
                                'Pantau mutasi saldo piutang/utang mitra, riwayat pembayaran, dan laporan rekening koran.',
                            )}
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-lg mb-2.5">
                            📱
                        </span>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {t('partners.dashboard.onboarding.feat4_title', undefined, 'Customer Portal Self-Service')}
                        </h5>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'partners.dashboard.onboarding.feat4_desc',
                                undefined,
                                'Berikan akses login mandiri bagi pelanggan untuk melihat armada, booking online, dan mengunduh invoice.',
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
