import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type ModuleState =
    | 'installed'
    | 'available'
    | 'uninstalled'
    | 'disabled'
    | 'disabled_with_data';

interface ModuleEntry {
    key: string;
    label: string;
    description: string;
    requires: string[];
    platform_enabled: boolean;
    installed: boolean;
    state: ModuleState;
    purges_at: string | null;
}

interface Props {
    modules: ModuleEntry[];
    graceDays: number;
}

const STATE_BADGE_CLASS: Record<ModuleState, string> = {
    installed:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    available:
        'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
    uninstalled:
        'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    disabled:
        'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
    disabled_with_data:
        'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
};

const STATE_DOT_CLASS: Record<ModuleState, string> = {
    installed: 'bg-emerald-500',
    available: 'bg-sky-500',
    uninstalled: 'bg-amber-500',
    disabled: 'bg-rose-500',
    disabled_with_data: 'bg-rose-500',
};

const STATE_LABEL: Record<ModuleState, string> = {
    installed: 'Terpasang',
    available: 'Tersedia',
    uninstalled: 'Menunggu Penghapusan',
    disabled: 'Dinonaktifkan',
    disabled_with_data: 'Dinonaktifkan (Data Tersimpan)',
};

const isDisabled = (state: ModuleState): boolean =>
    state === 'disabled' || state === 'disabled_with_data';

// Helper icon mapper for distinct visual representation
const getModuleIcon = (key: string) => {
    switch (key) {
        case 'accounting':
            return (
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
            );
        case 'pos':
        case 'sales':
            return (
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            );
        case 'fleet':
        case 'transportation':
            return (
                <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.083c.621 0 1.191.354 1.409.923.156.406.301.816.436 1.228M14.25 7.5v11.25m0-11.25h-3.75m3.75 0V4.875c0-.621-.504-1.125-1.125-1.125h-7.5C6.879 3.75 6 4.629 6 5.652v9.848m0 0a1.5 1.5 0 013 0M6 15.5h3.75" />
                </svg>
            );
        case 'inventory':
        case 'purchasing':
            return (
                <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
            );
        case 'bi':
        case 'analytics':
            return (
                <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
            );
        case 'document':
        case 'documents':
            return (
                <svg className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            );
        case 'rental':
            return (
                <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
            );
        case 'canvassing':
            return (
                <svg className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
            );
        default:
            return (
                <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
            );
    }
};

export default function Index({ modules, graceDays }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [confirming, setConfirming] = useState<ModuleEntry | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'installed' | 'available' | 'uninstalled' | 'disabled'
    >('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const totalCount = modules.length;
    const installedCount = useMemo(
        () => modules.filter((m) => m.installed).length,
        [modules],
    );
    const availableCount = useMemo(
        () => modules.filter((m) => m.state === 'available').length,
        [modules],
    );
    const uninstalledCount = useMemo(
        () => modules.filter((m) => m.state === 'uninstalled').length,
        [modules],
    );
    const disabledCount = useMemo(
        () => modules.filter((m) => isDisabled(m.state)).length,
        [modules],
    );

    const sorted = useMemo(
        () => [...modules].sort((a, b) => a.label.localeCompare(b.label)),
        [modules],
    );

    const filtered = useMemo(() => {
        return sorted.filter((m) => {
            if (statusFilter === 'installed' && !m.installed) return false;
            if (statusFilter === 'available' && m.state !== 'available') return false;
            if (statusFilter === 'uninstalled' && m.state !== 'uninstalled') return false;
            if (statusFilter === 'disabled' && !isDisabled(m.state)) return false;

            const q = search.trim().toLowerCase();
            if (!q) return true;

            return (
                m.label.toLowerCase().includes(q) ||
                m.key.toLowerCase().includes(q) ||
                m.description.toLowerCase().includes(q)
            );
        });
    }, [sorted, search, statusFilter]);

    const install = (module: ModuleEntry): void => {
        setBusyKey(module.key);
        router.post(
            route('module.marketplace.install', module.key),
            {},
            { preserveScroll: true, onFinish: () => setBusyKey(null) },
        );
    };

    const uninstall = (module: ModuleEntry): void => {
        setBusyKey(module.key);
        router.delete(route('module.marketplace.uninstall', module.key), {
            preserveScroll: true,
            onFinish: () => {
                setBusyKey(null);
                setConfirming(null);
            },
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('shell.central_modules', undefined, 'Central Modules Marketplace')}
                    description="Pasang atau lepas modul fungsionalitas opsional pada dashboard Central Admin secara modular"
                />
            }
        >
            <Head title={t('shell.central_modules', undefined, 'Central Modules Marketplace')} />

            <div className="space-y-6">
                {/* Alert Notifications */}
                {flash?.success && (
                    <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-sm animate-fade-in shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                                ✓
                            </span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm animate-fade-in shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
                                !
                            </span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Hero Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 border border-indigo-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Total Modul Central
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {totalCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Modul opsional yang didukung
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 border border-emerald-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Modul Terpasang
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {installedCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Aktif pada dashboard Central
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent p-5 border border-sky-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Modul Tersedia
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
                            {availableCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Siap dipasang langsung
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-5 border border-amber-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Retensi Data ({graceDays} Hari)
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                            {uninstalledCount > 0 ? uninstalledCount : 'Aman'}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {uninstalledCount > 0
                                ? `${uninstalledCount} modul menunggu purge`
                                : 'Tidak ada data terancam purge'}
                        </p>
                    </div>
                </div>

                {/* Toolbar: Filters, Search Bar & View Mode Toggle */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`rounded-lg px-3 py-1.5 transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Semua ({totalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('installed')}
                            className={`rounded-lg px-3 py-1.5 transition-all ${
                                statusFilter === 'installed'
                                    ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Terpasang ({installedCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('available')}
                            className={`rounded-lg px-3 py-1.5 transition-all ${
                                statusFilter === 'available'
                                    ? 'bg-sky-500 text-white shadow-sm font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Tersedia ({availableCount})
                        </button>
                        {uninstalledCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setStatusFilter('uninstalled')}
                                className={`rounded-lg px-3 py-1.5 transition-all ${
                                    statusFilter === 'uninstalled'
                                        ? 'bg-amber-500 text-white shadow-sm font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Menunggu Purge ({uninstalledCount})
                            </button>
                        )}
                        {disabledCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setStatusFilter('disabled')}
                                className={`rounded-lg px-3 py-1.5 transition-all ${
                                    statusFilter === 'disabled'
                                        ? 'bg-rose-500 text-white shadow-sm font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Dinonaktifkan ({disabledCount})
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative min-w-[280px] sm:min-w-[320px] flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                </svg>
                            </span>
                            <TextInput
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau key modul..."
                                className="w-full pl-9 pr-8 py-1.5 text-sm rounded-xl border-slate-200 dark:border-slate-800"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                title="Table View"
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            Tidak ada modul yang cocok
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Coba sesuaikan kata kunci pencarian atau ganti filter status modul Anda.
                        </p>
                        {(search || statusFilter !== 'all') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                }}
                                className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                Reset Filter & Pencarian
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Modern Grid View */
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((module) => {
                            const busy = busyKey === module.key;
                            const isStateDisabled = isDisabled(module.state);

                            return (
                                <div
                                    key={module.key}
                                    className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                                        module.installed
                                            ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 ring-1 ring-emerald-500/10'
                                            : isStateDisabled
                                            ? 'bg-slate-50/70 dark:bg-slate-900/40 border-rose-200/50 dark:border-rose-900/30 opacity-90'
                                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div>
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 group-hover:scale-105 transition-transform">
                                                    {getModuleIcon(module.key)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                        {module.label}
                                                    </h3>
                                                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                        {module.key}
                                                    </span>
                                                </div>
                                            </div>

                                            <span
                                                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATE_BADGE_CLASS[module.state]}`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${STATE_DOT_CLASS[module.state]}`}
                                                />
                                                {STATE_LABEL[module.state]}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {module.description && (
                                            <p className="mt-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                                                {module.description}
                                            </p>
                                        )}

                                        {/* Meta Information */}
                                        <div className="mt-4 space-y-2">
                                            {module.requires.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                                    </svg>
                                                    <span>Membutuhkan: <strong className="font-mono">{module.requires.join(', ')}</strong></span>
                                                </div>
                                            )}

                                            {module.state === 'uninstalled' && module.purges_at && (
                                                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                                    ⏳ Data akan dihapus permanen pada <strong>{module.purges_at}</strong> ({graceDays} hari).
                                                </div>
                                            )}

                                            {isStateDisabled && (
                                                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                                                    🚫 Modul ini dinonaktifkan platform secara global.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                                        <div className="text-[11px] text-slate-400">
                                            {module.installed ? (
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Aktif di Central
                                                </span>
                                            ) : (
                                                <span>Siap diinstal</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {module.installed ? (
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={() => setConfirming(module)}
                                                    disabled={busy}
                                                    className="!rounded-xl text-xs hover:!bg-rose-50 hover:!text-rose-700 hover:!border-rose-200 dark:hover:!bg-rose-950/40 dark:hover:!text-rose-400 dark:hover:!border-rose-800 transition-colors"
                                                >
                                                    {busy ? 'Memproses…' : 'Lepas Modul'}
                                                </SecondaryButton>
                                            ) : isStateDisabled ? (
                                                <SecondaryButton disabled className="!rounded-xl text-xs opacity-60">
                                                    Dinonaktifkan
                                                </SecondaryButton>
                                            ) : (
                                                <PrimaryButton
                                                    type="button"
                                                    onClick={() => install(module)}
                                                    disabled={busy}
                                                    className="!rounded-xl text-xs shadow-sm"
                                                >
                                                    {busy
                                                        ? 'Memproses…'
                                                        : module.state === 'uninstalled'
                                                        ? '⚡ Pasang Kembali'
                                                        : '⚡ Pasang Modul'}
                                                </PrimaryButton>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Modern Table View */
                    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-5">Modul</th>
                                    <th className="py-3.5 px-5">Key</th>
                                    <th className="py-3.5 px-5">Deskripsi</th>
                                    <th className="py-3.5 px-5">Dependensi</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map((module) => {
                                    const busy = busyKey === module.key;
                                    const isStateDisabled = isDisabled(module.state);

                                    return (
                                        <tr key={module.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                                                        {getModuleIcon(module.key)}
                                                    </div>
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {module.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {module.key}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 max-w-xs text-xs text-slate-600 dark:text-slate-400 truncate">
                                                {module.description || '-'}
                                            </td>
                                            <td className="py-4 px-5 text-xs text-slate-500">
                                                {module.requires.length > 0 ? (
                                                    <span className="font-mono">{module.requires.join(', ')}</span>
                                                ) : (
                                                    'None'
                                                )}
                                            </td>
                                            <td className="py-4 px-5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATE_BADGE_CLASS[module.state]}`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${STATE_DOT_CLASS[module.state]}`}
                                                    />
                                                    {STATE_LABEL[module.state]}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {module.installed ? (
                                                        <SecondaryButton
                                                            type="button"
                                                            onClick={() => setConfirming(module)}
                                                            disabled={busy}
                                                            className="!rounded-xl text-xs hover:!bg-rose-50 hover:!text-rose-700 hover:!border-rose-200 dark:hover:!bg-rose-950/40 dark:hover:!text-rose-400 dark:hover:!border-rose-800"
                                                        >
                                                            {busy ? 'Memproses…' : 'Lepas'}
                                                        </SecondaryButton>
                                                    ) : isStateDisabled ? (
                                                        <span className="text-xs text-slate-400 italic">
                                                            Dinonaktifkan
                                                        </span>
                                                    ) : (
                                                        <PrimaryButton
                                                            type="button"
                                                            onClick={() => install(module)}
                                                            disabled={busy}
                                                            className="!rounded-xl text-xs shadow-sm"
                                                        >
                                                            {busy
                                                                ? 'Memproses…'
                                                                : module.state === 'uninstalled'
                                                                ? 'Pasang Kembali'
                                                                : 'Pasang'}
                                                        </PrimaryButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDeleteDialog
                show={confirming !== null}
                onClose={() => setConfirming(null)}
                onConfirm={() => confirming && uninstall(confirming)}
                title={`Lepas modul ${confirming?.label ?? ''}?`}
                message={`Modul akan dilepas dari dashboard Central Admin. Data tetap tersimpan dan baru akan dihapus permanen setelah ${graceDays} hari jika tidak dipasang kembali.`}
                confirmText="Lepas Modul"
                processing={busyKey === confirming?.key}
            />
        </DynamicLayout>
    );
}

