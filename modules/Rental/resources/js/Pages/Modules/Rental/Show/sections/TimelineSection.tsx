import { useTrans } from '@/hooks/useTrans';
import { formatDateTimeDmYHi } from '@/utils/date';
import { SectionCard } from '../../ShowUi';
import type { Rental } from '../types';

interface Props {
    rental: Rental;
}

export default function TimelineSection({ rental }: Props): JSX.Element {
    const { t } = useTrans();

    const timelineSteps = [
        { label: t('rental.timeline.created'), date: rental.confirmed_at ? '' : t('rental.timeline.pending'), done: true },
        { label: t('rental.timeline.confirmed'), date: rental.confirmed_at ? formatDateTimeDmYHi(rental.confirmed_at) : null, by: rental.confirmed_by?.name, done: !!rental.confirmed_at },
        { label: t('rental.timeline.checked_out'), date: rental.checked_out_at ? formatDateTimeDmYHi(rental.checked_out_at) : null, done: !!rental.checked_out_at },
        { label: t('rental.timeline.returned'), date: rental.returned_at ? formatDateTimeDmYHi(rental.returned_at) : null, done: !!rental.returned_at },
        { label: t('rental.timeline.completed'), date: rental.completed_at ? formatDateTimeDmYHi(rental.completed_at) : null, done: !!rental.completed_at },
    ] as Array<{ label: string; date: string | null; by?: string; done: boolean }>;

    return (
        <SectionCard title={t('rental.sections.timeline', undefined, 'Alur & Status Perjalanan')} icon="🧭">
            <ol className="relative space-y-0 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                {timelineSteps.map((step, i) => (
                    <li key={i} className="relative mb-6 ml-4 last:mb-0">
                        <div
                            className={`absolute -left-[1.35rem] mt-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                                step.done ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                        />
                        <p className={`text-xs font-black ${step.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {step.label}
                        </p>
                        {step.date && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{step.date}</p>}
                        {step.by && (
                            <p className="text-[11px] text-slate-400">Oleh: <strong>{step.by}</strong></p>
                        )}
                    </li>
                ))}
                {(rental.status === 'cancelled' || rental.status === 'cancelled_paid') && (
                    <li className="relative mb-0 ml-4">
                        <div className="absolute -left-[1.35rem] mt-1 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />
                        <p className="text-xs font-black text-rose-600 dark:text-rose-400">{t('rental.timeline.cancelled', undefined, 'Dibatalkan')}</p>
                        {rental.cancelled_reason && (
                            <p className="mt-0.5 text-[11px] text-slate-400">Alasan: {rental.cancelled_reason}</p>
                        )}
                    </li>
                )}
            </ol>
        </SectionCard>
    );
}
