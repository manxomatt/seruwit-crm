import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { formatDateDmY } from '@/utils/date';
import { useForm } from '@inertiajs/react';
import { ModalHeader } from '../../ShowUi';
import type { AlternativeVehicleOption, ConflictingRentalSummary, Rental } from '../types';

interface Props {
    show: boolean;
    rental: Rental;
    conflictingRentals: ConflictingRentalSummary[];
    alternativeVehicles: AlternativeVehicleOption[];
    onClose: () => void;
}

export default function ReassignConflictModal({
    show,
    rental,
    conflictingRentals,
    alternativeVehicles,
    onClose,
}: Props): JSX.Element | null {
    const { prefixedRoute } = useRoutePrefix();

    const defaultConflictingId = conflictingRentals[0]?.id ? String(conflictingRentals[0].id) : '';
    const defaultToVehicleId = alternativeVehicles[0]?.id ? String(alternativeVehicles[0].id) : '';

    const form = useForm({
        conflicting_rental_id: defaultConflictingId,
        to_vehicle_id: defaultToVehicleId,
        notes: '',
    });

    if (!show) return null;

    const selectedConflict = conflictingRentals.find(
        (c) => String(c.id) === String(form.data.conflicting_rental_id)
    ) || conflictingRentals[0];

    const selectedVehicle = alternativeVehicles.find(
        (v) => String(v.id) === String(form.data.to_vehicle_id)
    );

    // Generate WhatsApp direct link for customer B
    const waPhone = selectedConflict?.customer_phone
        ? selectedConflict.customer_phone.replace(/\D/g, '').replace(/^0/, '62')
        : '';
    const waText = selectedConflict && selectedVehicle
        ? encodeURIComponent(
            `Halo kak ${selectedConflict.customer_name || ''}, terkait reservasi rental ${selectedConflict.code} untuk tanggal ${formatDateDmY(selectedConflict.start_date)}, kami telah menyiapkan armada pengganti (${selectedVehicle.name} - ${selectedVehicle.plate_number}) dalam kondisi bersih dan siap pakai demi kenyamanan perjalanan Anda. Terima kasih!`
        )
        : '';
    const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.reassign_conflicting_booking', rental.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <ModalHeader
                    tone="warning"
                    icon="⚡"
                    title="Atasi Benturan Jadwal (Smart Reassign)"
                    subtitle={`Pindahkan booking yang bertabrakan agar perpanjangan ${rental.code} dapat disetujui`}
                    onClose={onClose}
                />

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                    💡 <strong>Tips Operasional:</strong> Anda memindahkan jadwal booking customer lain ke unit yang sedang tersedia/menganggur di rentang tanggal tersebut.
                </div>

                {conflictingRentals.length > 1 && (
                    <div>
                        <InputLabel value="Pilih Booking yang Bertabrakan *" />
                        <select
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-amber-500 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            value={form.data.conflicting_rental_id}
                            onChange={(e) => form.setData('conflicting_rental_id', e.target.value)}
                            required
                        >
                            {conflictingRentals.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.code} — {c.customer_name || 'Customer'} ({formatDateDmY(c.start_date)} s/d {formatDateDmY(c.end_date)})
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.conflicting_rental_id} className="mt-1" />
                    </div>
                )}

                {selectedConflict && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="font-bold text-slate-900 dark:text-white">
                            Booking yang Dialihkan: {selectedConflict.code}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                            Penyewa: <strong>{selectedConflict.customer_name || '-'}</strong> ({selectedConflict.customer_phone || 'Tanpa HP'})
                        </div>
                        <div className="text-slate-500">
                            Periode: {formatDateDmY(selectedConflict.start_date)} s/d {formatDateDmY(selectedConflict.end_date)}
                        </div>
                    </div>
                )}

                <div>
                    <InputLabel value="Pilih Unit Pengganti yang Tersedia *" />
                    {alternativeVehicles.length === 0 ? (
                        <p className="mt-1 text-xs text-rose-600 font-semibold">
                            ⚠️ Tidak ada unit lain yang tersedia di jadwal tersebut. Perpanjangan harus ditolak.
                        </p>
                    ) : (
                        <select
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-amber-500 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            value={form.data.to_vehicle_id}
                            onChange={(e) => form.setData('to_vehicle_id', e.target.value)}
                            required
                        >
                            {alternativeVehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name} ({v.plate_number}) {v.is_same_class ? '⭐ [Unit Sekelas]' : `[Kelas: ${v.rental_class || 'Lainnya'}]`}
                                </option>
                            ))}
                        </select>
                    )}
                    <InputError message={form.errors.to_vehicle_id} className="mt-1" />
                </div>

                <div>
                    <InputLabel value="Catatan Internal / Penyesuaian (Opsional)" />
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-amber-500 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="Contoh: Free upgrade ke Innova atas persetujuan customer"
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                    />
                    <InputError message={form.errors.notes} className="mt-1" />
                </div>

                {waUrl && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-900 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
                        <span>📲 Kirim info unit pengganti ke penyewa via WhatsApp:</span>
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700"
                        >
                            Buka WhatsApp
                        </a>
                    </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        disabled={form.processing || alternativeVehicles.length === 0}
                        className="rounded-xl px-4 py-2 bg-amber-600 hover:bg-amber-700"
                    >
                        {form.processing ? 'Memindahkan...' : 'Pindahkan Unit & Kosongkan Jadwal'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
