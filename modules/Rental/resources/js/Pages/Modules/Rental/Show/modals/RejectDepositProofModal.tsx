import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { ModalHeader } from '../../ShowUi';
import type { ModalRental } from '../types';

interface Props {
    rental: ModalRental;
    onClose: () => void;
}

export default function RejectDepositProofModal({ rental, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({
        rejected_reason: t('rental.modals.reject_proof_default_reason', undefined, 'Bukti transfer tidak terbaca atau nominal tidak sesuai'),
    });

    return (
        <Modal show onClose={onClose} maxWidth="md">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(prefixedRoute('rental.reject_deposit_proof', rental.id), {
                        onSuccess: onClose,
                    });
                }}
                className="p-6 space-y-4"
            >
                <ModalHeader
                    tone="danger"
                    icon="❌"
                    title="Tolak Bukti Transfer"
                    subtitle={`Pembayaran untuk ${rental.code}`}
                    onClose={onClose}
                />

                <div>
                    <InputLabel value="Alasan Penolakan *" />
                    <textarea
                        rows={3}
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        value={form.data.rejected_reason}
                        onChange={(e) => form.setData('rejected_reason', e.target.value)}
                        placeholder="Contoh: Bukti transfer tidak terbaca / nominal tidak sesuai"
                        required
                    />
                    <InputError message={form.errors.rejected_reason} className="mt-1" />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <DangerButton type="submit" disabled={form.processing} className="rounded-xl px-4 py-2">
                        {form.processing ? 'Menolak...' : 'Tolak Bukti Transfer'}
                    </DangerButton>
                </div>
            </form>
        </Modal>
    );
}
