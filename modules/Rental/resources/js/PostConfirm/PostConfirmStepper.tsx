import { useTrans } from '@/hooks/useTrans';
import type { PostConfirmProgress, PostConfirmStepId } from './types';
import { POST_CONFIRM_STEPS } from './types';

interface Props {
    progress: PostConfirmProgress;
    step: PostConfirmStepId;
    onStepChange: (step: PostConfirmStepId) => void;
}

export default function PostConfirmStepper({ progress, step, onStepChange }: Props): JSX.Element {
    const { t } = useTrans();
    const byId = Object.fromEntries(progress.steps.map((s) => [s.id, s]));

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700 sm:px-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t('rental.post_confirm.title')}
                </p>
            </div>
            <ol className="flex flex-wrap items-center gap-2 px-5 py-4 sm:px-6">
                {POST_CONFIRM_STEPS.map((n, index) => {
                    const state = byId[n];
                    const active = n === step;
                    const done = state?.done ?? false;
                    const available = state?.available ?? false;
                    const clickable = available || done;

                    return (
                        <li key={n} className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!clickable}
                                onClick={() => clickable && onStepChange(n)}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                                    active
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : done
                                          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300'
                                          : available
                                            ? 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600'
                                            : 'bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-gray-500 dark:ring-gray-700'
                                } ${clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                                        active
                                            ? 'bg-white/20 text-white'
                                            : done
                                              ? 'bg-indigo-600 text-white'
                                              : 'bg-white text-gray-500 dark:bg-gray-800'
                                    }`}
                                >
                                    {done && !active ? '✓' : n}
                                </span>
                                {t(`rental.post_confirm.steps.${n}`)}
                            </button>
                            {index < POST_CONFIRM_STEPS.length - 1 && (
                                <span className="hidden text-gray-300 dark:text-gray-600 sm:inline" aria-hidden>
                                    →
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
