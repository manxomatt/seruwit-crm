import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { ModalRental } from '../types';

interface Props {
    show: boolean;
    rental: ModalRental;
    onClose: () => void;
}

export default function SettleDepositModal({ show, rental, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({
        deposit_applied_amount: '0',
        deposit_refunded_amount: String(rental.deposit_amount ?? '0'),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.deposit.settle', rental.id), { onSuccess: onClose });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-6">
                <ModalHeader
                    tone="emerald"
                    icon="💰"
                    title={t('rental.modals.deposit', undefined, 'Penyelesaian Deposit (Settlement)')}
                    subtitle={`Booking ${rental.code} • Total Ditahan: ${formatMoney(rental.deposit_amount)}`}
                    onClose={onClose}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs dark:border-slate-700 dark:bg-slate-800/60 space-y-2">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Total Deposit Ditahan:</span>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{formatMoney(rental.deposit_amount)}</span>
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="deposit_applied" value={t('rental.fields.deposit_applied', undefined, 'Dipotong untuk Tagihan / Kerusakan (Rp)')} />
                    <MoneyInput
                        id="deposit_applied"
                        value={form.data.deposit_applied_amount}
                        onChange={(applied) => {
                            const deposit = Number(rental.deposit_amount);
                            const refunded = Math.max(0, deposit - Number(applied || 0));
                            form.setData({
                                deposit_applied_amount: applied,
                                deposit_refunded_amount: String(refunded),
                            });
                        }}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.deposit_applied_amount} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="deposit_refunded" value={t('rental.fields.deposit_refunded', undefined, 'Dikembalikan ke Pelanggan (Rp)')} />
                    <MoneyInput
                        id="deposit_refunded"
                        value={form.data.deposit_refunded_amount}
                        onChange={(value) => form.setData('deposit_refunded_amount', value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.deposit_refunded_amount} className="mt-1" />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('common.cancel', undefined, 'Batal')}
                    </SecondaryButton>
                    <PrimaryButton disabled={form.processing} className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500">
                        {form.processing ? 'Menyimpan...' : t('rental.actions.settle_deposit', undefined, 'Selesaikan Deposit')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
