import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { ModalRental, SwapVehicleOption } from '../types';

interface Props {
    show: boolean;
    rental: ModalRental;
    swapVehicles: SwapVehicleOption[];
    onClose: () => void;
}

export default function SwapModal({ show, rental, swapVehicles, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ to_vehicle_id: '', odometer_km: '', notes: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.swap', rental.id), { onSuccess: onClose });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-6">
                <ModalHeader
                    tone="purple"
                    icon="🔄"
                    title={t('rental.modals.swap', undefined, 'Tukar Unit Kendaraan')}
                    subtitle={`Tukar unit ${rental.vehicle.name} (${rental.vehicle.plate_number})`}
                    onClose={onClose}
                />

                <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-3.5 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
                    <p className="font-semibold">Unit Saat Ini:</p>
                    <p className="font-bold text-sm mt-0.5">{rental.vehicle.name} — {rental.vehicle.plate_number}</p>
                </div>

                <div>
                    <InputLabel htmlFor="to_vehicle_id" value={`${t('rental.fields.swap_to_vehicle', undefined, 'Pilih Unit Kendaraan Pengganti')} *`} />
                    <Select
                        id="to_vehicle_id"
                        options={[
                            { value: '', label: t('rental.placeholders.select_vehicle', undefined, '-- Pilih Kendaraan Tersedia --') },
                            ...swapVehicles.map((v) => ({
                                value: String(v.id),
                                label: `${v.name} — ${v.plate_number}`,
                            })),
                        ]}
                        value={form.data.to_vehicle_id}
                        onChange={(value) => form.setData('to_vehicle_id', value)}
                        className="mt-1 w-full !rounded-xl"
                    />
                    <InputError message={form.errors.to_vehicle_id} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="swap_odometer" value={`${t('rental.fields.swap_odometer', undefined, 'Odometer Saat Tukar')} (KM)`} />
                    <div className="relative mt-1">
                        <TextInput
                            id="swap_odometer"
                            type="number"
                            min={0}
                            value={form.data.odometer_km}
                            onChange={(e) => form.setData('odometer_km', e.target.value)}
                            className="w-full !rounded-xl pr-12 font-mono"
                            placeholder="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                            KM
                        </span>
                    </div>
                    <InputError message={form.errors.odometer_km} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="swap_notes" value={t('rental.fields.notes', undefined, 'Alasan Penukaran Unit')} />
                    <textarea
                        id="swap_notes"
                        rows={2}
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="Contoh: Kendaraan perlu servis rutin / upgrade unit..."
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('common.cancel', undefined, 'Batal')}
                    </SecondaryButton>
                    <PrimaryButton disabled={form.processing} className="rounded-xl px-5 py-2 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500">
                        {form.processing ? 'Memproses Tukar...' : t('rental.actions.swap_vehicle', undefined, 'Konfirmasi Tukar Unit')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
