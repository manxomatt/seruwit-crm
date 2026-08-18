interface Props {
    label: string;
    value: string;
    hint?: string;
    tone?: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose';
}

const TONES: Record<string, { wrap: string; label: string; value: string }> = {
    indigo: {
        wrap: 'from-indigo-500/10 via-purple-500/5 border-indigo-500/15',
        label: 'text-indigo-600 dark:text-indigo-400',
        value: 'text-slate-900 dark:text-white',
    },
    emerald: {
        wrap: 'from-emerald-500/10 via-teal-500/5 border-emerald-500/15',
        label: 'text-emerald-600 dark:text-emerald-400',
        value: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
        wrap: 'from-amber-500/10 via-orange-500/5 border-amber-500/15',
        label: 'text-amber-600 dark:text-amber-400',
        value: 'text-amber-600 dark:text-amber-400',
    },
    sky: {
        wrap: 'from-sky-500/10 via-blue-500/5 border-sky-500/15',
        label: 'text-sky-600 dark:text-sky-400',
        value: 'text-slate-900 dark:text-white',
    },
    rose: {
        wrap: 'from-rose-500/10 via-pink-500/5 border-rose-500/15',
        label: 'text-rose-600 dark:text-rose-400',
        value: 'text-rose-600 dark:text-rose-400',
    },
};

export default function StatCard({ label, value, hint, tone = 'indigo' }: Props): JSX.Element {
    const styles = TONES[tone] ?? TONES.indigo;

    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-5 shadow-sm ${styles.wrap}`}>
            <div className={`text-xs font-semibold uppercase tracking-wider ${styles.label}`}>{label}</div>
            <div className={`mt-2 text-2xl font-bold tracking-tight ${styles.value}`}>{value}</div>
            {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
    );
}
