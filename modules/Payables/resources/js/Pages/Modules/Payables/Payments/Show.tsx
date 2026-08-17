import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import SecondaryButton from '@/Components/SecondaryButton';
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
    reference_number: string | null;
    partner: { id: number; name: string };
    allocations: Array<{ id: number; amount: string; bill: { id: number; code: string } }>;
}

interface Props {
    payment: Payment;
    can: { delete: boolean };
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

export default function Show({ payment, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={payment.code}
                    description={<StatusBadge status={payment.status} />}
                    actions={
                        can.delete && payment.status === 'posted' && (
                            <SecondaryButton onClick={() => router.post(prefixedRoute('payables.payments.void', payment.id))} className="!rounded-xl text-xs">
                                🚫 Void
                            </SecondaryButton>
                        )
                    }
                />
            }
        >
            <Head title={payment.code} />
            <PayablesNav />

            {/* Overview Cards Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier</p>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">{payment.partner.name}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                    <div className="mt-1">
                        <StatusBadge status={payment.status} />
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</p>
                    <p className="mt-1 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(Number(payment.amount))}</p>
                </div>
            </div>

            {/* Allocations Table */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">📑 Allocated Vendor Bills</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">Bill</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">Allocated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {payment.allocations.map((row) => (
                                <tr key={row.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={prefixedRoute('payables.bills.show', row.bill?.id)}
                                            className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            {row.bill?.code}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(Number(row.amount))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DynamicLayout>
    );
}
