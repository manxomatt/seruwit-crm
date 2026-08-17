import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import PageHeader from '@/Components/PageHeader';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import PayablesNav from '../../../../PayablesNav';

interface Payment {
    id: number;
    code: string;
    payment_date: string;
    amount: string;
    method: string;
    status: string;
    partner: { id: number; name: string };
}

interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    payments: PaginatedPayments;
    can: { create: boolean };
}

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const isPosted = status === 'posted';

    const style = isPosted
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50';

    const dot = isPosted ? 'bg-emerald-500' : 'bg-rose-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`payables.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Index({ payments, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('payables.payments.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('payables.payments.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">➕ {t('payables.payments.create')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('payables.payments.title')} />
            <PayablesNav />

            {/* Payments Table */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.code')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.supplier')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.status')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {payments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-2xl mb-2">
                                            💳
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">{t('payables.payments.empty')}</p>
                                    </td>
                                </tr>
                            ) : (
                                payments.data.map((payment) => (
                                    <tr key={payment.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            <Link href={prefixedRoute('payables.payments.show', payment.id)} className="hover:underline">
                                                {payment.code}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{payment.partner?.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={payment.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {formatMoney(Number(payment.amount))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {payments.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {t('common.showing_results', {
                                from: (payments.current_page - 1) * payments.per_page + 1,
                                to: Math.min(payments.current_page * payments.per_page, payments.total),
                                total: payments.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {payments.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-1 text-xs font-bold transition ${
                                        link.active
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : link.url
                                              ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                              : 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
