import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';
import React, { useState } from 'react';

export interface FleetSetupCounts {
    bases: number;
    vehicles: number;
    drivers: number;
}

export interface FleetSetupPermissions {
    create_base?: boolean;
    create_vehicle?: boolean;
    create_driver?: boolean;
}

interface Props {
    counts: FleetSetupCounts;
    can?: FleetSetupPermissions;
    mode?: 'full' | 'banner';
}

export default function FleetOnboardingHero({ counts, can, mode = 'full' }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [collapsed, setCollapsed] = useState(false);

    const hasBase = counts.bases > 0;
    const hasVehicle = counts.vehicles > 0;
    const hasDriver = counts.drivers > 0;

    const completedSteps = (hasBase ? 1 : 0) + (hasVehicle ? 1 : 0) + (hasDriver ? 1 : 0);
    const progressPercent = Math.round((completedSteps / 3) * 100);

    // Determine the next recommended action
    const nextStep = !hasBase
        ? {
              label: t('fleet.dashboard.onboarding.base_cta_add', undefined, 'Tambah Base Pertama'),
              route: 'fleet.bases.create',
              icon: '🏢',
              stepName: t('fleet.dashboard.onboarding.base_step_title', undefined, '1. Lokasi Pool & Base Armada'),
          }
        : !hasVehicle
          ? {
                label: t('fleet.dashboard.onboarding.vehicle_cta_add', undefined, 'Daftarkan Kendaraan Pertama'),
                route: 'fleet.vehicles.create',
                icon: '🚗',
                stepName: t('fleet.dashboard.onboarding.vehicle_step_title', undefined, '2. Registrasi Unit Kendaraan'),
            }
          : !hasDriver
            ? {
                  label: t('fleet.dashboard.onboarding.driver_cta_add', undefined, 'Tambah Pengemudi Pertama'),
                  route: 'fleet.drivers.create',
                  icon: '👨‍✈️',
                  stepName: t('fleet.dashboard.onboarding.driver_step_title', undefined, '3. Data & Akun Pengemudi'),
              }
            : null;

    // Missing entities list for partial setup text
    const missingNames: string[] = [];
    if (!hasBase) missingNames.push('Base / Pool');
    if (!hasVehicle) missingNames.push('Kendaraan');
    if (!hasDriver) missingNames.push('Pengemudi');

    /* =========================================================================
     * MODE: BANNER (Progressive Setup Checklist above operational dashboard)
     * ========================================================================= */
    if (mode === 'banner') {
        return (
            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg transition-all dark:border-indigo-800/60 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
                {/* Background decorative glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-4">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-lg ring-1 ring-indigo-400/30">
                                🚀
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">
                                        {t('fleet.dashboard.onboarding.banner_title', undefined, 'Setup Armada Belum Selesai')}
                                    </h4>
                                    <span className="rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-400/30">
                                        {progressPercent}% Selesai
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300/90 mt-0.5">
                                    {t(
                                        'fleet.dashboard.onboarding.banner_desc',
                                        { missing: missingNames.join(', ') },
                                        `Lengkapi data ${missingNames.join(', ')} untuk membuka seluruh fitur pemantauan & analitik armada secara optimal.`,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {nextStep && can?.[`create_${!hasBase ? 'base' : !hasVehicle ? 'vehicle' : 'driver'}` as keyof FleetSetupPermissions] !== false && (
                                <Link
                                    href={prefixedRoute(nextStep.route)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-indigo-500/20 transition"
                                >
                                    <span>{nextStep.icon}</span>
                                    <span>{nextStep.label}</span>
                                    <span>➔</span>
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={() => setCollapsed(!collapsed)}
                                className="rounded-xl bg-white/10 hover:bg-white/20 p-1.5 text-xs text-slate-300 transition"
                                title={collapsed ? 'Tampilkan Checklist' : 'Sembunyikan'}
                            >
                                {collapsed ? '▼' : '▲'}
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400 transition-all duration-700"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* 3 Step Compact Pills */}
                    {!collapsed && (
                        <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
                            {/* Step 1: Base */}
                            <div
                                className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-xs transition ${
                                    hasBase
                                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base shrink-0">🏢</span>
                                    <div className="truncate">
                                        <p className="font-bold text-white truncate">1. Pool / Base</p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {hasBase ? `${counts.bases} Base Terdaftar` : 'Belum Ada Base'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {hasBase ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                                            ✓ Selesai
                                        </span>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('fleet.bases.create')}
                                            className="rounded-lg bg-indigo-500/80 hover:bg-indigo-500 px-2 py-1 text-[11px] font-bold text-white transition whitespace-nowrap"
                                        >
                                            + Tambah
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Vehicle */}
                            <div
                                className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-xs transition ${
                                    hasVehicle
                                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base shrink-0">🚗</span>
                                    <div className="truncate">
                                        <p className="font-bold text-white truncate">2. Kendaraan</p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {hasVehicle ? `${counts.vehicles} Unit Terdaftar` : 'Belum Ada Unit'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {hasVehicle ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                                            ✓ Selesai
                                        </span>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('fleet.vehicles.create')}
                                            className="rounded-lg bg-indigo-500/80 hover:bg-indigo-500 px-2 py-1 text-[11px] font-bold text-white transition whitespace-nowrap"
                                        >
                                            + Tambah
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Driver */}
                            <div
                                className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-xs transition ${
                                    hasDriver
                                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base shrink-0">👨‍✈️</span>
                                    <div className="truncate">
                                        <p className="font-bold text-white truncate">3. Pengemudi</p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {hasDriver ? `${counts.drivers} Driver Terdaftar` : 'Belum Ada Driver'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {hasDriver ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                                            ✓ Selesai
                                        </span>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('fleet.drivers.create')}
                                            className="rounded-lg bg-indigo-500/80 hover:bg-indigo-500 px-2 py-1 text-[11px] font-bold text-white transition whitespace-nowrap"
                                        >
                                            + Tambah
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* =========================================================================
     * MODE: FULL (Zero-State Onboarding Experience)
     * ========================================================================= */
    return (
        <div className="space-y-8 pb-12">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white shadow-xl dark:border-slate-800">
                {/* Ambient glow backgrounds */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />

                <div className="relative z-10 max-w-3xl space-y-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/20 px-3.5 py-1.5 text-xs font-black text-indigo-300 ring-1 ring-indigo-400/30 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                        <span>{t('fleet.dashboard.onboarding.badge', undefined, 'PANDUAN SETUP ARMADA')}</span>
                    </div>

                    {/* Heading & Subtitle */}
                    <div className="space-y-2.5">
                        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl leading-tight">
                            {t('fleet.dashboard.onboarding.title', undefined, 'Mulai Bangun Fondasi Manajemen Armada Anda')}
                        </h2>
                        <p className="text-sm text-slate-300 sm:text-base leading-relaxed">
                            {t(
                                'fleet.dashboard.onboarding.description',
                                undefined,
                                'Lengkapi 3 data utama di bawah ini untuk mengaktifkan pemantauan unit secara real-time, analitik konsumsi BBM, pengingat STNK/KIR, dan penugasan pengemudi.',
                            )}
                        </p>
                    </div>

                    {/* Progress Bar & Quick Action */}
                    <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300">
                            <span>
                                {t(
                                    'fleet.dashboard.onboarding.progress',
                                    { completed: completedSteps, total: 3, percent: progressPercent },
                                    `${completedSteps} dari 3 Langkah Selesai (${progressPercent}%)`,
                                )}
                            </span>
                            {nextStep && (
                                <span className="text-indigo-300">
                                    {t('fleet.dashboard.onboarding.next_step', undefined, 'Langkah Selanjutnya')}:{' '}
                                    <strong className="text-white">{nextStep.stepName}</strong>
                                </span>
                            )}
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-xs">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-700 shadow-sm"
                                style={{ width: `${Math.max(5, progressPercent)}%` }}
                            />
                        </div>

                        {nextStep && can?.[`create_${!hasBase ? 'base' : !hasVehicle ? 'vehicle' : 'driver'}` as keyof FleetSetupPermissions] !== false && (
                            <div className="pt-2">
                                <Link
                                    href={prefixedRoute(nextStep.route)}
                                    className="inline-flex items-center gap-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <span className="text-lg">{nextStep.icon}</span>
                                    <span>{nextStep.label}</span>
                                    <span>➔</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3 Core Interactive Step Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Step 1: Base / Pool */}
                <div
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                        hasBase
                            ? 'border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-slate-900 ring-1 ring-emerald-500/20'
                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800'
                    }`}
                >
                    <div className="space-y-4">
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs">
                                🏢
                            </div>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black ${
                                    hasBase
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800'
                                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-200/60 dark:ring-indigo-800'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${hasBase ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                <span>
                                    {hasBase
                                        ? t('fleet.dashboard.onboarding.base_count', { count: counts.bases }, `${counts.bases} Base Terdaftar`)
                                        : t('fleet.dashboard.onboarding.step_pending', undefined, 'Langkah 1 · Perlu Dibuat')}
                                </span>
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('fleet.dashboard.onboarding.base_step_title', undefined, '1. Lokasi Pool & Base Armada')}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'fleet.dashboard.onboarding.base_step_desc',
                                    undefined,
                                    'Daftarkan depot pusat, pool parkir, atau cabang satelit sebagai titik bernaung armada kendaraan Anda.',
                                )}
                            </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {['📍 Koordinat GPS', '👤 Penanggung Jawab', '🅿️ Kapasitas Unit'].map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {hasBase ? (
                            <Link
                                href={prefixedRoute('fleet.bases.index')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                            >
                                <span>{t('fleet.dashboard.onboarding.base_cta_manage', undefined, 'Kelola Pool Armada')}</span>
                                <span>➔</span>
                            </Link>
                        ) : can?.create_base !== false ? (
                            <Link
                                href={prefixedRoute('fleet.bases.create')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition"
                            >
                                <span>+</span>
                                <span>{t('fleet.dashboard.onboarding.base_cta_add', undefined, 'Tambah Base Pertama')}</span>
                            </Link>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hubungi admin untuk menambah base</span>
                        )}
                    </div>
                </div>

                {/* Step 2: Vehicle Unit */}
                <div
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                        hasVehicle
                            ? 'border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-slate-900 ring-1 ring-emerald-500/20'
                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800'
                    }`}
                >
                    <div className="space-y-4">
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-xs">
                                🚗
                            </div>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black ${
                                    hasVehicle
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${hasVehicle ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>
                                    {hasVehicle
                                        ? t('fleet.dashboard.onboarding.vehicle_count', { count: counts.vehicles }, `${counts.vehicles} Unit Terdaftar`)
                                        : t('fleet.dashboard.onboarding.step_pending', undefined, 'Langkah 2 · Perlu Dibuat')}
                                </span>
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('fleet.dashboard.onboarding.vehicle_step_title', undefined, '2. Registrasi Unit Kendaraan')}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'fleet.dashboard.onboarding.vehicle_step_desc',
                                    undefined,
                                    'Daftarkan mobil, truk, atau bus lengkap dengan plat nomor, odometer awal, dan tanggal berlaku STNK/KIR.',
                                )}
                            </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {['🔢 Nomor Polisi', '🏎️ Tracking Odometer', '📜 Pengingat STNK & KIR'].map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {hasVehicle ? (
                            <Link
                                href={prefixedRoute('fleet.vehicles.index')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition"
                            >
                                <span>{t('fleet.dashboard.onboarding.vehicle_cta_manage', undefined, 'Kelola Unit Kendaraan')}</span>
                                <span>➔</span>
                            </Link>
                        ) : can?.create_vehicle !== false ? (
                            <Link
                                href={prefixedRoute('fleet.vehicles.create')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition"
                            >
                                <span>+</span>
                                <span>{t('fleet.dashboard.onboarding.vehicle_cta_add', undefined, 'Daftarkan Kendaraan Pertama')}</span>
                            </Link>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hubungi admin untuk menambah kendaraan</span>
                        )}
                    </div>
                </div>

                {/* Step 3: Driver */}
                <div
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                        hasDriver
                            ? 'border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-slate-900 ring-1 ring-emerald-500/20'
                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-800'
                    }`}
                >
                    <div className="space-y-4">
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shadow-xs">
                                👨‍✈️
                            </div>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black ${
                                    hasDriver
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${hasDriver ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span>
                                    {hasDriver
                                        ? t('fleet.dashboard.onboarding.driver_count', { count: counts.drivers }, `${counts.drivers} Driver Terdaftar`)
                                        : t('fleet.dashboard.onboarding.step_pending', undefined, 'Langkah 3 · Perlu Dibuat')}
                                </span>
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('fleet.dashboard.onboarding.driver_step_title', undefined, '3. Data & Akun Pengemudi')}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'fleet.dashboard.onboarding.driver_step_desc',
                                    undefined,
                                    'Tambahkan profil pengemudi, nomor SIM, kontak darurat, dan hubungkan dengan armada kendaraan.',
                                )}
                            </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {['🪪 Data SIM', '📞 Kontak Darurat', '📊 Skor Performa'].map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {hasDriver ? (
                            <Link
                                href={prefixedRoute('fleet.drivers.index')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition"
                            >
                                <span>{t('fleet.dashboard.onboarding.driver_cta_manage', undefined, 'Kelola Pengemudi')}</span>
                                <span>➔</span>
                            </Link>
                        ) : can?.create_driver !== false ? (
                            <Link
                                href={prefixedRoute('fleet.drivers.create')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-sky-600/20 transition"
                            >
                                <span>+</span>
                                <span>{t('fleet.dashboard.onboarding.driver_cta_add', undefined, 'Tambah Pengemudi Pertama')}</span>
                            </Link>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hubungi admin untuk menambah pengemudi</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Feature Value Props Grid */}
            <div className="space-y-4 pt-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('fleet.dashboard.onboarding.why_setup_title', undefined, 'Fitur Otomatis yang Terbuka Setelah Setup')}
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-base dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                ⛽
                            </span>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {t('fleet.dashboard.onboarding.why_fuel_title', undefined, 'Analitik Efisiensi BBM')}
                            </h5>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'fleet.dashboard.onboarding.why_fuel_desc',
                                undefined,
                                'Catat setiap pengisian bahan bakar dan deteksi anomali konsumsi secara otomatis.',
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-base dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                🛠️
                            </span>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {t('fleet.dashboard.onboarding.why_maint_title', undefined, 'Riwayat Servis & Bengkel')}
                            </h5>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'fleet.dashboard.onboarding.why_maint_desc',
                                undefined,
                                'Jadwalkan perawatan berkala dan pantau riwayat servis unit agar armada selalu prima.',
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-base dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                📜
                            </span>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {t('fleet.dashboard.onboarding.why_docs_title', undefined, 'Peringatan STNK & KIR')}
                            </h5>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'fleet.dashboard.onboarding.why_docs_desc',
                                undefined,
                                'Sistem akan otomatis memberi peringatan 30 hari sebelum masa berlaku dokumen habis.',
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-base dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                🗺️
                            </span>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {t('fleet.dashboard.onboarding.why_routing_title', undefined, 'Integrasi Rute & Transportasi')}
                            </h5>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t(
                                'fleet.dashboard.onboarding.why_routing_desc',
                                undefined,
                                'Unit dan pengemudi siap langsung ditugaskan pada modul Pengiriman, Rute, & Rental.',
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
