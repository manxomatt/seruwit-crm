import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PosLayout from '../../../../PosLayout';

interface Sale {
    id: number;
    code: string;
    status: string;
    subtotal: string | number;
    tax_total: string | number;
    discount_total: string | number;
    grand_total: string | number;
    amount_tendered: string | number | null;
    change_due: string | number | null;
    sold_at: string;
    voided_at: string | null;
    void_reason: string | null;
    notes: string | null;
    warehouse: { id: number; name: string };
    cashier: { id: number; name: string } | null;
    voider: { id: number; name: string } | null;
    items: Array<{
        id: number;
        quantity: string | number;
        unit_price: string | number;
        line_total: string | number;
        unit: string | null;
        product: { id: number; name: string; sku: string | null; unit: string | null };
    }>;
    payments: Array<{ id: number; method: string; amount: string | number; reference: string | null }>;
}

interface Props {
    sale: Sale;
    can: { void: boolean; sell: boolean };
}

function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function Show({ sale, can }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [voiding, setVoiding] = useState(false);

    const form = useForm({
        void_reason: '',
    });

    const submitVoid = (event: FormEvent): void => {
        event.preventDefault();
        if (!window.confirm(t('pos.sales.show.void_confirm'))) {
            return;
        }
        form.post(prefixedRoute('pos.sales.void', sale.id), {
            onSuccess: () => setVoiding(false),
        });
    };

    return (
        <PosLayout title={t('pos.sales.show.title', { code: sale.code })}>
            <Head title={t('pos.sales.show.title', { code: sale.code })} />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-[var(--pos-muted)]">{sale.warehouse.name}</p>
                    <p className="mt-1 text-sm text-gray-600">
                        {sale.cashier?.name} · {new Date(sale.sold_at).toLocaleString('id-ID')}
                    </p>
                    <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            sale.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {t(`pos.sale_status.${sale.status}`, undefined, sale.status)}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
                    >
                        {t('pos.actions.print_receipt')}
                    </button>
                    {sale.status === 'completed' && can.void && (
                        <PrimaryButton type="button" onClick={() => setVoiding(true)}>
                            {t('pos.actions.void')}
                        </PrimaryButton>
                    )}
                    <Link
                        href={prefixedRoute('pos.terminal')}
                        className="rounded-lg bg-[var(--pos-accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                        {t('pos.actions.back_terminal')}
                    </Link>
                </div>
            </div>

            {sale.voided_at && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                    {t('pos.sales.show.voided_by')}: {sale.voider?.name} · {new Date(sale.voided_at).toLocaleString('id-ID')}
                    {sale.void_reason ? ` — ${sale.void_reason}` : ''}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[var(--pos-muted)]">
                        {t('pos.sales.show.items')}
                    </div>
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <tbody className="divide-y divide-gray-100">
                            {sale.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-xs text-gray-500">{item.product.sku}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {Number(item.quantity)} × {formatMoney(Number(item.unit_price))}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {formatMoney(Number(item.line_total))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-[var(--pos-muted)]">
                                <span>{t('pos.terminal.subtotal')}</span>
                                <span className="tabular-nums">{formatMoney(Number(sale.subtotal))}</span>
                            </div>
                            <div className="flex justify-between text-[var(--pos-muted)]">
                                <span>{t('pos.terminal.tax')}</span>
                                <span className="tabular-nums">{formatMoney(Number(sale.tax_total))}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                                <span>{t('pos.terminal.total')}</span>
                                <span className="tabular-nums">{formatMoney(Number(sale.grand_total))}</span>
                            </div>
                            {sale.change_due != null && Number(sale.change_due) > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                    <span>{t('pos.terminal.change')}</span>
                                    <span className="tabular-nums">{formatMoney(Number(sale.change_due))}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--pos-muted)]">
                            {t('pos.sales.show.payments')}
                        </p>
                        <ul className="space-y-2 text-sm">
                            {sale.payments.map((payment) => (
                                <li key={payment.id} className="flex justify-between">
                                    <span>
                                        {t(`pos.payment_methods.${payment.method}`, undefined, payment.method)}
                                        {payment.reference ? ` · ${payment.reference}` : ''}
                                    </span>
                                    <span className="tabular-nums">{formatMoney(Number(payment.amount))}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {voiding && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
                    <form onSubmit={submitVoid} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold">{t('pos.actions.void')}</h3>
                        <p className="mt-2 text-sm text-[var(--pos-muted)]">{t('pos.sales.show.void_confirm')}</p>
                        <div className="mt-4">
                            <InputLabel value={t('pos.sales.show.void_reason')} />
                            <TextInput
                                className="mt-1 block w-full"
                                value={form.data.void_reason}
                                onChange={(e) => form.setData('void_reason', e.target.value)}
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setVoiding(false)} className="rounded-lg px-4 py-2 text-sm">
                                {t('common.cancel')}
                            </button>
                            <PrimaryButton disabled={form.processing}>{t('pos.actions.void')}</PrimaryButton>
                        </div>
                    </form>
                </div>
            )}
        </PosLayout>
    );
}
