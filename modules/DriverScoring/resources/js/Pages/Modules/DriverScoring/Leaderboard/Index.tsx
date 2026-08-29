import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ScoringNav from '../../../../ScoringNav';

interface Row {
    driver_id: number;
    average_score: number;
    scored_days: number;
    event_count: number;
    harsh_brake_count: number;
    speeding_count: number;
    idle_count: number;
    driver: { id: number; name: string; status: string } | null;
}

interface PaginatedLeaderboard {
    data: Row[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    leaderboard: PaginatedLeaderboard;
    filters: { from: string; to: string };
}

export default function Index({ leaderboard, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [searchQuery, setSearchQuery] = useState('');

    // Summary calculations
    const kpi = useMemo(() => {
        const rows = leaderboard.data;
        const totalDrivers = leaderboard.total;
        const avgScore = rows.length > 0
            ? Math.round((rows.reduce((acc, r) => acc + Number(r.average_score), 0) / rows.length) * 10) / 10
            : 0;
        const topDriver = rows.length > 0 ? rows[0] : null;
        const totalIncidents = rows.reduce(
            (acc, r) => acc + Number(r.harsh_brake_count) + Number(r.speeding_count) + Number(r.idle_count),
            0
        );

        return {
            totalDrivers,
            avgScore,
            topDriver,
            totalIncidents,
        };
    }, [leaderboard]);

    // Top 3 Podium Drivers (only on page 1)
    const podiumDrivers = useMemo(() => {
        if (leaderboard.current_page !== 1) return [];
        return leaderboard.data.slice(0, 3);
    }, [leaderboard]);

    // Filtered data by client search
    const filteredRows = useMemo(() => {
        if (!searchQuery.trim()) return leaderboard.data;
        const q = searchQuery.toLowerCase();
        return leaderboard.data.filter(
            (row) =>
                row.driver?.name.toLowerCase().includes(q) ||
                String(row.driver_id).includes(q)
        );
    }, [leaderboard.data, searchQuery]);

    // Score helper: Returns colors and rating text
    const getScoreBadge = (score: number) => {
        if (score >= 90) {
            return {
                label: t('scoring.pages.leaderboard.score_rating.excellent', undefined, 'Sangat Baik'),
                colorText: 'text-emerald-700 dark:text-emerald-400',
                colorBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60',
                colorBar: 'bg-emerald-500',
                badgeText: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700/60',
            };
        }
        if (score >= 75) {
            return {
                label: t('scoring.pages.leaderboard.score_rating.good', undefined, 'Baik'),
                colorText: 'text-indigo-700 dark:text-indigo-400',
                colorBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60',
                colorBar: 'bg-indigo-500',
                badgeText: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 border-indigo-200 dark:border-indigo-700/60',
            };
        }
        if (score >= 60) {
            return {
                label: t('scoring.pages.leaderboard.score_rating.fair', undefined, 'Cukup'),
                colorText: 'text-amber-700 dark:text-amber-400',
                colorBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
                colorBar: 'bg-amber-500',
                badgeText: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 border-amber-200 dark:border-amber-700/60',
            };
        }
        return {
            label: t('scoring.pages.leaderboard.score_rating.poor', undefined, 'Perlu Evaluasi'),
            colorText: 'text-rose-700 dark:text-rose-400',
            colorBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60',
            colorBar: 'bg-rose-500',
            badgeText: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 border-rose-200 dark:border-rose-700/60',
        };
    };

    // Driver Status Badge Helper
    const getDriverStatusBadge = (status?: string) => {
        switch (status) {
            case 'available':
                return { label: 'Tersedia', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50' };
            case 'on_trip':
                return { label: 'Bertugas', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50' };
            case 'inactive':
                return { label: 'Nonaktif', bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
            default:
                return { label: status ?? '—', bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
        }
    };

    // Quick date preset handler
    const applyDatePreset = (preset: 'this_week' | 'this_month' | 'last_30_days') => {
        const now = new Date();
        let fromStr = '';
        let toStr = '';

        if (preset === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
            const monday = new Date(now.setDate(diff));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            fromStr = monday.toISOString().slice(0, 10);
            toStr = sunday.toISOString().slice(0, 10);
        } else if (preset === 'this_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            fromStr = firstDay.toISOString().slice(0, 10);
            toStr = lastDay.toISOString().slice(0, 10);
        } else if (preset === 'last_30_days') {
            const past = new Date();
            past.setDate(past.getDate() - 30);
            fromStr = past.toISOString().slice(0, 10);
            toStr = new Date().toISOString().slice(0, 10);
        }

        router.get(prefixedRoute('scoring.leaderboard'), {
            from: fromStr,
            to: toStr,
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('scoring.pages.leaderboard.title', undefined, 'Leaderboard Driver & Performa Keselamatan')}
                    description={t('scoring.pages.leaderboard.subtitle', undefined, 'Pantau peringkat dan skor keselamatan berkendara pengemudi berdasarkan data telemetri GPS Traccar.')}
                />
            }
        >
            <Head title={t('scoring.pages.leaderboard.head', undefined, 'Driver Scoring & Leaderboard')} />

            <ScoringNav />

            {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Fleet Avg Score */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t('scoring.pages.leaderboard.fleet_avg_score', undefined, 'Rata-rata Armada')}
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-lg">
                            🛡️
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {kpi.avgScore}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                    </div>
                    <div className="mt-2">
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold border ${getScoreBadge(kpi.avgScore).badgeText}`}>
                            {getScoreBadge(kpi.avgScore).label}
                        </span>
                    </div>
                </div>

                {/* Top Performer (MVP) */}
                <div className="rounded-3xl border border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                            {t('scoring.pages.leaderboard.top_performer', undefined, 'Pengemudi Terbaik')}
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-lg">
                            🥇
                        </span>
                    </div>
                    <div className="mt-3">
                        {kpi.topDriver?.driver ? (
                            <Link
                                href={prefixedRoute('scoring.drivers.show', kpi.topDriver.driver.id)}
                                className="block truncate text-base font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                            >
                                {kpi.topDriver.driver.name}
                            </Link>
                        ) : (
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">
                                {kpi.topDriver ? `#${kpi.topDriver.driver_id}` : '—'}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>Skor:</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">
                            {kpi.topDriver?.average_score ?? 0} pts
                        </span>
                    </div>
                </div>

                {/* Total Incidents */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t('scoring.pages.leaderboard.total_incidents', undefined, 'Total Insiden')}
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-lg">
                            ⚠️
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {kpi.totalIncidents}
                        </span>
                        <span className="text-xs font-medium text-slate-400">kejadian</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                        Brake, speeding, & idle periode ini
                    </p>
                </div>

                {/* Monitored Drivers */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t('scoring.pages.leaderboard.monitored_drivers', undefined, 'Pengemudi Terdaftar')}
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-lg">
                            👨‍✈️
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {kpi.totalDrivers}
                        </span>
                        <span className="text-xs font-medium text-slate-400">orang</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                        Pengemudi aktif dievaluasi
                    </p>
                </div>
            </div>

            {/* ── Top 3 Podium Showcase (Page 1 only) ─────────────────────────── */}
            {podiumDrivers.length > 0 && (
                <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🏆</span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('scoring.pages.leaderboard.podium_title', undefined, 'Top 3 Performa Pengemudi Terbaik')}
                            </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                            {filters.from} s/d {filters.to}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {podiumDrivers.map((row, idx) => {
                            const rank = idx + 1;
                            const badge = getScoreBadge(row.average_score);
                            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                            const cardBg =
                                rank === 1
                                    ? 'border-amber-400/90 dark:border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent'
                                    : rank === 2
                                      ? 'border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-500/10 via-transparent to-transparent'
                                      : 'border-amber-700/30 dark:border-amber-900/40 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent';

                            return (
                                <div
                                    key={row.driver_id}
                                    className={`relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all hover:shadow-md ${cardBg}`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 items-center gap-1 rounded-xl bg-white/90 dark:bg-slate-800/90 px-2.5 text-xs font-extrabold shadow-2xs">
                                                <span>{medal}</span>
                                                <span className="text-slate-700 dark:text-slate-200">#{rank}</span>
                                            </span>
                                            <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${badge.badgeText}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        <div className="mt-3.5 flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 font-extrabold text-sm text-white shadow-sm">
                                                {row.driver?.name
                                                    ? row.driver.name
                                                          .split(' ')
                                                          .map((n) => n[0])
                                                          .slice(0, 2)
                                                          .join('')
                                                          .toUpperCase()
                                                    : 'DR'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                {row.driver ? (
                                                    <Link
                                                        href={prefixedRoute('scoring.drivers.show', row.driver.id)}
                                                        className="block truncate text-sm font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                                                    >
                                                        {row.driver.name}
                                                    </Link>
                                                ) : (
                                                    <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-white">
                                                        Driver #{row.driver_id}
                                                    </span>
                                                )}
                                                <div className="mt-0.5 flex items-center gap-2">
                                                    <span className={`inline-block rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${getDriverStatusBadge(row.driver?.status).bg}`}>
                                                        {getDriverStatusBadge(row.driver?.status).label}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {row.scored_days} hari aktif
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Gauge */}
                                        <div className="mt-4 rounded-xl bg-white/80 dark:bg-slate-800/80 p-3 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-500 dark:text-slate-400">Skor Keselamatan</span>
                                                <span className={`font-mono text-base font-extrabold ${badge.colorText}`}>
                                                    {row.average_score} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${badge.colorBar}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, row.average_score))}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Incidents pills */}
                                        <div className="mt-3 flex items-center justify-between gap-1.5 text-[11px]">
                                            <span className={`flex items-center gap-1 rounded-lg px-2 py-1 ${row.harsh_brake_count > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'}`}>
                                                🛑 {row.harsh_brake_count} Rem
                                            </span>
                                            <span className={`flex items-center gap-1 rounded-lg px-2 py-1 ${row.speeding_count > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'}`}>
                                                ⚡ {row.speeding_count} Speed
                                            </span>
                                            <span className={`flex items-center gap-1 rounded-lg px-2 py-1 ${row.idle_count > 0 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'}`}>
                                                ⏱️ {row.idle_count} Idle
                                            </span>
                                        </div>
                                    </div>

                                    {row.driver && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                            <Link
                                                href={prefixedRoute('scoring.drivers.show', row.driver.id)}
                                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
                                            >
                                                <span>Detail Analitik</span>
                                                <span>→</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Filter & Search Toolbar ─────────────────────────────────────── */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Quick Period Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                            Periode:
                        </span>
                        <button
                            type="button"
                            onClick={() => applyDatePreset('this_week')}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
                        >
                            📅 {t('scoring.pages.leaderboard.period_presets.this_week', undefined, 'Minggu Ini')}
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset('this_month')}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
                        >
                            🗓️ {t('scoring.pages.leaderboard.period_presets.this_month', undefined, 'Bulan Ini')}
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset('last_30_days')}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
                        >
                            ⏳ {t('scoring.pages.leaderboard.period_presets.last_30_days', undefined, '30 Hari Terakhir')}
                        </button>
                    </div>

                    {/* Date Inputs & Driver Search */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-400">{t('scoring.pages.leaderboard.filter_from', undefined, 'Dari')}</span>
                                <TextInput
                                    type="date"
                                    value={filters.from}
                                    onChange={(e) =>
                                        router.get(prefixedRoute('scoring.leaderboard'), {
                                            from: e.target.value,
                                            to: filters.to,
                                        })
                                    }
                                    className="!py-1.5 !px-2.5 text-xs !rounded-xl"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-400">{t('scoring.pages.leaderboard.filter_to', undefined, 'Sampai')}</span>
                                <TextInput
                                    type="date"
                                    value={filters.to}
                                    onChange={(e) =>
                                        router.get(prefixedRoute('scoring.leaderboard'), {
                                            from: filters.from,
                                            to: e.target.value,
                                        })
                                    }
                                    className="!py-1.5 !px-2.5 text-xs !rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Search Driver */}
                        <div className="relative min-w-[200px]">
                            <TextInput
                                type="text"
                                placeholder={t('scoring.pages.leaderboard.search_placeholder', undefined, 'Cari pengemudi…')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full !py-1.5 !px-3 text-xs !rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Leaderboard Table ───────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider w-16">
                                    {t('scoring.pages.leaderboard.rank', undefined, '#')}
                                </th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider">
                                    {t('scoring.fields.driver', undefined, 'Pengemudi')}
                                </th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider min-w-[180px]">
                                    {t('scoring.pages.leaderboard.safety_score', undefined, 'Skor Keselamatan')}
                                </th>
                                <th className="px-5 py-3.5 text-center font-bold uppercase tracking-wider">
                                    {t('scoring.pages.leaderboard.active_days', undefined, 'Hari Aktif')}
                                </th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider">
                                    {t('scoring.pages.leaderboard.incident_breakdown', undefined, 'Rincian Pelanggaran')}
                                </th>
                                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-14 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-2xl">
                                            📊
                                        </div>
                                        <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {t('scoring.pages.leaderboard.empty', undefined, 'Belum ada data skor dalam rentang ini')}
                                        </h4>
                                        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                                            {t('scoring.pages.leaderboard.empty_hint', undefined, 'Pastikan perjalanan (trip) sedang berlangsung dan GPS Traccar merekam telemetri pengemudi.')}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, index) => {
                                    const rankNumber = (leaderboard.current_page - 1) * leaderboard.per_page + index + 1;
                                    const badge = getScoreBadge(row.average_score);
                                    const statusBadge = getDriverStatusBadge(row.driver?.status);

                                    return (
                                        <tr
                                            key={row.driver_id}
                                            className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                        >
                                            {/* Rank */}
                                            <td className="px-5 py-4">
                                                {rankNumber === 1 ? (
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-extrabold text-xs shadow-2xs">
                                                        🥇
                                                    </span>
                                                ) : rankNumber === 2 ? (
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-extrabold text-xs shadow-2xs">
                                                        🥈
                                                    </span>
                                                ) : rankNumber === 3 ? (
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 font-extrabold text-xs shadow-2xs">
                                                        🥉
                                                    </span>
                                                ) : (
                                                    <span className="font-mono font-bold text-slate-400">
                                                        #{rankNumber}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Driver Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                                        {row.driver?.name
                                                            ? row.driver.name
                                                                  .split(' ')
                                                                  .map((n) => n[0])
                                                                  .slice(0, 2)
                                                                  .join('')
                                                                  .toUpperCase()
                                                            : 'DR'}
                                                    </div>
                                                    <div>
                                                        {row.driver ? (
                                                            <Link
                                                                href={prefixedRoute('scoring.drivers.show', row.driver.id)}
                                                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                                                            >
                                                                {row.driver.name}
                                                            </Link>
                                                        ) : (
                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                #{row.driver_id}
                                                            </span>
                                                        )}
                                                        <div className="mt-0.5 flex items-center gap-1.5">
                                                            <span className={`inline-block rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${statusBadge.bg}`}>
                                                                {statusBadge.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Safety Score with Mini Progress Gauge */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-base font-extrabold ${badge.colorText}`}>
                                                                {row.average_score}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">/ 100</span>
                                                        </div>
                                                        <span className={`inline-block rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${badge.badgeText}`}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                    <div className="w-24 hidden sm:block">
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${badge.colorBar}`}
                                                                style={{ width: `${Math.min(100, Math.max(0, row.average_score))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Active Days */}
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    📅 {row.scored_days} hr
                                                </span>
                                            </td>

                                            {/* Incidents Breakdown */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        title={t('scoring.types.harsh_brake', undefined, 'Pengereman mendadak')}
                                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${
                                                            row.harsh_brake_count > 0
                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50'
                                                                : 'bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500'
                                                        }`}
                                                    >
                                                        🛑 {row.harsh_brake_count}
                                                    </span>
                                                    <span
                                                        title={t('scoring.types.speeding', undefined, 'Kecepatan berlebih')}
                                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${
                                                            row.speeding_count > 0
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                                                                : 'bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500'
                                                        }`}
                                                    >
                                                        ⚡ {row.speeding_count}
                                                    </span>
                                                    <span
                                                        title={t('scoring.types.idle', undefined, 'Idle')}
                                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${
                                                            row.idle_count > 0
                                                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50'
                                                                : 'bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500'
                                                        }`}
                                                    >
                                                        ⏱️ {row.idle_count}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="px-5 py-4 text-right">
                                                {row.driver ? (
                                                    <Link
                                                        href={prefixedRoute('scoring.drivers.show', row.driver.id)}
                                                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                                                    >
                                                        <span>{t('scoring.pages.leaderboard.view_analysis', undefined, 'Analisis')}</span>
                                                        <span>→</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ─────────────────────────────────────────────────── */}
                {leaderboard.last_page > 1 && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-850/50">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {t('common.showing_results', {
                                from: (leaderboard.current_page - 1) * leaderboard.per_page + 1,
                                to: Math.min(leaderboard.current_page * leaderboard.per_page, leaderboard.total),
                                total: leaderboard.total,
                            })}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {leaderboard.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : link.url
                                              ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60'
                                              : 'cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
