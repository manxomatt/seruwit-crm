import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface ModuleRow {
    key: string;
    label: string;
    description: string;
    requires: string[];
    is_enabled: boolean;
}

interface Props {
    modules: ModuleRow[];
}

// Icon mapper per module category
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
            return (
                <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
            );
        default:
            return (
                <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.007-1.875 2.25-1.875s2.25.84 2.25 1.875c0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                </svg>
            );
    }
};

export default function Index({ modules }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [processingKey, setProcessingKey] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const totalCount = modules.length;
    const enabledCount = useMemo(() => modules.filter((m) => m.is_enabled).length, [modules]);
    const disabledCount = totalCount - enabledCount;

    const sorted = useMemo(
        () => [...modules].sort((a, b) => a.label.localeCompare(b.label)),
        [modules],
    );

    const filtered = useMemo(() => {
        return sorted.filter((m) => {
            if (statusFilter === 'enabled' && !m.is_enabled) return false;
            if (statusFilter === 'disabled' && m.is_enabled) return false;

            const q = search.trim().toLowerCase();
            if (!q) return true;

            return (
                m.label.toLowerCase().includes(q) ||
                m.key.toLowerCase().includes(q) ||
                m.description.toLowerCase().includes(q)
            );
        });
    }, [sorted, search, statusFilter]);

    const toggle = (module: ModuleRow): void => {
        setProcessingKey(module.key);
        router.patch(
            route('module.registry.toggle-status', module.key),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingKey(null),
            },
        );
    };

    return (
        <DynamicLayout header={<PageHeader title={t('platform.registry.title')} />}>
            <Head title={t('platform.registry.title')} />

            <div className="space-y-6">
                {/* Alert Notifications */}
                {flash?.success && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">!</span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Hero Overview & Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 border border-indigo-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Total Registered Modules
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {totalCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Platform-wide available capabilities
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 border border-emerald-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Active Across Platform
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {enabledCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Enabled & reachable by entitled tenants
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-5 border border-amber-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Disabled Globally (Kill Switch)
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                            {disabledCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Overridden & unreachable platform-wide
                        </p>
                    </div>
                </div>

                {/* Toolbar: Search, Filters & View Toggle */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-medium">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`rounded-lg px-3 py-1.5 transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('enabled')}
                            className={`rounded-lg px-3 py-1.5 transition-all ${
                                statusFilter === 'enabled'
                                    ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Active ({enabledCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('disabled')}
                            className={`rounded-lg px-3 py-1.5 transition-all ${
                                statusFilter === 'disabled'
                                    ? 'bg-amber-500 text-white shadow-sm font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Disabled ({disabledCount})
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative min-w-[340px] flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                </svg>
                            </span>
                            <TextInput
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search module name or key..."
                                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        {/* View Switcher */}
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                title="Table View"
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 p-12 text-center border border-slate-200/80 dark:border-slate-800">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">No modules match your filter</h3>
                        <p className="mt-1 text-xs text-slate-500">Try adjusting your search keyword or active status filter.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Modern Grid View */
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((module) => (
                            <div
                                key={module.key}
                                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                                    module.is_enabled
                                        ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-amber-200/50 dark:border-amber-900/30'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 group-hover:scale-105 transition-transform">
                                                {getModuleIcon(module.key)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                                                    {module.label}
                                                </h3>
                                                <span className="font-mono text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {module.key}
                                                </span>
                                            </div>
                                        </div>

                                        {/* iOS-Style Toggle Switch */}
                                        <button
                                            type="button"
                                            disabled={processingKey === module.key}
                                            onClick={() => toggle(module)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                module.is_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                            } ${processingKey === module.key ? 'opacity-50 cursor-wait' : ''}`}
                                            aria-label={`Toggle status for ${module.label}`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    module.is_enabled ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {module.description && (
                                        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                                            {module.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                module.is_enabled
                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    module.is_enabled ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`}
                                            />
                                            {module.is_enabled ? 'Active Platform' : 'Disabled Globally'}
                                        </span>
                                    </div>

                                    {module.requires.length > 0 && (
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1" title={`Requires: ${module.requires.join(', ')}`}>
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                            </svg>
                                            {module.requires.length} req
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Modern Table View */
                    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-5">Module</th>
                                    <th className="py-3.5 px-5">Key</th>
                                    <th className="py-3.5 px-5">Description</th>
                                    <th className="py-3.5 px-5">Requires</th>
                                    <th className="py-3.5 px-5 text-right">Status & Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map((module) => (
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
                                            {module.requires.length > 0 ? module.requires.join(', ') : 'None'}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                        module.is_enabled
                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${module.is_enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {module.is_enabled ? 'Active' : 'Disabled'}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={processingKey === module.key}
                                                    onClick={() => toggle(module)}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        module.is_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                                    } ${processingKey === module.key ? 'opacity-50 cursor-wait' : ''}`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                            module.is_enabled ? 'translate-x-4' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}

