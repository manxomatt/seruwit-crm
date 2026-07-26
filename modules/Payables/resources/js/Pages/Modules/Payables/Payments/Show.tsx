import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatMoney } from '@/utils/money';
import { Head, router } from '@inertiajs/react';

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

export default function Show({ payment, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">{payment.code}</h2>
                    {can.delete && payment.status === 'posted' && (
                        <SecondaryButton onClick={() => router.post(prefixedRoute('payables.payments.void', payment.id))}>
                            Void
                        </SecondaryButton>
                    )}
                </div>
            }
        >
            <Head title={payment.code} />
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="font-medium">{payment.partner.name}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium">{t(`payables.status.${payment.status}`, undefined, payment.status)}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-medium">{formatMoney(Number(payment.amount))}</p>
                </div>
            </div>
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Bill</th>
                            <th className="px-4 py-3 text-right">Allocated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payment.allocations.map((row) => (
                            <tr key={row.id} className="border-b">
                                <td className="px-4 py-3 text-sm">{row.bill?.code}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(row.amount))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}
