import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

interface OpenBill {
    id: number;
    code: string;
    total: number;
    amount_paid: number;
    balance: number;
}

interface Props {
    partners: Array<{ id: number; code: string; name: string }>;
    selectedPartnerId: number | null;
    selectedBillId: number | null;
    openBills: OpenBill[];
    methods: string[];
}

export default function Create({ partners, selectedPartnerId, selectedBillId, openBills, methods }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const form = useForm({
        partner_id: selectedPartnerId ? String(selectedPartnerId) : '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: selectedBillId
            ? String(openBills.find((b) => b.id === selectedBillId)?.balance ?? '')
            : '',
        method: 'transfer',
        reference_number: '',
        notes: '',
        allocations: selectedBillId
            ? [
                  {
                      supplier_bill_id: String(selectedBillId),
                      amount: String(openBills.find((b) => b.id === selectedBillId)?.balance ?? ''),
                  },
              ]
            : ([] as Array<{ supplier_bill_id: string; amount: string }>),
    });

    useEffect(() => {
        if (!form.data.partner_id) {
            return;
        }
        router.get(
            prefixedRoute('payables.payments.create'),
            { partner_id: form.data.partner_id, bill_id: selectedBillId || undefined },
            { preserveState: true, replace: true },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.partner_id]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('payables.payments.store'));
    };

    const selectBill = (bill: OpenBill) => {
        form.setData({
            ...form.data,
            amount: String(bill.balance),
            allocations: [{ supplier_bill_id: String(bill.id), amount: String(bill.balance) }],
        });
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('payables.payments.create')}</h2>}>
            <Head title={t('payables.payments.create')} />
            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <select
                        className="mt-1 w-full rounded border-gray-300"
                        value={form.data.partner_id}
                        onChange={(e) => form.setData('partner_id', e.target.value)}
                    >
                        <option value="">—</option>
                        {partners.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            className="mt-1 w-full rounded border-gray-300"
                            value={form.data.payment_date}
                            onChange={(e) => form.setData('payment_date', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Method</label>
                        <select
                            className="mt-1 w-full rounded border-gray-300"
                            value={form.data.method}
                            onChange={(e) => form.setData('method', e.target.value)}
                        >
                            {methods.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {openBills.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Open bills</p>
                        {openBills.map((bill) => (
                            <button
                                key={bill.id}
                                type="button"
                                onClick={() => selectBill(bill)}
                                className="flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                                <span>{bill.code}</span>
                                <span className="tabular-nums">{bill.balance}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded border-gray-300"
                        value={form.data.amount}
                        onChange={(e) => form.setData('amount', e.target.value)}
                    />
                </div>
                <PrimaryButton disabled={form.processing}>{t('payables.payments.create')}</PrimaryButton>
            </form>
        </DynamicLayout>
    );
}
