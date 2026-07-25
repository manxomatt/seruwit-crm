import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-800">{payment.code}</h2>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                payment.status === 'posted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {t(`receivables.status.${payment.status}`, undefined, payment.status)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('receivables.payments.index')}>
                            <PrimaryButton>{t('receivables.actions.back')}</PrimaryButton>
                        </Link>
                        {can.delete && payment.status === 'posted' && (
                            <DangerButton onClick={voidPayment}>{t('receivables.actions.void')}</DangerButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={payment.code} />
            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ReceivablesNav />

                    <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-gray-500">{t('receivables.fields.partner')}</p>
                            <p className="font-medium">{payment.partner.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('receivables.fields.date')}</p>
                            <p className="font-medium">{new Date(payment.payment_date).toLocaleDateString(localeTag)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('receivables.fields.type_method')}</p>
                            <p className="font-medium">
                                {t(`receivables.types.${payment.type}`, undefined, payment.type)} ·{' '}
                                {t(`receivables.methods.${payment.method}`, undefined, payment.method)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('receivables.fields.amount')}</p>
                            <p className="text-xl font-semibold tabular-nums">{formatMoney(payment.amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('receivables.fields.reference_number')}</p>
                            <p className="font-medium">{payment.reference_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('receivables.fields.recorded_by')}</p>
                            <p className="font-medium">{payment.recorder?.name ?? '—'}</p>
                        </div>
                        {payment.notes && (
                            <div className="sm:col-span-2">
                                <p className="text-xs text-gray-500">{t('receivables.fields.notes')}</p>
                                <p className="text-gray-700">{payment.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
                            {t('receivables.payments.show.allocations')}
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.invoice')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.status')}</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.allocated')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payment.allocations.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-2">
                                            <Link
                                                href={prefixedRoute('invoicing.invoices.show', row.invoice.id)}
                                                className="text-indigo-600 hover:underline"
                                            >
                                                {row.invoice.code}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2 capitalize text-gray-600">{row.invoice.status.replace('_', ' ')}</td>
                                        <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.amount)}</td>
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
