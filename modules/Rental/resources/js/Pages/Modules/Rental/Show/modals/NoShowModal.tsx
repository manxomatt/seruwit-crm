import DangerButton from '@/Components/DangerButton';
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

export default function NoShowModal({ show, rental, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ cancelled_reason: '', charge_fee: false as boolean });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.no_show', rental.id), { onSuccess: onClose });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-6">
                <ModalHeader
                    tone="amber"
                    icon="⚠️"
                    title={t('rental.modals.no_show', undefined, 'Tandai Sebagai No-Show')}
                    subtitle={`Booking ${rental.code} • Pelanggan tidak hadir`}
                    onClose={onClose}
                />

                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-semibold">Informasi No-Show</p>
                    <p className="mt-0.5 opacity-90">
                        Tandai jika pelanggan tidak datang pada jadwal pengambilan kendaraan tanpa konfirmasi pembatalan sebelumnya.
                    </p>
                </div>

                <div>
                    <InputLabel htmlFor="no_show_reason" value={t('rental.fields.cancel_reason', undefined, 'Catatan / Alasan')} />
                    <textarea
                        id="no_show_reason"
                        rows={3}
                        value={form.data.cancelled_reason}
                        onChange={(e) => form.setData('cancelled_reason', e.target.value)}
                        placeholder="Catatan tambahan no-show (opsional)..."
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-amber-500 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>

                <ChecklistToggleCard
                    label={t('rental.modals.no_show_fee_hint', undefined, 'Kenakan Biaya No-Show (No-Show Fee)')}
                    checked={form.data.charge_fee}
                    onChange={(checked) => form.setData('charge_fee', checked)}
                />

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('rental.nav.back', undefined, 'Kembali')}
                    </SecondaryButton>
                    <DangerButton disabled={form.processing} className="rounded-xl px-4 py-2 bg-amber-600 hover:bg-amber-700 focus:ring-amber-500">
                        {form.processing
                            ? 'Memproses...'
                            : form.data.charge_fee
                                ? t('rental.actions.no_show_with_fee', undefined, 'Tandai No-Show & Kenakan Biaya')
                                : t('rental.actions.mark_no_show', undefined, 'Tandai No-Show')}
                    </DangerButton>
                </div>
            </form>
        </Modal>
    );
}
