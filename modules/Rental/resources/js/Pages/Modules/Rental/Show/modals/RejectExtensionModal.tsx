import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { ExtensionRequest, Rental } from '../types';

interface Props {
    show: boolean;
    rental: Rental;
    request: ExtensionRequest;
    onClose: () => void;
}

export default function RejectExtensionModal({
    show,
    rental,
    request,
    onClose,
}: Props): JSX.Element | null {
    const { prefixedRoute } = useRoutePrefix();
    const [hasTransferred, setHasTransferred] = useState(false);

    const form = useForm({
        staff_notes: '',
        refund_status: 'none',
        transfer_amount_reported: '',
    });

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.extension_requests.reject', [rental.id, request.id]), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <ModalHeader
                    tone="danger"
                    icon="🚫"
                    title="Tolak Permohonan Perpanjangan"
                    subtitle={`Perpanjangan ${rental.code} s/d ${request.requested_end_date}`}
                    onClose={onClose}
                />

                <div>
                    <InputLabel value="Alasan Penolakan / Catatan Staf *" />
                    <textarea
                        rows={2}
                        className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        value={form.data.staff_notes}
                        onChange={(e) => form.setData('staff_notes', e.target.value)}
                        placeholder="Contoh: Unit sudah terisi jadwal sewa customer lain / armada penuh"
                        required
                    />
                    <InputError message={form.errors.staff_notes} className="mt-1" />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3 dark:border-slate-700 dark:bg-slate-800/60">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={hasTransferred}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setHasTransferred(checked);
                                if (!checked) {
                                    form.setData({
                                        ...form.data,
                                        refund_status: 'none',
                                        transfer_amount_reported: '',
                                    });
                                } else {
                                    form.setData('refund_status', 'pending_refund');
                                }
                            }}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span>Customer sudah telanjur melakukan transfer manual</span>
                    </label>

                    {hasTransferred && (
                        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div>
                                <InputLabel value="Nominal Transfer yang Diterima (Rp) *" />
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    placeholder="Contoh: 500000"
                                    value={form.data.transfer_amount_reported}
                                    onChange={(e) => form.setData('transfer_amount_reported', e.target.value)}
                                    required={hasTransferred}
                                />
                                <InputError message={form.errors.transfer_amount_reported} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Rencana Penyelesaian Dana *" />
                                <select
                                    className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-rose-500 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    value={form.data.refund_status}
                                    onChange={(e) => form.setData('refund_status', e.target.value)}
                                    required={hasTransferred}
                                >
                                    <option value="pending_refund">💸 Jadwalkan Pengembalian Dana (Refund)</option>
                                    <option value="credited_to_deposit">💼 Konversikan Menjadi Saldo Deposit Customer</option>
                                    <option value="refunded">✅ Dana Sudah Langsung Ditransfer Balik</option>
                                </select>
                                <InputError message={form.errors.refund_status} className="mt-1" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <DangerButton
                        type="submit"
                        disabled={form.processing}
                        className="rounded-xl px-4 py-2"
                    >
                        {form.processing ? 'Memproses...' : 'Tolak Permohonan'}
                    </DangerButton>
                </div>
            </form>
        </Modal>
    );
}
