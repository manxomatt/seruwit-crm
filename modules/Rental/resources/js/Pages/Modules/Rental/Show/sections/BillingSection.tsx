import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { Link } from '@inertiajs/react';
import { DetailRow, EmptyBlock, PaymentBadge, SectionCard } from '../../ShowUi';
import type { PaymentSummary } from '../types';

interface Props {
    payment: PaymentSummary;
}

export default function BillingSection({ payment }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <SectionCard
            title={t('rental.sections.billing', undefined, 'Status Tagihan & Invoicing')}
            icon="🧾"
            action={
                <PaymentBadge
                    status={payment.status}
                    label={t(`rental.payment.${payment.status}`, undefined, payment.status)}
                />
            }
        >
            <dl>
                <DetailRow label={t('rental.fields.invoiced', undefined, 'Total Ditagihkan')}>
                    <span className="tabular-nums font-bold">{formatMoney(payment.total_invoiced)}</span>
                </DetailRow>
                <DetailRow label={t('rental.fields.paid', undefined, 'Total Terbayar')}>
                    <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(payment.total_paid)}</span>
                </DetailRow>
                <DetailRow label={t('rental.fields.balance_due', undefined, 'Sisa Tagihan')}>
                    <span className="tabular-nums font-black text-amber-600 dark:text-amber-400">{formatMoney(payment.balance_due)}</span>
                </DetailRow>
            </dl>
            {payment.invoices.length > 0 ? (
                <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                    {payment.invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                            <div>
                                <Link
                                    href={prefixedRoute('invoicing.invoices.show', inv.id)}
                                    className="font-mono font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    {inv.code}
                                </Link>
                                <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {inv.status}
                                </span>
                                {inv.due_date && (
                                    <span className="ml-2 text-[11px] text-slate-400">
                                        Jatuh tempo: {formatDateDmY(inv.due_date)}
                                    </span>
                                )}
                            </div>
                            <span className="tabular-nums font-black text-slate-900 dark:text-white">{formatMoney(inv.total)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-3">
                    <EmptyBlock>{t('rental.payment.none', undefined, 'Belum ada faktur tagihan yang diterbitkan.')}</EmptyBlock>
                </div>
            )}
        </SectionCard>
    );
}
