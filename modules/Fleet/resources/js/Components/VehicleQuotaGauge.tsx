import { useMemo } from 'react';

interface Props {
    current: number;
    max: number | null;
    total?: number;
    reached?: boolean;
    onOpenUpgrade: () => void;
}

export default function VehicleQuotaGauge({
    current,
    max,
    total = current,
    reached = false,
    onOpenUpgrade,
}: Props): JSX.Element {
    const isUnlimited = max === null || max <= 0;
    const inactiveCount = Math.max(0, total - current);

    const percentage = useMemo(() => {
        if (isUnlimited) return 0;
        return Math.min(100, Math.round((current / max) * 100));
    }, [current, max, isUnlimited]);

    const statusColor = useMemo(() => {
        if (isUnlimited) return 'bg-emerald-500';
        if (percentage >= 100 || reached) return 'bg-rose-500';
        if (percentage >= 80) return 'bg-amber-500';
        return 'bg-indigo-600';
    }, [percentage, reached, isUnlimited]);

    const badgeColor = useMemo(() => {
        if (isUnlimited) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
        if (percentage >= 100 || reached) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
        if (percentage >= 80) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
    }, [percentage, reached, isUnlimited]);

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Info Text */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                            📊
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Kapasitas Slot Kendaraan Aktif
                        </h3>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${badgeColor}`}>
                            {isUnlimited ? 'Unlimited (Trial)' : `${percentage}% Terpakai`}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {current}
                        </span>
                        <span className="text-sm font-bold text-slate-400">
                            / {isUnlimited ? '∞' : max} Slot Aktif
                        </span>
                        {inactiveCount > 0 && (
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                ({inactiveCount} unit non-aktif / arsip)
                            </span>
                        )}
                    </div>
                </div>

                {/* Upgrade Button */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onOpenUpgrade}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
                    >
                        <span>⚡</span>
                        <span>+ Tambah Slot Armada</span>
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {!isUnlimited && (
                <div className="mt-4 space-y-1">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                        <span>{current} unit aktif saat ini</span>
                        <span>Sisa {Math.max(0, (max || 0) - current)} slot tersedia</span>
                    </div>
                </div>
            )}
        </div>
    );
}
