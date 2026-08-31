import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { ModalRental } from '../types';

interface Props {
    rental: ModalRental;
    onClose: () => void;
}

export default function ApproveDepositProofModal({ rental, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [approving, setApproving] = useState(false);
    const hasDeposit = Number(rental.deposit_amount) > 0;

    return (
        <Modal show onClose={onClose} maxWidth="md">
            <div className="p-6 space-y-4">
                <ModalHeader
                    tone="emerald"
                    icon="✅"
                    title="Konfirmasi Persetujuan Bukti Transfer"
                    subtitle={`Verifikasi pembayaran untuk ${rental.code}`}
                    onClose={onClose}
                />

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Kode Reservasi:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{rental.code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Pemesan:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{rental.partner?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">{hasDeposit ? 'Nominal Deposit:' : 'Nominal Pembayaran Sewa:'}</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">{formatMoney(hasDeposit ? rental.deposit_amount : rental.total_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Rekening Tujuan:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {rental.depositCompanyBankAccount
                                ? `${rental.depositCompanyBankAccount.bank_name || ''} - ${rental.depositCompanyBankAccount.account_number || ''}`
                                : 'Transfer Bank'}
                        </span>
                    </div>
                </div>

                {/* List Dampak Aksi */}
                <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/50 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                    <p className="font-bold mb-1">Dampak setelah bukti transfer disetujui:</p>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span>Status bukti transfer diubah menjadi <b>Disetujui (Approved)</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span>{hasDeposit ? 'Pembayaran deposit otomatis dicatat ke sistem' : 'Pembayaran sewa otomatis dicatat ke sistem'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span>Status reservasi otomatis berubah menjadi <b>Dikonfirmasi (Open)</b></span>
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        disabled={approving}
                        onClick={() => {
                            setApproving(true);
                            router.post(prefixedRoute('rental.approve_deposit_proof', rental.id), {}, {
                                onFinish: () => {
                                    setApproving(false);
                                    onClose();
                                },
                            });
                        }}
                        className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                    >
                        {approving ? 'Memproses...' : (hasDeposit ? 'Ya, Setujui Deposit' : 'Ya, Setujui Pembayaran')}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}
