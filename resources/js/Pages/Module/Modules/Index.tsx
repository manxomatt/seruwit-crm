import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

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

interface Props {
    modules: ModuleEntry[];
    plan: Plan;
    graceDays: number;
}

const STATE_BADGE_CLASS: Record<ModuleState, string> = {
    installed: 'bg-green-100 text-green-800',
    available: 'bg-sky-100 text-sky-800',
    uninstalled: 'bg-amber-100 text-amber-800',
    locked: 'bg-gray-100 text-gray-600',
    locked_with_data: 'bg-gray-100 text-gray-600',
    disabled: 'bg-red-100 text-red-800',
    disabled_with_data: 'bg-red-100 text-red-800',
};

const isDisabled = (state: ModuleState): boolean => state === 'disabled' || state === 'disabled_with_data';

export default function Index({ modules, plan, graceDays }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [confirming, setConfirming] = useState<ModuleEntry | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);

    const install = (module: ModuleEntry): void => {
        setBusyKey(module.key);
        router.post(
            route('module.modules.install', module.key),
            {},
            { preserveScroll: true, onFinish: () => setBusyKey(null) },
        );
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
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('platform.modules_catalog.title')}</h2>}>
            <Head title={t('platform.modules_catalog.title')} />

            <div className="py-6">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 ring-1 ring-green-200">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                            {flash.error}
                        </div>
                    )}

                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">{t('platform.modules_catalog.plan_label')}</h3>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{plan.label}</p>
                                <p className="text-sm text-gray-500">{plan.description}</p>
                            </div>
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                                {plan.key}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-100 p-6">
                            <h3 className="text-base font-semibold text-gray-900">{t('platform.modules_catalog.available_heading')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('platform.modules_catalog.available_hint', { days: graceDays })}</p>
                        </div>

                        {modules.length === 0 ? (
                            <p className="p-6 text-sm text-gray-500">{t('platform.modules_catalog.empty')}</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {modules.map((module) => {
                                    const badgeLabel = t(`platform.modules_catalog.states.${module.state}`);
                                    const busy = busyKey === module.key;

                                    return (
                                        <li key={module.key} className="flex flex-wrap items-center gap-4 p-6">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-gray-900">{module.label}</h4>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_BADGE_CLASS[module.state]}`}>
                                                        {badgeLabel}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">{module.description}</p>

                                                {module.state === 'uninstalled' && module.purges_at && (
                                                    <p className="mt-2 text-xs text-amber-700">
                                                        {t('platform.modules_catalog.purges_at', { date: module.purges_at })}
                                                    </p>
                                                )}

                                                {module.state === 'locked_with_data' && (
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        {t('platform.modules_catalog.locked_with_data_hint')}
                                                    </p>
                                                )}

                                                {isDisabled(module.state) && (
                                                    <p className="mt-2 text-xs text-red-700">
                                                        {module.state === 'disabled_with_data'
                                                            ? t('platform.modules_catalog.disabled_with_data_hint')
                                                            : t('platform.modules_catalog.disabled_hint')}
                                                    </p>
                                                )}

                                                {!isDisabled(module.state) && !module.entitled && module.plans_offering.length > 0 && (
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        {t('platform.modules_catalog.plans_offering_hint', { plans: module.plans_offering.join(', ') })}
                                                    </p>
                                                )}

                                                {module.requires.length > 0 && (
                                                    <p className="mt-2 text-xs text-gray-400">
                                                        {t('platform.modules_catalog.requires_prefix')} {module.requires.join(', ')}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="shrink-0">
                                                {isDisabled(module.state) ? (
                                                    <SecondaryButton disabled>{t('platform.modules_catalog.states.disabled')}</SecondaryButton>
                                                ) : !module.entitled ? (
                                                    <SecondaryButton disabled>{t('platform.modules_catalog.actions.needs_upgrade')}</SecondaryButton>
                                                ) : module.installed ? (
                                                    <SecondaryButton
                                                        disabled={busy}
                                                        onClick={() => setConfirming(module)}
                                                    >
                                                        {t('platform.modules_catalog.actions.uninstall')}
                                                    </SecondaryButton>
                                                ) : (
                                                    <PrimaryButton disabled={busy} onClick={() => install(module)}>
                                                        {busy ? t('platform.modules_catalog.actions.installing') : t('platform.modules_catalog.actions.install')}
                                                    </PrimaryButton>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
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
