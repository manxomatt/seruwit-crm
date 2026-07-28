import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
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

export default function Index({ payments, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">{t('payables.payments.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('payables.payments.create')}>
                            <PrimaryButton>{t('payables.payments.create')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('payables.payments.title')} />
            <PayablesNav />
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Supplier</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('payables.payments.empty')}
                                </td>
                            </tr>
                        )}
                        {payments.data.map((payment) => (
                            <tr key={payment.id} className="border-b">
                                <td className="px-4 py-3">
                                    <Link
                                        href={prefixedRoute('payables.payments.show', payment.id)}
                                        className="font-medium text-indigo-600"
                                    >
                                        {payment.code}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm">{payment.partner?.name}</td>
                                <td className="px-4 py-3 text-sm">{t(`payables.status.${payment.status}`, undefined, payment.status)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(payment.amount))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {payments.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
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
