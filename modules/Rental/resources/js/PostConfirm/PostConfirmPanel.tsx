import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { useState } from 'react';
import type { PostConfirmAction, PostConfirmStepId } from './types';
import PayInvoicesModal from './PayInvoicesModal';

interface PaymentSummary {
    status: string;
    total_invoiced: number;
    total_paid: number;
    balance_due: number;
    invoices?: Array<{
        id: number;
        code: string;
        due_date: string | null;
        balance: number;
    }>;
}

interface Props {
    step: PostConfirmStepId;
    rentalStatus: string;
    depositAmount: string | number;
    depositReceived: boolean;
    depositBlocksCheckout: boolean;
    canReceiveDeposit: boolean;
    canSettleDeposit: boolean;
    canPayDepositOnline: boolean;
    canPrintContract: boolean;
    canPrintHandover: boolean;
    payment: PaymentSummary;
    invoicingEnabled: boolean;
    rentalId: number;
    rentalCode: string;
    partnerId: number;
    companyBankAccounts: Array<{
        id: number;
        name: string;
        kind?: string | null;
    }>;
    onAction: (action: PostConfirmAction) => void;
    onPayInvoices?: (data: {
        payment_date: string;
        amount: number;
        type: string;
        method: string;
        company_bank_account_id: number | null;
        reference_number: string | null;
        notes: string | null;
        allocations: Array<{ invoice_id: number; amount: number }>;
    }) => void;
}

export default function PostConfirmPanel({
    step,
    rentalStatus,
    depositAmount,
    depositReceived,
    depositBlocksCheckout,
    canReceiveDeposit,
    canSettleDeposit,
    canPayDepositOnline,
    canPrintContract,
    canPrintHandover,
    payment,
    invoicingEnabled,
    rentalId,
    rentalCode,
    partnerId,
    companyBankAccounts,
    onAction,
    onPayInvoices,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const isActive = rentalStatus === 'active';
    const isReturned = rentalStatus === 'returned';
    const isConfirmed = rentalStatus === 'confirmed';
    const [showPayInvoices, setShowPayInvoices] = useState(false);

    const balanceDue = payment.balance_due ?? 0;
    const hasOpenInvoices = (payment.invoices ?? []).some((inv) => inv.balance > 0.009);

    return (
        <section className="overflow-hidden rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:border-indigo-900 dark:from-indigo-950/60 dark:via-gray-800 dark:to-gray-800">
            <div className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                            {t('rental.post_confirm.current_step', undefined, `Step ${step}`)}
                        </p>
                        <h3 className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
                            {t(`rental.post_confirm.steps.${step}`)}
                        </h3>
                    </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {t(`rental.post_confirm.hints.${step}`)}
                </p>

            {step === 7 && (
                <div className="mt-4 space-y-3">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                        <dt className="text-gray-500 dark:text-gray-400">{t('rental.fields.deposit')}</dt>
                        <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(depositAmount)}</dd>
                        <dt className="text-gray-500 dark:text-gray-400">{t('rental.deposit.status')}</dt>
                        <dd className="text-gray-900 dark:text-white">
                            {depositReceived
                                ? t('rental.deposit.received')
                                : Number(depositAmount) > 0
                                  ? t('rental.deposit.not_received')
                                  : t('rental.deposit.none')}
                        </dd>
                        {invoicingEnabled && (
                            <>
                                <dt className="text-gray-500 dark:text-gray-400">{t('rental.fields.balance_due')}</dt>
                                <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(payment.balance_due)}</dd>
                            </>
                        )}
                    </dl>
                    <div className="flex flex-wrap gap-2">
                        {Number(depositAmount) > 0 && (
                            <PrimaryButton
                                type="button"
                                onClick={() => onAction('receive_deposit')}
                                disabled={!canReceiveDeposit}
                                title={!canReceiveDeposit ? t('rental.deposit.not_received') : undefined}
                            >
                                {t('rental.actions.receive_deposit')}
                            </PrimaryButton>
                        )}
                        {Number(depositAmount) <= 0 && (
                            <PrimaryButton type="button" disabled>
                                {t('rental.actions.receive_deposit')}
                            </PrimaryButton>
                        )}
                        {canPayDepositOnline && (
                            <SecondaryButton type="button" onClick={() => onAction('pay_deposit_online')}>
                                {t('receivables.gateway.pay_deposit')}
                            </SecondaryButton>
                        )}
                        {canSettleDeposit && (
                            <SecondaryButton type="button" onClick={() => onAction('settle_deposit')}>
                                {t('rental.actions.settle_deposit')}
                            </SecondaryButton>
                        )}
                        {invoicingEnabled && balanceDue > 0.009 && hasOpenInvoices && (
                            <SecondaryButton type="button" onClick={() => setShowPayInvoices(true)}>
                                {t('rental.actions.pay_invoices')}
                            </SecondaryButton>
                        )}
                    </div>
                </div>
            )}

            {step === 8 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {isConfirmed && (
                        <PrimaryButton
                            type="button"
                            onClick={() => onAction('checkout')}
                            disabled={depositBlocksCheckout}
                            title={depositBlocksCheckout ? t('rental.errors.checkout_deposit_required') : undefined}
                            className={depositBlocksCheckout ? 'opacity-50' : undefined}
                        >
                            {t('rental.actions.checkout')}
                        </PrimaryButton>
                    )}
                    {!isConfirmed && (
                        <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80">
                            {t('rental.post_confirm.pickup_done')}
                        </p>
                    )}
                </div>
            )}

            {step === 9 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {canPrintContract && (
                        <a href={prefixedRoute('rental.pdf.contract', rentalId)} target="_blank" rel="noreferrer">
                            <PrimaryButton type="button">{t('rental.actions.print_contract')}</PrimaryButton>
                        </a>
                    )}
                    {canPrintHandover && (
                        <a href={prefixedRoute('rental.pdf.handover', rentalId)} target="_blank" rel="noreferrer">
                            <SecondaryButton type="button">{t('rental.actions.print_handover')}</SecondaryButton>
                        </a>
                    )}
                </div>
            )}

            {step === 10 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {isActive && (
                        <PrimaryButton type="button" onClick={() => onAction('return')}>
                            {t('rental.actions.return')}
                        </PrimaryButton>
                    )}
                    {isReturned && (
                        <>
                            {canSettleDeposit && (
                                <SecondaryButton type="button" onClick={() => onAction('settle_deposit')}>
                                    {t('rental.actions.settle_deposit')}
                                </SecondaryButton>
                            )}
                            <PrimaryButton type="button" onClick={() => onAction('complete')}>
                                {t('rental.actions.complete')}
                            </PrimaryButton>
                        </>
                    )}
                    {!isActive && !isReturned && (
                        <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80">
                            {t('rental.post_confirm.return_done')}
                        </p>
                    )}
                </div>
            )}

            {step === 11 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {isActive ? (
                        <>
                            <SecondaryButton type="button" onClick={() => onAction('extend')}>
                                {t('rental.actions.extend')}
                            </SecondaryButton>
                            <SecondaryButton type="button" onClick={() => onAction('swap')}>
                                {t('rental.actions.swap_vehicle')}
                            </SecondaryButton>
                            <SecondaryButton type="button" onClick={() => onAction('addon')}>
                                {t('rental.actions.add_addon')}
                            </SecondaryButton>
                            <PrimaryButton type="button" onClick={() => onAction('return')}>
                                {t('rental.actions.return')}
                            </PrimaryButton>
                        </>
                    ) : (
                        <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80">
                            {t('rental.post_confirm.changes_closed')}
                        </p>
                    )}
                </div>
            )}
            </div>

            <PayInvoicesModal
                show={showPayInvoices}
                rentalCode={rentalCode}
                invoices={payment.invoices ?? []}
                partnerId={partnerId}
                companyBankAccounts={companyBankAccounts}
                onClose={() => setShowPayInvoices(false)}
                onSubmit={(data) => {
                    setShowPayInvoices(false);
                    onPayInvoices?.(data);
                }}
                processing={false}
                errors={{}}
            />
        </section>
    );
}
