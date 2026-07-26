import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';

interface Bill {
    id: number;
    code: string;
    status: string;
    bill_date: string;
    total: string;
    amount_paid: string;
    notes: string | null;
    partner: { id: number; code: string; name: string };
    purchase_order?: { id: number; po_number: string } | null;
    good_receipt_note?: { id: number; grn_number: string } | null;
    lines: Array<{ id: number; description: string; amount: string }>;
}

interface Props {
    bill: Bill;
    can: { update: boolean; delete: boolean; create: boolean };
}

export default function Show({ bill, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">{bill.code}</h2>
                    <div className="flex gap-2">
                        {can.update && bill.status === 'draft' && (
                            <PrimaryButton onClick={() => router.post(prefixedRoute('payables.bills.issue', bill.id))}>
                                {t('payables.bills.issue')}
                            </PrimaryButton>
                        )}
                        {can.create && ['issued', 'partially_paid'].includes(bill.status) && (
                            <Link
                                href={prefixedRoute('payables.payments.create', {
                                    partner_id: bill.partner.id,
                                    bill_id: bill.id,
                                })}
                            >
                                <PrimaryButton>{t('payables.bills.pay')}</PrimaryButton>
                            </Link>
                        )}
                        {can.delete && ['draft', 'issued'].includes(bill.status) && Number(bill.amount_paid) === 0 && (
                            <SecondaryButton onClick={() => router.post(prefixedRoute('payables.bills.void', bill.id))}>
                                {t('payables.bills.void')}
                            </SecondaryButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={bill.code} />
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="font-medium">{bill.partner.name}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium">{t(`payables.status.${bill.status}`, undefined, bill.status)}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Total / Paid</p>
                    <p className="font-medium">
                        {formatMoney(Number(bill.total))} / {formatMoney(Number(bill.amount_paid))}
                    </p>
                </div>
            </div>
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.lines.map((line) => (
                            <tr key={line.id} className="border-b">
                                <td className="px-4 py-3 text-sm">{line.description}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(line.amount))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}
