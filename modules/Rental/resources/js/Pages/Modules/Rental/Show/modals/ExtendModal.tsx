import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { ModalRental } from '../types';

interface Props {
    show: boolean;
    rental: ModalRental;
    onClose: () => void;
}

export default function ExtendModal({ show, rental, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ new_end_date: '', notes: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.extend', rental.id), { onSuccess: onClose });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-6">
                <ModalHeader
                    tone="primary"
                    icon="🗓️"
                    title={t('rental.modals.extend', undefined, 'Perpanjang Masa Sewa')}
                    subtitle={`Booking ${rental.code} • ${rental.vehicle.name}`}
                    onClose={onClose}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs dark:border-slate-700 dark:bg-slate-800/60 space-y-1.5">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Tanggal Mulai:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatDateDmY(rental.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Jadwal Selesai Saat Ini:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatDateDmY(rental.end_date)}</span>
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="new_end_date" value={`${t('rental.fields.new_end_date', undefined, 'Tanggal Selesai Baru')} *`} />
                    <TextInput
                        id="new_end_date"
                        type="date"
                        min={rental.end_date}
                        value={form.data.new_end_date}
                        onChange={(e) => form.setData('new_end_date', e.target.value)}
                        className="mt-1 w-full !rounded-xl"
                        required
                    />
                    <InputError message={form.errors.new_end_date} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="extend_notes" value={t('rental.fields.notes', undefined, 'Catatan Perpanjangan')} />
                    <textarea
                        id="extend_notes"
                        rows={2}
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="Alasan / catatan perpanjangan..."
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('common.cancel', undefined, 'Batal')}
                    </SecondaryButton>
                    <PrimaryButton disabled={form.processing} className="rounded-xl px-5 py-2">
                        {form.processing ? 'Menyimpan...' : t('rental.actions.extend', undefined, 'Perpanjang Rental')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
