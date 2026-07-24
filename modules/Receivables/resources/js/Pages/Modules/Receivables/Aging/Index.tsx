import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import ReceivablesNav from '../../../../ReceivablesNav';

interface AgingRow {
    invoice_id: number;
    code: string;
    partner: { id: number; code: string; name: string };
    issue_date: string | null;
    due_date: string | null;
    total: number;
    amount_paid: number;
    balance: number;
    days_past_due: number;
    bucket: string;
    is_overdue: boolean;
}

interface Props {
    buckets: Record<string, number>;
    overdue_count: number;
    overdue_amount: number;
    rows: AgingRow[];
}

const bucketLabel: Record<string, string> = {
    current: 'Current',
    '1_30': '1–30',
    '31_60': '31–60',
    '61_90': '61–90',
    '90_plus': '90+',
};

export default function Index({ buckets, overdue_count, overdue_amount, rows }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">AR Aging</h2>}>
            <Head title="AR Aging" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ReceivablesNav />

                    {overdue_count > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                            Alert: <strong>{overdue_count} overdue</strong> · {formatMoney(overdue_amount)}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-5">
                        {Object.entries(buckets).map(([key, value]) => (
                            <div key={key} className="rounded-lg border border-gray-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-wider text-gray-500">{bucketLabel[key] ?? key}</p>
                                <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(value)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Partner</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Due</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Balance</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Days PD</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Bucket</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                            Tidak ada piutang terbuka.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.invoice_id} className={row.is_overdue ? 'bg-red-50/40' : ''}>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('invoicing.invoices.show', row.invoice_id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {row.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{row.partner.name}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {row.due_date ? new Date(row.due_date).toLocaleDateString('id-ID') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(row.balance)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{row.days_past_due}</td>
                                            <td className="px-4 py-3">{bucketLabel[row.bucket] ?? row.bucket}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`${prefixedRoute('receivables.payments.create')}?partner_id=${row.partner.id}&invoice_id=${row.invoice_id}`}
                                                >
                                                    <PrimaryButton type="button">Bayar</PrimaryButton>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
