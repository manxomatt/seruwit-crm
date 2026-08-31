import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ChecklistToggleCard, ModalHeader } from '../../ShowUi';
import type { ModalRental } from '../types';

interface Props {
    show: boolean;
    rental: ModalRental;
    onClose: () => void;
}

export default function CancelModal({ show, rental, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ cancelled_reason: '', charge_fee: false as boolean });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.cancel', rental.id), { onSuccess: onClose });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-6">
                <ModalHeader
                    tone="danger"
                    icon="🚫"
                    title={t('rental.modals.cancel', undefined, 'Batalkan Reservasi')}
                    subtitle={`Booking ${rental.code} • ${rental.partner?.name || ''}`}
                    onClose={onClose}
                />

                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-3.5 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                    <p className="font-semibold">⚠️ Perhatian Pembatalan</p>
                    <p className="mt-0.5 opacity-90">
                        Pembatalan akan menghentikan proses rental dan melepaskan unit kendaraan kembali ke jadwal ketersediaan.
                    </p>
                </div>

                <div>
                    <InputLabel htmlFor="cancelled_reason" value={`${t('rental.fields.cancel_reason', undefined, 'Alasan Pembatalan')} *`} />
                    <textarea
                        id="cancelled_reason"
                        rows={3}
                        value={form.data.cancelled_reason}
                        onChange={(e) => form.setData('cancelled_reason', e.target.value)}
                        placeholder="Tuliskan alasan pembatalan rental ini..."
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                    />
                    <InputError message={form.errors.cancelled_reason} className="mt-1" />
                </div>

                <ChecklistToggleCard
                    label={t('rental.modals.cancel_fee_hint', undefined, 'Kenakan Biaya Pembatalan (Cancellation Fee)')}
                    checked={form.data.charge_fee}
                    onChange={(checked) => form.setData('charge_fee', checked)}
                />

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('rental.nav.back', undefined, 'Kembali')}
                    </SecondaryButton>
                    <DangerButton disabled={form.processing} className="rounded-xl px-4 py-2">
                        {form.processing
                            ? 'Memproses...'
                            : form.data.charge_fee
                                ? t('rental.actions.cancel_with_fee', undefined, 'Batalkan & Kenakan Biaya')
                                : t('rental.actions.cancel_rental', undefined, 'Ya, Batalkan Rental')}
                    </DangerButton>
                </div>
            </form>
        </Modal>
    );
}
