import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { ModalRental } from '../types';

interface Props {
    show: boolean;
    rental: ModalRental;
    onClose: () => void;
}

export default function DamageModal({ show, rental, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ description: '', amount: '', photo_path: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.damages.store', rental.id), { onSuccess: onClose });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-6">
                <ModalHeader
                    tone="danger"
                    icon="💥"
                    title={t('rental.modals.damage', undefined, 'Laporkan Kerusakan Kendaraan')}
                    subtitle={`Booking ${rental.code} • ${rental.vehicle.name}`}
                    onClose={onClose}
                />

                <div>
                    <InputLabel htmlFor="damage_desc" value={`${t('rental.fields.description', undefined, 'Deskripsi Kerusakan')} *`} />
                    <textarea
                        id="damage_desc"
                        rows={2}
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        placeholder="Contoh: Goresan pada pintu kanan belakang..."
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                    />
                    <InputError message={form.errors.description} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="damage_amount" value={`${t('rental.fields.repair_cost', undefined, 'Estimasi Biaya Perbaikan')} *`} />
                    <MoneyInput
                        id="damage_amount"
                        value={form.data.amount}
                        onChange={(value) => form.setData('amount', value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.amount} className="mt-1" />
                </div>

                <div>
                    <InputLabel value={t('rental.fields.damage_photo', undefined, 'Foto Bukti Kerusakan')} />
                    <ImageUploader
                        value={form.data.photo_path}
                        onChange={(value) => form.setData('photo_path', value)}
                        className="mt-1"
                    />
                    <InputError message={form.errors.photo_path} className="mt-1" />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('common.cancel', undefined, 'Batal')}
                    </SecondaryButton>
                    <PrimaryButton disabled={form.processing} className="rounded-xl px-5 py-2 bg-rose-600 hover:bg-rose-700 focus:ring-rose-500">
                        {form.processing ? 'Menyimpan...' : t('rental.actions.save_damage', undefined, 'Simpan Kerusakan')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
