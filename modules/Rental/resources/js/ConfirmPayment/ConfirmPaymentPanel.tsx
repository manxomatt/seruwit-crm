import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { useMemo } from 'react';

export type DepositPaymentMethod = 'cash' | 'transfer' | 'giro' | 'card' | 'other';

export type CompanyBankAccountOption = {
    id: number;
    name: string;
    kind?: string | null;
};

interface Props {
    rentalCode: string;
    depositAmount: string | number;
    needsDeposit: boolean;
    canPayOnline: boolean;
    confirming: boolean;
    paymentMethod: DepositPaymentMethod;
    companyBankAccountId: string;
    companyBankAccounts: CompanyBankAccountOption[];
    errors?: Partial<Record<'payment_method' | 'company_bank_account_id' | 'deposit' | 'vehicle_id', string>>;
    onPaymentMethodChange: (method: DepositPaymentMethod) => void;
    onCompanyBankAccountChange: (id: string) => void;
    onConfirmWithDeposit: () => void;
    onConfirmLater: () => void;
    onPayOnline: () => void;
    onCancel: () => void;
}

const METHODS: DepositPaymentMethod[] = ['cash', 'transfer', 'giro', 'card', 'other'];

export default function ConfirmPaymentPanel({
    rentalCode,
    depositAmount,
    needsDeposit,
    canPayOnline,
    confirming,
    paymentMethod,
    companyBankAccountId,
    companyBankAccounts,
    errors = {},
    onPaymentMethodChange,
    onCompanyBankAccountChange,
    onConfirmWithDeposit,
    onConfirmLater,
    onPayOnline,
    onCancel,
}: Props): JSX.Element {
    const { t } = useTrans();

    const methodOptions = useMemo(
        () =>
            METHODS.map((method) => ({
                value: method,
                label: t(`receivables.methods.${method}`, undefined, method),
            })),
        [t],
    );

    const bankOptions = useMemo(
        () => [
            { value: '', label: t('rental.confirm_payment.select_bank') },
            ...companyBankAccounts.map((account) => ({
                value: String(account.id),
                label: account.name,
            })),
        ],
        [companyBankAccounts, t],
    );

    const needsBank = paymentMethod === 'transfer' || paymentMethod === 'giro';

    return (
        <section
            id="rental-confirm-payment"
            className="overflow-hidden rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:border-indigo-900 dark:from-indigo-950/60 dark:via-gray-800 dark:to-gray-800"
        >
            <div className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                            {t('rental.confirm_payment.step_label')}
                        </p>
                        <h3 className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
                            {t('rental.confirm_payment.title')}
                        </h3>
                    </div>
                    <SecondaryButton type="button" onClick={onCancel} disabled={confirming}>
                        {t('rental.nav.back')}
                    </SecondaryButton>
                </div>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {needsDeposit
                        ? t('rental.confirm_payment.subtitle_deposit', {
                              code: rentalCode,
                              amount: formatMoney(depositAmount),
                          })
                        : t('rental.confirm_payment.subtitle_no_deposit', { code: rentalCode })}
                </p>

                {errors.vehicle_id && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                        {errors.vehicle_id}
                    </div>
                )}

                {needsDeposit ? (
                    <div className="mt-4 space-y-4">
                        <div className="rounded-lg border border-indigo-100 bg-white/80 p-4 dark:border-indigo-900/50 dark:bg-gray-900/40">
                            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                <div>
                                    <dt className="text-gray-500 dark:text-gray-400">{t('rental.fields.deposit')}</dt>
                                    <dd className="mt-0.5 text-base font-semibold tabular-nums text-gray-900 dark:text-white">
                                        {formatMoney(depositAmount)}
                                    </dd>
                                </div>
                                <div className="sm:col-span-3">
                                    <dt className="text-gray-500 dark:text-gray-400">
                                        {t('rental.confirm_payment.method')}
                                    </dt>
                                    <dd className="mt-1">
                                        <div className="flex flex-wrap gap-2">
                                            {methodOptions.map((option) => {
                                                const selected = paymentMethod === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        disabled={confirming}
                                                        onClick={() =>
                                                            onPaymentMethodChange(option.value as DepositPaymentMethod)
                                                        }
                                                        className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                                                            selected
                                                                ? 'bg-indigo-600 text-white ring-indigo-600'
                                                                : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <InputError message={errors.payment_method} className="mt-1" />
                                    </dd>
                                </div>
                            </dl>

                            {needsBank && companyBankAccounts.length > 0 && (
                                <div className="mt-4">
                                    <InputLabel
                                        htmlFor="confirm_company_bank_account_id"
                                        value={t('rental.confirm_payment.bank_account')}
                                    />
                                    <Select
                                        id="confirm_company_bank_account_id"
                                        className="mt-1"
                                        value={companyBankAccountId}
                                        onChange={onCompanyBankAccountChange}
                                        options={bankOptions}
                                    />
                                    <InputError message={errors.company_bank_account_id} className="mt-1" />
                                </div>
                            )}
                        </div>

                        <InputError message={errors.deposit} />

                        <div className="flex flex-wrap gap-2">
                            <PrimaryButton
                                type="button"
                                disabled={confirming || (needsBank && companyBankAccounts.length > 0 && !companyBankAccountId)}
                                onClick={onConfirmWithDeposit}
                            >
                                {confirming
                                    ? t('rental.actions.confirming')
                                    : t('rental.actions.deposit_collected')}
                            </PrimaryButton>
                            {canPayOnline && (
                                <SecondaryButton type="button" disabled={confirming} onClick={onPayOnline}>
                                    {t('receivables.gateway.pay_deposit')}
                                </SecondaryButton>
                            )}
                            <SecondaryButton type="button" disabled={confirming} onClick={onConfirmLater}>
                                {t('rental.actions.pay_deposit_later')}
                            </SecondaryButton>
                        </div>

                        <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                            {t('rental.modals.confirm_deposit_hint')}
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <PrimaryButton type="button" disabled={confirming} onClick={onConfirmLater}>
                            {confirming
                                ? t('rental.actions.confirming')
                                : t('rental.actions.confirm_rental')}
                        </PrimaryButton>
                    </div>
                )}
            </div>
        </section>
    );
}
