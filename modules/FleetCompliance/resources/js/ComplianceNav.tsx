import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

interface Props {
    activeTab?: 'board' | 'history';
    onTabChange?: (tab: 'board' | 'history') => void;
}

export default function ComplianceNav({ activeTab = 'board', onTabChange }: Props) {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    const isFleetComplianceRoute =
        isCurrentRoute('fleet-compliance.*') ||
        isCurrentRoute('fleet-compliances.*') ||
        isCurrentRoute('fleet.compliance.*') ||
        isCurrentRoute('documents.compliance.*');

    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 overflow-x-auto">
                <Link
                    href={prefixedRoute('fleet-compliance.index')}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                        isFleetComplianceRoute
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <span>🛡️</span>
                    <span>{t('fleet_compliance.nav.board', undefined, 'Kepatuhan & Pajak Armada')}</span>
                </Link>

                <Link
                    href={prefixedRoute('fleet.vehicles.index')}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                >
                    <span>🚗</span>
                    <span>{t('fleet.nav.vehicles', undefined, 'Daftar Armada')}</span>
                </Link>

                <Link
                    href={prefixedRoute('fleet-fuel.index')}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                >
                    <span>⛽</span>
                    <span>{t('modules.fleet-fuel', undefined, 'BBM Armada')}</span>
                </Link>

                <Link
                    href={prefixedRoute('fleet-settlement.index')}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                >
                    <span>🤝</span>
                    <span>{t('modules.fleet-settlement', undefined, 'Rekonsiliasi Armada')}</span>
                </Link>
            </div>

            {onTabChange && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => onTabChange('board')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'board'
                                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        📋 Matriks Kepatuhan
                    </button>
                    <button
                        type="button"
                        onClick={() => onTabChange('history')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'history'
                                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        📜 Riwayat Perpanjangan
                    </button>
                </div>
            )}
        </div>
    );
}
