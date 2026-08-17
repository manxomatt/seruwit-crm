import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PayablesNav from '../../../../PayablesNav';

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

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();

    let style = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    let dot = 'bg-slate-500';

    if (status === 'issued') {
        style = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50';
        dot = 'bg-sky-500';
    } else if (status === 'partially_paid') {
        style = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50';
        dot = 'bg-amber-500';
    } else if (status === 'paid') {
        style = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50';
        dot = 'bg-emerald-500';
    } else if (status === 'voided') {
        style = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50';
        dot = 'bg-rose-500';
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`payables.status.${status}`, undefined, status)}
        </span>
    );
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
        return <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(Number(line.amount))}</span>;
    }

    if (!editing) {
        return (
            <button type="button" className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => setEditing(true)}>
                {formatMoney(Number(line.amount))} ✏️
            </button>
        );
    }

    return (
        <form onSubmit={save} className="flex items-center justify-end gap-2">
            <TextInput
                type="number"
                step="0.01"
                className="w-28 text-right !rounded-xl text-xs font-mono"
                value={data.amount}
                onChange={(e) => setData('amount', e.target.value)}
            />
            <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">{t('payables.bills.save_line')}</PrimaryButton>
            {errors.amount && <span className="text-xs text-rose-600">{errors.amount}</span>}
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
                <PageHeader
                    title={bill.code}
                    description={<StatusBadge status={bill.status} />}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            {can.update && isDraft && (
                                <PrimaryButton onClick={() => router.post(prefixedRoute('payables.bills.issue', bill.id))} className="!rounded-xl text-xs shadow-sm">
                                    🚀 {t('payables.bills.issue')}
                                </PrimaryButton>
                            )}
                            {can.create && ['issued', 'partially_paid'].includes(bill.status) && (
                                <Link
                                    href={prefixedRoute('payables.payments.create', {
                                        partner_id: bill.partner.id,
                                        bill_id: bill.id,
                                    })}
                                >
                                    <PrimaryButton className="!rounded-xl text-xs shadow-sm">💳 {t('payables.bills.pay')}</PrimaryButton>
                                </Link>
                            )}
                            {can.delete && ['draft', 'issued'].includes(bill.status) && Number(bill.amount_paid) === 0 && (
                                <SecondaryButton onClick={() => router.post(prefixedRoute('payables.bills.void', bill.id))} className="!rounded-xl text-xs">
                                    🚫 {t('payables.bills.void')}
                                </SecondaryButton>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={bill.code} />
            <PayablesNav />

            {/* Top Cards Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier</p>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">{bill.partner.name}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                    <div className="mt-1">
                        <StatusBadge status={bill.status} />
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total / Paid</p>
                    <p className="mt-1 font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatMoney(Number(bill.total))} <span className="text-slate-400 font-normal">/</span> <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(Number(bill.amount_paid))}</span>
                    </p>
                </div>
            </div>

            {/* Variance Tolerance Warning */}
            {(match.has_variance || match.exceeds_tolerance) && (
                <div
                    className={`mb-6 rounded-3xl p-4 text-xs font-bold shadow-sm ${
                        match.exceeds_tolerance
                            ? 'border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                            : 'border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200'
                    }`}
                >
                    ⚠️ {match.exceeds_tolerance ? t('payables.bills.match_warn') : t('payables.bills.match_ok')}
                </div>
            )}

            {/* Lines Table */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">📋 Line Items</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">Description</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('payables.bills.expected')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('payables.bills.billed')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('payables.bills.variance')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {bill.lines.map((line) => (
                                <tr key={line.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{line.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-500 dark:text-slate-400">
                                        {line.expected_amount !== null
                                            ? formatMoney(Number(line.expected_amount))
                                            : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <LineEditor billId={bill.id} line={line} canEdit={can.update && isDraft} />
                                    </td>
                                    <td
                                        className={`px-6 py-4 whitespace-nowrap text-right font-mono font-bold ${
                                            line.exceeds_tolerance ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                                        }`}
                                    >
                                        {formatMoney(line.variance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DynamicLayout>
    );
}
