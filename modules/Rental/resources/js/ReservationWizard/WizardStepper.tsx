import { useTrans } from '@/hooks/useTrans';
import type { WizardStep } from './types';
import { WIZARD_STEPS } from './types';

interface Props {
    step: WizardStep;
    onStepClick?: (step: WizardStep) => void;
}

const STEP_ICONS: Record<WizardStep, string> = {
    1: '📅',
    2: '🚗',
    3: '📍',
    4: '🛡️',
    5: '👤',
    6: '✅',
};

export default function WizardStepper({ step, onStepClick }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <div className="mb-8">
            {/* Desktop Stepper */}
            <div className="hidden md:block">
                <ol className="grid grid-cols-6 gap-2">
                    {WIZARD_STEPS.map((n) => {
                        const active = n === step;
                        const done = n < step;
                        const clickable = Boolean(onStepClick && n < step);

                        const stepLabel = t(`rental.wizard.steps.${n}`, undefined, String(n));

                        return (
                            <li key={n} className="relative">
                                <button
                                    type="button"
                                    disabled={!clickable}
                                    onClick={() => clickable && onStepClick?.(n)}
                                    className={`group flex w-full flex-col items-start rounded-2xl border p-3 text-left transition-all duration-200 ${
                                        active
                                            ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                            : done
                                              ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                              : 'border-slate-200/80 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-800/40'
                                    } ${clickable ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'}`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold shadow-2xs dark:bg-slate-800">
                                            {done ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                                            ) : (
                                                <span>{STEP_ICONS[n]}</span>
                                            )}
                                        </span>
                                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                                            0{n}
                                        </span>
                                    </div>

                                    <div className="mt-2 min-w-0">
                                        <p
                                            className={`truncate text-xs font-bold ${
                                                active
                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                    : done
                                                      ? 'text-slate-800 dark:text-slate-200'
                                                      : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            {stepLabel}
                                        </p>
                                    </div>

                                    {/* Bottom Progress Line */}
                                    <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                done
                                                    ? 'w-full bg-emerald-500'
                                                    : active
                                                      ? 'w-1/2 bg-indigo-600'
                                                      : 'w-0'
                                            }`}
                                        />
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>

            {/* Mobile / Tablet Compact Stepper */}
            <div className="block md:hidden">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-xs">
                            {STEP_ICONS[step]}
                        </span>
                        <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                                Langkah {step} dari 6
                            </span>
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                                {t(`rental.wizard.steps.${step}`, undefined, `Langkah ${step}`)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        {WIZARD_STEPS.map((n) => (
                            <div
                                key={n}
                                className={`h-2 w-4 rounded-full transition-all ${
                                    n === step
                                        ? 'w-6 bg-indigo-600'
                                        : n < step
                                          ? 'bg-emerald-500'
                                          : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

