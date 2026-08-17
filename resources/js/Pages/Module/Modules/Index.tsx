import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import PageHeader from '@/Components/PageHeader';

type ModuleState = 'installed' | 'available' | 'uninstalled' | 'locked' | 'locked_with_data' | 'disabled' | 'disabled_with_data';

interface ModuleEntry {
    key: string;
    label: string;
    description: string;
    requires: string[];
    entitled: boolean;
    installed: boolean;
    state: ModuleState;
    purges_at: string | null;
    plans_offering: string[];
}

interface Plan {
    key: string;
    label: string;
    description: string;
}

interface DemoEntry {
    key: string;
    label: string;
    description: string;
    installed?: boolean;
    includes?: string[];
    requires_module?: string | null;
    module_available?: boolean;
}

interface Props {
    modules: ModuleEntry[];
    plan: Plan;
    graceDays: number;
    canInstallDemoData?: boolean;
    demos?: DemoEntry[];
}

const STATE_BADGE_CLASS: Record<ModuleState, string> = {
    installed: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
    available: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50',
    uninstalled: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
    locked: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    locked_with_data: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    disabled: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
    disabled_with_data: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
};

const isDisabled = (state: ModuleState): boolean => state === 'disabled' || state === 'disabled_with_data';

export default function Index({
    modules,
    plan,
    graceDays,
    canInstallDemoData = false,
    demos = [],
}: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [confirming, setConfirming] = useState<ModuleEntry | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredModules = useMemo(() => {
        return modules.filter((module) => {
            const matchesSearch =
                module.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.key.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'installed' && module.installed) ||
                (statusFilter === 'available' && module.state === 'available') ||
                (statusFilter === 'uninstalled' && module.state === 'uninstalled') ||
                (statusFilter === 'locked' && (module.state === 'locked' || module.state === 'locked_with_data'));

            return matchesSearch && matchesStatus;
        });
    }, [modules, searchQuery, statusFilter]);

    const install = (module: ModuleEntry): void => {
        setBusyKey(module.key);
        router.post(
            route('module.modules.install', module.key),
            {},
            { preserveScroll: true, onFinish: () => setBusyKey(null) },
        );
    };

    const installDemo = (demoKey: string): void => {
        setBusyKey(`demo:${demoKey}`);
        router.post(
            route('module.modules.demos.install', demoKey),
            {},
            { preserveScroll: true, onFinish: () => setBusyKey(null) },
        );
    };

    const uninstallDemo = (demoKey: string): void => {
        setBusyKey(`demo-uninstall:${demoKey}`);
        router.delete(route('module.modules.demos.uninstall', demoKey), {
            preserveScroll: true,
            onFinish: () => setBusyKey(null),
        });
    };

    const uninstall = (module: ModuleEntry): void => {
        setBusyKey(module.key);
        router.delete(route('module.modules.uninstall', module.key), {
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
                    title={t('platform.modules_catalog.title')}
                    description="Kelola modul operasional dan data demo untuk ruang kerja Anda"
                />
            }
        >
            <Head title={t('platform.modules_catalog.title')} />

            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        ✅ {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-2xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 p-4 text-xs font-bold text-rose-800 dark:text-rose-300">
                        ⚠️ {flash.error}
                    </div>
                )}

                {/* Plan Overview Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('platform.modules_catalog.plan_label')}</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.label}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                            Plan: {plan.key}
                        </span>
                    </div>
                </div>

                {/* Demo Datasets Section */}
                {canInstallDemoData && demos.length > 0 && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t('platform.modules_catalog.demos_heading')}</h3>
                                <p className="text-xs text-slate-400">{t('platform.modules_catalog.demos_hint')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {demos.map((demo) => {
                                const busy = busyKey === `demo:${demo.key}` || busyKey === `demo-uninstall:${demo.key}`;

                                return (
                                    <div
                                        key={demo.key}
                                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-5 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{demo.label}</h4>
                                                {demo.installed && (
                                                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                                                        {t('platform.modules_catalog.states.installed')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{demo.description}</p>
                                            {demo.includes && demo.includes.length > 0 && (
                                                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-2">
                                                    📦 {t('platform.modules_catalog.demos_includes_prefix')} {demo.includes.join(', ')}
                                                </p>
                                            )}
                                            {demo.requires_module && !demo.module_available && (
                                                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-2">
                                                    ⚠️ {t('platform.modules_catalog.demos_requires_module', { module: demo.requires_module })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
                                            {demo.installed ? (
                                                <SecondaryButton
                                                    disabled={busy}
                                                    onClick={() => uninstallDemo(demo.key)}
                                                    className="!rounded-xl text-xs"
                                                >
                                                    {busyKey === `demo-uninstall:${demo.key}`
                                                        ? t('platform.modules_catalog.actions.uninstalling')
                                                        : t('platform.modules_catalog.actions.uninstall_demo')}
                                                </SecondaryButton>
                                            ) : (
                                                <PrimaryButton
                                                    disabled={busy || demo.module_available === false}
                                                    onClick={() => installDemo(demo.key)}
                                                    className="!rounded-xl text-xs shadow-sm"
                                                >
                                                    {busyKey === `demo:${demo.key}`
                                                        ? t('platform.modules_catalog.actions.installing')
                                                        : t('platform.modules_catalog.actions.install_demo')}
                                                </PrimaryButton>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Available Modules Section */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    {/* Header & Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t('platform.modules_catalog.available_heading')}</h3>
                                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                        {filteredModules.length} / {modules.length}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">{t('platform.modules_catalog.available_hint', { days: graceDays })}</p>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            {/* Search Input */}
                            <div className="relative flex-1 sm:w-64">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                </div>
                                <TextInput
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari modul..."
                                    className="!rounded-2xl text-xs pl-9 pr-8 w-full bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Pills */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                                {[
                                    { key: 'all', label: 'Semua' },
                                    { key: 'installed', label: 'Terpasang' },
                                    { key: 'available', label: 'Tersedia' },
                                    { key: 'uninstalled', label: 'Dicopot' },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setStatusFilter(tab.key)}
                                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                                            statusFilter === tab.key
                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modules Grid */}
                    {filteredModules.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                                🔍
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada modul yang ditemukan</p>
                            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter status modul Anda.</p>
                            {(searchQuery || statusFilter !== 'all') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                    }}
                                    className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Reset Filter & Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredModules.map((module) => {
                                const badgeLabel = t(`platform.modules_catalog.states.${module.state}`);
                                const busy = busyKey === module.key;

                                return (
                                    <div
                                        key={module.key}
                                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 p-5 flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{module.label}</h4>
                                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATE_BADGE_CLASS[module.state]}`}>
                                                    {badgeLabel}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">{module.description}</p>

                                            {module.state === 'uninstalled' && module.purges_at && (
                                                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-2">
                                                    ⏳ {t('platform.modules_catalog.purges_at', { date: module.purges_at })}
                                                </p>
                                            )}

                                            {module.state === 'locked_with_data' && (
                                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                                                    🔒 {t('platform.modules_catalog.locked_with_data_hint')}
                                                </p>
                                            )}

                                            {isDisabled(module.state) && (
                                                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-2">
                                                    🚫 {module.state === 'disabled_with_data'
                                                        ? t('platform.modules_catalog.disabled_with_data_hint')
                                                        : t('platform.modules_catalog.disabled_hint')}
                                                </p>
                                            )}

                                            {!isDisabled(module.state) && !module.entitled && module.plans_offering.length > 0 && (
                                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                                                    💡 {t('platform.modules_catalog.plans_offering_hint', { plans: module.plans_offering.join(', ') })}
                                                </p>
                                            )}

                                            {module.requires.length > 0 && (
                                                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-2">
                                                    🔗 {t('platform.modules_catalog.requires_prefix')} {module.requires.join(', ')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
                                            {isDisabled(module.state) ? (
                                                <SecondaryButton disabled className="!rounded-xl text-xs">{t('platform.modules_catalog.states.disabled')}</SecondaryButton>
                                            ) : !module.entitled ? (
                                                <SecondaryButton disabled className="!rounded-xl text-xs">{t('platform.modules_catalog.actions.needs_upgrade')}</SecondaryButton>
                                            ) : module.installed ? (
                                                <SecondaryButton
                                                    disabled={busy}
                                                    onClick={() => setConfirming(module)}
                                                    className="!rounded-xl text-xs"
                                                >
                                                    🗑️ {t('platform.modules_catalog.actions.uninstall')}
                                                </SecondaryButton>
                                            ) : (
                                                <PrimaryButton disabled={busy} onClick={() => install(module)} className="!rounded-xl text-xs shadow-sm">
                                                    ⚡ {busy ? t('platform.modules_catalog.actions.installing') : t('platform.modules_catalog.actions.install')}
                                                </PrimaryButton>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={confirming !== null}
                title={t('platform.modules_catalog.uninstall_confirm.title', { module: confirming?.label ?? '' })}
                message={t('platform.modules_catalog.uninstall_confirm.message', { days: graceDays })}
                confirmText={t('platform.modules_catalog.uninstall_confirm.confirm')}
                processing={busyKey !== null}
                onClose={() => setConfirming(null)}
                onConfirm={() => confirming && uninstall(confirming)}
            />
        </DynamicLayout>
    );
}
