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
    is_over_limit: boolean;
}

interface Props {
    invoice: Invoice;
    credit?: CreditSnapshot | null;
    can: { create: boolean; update: boolean; delete: boolean };
    canRecordPayment?: boolean;
    gatewayEnabled?: boolean;
    taxCodes?: TaxCodeOption[];
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'issued':
            return 'bg-blue-100 text-blue-800';
        case 'partially_paid':
            return 'bg-amber-100 text-amber-800';
        case 'paid':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-red-100 text-red-800';
    }
};

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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{invoice.code}</h2>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                            {t(`invoicing.status.${invoice.status}`, undefined, invoice.status)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {can.update && isDraft && <PrimaryButton onClick={issue}>{t('invoicing.show.issue')}</PrimaryButton>}
                        {can.update && isOpen && (
                            <PrimaryButton onClick={pay}>
                                {isPartiallyPaid ? t('invoicing.show.settle_remaining') : t('invoicing.show.mark_paid')}
                            </PrimaryButton>
                        )}
                        {canRecordPayment && isOpen && (
                            <Link
                                href={`${prefixedRoute('receivables.payments.create')}?partner_id=${invoice.partner.id}&invoice_id=${invoice.id}`}
                            >
                                <SecondaryButton type="button">{t('invoicing.show.record_payment')}</SecondaryButton>
                            </Link>
                        )}
                        {gatewayEnabled && isOpen && (
                            <SecondaryButton
                                type="button"
                                onClick={() => router.post(prefixedRoute('receivables.gateway.invoices.pay', invoice.id))}
                            >
                                {t('receivables.gateway.pay_invoice')}
                            </SecondaryButton>
                        )}
                        {printable && (
                            <a href={prefixedRoute('invoicing.invoices.pdf', invoice.id)} target="_blank" rel="noreferrer">
                                <SecondaryButton type="button">{t('invoicing.show.print_pdf')}</SecondaryButton>
                            </a>
                        )}
                        {can.update && (isDraft || isIssued) && (
                            <DangerButton onClick={() => setShowVoidModal(true)}>{t('invoicing.show.void')}</DangerButton>
                        )}
                        <Link href={prefixedRoute('invoicing.invoices.index')}>
                            <SecondaryButton>{t('invoicing.show.back')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={invoice.code} />

            <InvoicingNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('invoicing.show.partner')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{invoice.partner.name} ({invoice.partner.code})</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('invoicing.show.issue_date')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{invoice.issue_date}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('invoicing.show.due_date')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{invoice.due_date || '—'}</dd>
                            </div>
                            {invoice.paid_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('invoicing.show.paid_at')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{invoice.paid_at}</dd>
                                </div>
                            )}
                            {invoice.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">{t('invoicing.show.notes')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{invoice.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{t('invoicing.show.items')}</h3>
                            {canEditLines && (
                                <PrimaryButton onClick={() => setShowLineModal(true)}>{t('invoicing.show.add_item')}</PrimaryButton>
                            )}
                        </div>
                        {invoice.lines.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('invoicing.show.items_empty')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.show.columns.no')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.show.columns.description')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.show.columns.amount')}</th>
                                            {canEditLines && <th className="px-4 py-3" />}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {invoice.lines.map((line, index) => (
                                            <tr key={line.id}>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{line.description}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">{formatMoney(line.amount)}</td>
                                                {canEditLines && (
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                        <button onClick={() => removeLine(line.id)} className="text-red-600 hover:text-red-900">{t('invoicing.show.remove')}</button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <dl className="w-full max-w-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-500">{t('invoicing.show.subtotal')}</dt>
                                    <dd className="text-sm text-gray-900">{formatMoney(invoice.subtotal)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex flex-col gap-1 text-sm text-gray-500">
                                        {canEditTax ? (
                                            <>
                                                <span>{t('invoicing.show.tax_code')}</span>
                                                <Select
                                                    className="min-w-[12rem] text-gray-900"
                                                    searchable
                                                    value={invoice.tax_code_id ? String(invoice.tax_code_id) : ''}
                                                    onChange={changeTaxCode}
                                                    options={taxCodes.map((code) => ({
                                                        value: String(code.id),
                                                        label: `${code.code} — ${code.name} (${code.rate}%)`,
                                                    }))}
                                                />
                                                {invoice.tax_calculation ? (
                                                    <span className="text-xs text-gray-400">
                                                        {t('invoicing.show.tax_calculation', { mode: invoice.tax_calculation })}
                                                    </span>
                                                ) : null}
                                            </>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {can.update && isDraft && (
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
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
                                    <dd className="text-sm text-gray-900">{invoice.tax_enabled ? formatMoney(invoice.tax_amount) : '—'}</dd>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                                    <dt className="text-sm font-semibold text-gray-900">{t('invoicing.show.total')}</dt>
                                    <dd className="text-sm font-semibold text-gray-900">{formatMoney(invoice.total)}</dd>
                                </div>
                                {(isOpen || invoice.status === 'paid') && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <dt className="text-sm text-gray-500">{t('invoicing.show.paid')}</dt>
                                            <dd className="text-sm text-gray-900">{formatMoney(invoice.amount_paid || 0)}</dd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <dt className="text-sm font-semibold text-gray-900">{t('invoicing.show.balance')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900">{formatMoney(balanceDue)}</dd>
                                        </div>
                                    </>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {credit && credit.limit !== null && credit.limit > 0 && (
                    <div
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            credit.is_over_limit
                                ? 'border-red-200 bg-red-50 text-red-900'
                                : 'border-gray-200 bg-white text-gray-700'
                        }`}
                    >
                        {t('invoicing.show.credit', {
                            limit: formatMoney(credit.limit),
                            outstanding: formatMoney(credit.outstanding),
                            available: credit.available !== null ? formatMoney(credit.available) : '—',
                            pct: credit.utilization !== null ? credit.utilization.toFixed(1) : '0',
                        })}
                    </div>
                )}

                {can.delete && isDraft && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{t('invoicing.show.delete_title')}</h3>
                                <p className="text-sm text-gray-500">{t('invoicing.show.delete_hint')}</p>
                            </div>
                            <button onClick={deleteInvoice} className="text-sm font-medium text-red-600 hover:text-red-900">
                                {t('invoicing.show.delete_action')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {canEditLines && (
                <Modal show={showLineModal} onClose={() => setShowLineModal(false)} maxWidth="md">
                    <form onSubmit={submitLine} className="p-6">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">{t('invoicing.show.add_modal_title')}</h3>
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="line_description" value={t('invoicing.show.description')} />
                                <TextInput
                                    id="line_description"
                                    type="text"
                                    className="mt-1 block w-full"
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
                                    className="mt-1 block w-full"
                                    value={lineForm.data.amount}
                                    onChange={(e) => lineForm.setData('amount', e.target.value)}
                                />
                                <InputError message={lineForm.errors.amount} className="mt-2" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setShowLineModal(false)}>{t('common.cancel')}</SecondaryButton>
                            <PrimaryButton disabled={lineForm.processing}>{t('invoicing.show.add')}</PrimaryButton>
                        </div>
                    </form>
                </Modal>
            )}

            <Modal show={showVoidModal} onClose={() => setShowVoidModal(false)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{t('invoicing.show.void_title')}</h3>
                    <p className="text-sm text-gray-500">
                        {t('invoicing.show.void_confirm', { code: invoice.code })}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowVoidModal(false)}>{t('common.cancel')}</SecondaryButton>
                        <DangerButton onClick={confirmVoid}>{t('invoicing.show.void')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
