import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';

interface Bill {
    id: number;
    code: string;
    status: string;
    bill_date: string;
    total: string;
    amount_paid: string;
    partner: { id: number; code: string; name: string };
    good_receipt_note?: { id: number; grn_number: string } | null;
}

interface Props {
    bills: { data: Bill[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    can: { create: boolean; update: boolean };
}

export default function Index({ bills, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">{t('payables.bills.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('payables.payments.create')}>
                            <PrimaryButton>{t('payables.payments.create')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('payables.bills.title')} />
            <div className="mb-4 flex gap-4 text-sm">
                <Link href={prefixedRoute('payables.bills.index')} className="font-medium text-indigo-600">
                    {t('payables.nav.bills')}
                </Link>
                <Link href={prefixedRoute('payables.payments.index')} className="text-gray-600 hover:text-gray-900">
                    {t('payables.nav.payments')}
                </Link>
            </div>
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Supplier</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">Paid</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('payables.bills.empty')}
                                </td>
                            </tr>
                        )}
                        {bills.data.map((bill) => (
                            <tr key={bill.id} className="border-b">
                                <td className="px-4 py-3">
                                    <Link
                                        href={prefixedRoute('payables.bills.show', bill.id)}
                                        className="font-medium text-indigo-600"
                                    >
                                        {bill.code}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm">{bill.partner?.name}</td>
                                <td className="px-4 py-3 text-sm">{t(`payables.status.${bill.status}`, undefined, bill.status)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(bill.total))}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(bill.amount_paid))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}
