import { useTrans } from '@/hooks/useTrans';
import type { WizardStep } from './types';
import { WIZARD_STEPS } from './types';

interface Props {
    step: WizardStep;
    onStepClick?: (step: WizardStep) => void;
}

export default function WizardStepper({ step, onStepClick }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <ol className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
            {WIZARD_STEPS.map((n) => {
                const active = n === step;
                const done = n < step;
                const clickable = onStepClick && n < step;

                return (
                    <li key={n} className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => clickable && onStepClick?.(n)}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                active
                                    ? 'bg-indigo-600 text-white'
                                    : done
                                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                      : 'bg-gray-100 text-gray-500'
                            } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                                    active ? 'bg-white/20 text-white' : done ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500'
                                }`}
                            >
                                {n}
                            </span>
                            {t(`rental.wizard.steps.${n}`, undefined, String(n))}
                        </button>
                        {n < 5 && <span className="hidden text-gray-300 sm:inline">→</span>}
                    </li>
                );
            })}
        </ol>
    );
}
