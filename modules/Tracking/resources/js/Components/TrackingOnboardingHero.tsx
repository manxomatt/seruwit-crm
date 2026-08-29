import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';
import React, { useState } from 'react';

export interface TrackingSetupCounts {
    configured: boolean;
    sources_total?: number;
    devices_total: number;
    devices_paired: number;
}

export interface TrackingSetupPermissions {
    update?: boolean;
    create?: boolean;
}

interface Props {
    counts: TrackingSetupCounts;
    can?: TrackingSetupPermissions;
    mode?: 'full' | 'banner';
}

export default function TrackingOnboardingHero({ counts, can, mode = 'full' }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [collapsed, setCollapsed] = useState(false);

    const hasSource = counts.configured;
    const hasDevices = counts.devices_total > 0;
    const hasPaired = counts.devices_paired > 0;

    const completedSteps = (hasSource ? 1 : 0) + (hasDevices ? 1 : 0) + (hasPaired ? 1 : 0);
    const progressPercent = Math.round((completedSteps / 3) * 100);

    // Next recommended action
    const nextStep = !hasSource
        ? {
              label: t('tracking.dashboard.onboarding.step1_cta_add', undefined, 'Hubungkan Sumber GPS'),
              route: 'tracking.settings.edit',
              icon: '📡',
              stepName: t('tracking.dashboard.onboarding.step1_title', undefined, '1. Sumber Data & Provider GPS'),
          }
        : !hasDevices
          ? {
                label: t('tracking.dashboard.onboarding.step2_cta_sync', undefined, 'Sinkronkan Perangkat'),
                route: 'tracking.devices.index',
                icon: '🔄',
                stepName: t('tracking.dashboard.onboarding.step2_title', undefined, '2. Sinkronisasi Perangkat GPS'),
            }
          : !hasPaired
            ? {
                  label: t('tracking.dashboard.onboarding.step3_cta_pair', undefined, 'Pair Tracker ke Unit'),
                  route: 'tracking.devices.index',
                  icon: '🚗',
                  stepName: t('tracking.dashboard.onboarding.step3_title', undefined, '3. Hubungkan Tracker ke Kendaraan'),
              }
            : null;

    // Missing entities for banner description
    const missingNames: string[] = [];
    if (!hasSource) missingNames.push(t('tracking.fields.source', undefined, 'Sumber GPS'));
    if (!hasDevices) missingNames.push(t('tracking.nav.devices', undefined, 'Perangkat GPS'));
    if (!hasPaired) missingNames.push('Pairing Unit');

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
                                📡
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">
                                        {t('tracking.dashboard.onboarding.banner_title', undefined, 'Setup Tracking GPS Belum Selesai')}
                                    </h4>
                                    <span className="rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-400/30">
                                        {progressPercent}% Selesai
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300/90 mt-0.5">
                                    {t(
                                        'tracking.dashboard.onboarding.banner_desc',
                                        { missing: missingNames.join(', ') },
                                        `Lengkapi konfigurasi ${missingNames.join(', ')} untuk mengaktifkan peta live dan telemetri armada secara optimal.`,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {nextStep && can?.update !== false && (
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
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 transition-all duration-700"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* 3 Step Compact Pills */}
                    {!collapsed && (
                        <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
                            {/* Step 1: GPS Source */}
                            <div
                                className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-xs transition ${
                                    hasSource
                                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base shrink-0">📡</span>
                                    <div className="truncate">
                                        <p className="font-bold text-white truncate">1. Sumber GPS</p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {hasSource
                                                ? t('tracking.dashboard.onboarding.step1_status', { count: counts.sources_total || 1 }, `${counts.sources_total || 1} Sumber Terhubung`)
                                                : 'Belum Terhubung'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {hasSource ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                                            ✓ Selesai
                                        </span>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('tracking.settings.edit')}
                                            className="rounded-lg bg-indigo-500/80 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-bold text-white transition whitespace-nowrap"
                                        >
                                            Hubungkan
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Sync Devices */}
                            <div
                                className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-xs transition ${
                                    hasDevices
                                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base shrink-0">🔄</span>
                                    <div className="truncate">
                                        <p className="font-bold text-white truncate">2. Perangkat GPS</p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {hasDevices
                                                ? t('tracking.dashboard.onboarding.step2_status', { count: counts.devices_total }, `${counts.devices_total} Perangkat Terdeteksi`)
                                                : 'Belum Ada Perangkat'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {hasDevices ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                                            ✓ Selesai
                                        </span>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('tracking.devices.index')}
                                            className="rounded-lg bg-indigo-500/80 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-bold text-white transition whitespace-nowrap"
                                        >
                                            Sinkronkan
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Pairing */}
                            <div
                                className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-xs transition ${
                                    hasPaired
                                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base shrink-0">🚗</span>
                                    <div className="truncate">
                                        <p className="font-bold text-white truncate">3. Hubungkan Unit</p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {hasPaired
                                                ? t('tracking.dashboard.onboarding.step3_status', { count: counts.devices_paired }, `${counts.devices_paired} Unit Ter-Pair`)
                                                : 'Belum Ter-Pair'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {hasPaired ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                                            ✓ Selesai
                                        </span>
                                    ) : (
                                        <Link
                                            href={prefixedRoute('tracking.devices.index')}
                                            className="rounded-lg bg-indigo-500/80 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-bold text-white transition whitespace-nowrap"
                                        >
                                            Pairing
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
                        <span>{t('tracking.dashboard.onboarding.badge', undefined, 'PANDUAN KONEKSI GPS & TRACKING')}</span>
                    </div>

                    {/* Heading & Subtitle */}
                    <div className="space-y-2.5">
                        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl leading-tight">
                            {t('tracking.dashboard.onboarding.title', undefined, 'Hubungkan Sumber Data GPS & Aktifkan Telemetri Armada')}
                        </h2>
                        <p className="text-sm text-slate-300 sm:text-base leading-relaxed">
                            {t(
                                'tracking.dashboard.onboarding.description',
                                undefined,
                                'Integrasikan GPS Traccar, Sky Track, atau server GPS lainnya untuk memantau pergerakan armada secara real-time, merekam jejak rute, geofencing, dan evaluasi perilaku pengemudi.',
                            )}
                        </p>
                    </div>

                    {/* Progress Bar & Quick Action */}
                    <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300">
                            <span>
                                {t(
                                    'tracking.dashboard.onboarding.progress',
                                    { completed: completedSteps, total: 3, percent: progressPercent },
                                    `${completedSteps} dari 3 Langkah Selesai (${progressPercent}%)`,
                                )}
                            </span>
                            {nextStep && (
                                <span className="text-indigo-300">
                                    {t('tracking.dashboard.onboarding.next_step', undefined, 'Langkah Selanjutnya')}:{' '}
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

                        {nextStep && can?.update !== false && (
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
                {/* Step 1: GPS Source */}
                <div
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                        hasSource
                            ? 'border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-slate-900 ring-1 ring-emerald-500/20'
                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800'
                    }`}
                >
                    <div className="space-y-4">
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs">
                                📡
                            </div>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black ${
                                    hasSource
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800'
                                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-200/60 dark:ring-indigo-800'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${hasSource ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                <span>
                                    {hasSource
                                        ? t('tracking.dashboard.onboarding.step1_status', { count: counts.sources_total || 1 }, `${counts.sources_total || 1} Sumber Terhubung`)
                                        : t('tracking.dashboard.onboarding.step_pending', undefined, 'Langkah 1 · Perlu Dikonfigurasi')}
                                </span>
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('tracking.dashboard.onboarding.step1_title', undefined, '1. Sumber Data & Provider GPS')}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'tracking.dashboard.onboarding.step1_desc',
                                    undefined,
                                    'Hubungkan server Traccar, Sky Track, atau GPS-Server untuk menarik data koordinat dan telemetri perangkat.',
                                )}
                            </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {['📡 Traccar (Generic)', '🛰️ Sky Track', '🌐 GPS-Server API'].map((tag) => (
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
                        {hasSource ? (
                            <Link
                                href={prefixedRoute('tracking.settings.edit')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                            >
                                <span>{t('tracking.dashboard.onboarding.step1_cta_manage', undefined, 'Kelola Sumber GPS')}</span>
                                <span>➔</span>
                            </Link>
                        ) : can?.update !== false ? (
                            <Link
                                href={prefixedRoute('tracking.settings.edit')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition"
                            >
                                <span>{t('tracking.dashboard.onboarding.step1_cta_add', undefined, 'Hubungkan Sumber GPS')}</span>
                            </Link>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hubungi admin untuk konfigurasi tracking</span>
                        )}
                    </div>
                </div>

                {/* Step 2: Sync Devices */}
                <div
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                        hasDevices
                            ? 'border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-slate-900 ring-1 ring-emerald-500/20'
                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800'
                    }`}
                >
                    <div className="space-y-4">
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-xs">
                                🔄
                            </div>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black ${
                                    hasDevices
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${hasDevices ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>
                                    {hasDevices
                                        ? t('tracking.dashboard.onboarding.step2_status', { count: counts.devices_total }, `${counts.devices_total} Perangkat Terdeteksi`)
                                        : t('tracking.dashboard.onboarding.step_pending', undefined, 'Langkah 2 · Perlu Disinkronkan')}
                                </span>
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('tracking.dashboard.onboarding.step2_title', undefined, '2. Sinkronisasi Perangkat GPS')}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'tracking.dashboard.onboarding.step2_desc',
                                    undefined,
                                    'Impor dan sinkronkan daftar tracker GPS yang terdaftar pada provider untuk mulai menerima sinyal koordinat.',
                                )}
                            </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {['🔄 Auto-Sync Tracker', '🔢 Deteksi IMEI', '📶 Status Online'].map((tag) => (
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
                        {hasDevices ? (
                            <Link
                                href={prefixedRoute('tracking.devices.index')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition"
                            >
                                <span>{t('tracking.dashboard.onboarding.step2_cta_manage', undefined, 'Kelola Perangkat')}</span>
                                <span>➔</span>
                            </Link>
                        ) : can?.update !== false ? (
                            <Link
                                href={prefixedRoute('tracking.devices.index')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition"
                            >
                                <span>{t('tracking.dashboard.onboarding.step2_cta_sync', undefined, 'Sinkronkan Perangkat')}</span>
                            </Link>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hubungi admin untuk sinkronisasi perangkat</span>
                        )}
                    </div>
                </div>

                {/* Step 3: Pairing Unit */}
                <div
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                        hasPaired
                            ? 'border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-slate-900 ring-1 ring-emerald-500/20'
                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-800'
                    }`}
                >
                    <div className="space-y-4">
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shadow-xs">
                                🚗
                            </div>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black ${
                                    hasPaired
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${hasPaired ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span>
                                    {hasPaired
                                        ? t('tracking.dashboard.onboarding.step3_status', { count: counts.devices_paired }, `${counts.devices_paired} Unit Ter-Pair`)
                                        : t('tracking.dashboard.onboarding.step_pending', undefined, 'Langkah 3 · Perlu Di-Pair')}
                                </span>
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('tracking.dashboard.onboarding.step3_title', undefined, '3. Hubungkan Tracker ke Kendaraan')}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'tracking.dashboard.onboarding.step3_desc',
                                    undefined,
                                    'Pairing perangkat GPS ke unit kendaraan armada agar data kecepatan, lokasi, dan odometer terhubung otomatis.',
                                )}
                            </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {['🚗 Sinkron Odometer', '📍 Posisi Armada', '⚡ Kecepatan Live'].map((tag) => (
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
                        {hasPaired ? (
                            <Link
                                href={prefixedRoute('tracking.devices.index')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition"
                            >
                                <span>{t('tracking.dashboard.onboarding.step3_cta_manage', undefined, 'Lihat Status Pairing')}</span>
                                <span>➔</span>
                            </Link>
                        ) : can?.update !== false ? (
                            <Link
                                href={prefixedRoute('tracking.devices.index')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-sky-600/20 transition"
                            >
                                <span>{t('tracking.dashboard.onboarding.step3_cta_pair', undefined, 'Pair Tracker ke Unit')}</span>
                            </Link>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hubungi admin untuk pairing perangkat</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Feature Value Props Grid */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {t('tracking.dashboard.onboarding.why_setup_title', undefined, 'Fitur Otomatis yang Terbuka Setelah Terhubung GPS')}
                    </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                    {/* Live Map */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/60">
                        <div>
                            <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-lg text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/10">
                                🗺️
                            </div>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                {t('tracking.dashboard.onboarding.why_map_title', undefined, 'Peta Armada Real-Time')}
                            </h5>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'tracking.dashboard.onboarding.why_map_desc',
                                    undefined,
                                    'Pantau lokasi dan pergerakan seluruh armada kendaraan secara live dengan status mesin (bergerak/idle/stale).',
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Route History */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-900/60">
                        <div>
                            <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-lg text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/10">
                                ⏱️
                            </div>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                {t('tracking.dashboard.onboarding.why_history_title', undefined, 'Riwayat Rute & Playback')}
                            </h5>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'tracking.dashboard.onboarding.why_history_desc',
                                    undefined,
                                    'Putar ulang rekam jejak perjalanan armada, analisis kecepatan berkendara, dan titik pemberhentian unit.',
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Geofence */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-900/60">
                        <div>
                            <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-lg text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/10">
                                🚧
                            </div>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                {t('tracking.dashboard.onboarding.why_geofence_title', undefined, 'Geofence & Alert Zona')}
                            </h5>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'tracking.dashboard.onboarding.why_geofence_desc',
                                    undefined,
                                    'Dapatkan notifikasi otomatis saat kendaraan keluar atau masuk area pool dan wilayah yang ditentukan.',
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Driver Scoring */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900/60">
                        <div>
                            <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-lg text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/10">
                                📊
                            </div>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                {t('tracking.dashboard.onboarding.why_scoring_title', undefined, 'Scoring Perilaku Pengemudi')}
                            </h5>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {t(
                                    'tracking.dashboard.onboarding.why_scoring_desc',
                                    undefined,
                                    'Deteksi otomatis pengereman mendadak (harsh brake), kecepatan tinggi, dan idle untuk penilaian driver.',
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
