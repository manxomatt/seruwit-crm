import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PageHeader from '@/Components/PageHeader';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import ReceivablesNav from '../../../../ReceivablesNav';

interface Allocation {
    id: number;
    amount: string;
    invoice: {
        id: number;
        code: string;
        status: string;
        total: string;
        amount_paid: string;
        due_date: string | null;
    };
}

interface Payment {
    id: number;
    code: string;
    payment_date: string;
    amount: string;
    type: string;
    method: string;
    status: string;
    reference_number: string | null;
    notes: string | null;
    voided_at: string | null;
    partner: { id: number; code: string; name: string };
    recorder: { id: number; name: string } | null;
    allocations: Allocation[];
}

interface Props {
    payment: Payment;
    can: { create: boolean; update: boolean; delete: boolean };
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
            {t(`receivables.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Show({ payment, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const voidPayment = () => {
        if (!confirm(t('receivables.payments.show.void_confirm'))) {
            return;
        }
        router.post(prefixedRoute('receivables.payments.void', payment.id), {}, { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={payment.code}
                    description={<StatusBadge status={payment.status} />}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('receivables.payments.index')}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.back')}</SecondaryButton>
                            </Link>
                            {can.delete && payment.status === 'posted' && (
                                <DangerButton onClick={voidPayment} className="!rounded-xl text-xs">
                                    🚫 {t('receivables.actions.void')}
                                </DangerButton>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={payment.code} />

            <ReceivablesNav />

            <div className="max-w-4xl space-y-6">
                {/* Payment Overview Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.partner')}</p>
                            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{payment.partner.name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.date')}</p>
                            <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                                {new Date(payment.payment_date).toLocaleDateString(localeTag)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.type_method')}</p>
                            <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                {t(`receivables.types.${payment.type}`, undefined, payment.type)} ·{' '}
                                {t(`receivables.methods.${payment.method}`, undefined, payment.method)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.amount')}</p>
                            <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(payment.amount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {t('receivables.fields.reference_number')}
                            </p>
                            <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">{payment.reference_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {t('receivables.fields.recorded_by')}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{payment.recorder?.name ?? '—'}</p>
                        </div>
                        {payment.notes && (
                            <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.notes')}</p>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{payment.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Allocations Table */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">📄 {t('receivables.payments.show.allocations')}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.invoice')}
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.status')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.allocated')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                {payment.allocations.map((row) => (
                                    <tr key={row.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                href={prefixedRoute('invoicing.invoices.show', row.invoice.id)}
                                                className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                {row.invoice.code}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                            {row.invoice.status}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {formatMoney(row.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
