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
import { ChangeEvent, FormEventHandler } from 'react';
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
    const form = useForm<{
        deposit_applied_amount: string;
        deposit_refunded_amount: string;
        deposit_refund_proof: File | null;
        deposit_refund_notes: string;
    }>({
        deposit_applied_amount: '0',
        deposit_refunded_amount: String(rental.deposit_amount ?? '0'),
        deposit_refund_proof: null,
        deposit_refund_notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.deposit.settle', rental.id), {
            forceFormData: true,
            onSuccess: onClose,
        });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            form.setData('deposit_refund_proof', e.target.files[0]);
        }
    };

    const refundedNum = Number(form.data.deposit_refunded_amount || 0);

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
                                ...form.data,
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

                {refundedNum > 0 && (
                    <div className="space-y-3 pt-1">
                        {rental.deposit_refund_bank_name ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs dark:border-emerald-800/60 dark:bg-emerald-950/40">
                                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                                    <span>💳 Rekening Tujuan Refund Pelanggan:</span>
                                </div>
                                <div className="mt-1.5 text-slate-800 dark:text-slate-200 font-medium">
                                    <span className="font-bold text-slate-900 dark:text-white">{rental.deposit_refund_bank_name}</span> - {rental.deposit_refund_account_number}
                                </div>
                                <div className="text-slate-600 dark:text-slate-400">
                                    a/n <span className="font-semibold text-slate-900 dark:text-white">{rental.deposit_refund_account_name}</span>
                                </div>
                                {rental.deposit_refund_bank_submitted_at && (
                                    <div className="mt-1 text-[11px] text-slate-500">
                                        Diajukan: {rental.deposit_refund_bank_submitted_at}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                                ⚠️ <strong>Catatan:</strong> Pelanggan belum mengisi data rekening di portal mandiri. Anda tetap bisa menyelesaikan settlement ini, dan status refund akan menjadi <em>Menunggu Info Rekening</em>.
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="deposit_refund_proof" value="Upload Bukti Transfer Refund (Opsional)" />
                            <input
                                id="deposit_refund_proof"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                Jika diunggah sekarang, status otomatis ditandai sebagai <em>Selesai Ditransfer</em> dan notifikasi WA akan terkirim.
                            </p>
                            <InputError message={form.errors.deposit_refund_proof} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="deposit_refund_notes" value="Catatan Penyelesaian Refund (Opsional)" />
                            <textarea
                                id="deposit_refund_notes"
                                rows={2}
                                value={form.data.deposit_refund_notes}
                                onChange={(e) => form.setData('deposit_refund_notes', e.target.value)}
                                placeholder="Contoh: Dipotong denda keterlambatan 1 hari Rp 100.000, sisa ditransfer."
                                className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-xs shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            <InputError message={form.errors.deposit_refund_notes} className="mt-1" />
                        </div>
                    </div>
                )}

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
