import CommissionTable from '@/Components/Reseller/CommissionTable';
import PayoutStatusBadge from '@/Components/Reseller/PayoutStatusBadge';
import { CommissionRow, PayoutRow } from '@/Components/Reseller/types';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Props {
    payout: PayoutRow;
    commissions: CommissionRow[];
}

export default function PayoutDetail({ payout, commissions }: Props): JSX.Element {
    const { t } = useTrans();
    const [paying, setPaying] = useState(false);

    const form = useForm<{ proof: File | null; notes: string }>({ proof: null, notes: payout.notes ?? '' });

    const approve = () => {
        router.post(route('module.reseller-payouts.approve', payout.id), {}, { preserveScroll: true });
    };

    const cancel = () => {
        if (!window.confirm(t('reseller.payout.cancel_confirm'))) {
            return;
        }

        router.post(route('module.reseller-payouts.cancel', payout.id), {}, { preserveScroll: true });
    };

    const submitPayment: FormEventHandler = (event) => {
        event.preventDefault();
        form.post(route('module.reseller-payouts.pay', payout.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setPaying(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={payout.reference}
                    description={payout.reseller_name ?? undefined}
                    actions={
                        <div className="flex gap-2">
                            {payout.status === 'draft' && (
                                <PrimaryButton type="button" onClick={approve}>
                                    {t('reseller.payout.approve')}
                                </PrimaryButton>
                            )}
                            {payout.status === 'approved' && (
                                <PrimaryButton type="button" onClick={() => setPaying(true)}>
                                    {t('reseller.payout.pay')}
                                </PrimaryButton>
                            )}
                            {payout.status !== 'paid' && payout.status !== 'cancelled' && (
                                <DangerButton type="button" onClick={cancel}>
                                    {t('reseller.payout.cancel')}
                                </DangerButton>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={payout.reference} />

            <div className="space-y-6">
                <Link
                    href={route('module.reseller-payouts.index')}
                    className="inline-block text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                >
                    ← {t('reseller.payout.title')}
                </Link>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-slate-400">{t('reseller.payout.status')}</dt>
                                <dd className="mt-1">
                                    <PayoutStatusBadge status={payout.status} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-slate-400">{t('reseller.payout.period')}</dt>
                                <dd className="mt-1 text-slate-900 dark:text-white">
                                    {payout.period_start} → {payout.period_end}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-slate-400">{t('reseller.payout.gross')}</dt>
                                <dd className="mt-1 text-slate-900 dark:text-white">{formatMoney(payout.gross_amount)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-slate-400">{t('reseller.payout.tax')}</dt>
                                <dd className="mt-1 text-slate-900 dark:text-white">{formatMoney(payout.tax_withheld_amount)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-slate-400">{t('reseller.payout.net')}</dt>
                                <dd className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatMoney(payout.net_amount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-slate-400">{t('reseller.payout.paid_at')}</dt>
                                <dd className="mt-1 text-slate-900 dark:text-white">{payout.paid_at ?? '—'}</dd>
                            </div>
                        </dl>

                        {payout.notes && (
                            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <dt className="text-xs uppercase tracking-wider text-slate-400">{t('reseller.payout.notes')}</dt>
                                <dd className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{payout.notes}</dd>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.payout.bank')}</h3>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-500 dark:text-slate-400">{t('reseller.profile.payout_bank_name')}</dt>
                                <dd className="font-medium text-slate-900 dark:text-white">{payout.bank_name ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-500 dark:text-slate-400">{t('reseller.profile.payout_account_number')}</dt>
                                <dd className="font-mono text-slate-900 dark:text-white">{payout.account_number ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-500 dark:text-slate-400">{t('reseller.profile.payout_account_name')}</dt>
                                <dd className="font-medium text-slate-900 dark:text-white">{payout.account_name ?? '—'}</dd>
                            </div>
                        </dl>

                        {payout.proof_url && (
                            <a
                                href={payout.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                {t('reseller.payout.view_proof')} →
                            </a>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.payout.contents')}</h3>
                    <CommissionTable rows={commissions} />
                </div>
            </div>

            <Modal show={paying} maxWidth="md" onClose={() => setPaying(false)}>
                <form onSubmit={submitPayment} className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('reseller.payout.pay_title')}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {payout.reference} — {formatMoney(payout.net_amount)}
                    </p>

                    <div className="mt-4">
                        <InputLabel htmlFor="proof" value={t('reseller.payout.proof')} />
                        <input
                            id="proof"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(event) => form.setData('proof', event.target.files?.[0] ?? null)}
                            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 dark:text-slate-300"
                        />
                        <InputError message={form.errors.proof} className="mt-1" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="notes" value={t('reseller.payout.notes')} />
                        <textarea
                            id="notes"
                            rows={3}
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <InputError message={form.errors.notes} className="mt-1" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setPaying(false)}>
                            {t('reseller.payout.close')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('reseller.payout.pay')}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
