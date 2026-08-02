import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import PayablesNav from '../../../../PayablesNav';
import PageHeader from '@/Components/PageHeader';

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

interface PaginatedBills {
    data: Bill[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    bills: PaginatedBills;
    can: { create: boolean; update: boolean };
}

export default function Index({ bills, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('payables.bills.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('payables.payments.create')}>
                            <PrimaryButton>{t('payables.payments.create')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('payables.bills.title')} />
            <PayablesNav />
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

                {bills.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (bills.current_page - 1) * bills.per_page + 1,
                                to: Math.min(bills.current_page * bills.per_page, bills.total),
                                total: bills.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {bills.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
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
