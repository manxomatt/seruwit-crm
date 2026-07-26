import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface BillLine {
    id: number;
    description: string;
    amount: string | number;
    expected_amount: string | number | null;
    variance: number;
    exceeds_tolerance: boolean;
}

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
    lines: BillLine[];
}

interface MatchInfo {
    tolerance_amount: number;
    tolerance_percent: number;
    has_variance: boolean;
    exceeds_tolerance: boolean;
}

interface Props {
    bill: Bill;
    match: MatchInfo;
    can: { update: boolean; delete: boolean; create: boolean };
}

function LineEditor({
    billId,
    line,
    canEdit,
}: {
    billId: number;
    line: BillLine;
    canEdit: boolean;
}): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [editing, setEditing] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        amount: String(line.amount),
    });

    const save: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('payables.bills.lines.update', { bill: billId, line: line.id }), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    if (!canEdit) {
        return <span className="tabular-nums">{formatMoney(Number(line.amount))}</span>;
    }

    if (!editing) {
        return (
            <button type="button" className="tabular-nums text-indigo-600 hover:underline" onClick={() => setEditing(true)}>
                {formatMoney(Number(line.amount))}
            </button>
        );
    }

    return (
        <form onSubmit={save} className="flex items-center justify-end gap-2">
            <TextInput
                type="number"
                step="0.01"
                className="w-28 text-right"
                value={data.amount}
                onChange={(e) => setData('amount', e.target.value)}
            />
            <PrimaryButton disabled={processing}>{t('payables.bills.save_line')}</PrimaryButton>
            {errors.amount && <span className="text-xs text-red-600">{errors.amount}</span>}
        </form>
    );
}

export default function Show({ bill, match, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const isDraft = bill.status === 'draft';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">{bill.code}</h2>
                    <div className="flex gap-2">
                        {can.update && isDraft && (
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

            {(match.has_variance || match.exceeds_tolerance) && (
                <div
                    className={`mb-4 rounded-md px-4 py-3 text-sm ${
                        match.exceeds_tolerance
                            ? 'border border-red-200 bg-red-50 text-red-800'
                            : 'border border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                >
                    {match.exceeds_tolerance ? t('payables.bills.match_warn') : t('payables.bills.match_ok')}
                </div>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">{t('payables.bills.expected')}</th>
                            <th className="px-4 py-3 text-right">{t('payables.bills.billed')}</th>
                            <th className="px-4 py-3 text-right">{t('payables.bills.variance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.lines.map((line) => (
                            <tr key={line.id} className="border-b">
                                <td className="px-4 py-3 text-sm">{line.description}</td>
                                <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-600">
                                    {line.expected_amount !== null
                                        ? formatMoney(Number(line.expected_amount))
                                        : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <LineEditor billId={bill.id} line={line} canEdit={can.update && isDraft} />
                                </td>
                                <td
                                    className={`px-4 py-3 text-right text-sm tabular-nums ${
                                        line.exceeds_tolerance ? 'font-semibold text-red-600' : 'text-gray-700'
                                    }`}
                                >
                                    {formatMoney(line.variance)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}
