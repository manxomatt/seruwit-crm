import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ReceivablesNav from '../../../../ReceivablesNav';

interface Payment {
    id: number;
    code: string;
    payment_date: string;
    amount: string;
    type: string;
    method: string;
    status: string;
    reference_number: string | null;
    partner: { id: number; code: string; name: string };
}

interface Props {
    payments: {
        data: Payment[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    alerts: { overdue_count: number; overdue_amount: number };
    summary: { posted_this_month: number; open_ar: number };
    filters: { search?: string; status?: string };
    can: { create: boolean; update: boolean; delete: boolean };
}

const typeLabel: Record<string, string> = {
    down_payment: 'DP',
    installment: 'Cicilan',
    settlement: 'Lunas',
    other: 'Lainnya',
};

export default function Index({ payments, alerts, summary, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('receivables.payments.index'), { search, status: filters.status }, { preserveState: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Receivables</h2>
                    {can.create && (
                        <Link href={prefixedRoute('receivables.payments.create')}>
                            <PrimaryButton>Rekam Pembayaran</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Receivables — Payments" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ReceivablesNav />

                    {alerts.overdue_count > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <strong>{alerts.overdue_count} invoice overdue</strong>
                            {' — '}
                            {formatMoney(alerts.overdue_amount)} past due.{' '}
                            <Link href={prefixedRoute('receivables.aging.index')} className="font-medium underline">
                                Lihat aging
                            </Link>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-500">Open AR</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{formatMoney(summary.open_ar)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-500">Received this month</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{formatMoney(summary.posted_this_month)}</p>
                        </div>
                    </div>

                    <form onSubmit={submitSearch} className="flex gap-2">
                        <TextInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kode / referensi…"
                            className="max-w-sm"
                        />
                        <PrimaryButton type="submit">Cari</PrimaryButton>
                    </form>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Partner</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Method</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                            Belum ada pembayaran.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.data.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('receivables.payments.show', payment.id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {payment.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{payment.partner.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{typeLabel[payment.type] ?? payment.type}</td>
                                            <td className="px-4 py-3 capitalize text-gray-600">{payment.method}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(payment.amount)}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(payment.payment_date).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        payment.status === 'posted'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {payment.status}
                                                </span>
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
