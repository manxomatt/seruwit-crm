import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface OrderProps {
    id: number;
    type: string;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    currency: string;
    expires_at: string;
    transfer_proof_path: string | null;
    transfer_note: string | null;
    rejection_reason: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    proof_url: string | null;
}

interface PlanProps {
    id: number;
    name: string;
    interval: string;
}

interface Props {
    order: OrderProps;
    plan: PlanProps | null;
}

export default function SubscriptionPayment({ order, plan }: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        proof: null as File | null,
        transfer_note: '',
    });

    const cancelOrder = () => {
        post(route('module.subscription.cancel', order.id), {
            onFinish: () => setShowCancelDialog(false),
        });
    };

    const expiryDate = order.expires_at ? new Date(order.expires_at) : null;
    const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false;

    const formatPrice = (price: string): string => {
        const num = Number(price);
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    const submitProof = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!data.proof) return;
        post(route('module.subscription.proof', order.id), {
            onSuccess: () => reset('proof', 'transfer_note'),
        });
    };

    const renderStatus = (): JSX.Element => {
        if (isExpired || order.status === 'expired' || order.status === 'cancelled') {
            return (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="font-semibold text-slate-900">
                        {isExpired ? 'Pesanan ini telah kedaluwarsa.' : 'Pesanan ini telah dibatalkan.'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        Silakan buat pesanan baru untuk melanjutkan.
                    </p>
                </div>
            );
        }

        if (order.status === 'confirmed') {
            return (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                    <p className="font-semibold text-emerald-900">Pembayaran dikonfirmasi</p>
                    <p className="mt-1 text-sm text-emerald-700">Langganan Anda sekarang aktif.</p>
                </div>
            );
        }

        if (order.status === 'rejected') {
            return (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <p className="font-semibold text-red-900">Bukti transfer ditolak</p>
                    <p className="mt-1 text-sm text-red-700">
                        {order.rejection_reason || 'Silakan upload bukti transfer yang benar.'}
                    </p>
                </div>
            );
        }

        if (order.status === 'awaiting_confirmation') {
            return (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <p className="font-semibold text-amber-900">Bukti diterima, sedang diverifikasi</p>
                    <p className="mt-1 text-sm text-amber-700">Admin sedang memverifikasi pembayaran Anda.</p>
                </div>
            );
        }

        return (
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
                <p className="font-semibold text-teal-900">Menunggu pembayaran</p>
                <p className="mt-1 text-sm text-teal-700">Silakan transfer sesuai nominal dan upload bukti transfer.</p>
            </div>
        );
    };

    const canSubmitProof = order.status === 'pending' || order.status === 'awaiting_confirmation' || order.status === 'rejected';
    const canCancel = order.status === 'pending' || order.status === 'awaiting_confirmation';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('central.subscription.payment_title')}
                    description={plan ? `${plan.name} — ${formatPrice(order.total_amount)}` : 'Pembayaran'}
                />
            }
        >
            <Head title={t('central.subscription.payment_title')} />

            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {renderStatus()}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold text-slate-900">Instruksi Transfer</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                        {order.bank_name && (
                            <p><span className="font-medium text-slate-700">Bank:</span> {order.bank_name}</p>
                        )}
                        {order.bank_account_number && (
                            <p>
                                <span className="font-medium text-slate-700">No. Rekening:</span>{' '}
                                {order.bank_account_number}
                            </p>
                        )}
                        {order.bank_account_name && (
                            <p>
                                <span className="font-medium text-slate-700">Atas Nama:</span>{' '}
                                {order.bank_account_name}
                            </p>
                        )}
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="font-semibold text-amber-900">
                                Transfer tepat: {formatPrice(order.total_amount)}
                            </p>
                            {Number(order.unique_code) > 0 && (
                                <p className="text-sm text-amber-700">
                                    {formatPrice(order.amount)} + kode unik {order.unique_code}
                                </p>
                            )}
                        </div>
                        {expiryDate && (
                            <p className="mt-2 text-xs text-slate-500">
                                Berlaku hingga: {expiryDate.toLocaleString('id-ID')}
                            </p>
                        )}
                    </div>
                </div>

                {canSubmitProof && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Upload Bukti Transfer</h3>
                        <form onSubmit={submitProof} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Bukti Transfer (JPG, PNG, PDF — maks 5MB)
                                </label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setData('proof', file);
                                    }}
                                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
                                />
                                {errors.proof && (
                                    <p className="mt-1 text-sm text-red-600">{errors.proof}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Catatan (opsional)
                                </label>
                                <textarea
                                    value={data.transfer_note}
                                    onChange={(e) => setData('transfer_note', e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                    placeholder="Contoh: Transfer dari BCA a.n John Doe"
                                />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="submit"
                                    disabled={processing || !data.proof}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    {processing ? 'Mengunggah...' : 'Kirim Bukti Transfer'}
                                </button>
                                {canCancel && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCancelDialog(true)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                                    >
                                        Batalkan
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {!canSubmitProof && !isExpired && order.status !== 'cancelled' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Bukti Transfer</h3>
                        {order.proof_url ? (
                            <div className="space-y-3">
                                <a
                                    href={order.proof_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-teal-700 hover:text-teal-800 underline"
                                >
                                    Lihat bukti transfer
                                </a>
                                {order.transfer_note && (
                                    <p className="text-sm text-slate-600">
                                        <span className="font-medium">Catatan:</span> {order.transfer_note}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Belum ada bukti transfer yang diunggah.</p>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                onConfirm={cancelOrder}
                processing={processing}
                title="Batalkan pesanan pembayaran?"
                message="Pesanan ini akan dibatalkan dan tidak bisa diaktifkan kembali. Anda bisa membuat pesanan baru kapan saja dari halaman langganan."
                confirmText="Ya, batalkan pesanan"
                cancelText="Kembali"
                processingText="Membatalkan…"
            />
        </DynamicLayout>
    );
}
