import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
        'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
    available:
        'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50',
    uninstalled:
        'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
    disabled:
        'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
    disabled_with_data:
        'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
};

const STATE_LABEL: Record<ModuleState, string> = {
    installed: 'Terpasang',
    available: 'Tersedia',
    uninstalled: 'Menunggu penghapusan',
    disabled: 'Dinonaktifkan',
    disabled_with_data: 'Dinonaktifkan (data tersimpan)',
};

const isDisabled = (state: ModuleState): boolean =>
    state === 'disabled' || state === 'disabled_with_data';

export default function Index({ modules, graceDays }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [confirming, setConfirming] = useState<ModuleEntry | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);

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
                    title={t('shell.central_modules', undefined, 'Central Modules')}
                    description="Pasang atau lepas modul opsional pada dashboard Central Admin"
                />
            }
        >
            <Head title={t('shell.central_modules', undefined, 'Central Modules')} />

            <div className="space-y-6">
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

                {modules.length === 0 && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        Belum ada modul opsional yang tersedia untuk Central Admin.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {modules.map((module) => (
                        <div
                            key={module.key}
                            className="flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {module.label}
                                    </h3>
                                    <span className="text-xs font-medium text-slate-400">{module.key}</span>
                                </div>
                                <span
                                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${STATE_BADGE_CLASS[module.state]}`}
                                >
                                    {STATE_LABEL[module.state]}
                                </span>
                            </div>

                            <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {module.description}
                            </p>

                            {module.requires.length > 0 && (
                                <p className="mt-3 text-[11px] font-medium text-slate-400">
                                    Membutuhkan: {module.requires.join(', ')}
                                </p>
                            )}

                            {module.state === 'uninstalled' && module.purges_at && (
                                <p className="mt-3 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                    Data akan dihapus permanen pada {module.purges_at} ({graceDays} hari).
                                </p>
                            )}

                            <div className="mt-5 flex items-center gap-2">
                                {module.installed ? (
                                    <SecondaryButton
                                        onClick={() => setConfirming(module)}
                                        disabled={busyKey === module.key}
                                    >
                                        {busyKey === module.key ? 'Memproses…' : 'Lepas'}
                                    </SecondaryButton>
                                ) : (
                                    <PrimaryButton
                                        onClick={() => install(module)}
                                        disabled={busyKey === module.key || isDisabled(module.state)}
                                    >
                                        {busyKey === module.key ? 'Memproses…' : 'Pasang'}
                                    </PrimaryButton>
                                )}
                                {isDisabled(module.state) && !module.installed && (
                                    <span className="text-[11px] font-medium text-rose-500">
                                        Modul dinonaktifkan platform
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={confirming !== null}
                onClose={() => setConfirming(null)}
                onConfirm={() => confirming && uninstall(confirming)}
                title={`Lepas modul ${confirming?.label ?? ''}?`}
                message={`Modul akan dilepas dari dashboard central. Data tetap tersimpan dan dihapus permanen setelah ${graceDays} hari jika tidak dipasang kembali.`}
                confirmText="Lepas"
                processing={busyKey === confirming?.key}
            />
        </DynamicLayout>
    );
}
