import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';

interface PaymentOrder {
    id: number;
    type: string;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    currency: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    transfer_proof_path: string | null;
    transfer_note: string | null;
    rejection_reason: string | null;
    expires_at: string;
    confirmed_at: string | null;
    rejected_at: string | null;
    created_at: string;
    proof_url: string | null;
    tenant: {
        id: string;
        name: string;
        status: string;
        trial_ends_at: string | null;
    };
    plan: {
        id: number;
        name: string;
        price: string;
        interval: string;
    };
    subscription: {
        id: number;
        status: string;
        ends_at: string | null;
    } | null;
    confirmedBy: {
        id: number;
        name: string;
    } | null;
    rejectedBy: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    paymentOrder: PaymentOrder;
}

const statusBadge: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    awaiting_confirmation: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-slate-100 text-slate-800',
    cancelled: 'bg-slate-100 text-slate-800',
};

export default function PaymentOrdersShow({ paymentOrder }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const canConfirm = paymentOrder.status === 'pending' || paymentOrder.status === 'awaiting_confirmation';
    const canReject = paymentOrder.status === 'pending' || paymentOrder.status === 'awaiting_confirmation';

    const formatPrice = (price: string): string => {
        const num = Number(price);
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    const handleConfirm = () => {
        setProcessing(true);
        router.post(prefixedRoute('payment-orders.confirm', paymentOrder.id), {}, {
            onSuccess: () => setShowConfirmModal(false),
            onFinish: () => setProcessing(false),
        });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) return;
        setProcessing(true);
        router.post(prefixedRoute('payment-orders.reject', paymentOrder.id), {
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => setShowRejectModal(false),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={`Pesanan #${paymentOrder.id}`}
                    description={paymentOrder.tenant.name}
                />
            }
        >
            <Head title={`Pesanan Pembayaran #${paymentOrder.id}`} />

            <div className="space-y-6">
                {/* Status Banner */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadge[paymentOrder.status] || 'bg-gray-100 text-gray-800'}`}>
                                {paymentOrder.status.replace('_', ' ')}
                            </span>
                            <p className="mt-2 text-sm text-gray-600">
                                Dibuat: {new Date(paymentOrder.created_at).toLocaleString('id-ID')}
                            </p>
                            {paymentOrder.expires_at && (
                                <p className="text-sm text-gray-600">
                                    Berakhir: {new Date(paymentOrder.expires_at).toLocaleString('id-ID')}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {canConfirm && (
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    Konfirmasi
                                </button>
                            )}
                            {canReject && (
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                >
                                    Tolak
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Tenant Info */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Informasi Tenant</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p><span className="font-medium text-slate-700">Nama:</span> {paymentOrder.tenant.name}</p>
                            <p><span className="font-medium text-slate-700">Status:</span> {paymentOrder.tenant.status}</p>
                            {paymentOrder.tenant.trial_ends_at && (
                                <p><span className="font-medium text-slate-700">Trial berakhir:</span> {new Date(paymentOrder.tenant.trial_ends_at).toLocaleDateString('id-ID')}</p>
                            )}
                            <Link href={prefixedRoute('tenants.show', paymentOrder.tenant.id)} className="text-teal-600 hover:text-teal-800 text-sm">
                                Lihat detail tenant →
                            </Link>
                        </div>
                    </div>

                    {/* Plan Info */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Informasi Paket</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p><span className="font-medium text-slate-700">Paket:</span> {paymentOrder.plan.name}</p>
                            <p><span className="font-medium text-slate-700">Harga:</span> {formatPrice(paymentOrder.plan.price)}</p>
                            <p><span className="font-medium text-slate-700">Interval:</span> {paymentOrder.plan.interval}</p>
                            <p><span className="font-medium text-slate-700">Tipe:</span> {paymentOrder.type === 'renew' ? 'Perpanjangan' : 'Aktivasi'}</p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Informasi Pembayaran</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p><span className="font-medium text-slate-700">Nominal:</span> {formatPrice(paymentOrder.amount)}</p>
                            <p><span className="font-medium text-slate-700">Kode Unik:</span> {paymentOrder.unique_code}</p>
                            <p><span className="font-medium text-slate-700">Total Transfer:</span> {formatPrice(paymentOrder.total_amount)}</p>
                            <p><span className="font-medium text-slate-700">Mata Uang:</span> {paymentOrder.currency}</p>
                        </div>
                    </div>

                    {/* Bank Info */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Instruksi Transfer</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            {paymentOrder.bank_name && (
                                <p><span className="font-medium text-slate-700">Bank:</span> {paymentOrder.bank_name}</p>
                            )}
                            {paymentOrder.bank_account_number && (
                                <p><span className="font-medium text-slate-700">No. Rekening:</span> {paymentOrder.bank_account_number}</p>
                            )}
                            {paymentOrder.bank_account_name && (
                                <p><span className="font-medium text-slate-700">Atas Nama:</span> {paymentOrder.bank_account_name}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Proof */}
                {paymentOrder.transfer_proof_path && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Bukti Transfer</h3>
                        {paymentOrder.proof_url ? (
                            <a
                                href={paymentOrder.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:text-teal-800 underline text-sm"
                            >
                                Lihat bukti transfer
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500">{paymentOrder.transfer_proof_path}</p>
                        )}
                        {paymentOrder.transfer_note && (
                            <p className="mt-2 text-sm text-slate-600">
                                <span className="font-medium">Catatan:</span> {paymentOrder.transfer_note}
                            </p>
                        )}
                    </div>
                )}

                {/* Confirmation Info */}
                {paymentOrder.confirmed_at && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                        <h3 className="mb-2 font-semibold text-emerald-900">Dikonfirmasi</h3>
                        <p className="text-sm text-emerald-700">
                            Dikonfirmasi oleh {paymentOrder.confirmedBy?.name} pada {new Date(paymentOrder.confirmed_at).toLocaleString('id-ID')}
                        </p>
                    </div>
                )}

                {/* Rejection Info */}
                {paymentOrder.rejected_at && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                        <h3 className="mb-2 font-semibold text-red-900">Ditolak</h3>
                        <p className="text-sm text-red-700">
                            Ditolak oleh {paymentOrder.rejectedBy?.name} pada {new Date(paymentOrder.rejected_at).toLocaleString('id-ID')}
                        </p>
                        {paymentOrder.rejection_reason && (
                            <p className="mt-1 text-sm text-red-700">
                                <span className="font-medium">Alasan:</span> {paymentOrder.rejection_reason}
                            </p>
                        )}
                    </div>
                )}

                {/* Subscription Info */}
                {paymentOrder.subscription && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-900">Langganan Terkait</h3>
                        <div className="text-sm text-slate-600">
                            <p>Subscription #{paymentOrder.subscription.id} — {paymentOrder.subscription.status}</p>
                            {paymentOrder.subscription.ends_at && (
                                <p>Berakhir: {new Date(paymentOrder.subscription.ends_at).toLocaleDateString('id-ID')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Pembayaran</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Apakah Anda yakin ingin mengkonfirmasi pembayaran sebesar {formatPrice(paymentOrder.total_amount)} dari tenant {paymentOrder.tenant.name}?
                        Langganan akan langsung diaktifkan.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowConfirmModal(false)} disabled={processing}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton onClick={handleConfirm} disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Konfirmasi'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Tolak Pembayaran</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Berikan alasan penolakan kepada tenant.
                    </p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="mt-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        placeholder="Contoh: Nominal transfer tidak sesuai..."
                    />
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowRejectModal(false)} disabled={processing}>
                            Batal
                        </SecondaryButton>
                        <DangerButton onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
                            {processing ? 'Menyimpan...' : 'Tolak Pembayaran'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
