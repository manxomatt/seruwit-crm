import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import InvoicingNav from '../../../../InvoicingNav';
import { formatMoney } from '@/utils/money';

interface InvoiceLine {
    id: number;
    description: string;
    amount: string;
    source_type: string | null;
    source_id: number | null;
}

interface Invoice {
    id: number;
    code: string;
    status: string;
    issue_date: string;
    due_date: string | null;
    tax_enabled: boolean;
    tax_rate: string;
    tax_code_id?: number | null;
    tax_code?: string | null;
    tax_calculation?: string | null;
    subtotal: string;
    tax_amount: string;
    total: string;
    amount_paid?: string;
    paid_at: string | null;
    notes: string | null;
    partner: { id: number; code: string; name: string; credit_limit?: string | null };
    lines: InvoiceLine[];
}

interface TaxCodeOption {
    id: number;
    code: string;
    name: string;
    rate: number;
    calculation: string;
}

interface CreditSnapshot {
    limit: number | null;
    outstanding: number;
    available: number | null;
    utilization: number | null;
    is_overdue: boolean;
}

interface Props {
    invoice: Invoice;
    credit?: CreditSnapshot | null;
    can: { create: boolean; update: boolean; delete: boolean };
    canRecordPayment?: boolean;
    gatewayEnabled?: boolean;
    taxCodes?: TaxCodeOption[];
}

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const isPaid = status === 'paid';
    const isIssued = status === 'issued';
    const isPartial = status === 'partially_paid';
    const isDraft = status === 'draft';

    const style = isPaid
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : isIssued
        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50'
        : isPartial
        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
        : isDraft
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50';

    const dot = isPaid ? 'bg-emerald-500' : isIssued ? 'bg-sky-500' : isPartial ? 'bg-amber-500' : isDraft ? 'bg-slate-400' : 'bg-rose-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`invoicing.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Show({ invoice, credit, can, canRecordPayment = false, gatewayEnabled = false, taxCodes = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showLineModal, setShowLineModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);

    const lineForm = useForm({ description: '', amount: '' });

    const isDraft = invoice.status === 'draft';
    const isIssued = invoice.status === 'issued';
    const isPartiallyPaid = invoice.status === 'partially_paid';
    const isOpen = isIssued || isPartiallyPaid;
    const printable = isOpen || invoice.status === 'paid';
    const canEditLines = isDraft && can.update;
    const balanceDue = Math.max(0, parseFloat(invoice.total) - parseFloat(invoice.amount_paid || '0'));
    const canEditTax = can.update && isDraft && taxCodes.length > 0;

    const issue = () => {
        router.post(prefixedRoute('invoicing.invoices.issue', invoice.id), {}, { preserveScroll: true });
    };

    const pay = () => {
        router.post(prefixedRoute('invoicing.invoices.pay', invoice.id), {}, { preserveScroll: true });
    };

    const confirmVoid = () => {
        router.post(prefixedRoute('invoicing.invoices.void', invoice.id), {}, {
            preserveScroll: true,
            onSuccess: () => setShowVoidModal(false),
        });
    };

    const changeTaxCode = (value: string) => {
        router.patch(
            prefixedRoute('invoicing.invoices.update', invoice.id),
            { tax_code_id: value === '' ? null : Number(value) },
            { preserveScroll: true },
        );
    };

    const toggleTax = () => {
        router.patch(prefixedRoute('invoicing.invoices.update', invoice.id), { tax_enabled: !invoice.tax_enabled }, { preserveScroll: true });
    };

    const removeLine = (lineId: number) => {
        router.delete(prefixedRoute('invoicing.invoices.lines.destroy', [invoice.id, lineId]), { preserveScroll: true });
    };

    const submitLine: FormEventHandler = (e) => {
        e.preventDefault();
        lineForm.post(prefixedRoute('invoicing.invoices.lines.store', invoice.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowLineModal(false);
                lineForm.reset();
            },
        });
    };

    const deleteInvoice = () => {
        router.delete(prefixedRoute('invoicing.invoices.destroy', invoice.id));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={invoice.code}
                    description={<StatusBadge status={invoice.status} />}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            {can.update && isDraft && (
                                <PrimaryButton onClick={issue} className="!rounded-xl text-xs shadow-sm">
                                    🚀 {t('invoicing.show.issue')}
                                </PrimaryButton>
                            )}
                            {can.update && isOpen && (
                                <PrimaryButton onClick={pay} className="!rounded-xl text-xs shadow-sm">
                                    💳 {isPartiallyPaid ? t('invoicing.show.settle_remaining') : t('invoicing.show.mark_paid')}
                                </PrimaryButton>
                            )}
                            {canRecordPayment && isOpen && (
                                <Link
                                    href={`${prefixedRoute('receivables.payments.create')}?partner_id=${invoice.partner.id}&invoice_id=${invoice.id}`}
                                >
                                    <SecondaryButton type="button" className="!rounded-xl text-xs">
                                        📝 {t('invoicing.show.record_payment')}
                                    </SecondaryButton>
                                </Link>
                            )}
                            {gatewayEnabled && isOpen && (
                                <SecondaryButton
                                    type="button"
                                    className="!rounded-xl text-xs"
                                    onClick={() => router.post(prefixedRoute('receivables.gateway.invoices.pay', invoice.id))}
                                >
                                    🌐 {t('receivables.gateway.pay_invoice')}
                                </SecondaryButton>
                            )}
                            {printable && (
                                <a href={prefixedRoute('invoicing.invoices.pdf', invoice.id)} target="_blank" rel="noreferrer">
                                    <SecondaryButton type="button" className="!rounded-xl text-xs">
                                        🖨️ {t('invoicing.show.print_pdf')}
                                    </SecondaryButton>
                                </a>
                            )}
                            {can.update && (isDraft || isIssued) && (
                                <DangerButton onClick={() => setShowVoidModal(true)} className="!rounded-xl text-xs">
                                    🚫 {t('invoicing.show.void')}
                                </DangerButton>
                            )}
                            <Link href={prefixedRoute('invoicing.invoices.index')}>
                                <SecondaryButton className="!rounded-xl text-xs">{t('invoicing.show.back')}</SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={invoice.code} />

            <InvoicingNav />

            <div className="space-y-6">
                {/* Details Summary Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.partner')}</dt>
                            <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                                {invoice.partner.name} <span className="font-mono text-xs text-slate-400">({invoice.partner.code})</span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.issue_date')}</dt>
                            <dd className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{invoice.issue_date}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.due_date')}</dt>
                            <dd className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{invoice.due_date || '—'}</dd>
                        </div>
                        {invoice.paid_at && (
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.paid_at')}</dt>
                                <dd className="mt-1 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{invoice.paid_at}</dd>
                            </div>
                        )}
                        {invoice.notes && (
                            <div className="sm:col-span-3">
                                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.notes')}</dt>
                                <dd className="mt-1 text-xs text-slate-600 dark:text-slate-300">{invoice.notes}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Line Items Table & Totals */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">📦 {t('invoicing.show.items')}</h3>
                        {canEditLines && (
                            <PrimaryButton onClick={() => setShowLineModal(true)} className="!rounded-xl text-xs shadow-sm">
                                ➕ {t('invoicing.show.add_item')}
                            </PrimaryButton>
                        )}
                    </div>
                    {invoice.lines.length === 0 ? (
                        <div className="py-12 text-center text-xs font-bold text-slate-400">
                            {t('invoicing.show.items_empty')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/60">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.columns.no')}</th>
                                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.columns.description')}</th>
                                        <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-slate-400">{t('invoicing.show.columns.amount')}</th>
                                        {canEditLines && <th className="px-4 py-3" />}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                    {invoice.lines.map((line, index) => (
                                        <tr key={line.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-4 py-3 font-mono text-slate-400">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{line.description}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(line.amount)}</td>
                                            {canEditLines && (
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => removeLine(line.id)} className="font-bold text-rose-600 dark:text-rose-400 hover:underline">
                                                        {t('invoicing.show.remove')}
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Breakdown totals */}
                    <div className="mt-6 flex justify-end">
                        <dl className="w-full max-w-xs space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <dt className="font-bold text-slate-400">{t('invoicing.show.subtotal')}</dt>
                                <dd className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(invoice.subtotal)}</dd>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <dt className="flex flex-col gap-1 text-slate-400">
                                    {canEditTax ? (
                                        <>
                                            <span className="font-bold">{t('invoicing.show.tax_code')}</span>
                                            <Select
                                                className="min-w-[12rem]"
                                                searchable
                                                value={invoice.tax_code_id ? String(invoice.tax_code_id) : ''}
                                                onChange={changeTaxCode}
                                                options={taxCodes.map((code) => ({
                                                    value: String(code.id),
                                                    label: `${code.code} — ${code.name} (${code.rate}%)`,
                                                }))}
                                            />
                                            {invoice.tax_calculation ? (
                                                <span className="text-[10px] text-slate-400">
                                                    {t('invoicing.show.tax_calculation', { mode: invoice.tax_calculation })}
                                                </span>
                                            ) : null}
                                        </>
                                    ) : (
                                        <span className="flex items-center gap-2 font-bold">
                                            {can.update && isDraft && (
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                    checked={invoice.tax_enabled}
                                                    onChange={toggleTax}
                                                />
                                            )}
                                            {invoice.tax_code
                                                ? `${invoice.tax_code} · ${t('invoicing.show.tax', { rate: Number(invoice.tax_rate) })}`
                                                : t('invoicing.show.tax', { rate: Number(invoice.tax_rate) })}
                                        </span>
                                    )}
                                </dt>
                                <dd className="font-mono font-bold text-slate-900 dark:text-white">{invoice.tax_enabled ? formatMoney(invoice.tax_amount) : '—'}</dd>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-3 text-sm">
                                <dt className="font-extrabold text-slate-900 dark:text-white">{t('invoicing.show.total')}</dt>
                                <dd className="font-mono font-extrabold text-slate-900 dark:text-white">{formatMoney(invoice.total)}</dd>
                            </div>
                            {(isOpen || invoice.status === 'paid') && (
                                <>
                                    <div className="flex items-center justify-between text-xs">
                                        <dt className="font-bold text-emerald-600 dark:text-emerald-400">{t('invoicing.show.paid')}</dt>
                                        <dd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(invoice.amount_paid || 0)}</dd>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                                        <dt className="font-extrabold text-slate-900 dark:text-white">{t('invoicing.show.balance')}</dt>
                                        <dd className="font-mono font-extrabold text-slate-900 dark:text-white">{formatMoney(balanceDue)}</dd>
                                    </div>
                                </>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Credit Snapshot Banner */}
                {credit && credit.limit !== null && credit.limit > 0 && (
                    <div
                        className={`rounded-3xl border p-5 text-xs shadow-sm ${
                            credit.is_over_limit
                                ? 'border-rose-200/60 dark:border-rose-800/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                                : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                        <p className="font-bold">💳 {t('invoicing.show.credit', {
                            limit: formatMoney(credit.limit),
                            outstanding: formatMoney(credit.outstanding),
                            available: credit.available !== null ? formatMoney(credit.available) : '—',
                            pct: credit.utilization !== null ? credit.utilization.toFixed(1) : '0',
                        })}</p>
                    </div>
                )}

                {/* Delete Zone */}
                {can.delete && isDraft && (
                    <div className="rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/40 dark:bg-rose-950/20 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">{t('invoicing.show.delete_title')}</h3>
                                <p className="mt-0.5 text-xs text-rose-700/80 dark:text-rose-300/80">{t('invoicing.show.delete_hint')}</p>
                            </div>
                            <DangerButton onClick={deleteInvoice} className="!rounded-xl text-xs">
                                🗑️ {t('invoicing.show.delete_action')}
                            </DangerButton>
                        </div>
                    </div>
                )}
            </div>

            {/* Line Item Modal */}
            {canEditLines && (
                <Modal show={showLineModal} onClose={() => setShowLineModal(false)} maxWidth="md">
                    <form onSubmit={submitLine} className="p-6">
                        <h3 className="mb-4 text-sm font-extrabold text-slate-900 dark:text-white">{t('invoicing.show.add_modal_title')}</h3>
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="line_description" value={t('invoicing.show.description')} />
                                <TextInput
                                    id="line_description"
                                    type="text"
                                    className="mt-1 block w-full !rounded-2xl text-xs"
                                    value={lineForm.data.description}
                                    onChange={(e) => lineForm.setData('description', e.target.value)}
                                />
                                <InputError message={lineForm.errors.description} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="line_amount" value={t('invoicing.show.amount')} />
                                <TextInput
                                    id="line_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full !rounded-2xl text-xs font-mono"
                                    value={lineForm.data.amount}
                                    onChange={(e) => lineForm.setData('amount', e.target.value)}
                                />
                                <InputError message={lineForm.errors.amount} className="mt-2" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setShowLineModal(false)} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                            <PrimaryButton disabled={lineForm.processing} className="!rounded-xl text-xs shadow-sm">{t('invoicing.show.add')}</PrimaryButton>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Void Modal */}
            <Modal show={showVoidModal} onClose={() => setShowVoidModal(false)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-sm font-extrabold text-slate-900 dark:text-white">{t('invoicing.show.void_title')}</h3>
                    <p className="text-xs text-slate-500">
                        {t('invoicing.show.void_confirm', { code: invoice.code })}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowVoidModal(false)} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        <DangerButton onClick={confirmVoid} className="!rounded-xl text-xs">{t('invoicing.show.void')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
