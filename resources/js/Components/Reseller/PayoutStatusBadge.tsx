import { useTrans } from '@/hooks/useTrans';

const STATUS_CLASSES: Record<string, string> = {
    draft: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    approved: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 line-through',
};

export default function PayoutStatusBadge({ status }: { status: string }): JSX.Element {
    const { t } = useTrans();

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                STATUS_CLASSES[status] ?? STATUS_CLASSES.draft
            }`}
        >
            {t(`reseller.payout_status.${status}`)}
        </span>
    );
}
