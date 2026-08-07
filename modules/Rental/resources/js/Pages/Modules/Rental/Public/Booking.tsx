import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
}

interface Booking {
    code: string;
    public_token: string;
    status: string;
    channel: string;
    booker_phone: string | null;
    start_date: string | null;
    end_date: string | null;
    period_type: string;
    total_periods: number;
    rate_per_period: number;
    base_amount: number;
    deposit_amount: number;
    deposit_received: boolean;
    total_amount: number;
    pickup_location: string | null;
    return_location: string | null;
    reserved_until: string | null;
    cancelled_reason: string | null;
    vehicle: { id: number; name: string; plate_number: string; photo_url: string | null } | null;
    insurance_package: { id: number; name: string; amount: number } | null;
    can_pay_deposit: boolean;
    can_request_extend: boolean;
    cancel: {
        can_cancel: boolean;
        charge_fee: boolean;
        fee_amount: number;
        free_until: string | null;
        reason: string | null;
    };
    payment: {
        status: string;
        balance_due: number;
        can_pay_balance: boolean;
        invoices: Array<{ id: number; code: string; status: string; balance: number; total: number }>;
    };
    extend_request: {
        id: number;
        requested_end_date: string | null;
        estimated_periods: number;
        estimated_amount: number;
        status: string;
    } | null;
    documents: {
        ktp_uploaded: boolean;
        sim_uploaded: boolean;
        ktp_url: string | null;
        sim_url: string | null;
    };
}

interface Props {
    brand: Brand;
    booking: Booking;
    gateway_available: boolean;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const fieldClassName =
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

const statusLabel: Record<string, string> = {
    pending_reserved: 'Menunggu deposit',
    pending: 'Kedaluwarsa / pending',
    confirmed: 'Reservasi aktif',
    active: 'Sedang disewa',
    returned: 'Dikembalikan',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    cancelled_paid: 'Dibatalkan',
};

export default function Booking({ brand, booking, gateway_available }: Props) {
    const { flash, errors } = usePage().props as {
        flash?: { success?: string; error?: string };
        errors: Record<string, string>;
    };
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [showCancel, setShowCancel] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);

    const payForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
    });

    const cancelForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        cancelled_reason: 'Dibatalkan oleh pemesan',
    });

    const extendForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        new_end_date: '',
        notes: '',
    });

    const docsForm = useForm<{
        booker_phone: string;
        otp_code: string;
        ktp: File | null;
        sim: File | null;
    }>({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        ktp: null,
        sim: null,
    });

    const invoiceForm = useForm({
        booker_phone: booking.booker_phone ?? '',
        otp_code: '',
        invoice_id: 0,
    });

    const sendOtp = async (phone: string) => {
        if (!phone) {
            return;
        }
        const { data } = await axios.post(route('book.rental.otp'), { booker_phone: phone });
        setOtpHint(data.debug_code ? `Kode (dev): ${data.debug_code}` : data.message);
    };

    const pay = (e: FormEvent) => {
        e.preventDefault();
        payForm.post(route('book.rental.booking.pay_deposit', booking.public_token));
    };

    const cancel = (e: FormEvent) => {
        e.preventDefault();
        if (!confirm('Batalkan reservasi? Unit akan dilepas.')) {
            return;
        }
        cancelForm.post(route('book.rental.booking.cancel', booking.public_token));
    };

    const requestExtend = (e: FormEvent) => {
        e.preventDefault();
        extendForm.post(route('book.rental.booking.extend_request', booking.public_token), {
            onSuccess: () => setShowExtend(false),
        });
    };

    const uploadDocuments = (e: FormEvent) => {
        e.preventDefault();
        docsForm.post(route('book.rental.booking.documents', booking.public_token), {
            forceFormData: true,
        });
    };

    const payInvoice = (e: FormEvent) => {
        e.preventDefault();
        if (payingInvoiceId === null) {
            return;
        }
        invoiceForm
            .transform((data) => ({ ...data, invoice_id: payingInvoiceId }))
            .post(route('book.rental.booking.pay_invoice', booking.public_token));
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <Head title={`Reservasi ${booking.code}`} />
            <div className="mx-auto max-w-lg px-4">
                <div className="mb-4 text-center">
                    <h1 className="text-xl font-semibold" style={{ color: brand.color }}>
                        {brand.name}
                    </h1>
                    <Link href={route('book.rental.search')} className="text-sm text-slate-500">
                        Sewa lagi
                    </Link>
                </div>

                {(flash?.error || flash?.success) && (
                    <p className={`mb-3 rounded-md px-3 py-2 text-sm ${flash.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {flash.error || flash.success}
                    </p>
                )}

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b p-6 text-center">
                        <p className="text-lg font-semibold">{booking.code}</p>
                        <p className="text-sm text-slate-500">{statusLabel[booking.status] ?? booking.status}</p>
                        {booking.status === 'pending_reserved' && booking.reserved_until && (
                            <p className="mt-2 text-xs text-amber-700">
                                Bayar deposit sebelum {new Date(booking.reserved_until).toLocaleString('id-ID')} agar unit tetap
                                ditahan.
                            </p>
                        )}
                    </div>

                    <div className="space-y-3 p-6 text-sm">
                        {booking.vehicle && (
                            <div>
                                <div className="text-xs uppercase text-slate-400">Kendaraan</div>
                                <div className="font-medium">
                                    {booking.vehicle.name} · {booking.vehicle.plate_number}
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="text-xs uppercase text-slate-400">Periode</div>
                            <div className="font-medium">
                                {booking.start_date} → {booking.end_date} ({booking.total_periods} {booking.period_type})
                            </div>
                        </div>
                        {(booking.pickup_location || booking.return_location) && (
                            <div>
                                <div className="text-xs uppercase text-slate-400">Lokasi</div>
                                <div className="font-medium">
                                    Ambil: {booking.pickup_location ?? '—'}
                                    <br />
                                    Kembali: {booking.return_location ?? '—'}
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="text-xs uppercase text-slate-400">Biaya</div>
                            <div className="font-medium">Total sewa {money(booking.total_amount)}</div>
                            <div className="text-xs text-slate-500">
                                Deposit {money(booking.deposit_amount)}
                                {booking.deposit_received ? ' · sudah dibayar' : ' · belum dibayar'}
                            </div>
                            {booking.payment.balance_due > 0 && (
                                <div className="text-xs text-amber-700">
                                    Sisa tagihan {money(booking.payment.balance_due)}
                                </div>
                            )}
                        </div>
                        {booking.extend_request && (
                            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                Perpanjangan menunggu review: → {booking.extend_request.requested_end_date}{' '}
                                (~{money(booking.extend_request.estimated_amount)})
                            </div>
                        )}
                        {brand.support_phone && (
                            <div>
                                <div className="text-xs uppercase text-slate-400">Bantuan</div>
                                <div className="font-medium">{brand.support_phone}</div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 border-t p-4">
                        {booking.can_pay_deposit && gateway_available && (
                            <form onSubmit={pay} className="space-y-2 rounded-xl bg-slate-50 p-3">
                                <p className="text-sm font-medium text-slate-800">Bayar deposit online</p>
                                <input
                                    className={fieldClassName}
                                    value={payForm.data.booker_phone}
                                    onChange={(e) => payForm.setData('booker_phone', e.target.value)}
                                    placeholder="Nomor HP"
                                    required
                                />
                                <div className="flex gap-2">
                                    <input
                                        className={fieldClassName}
                                        value={payForm.data.otp_code}
                                        onChange={(e) => payForm.setData('otp_code', e.target.value)}
                                        placeholder="OTP"
                                        maxLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="mt-1 rounded-md border border-slate-300 px-3 text-sm"
                                        onClick={() => void sendOtp(payForm.data.booker_phone)}
                                    >
                                        OTP
                                    </button>
                                </div>
                                {otpHint && <p className="text-xs text-slate-500">{otpHint}</p>}
                                {errors.otp_code && <p className="text-xs text-red-600">{errors.otp_code}</p>}
                                <button
                                    type="submit"
                                    disabled={payForm.processing}
                                    className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white"
                                    style={{ background: brand.color }}
                                >
                                    Bayar deposit · {money(booking.deposit_amount)}
                                </button>
                            </form>
                        )}

                        {booking.can_pay_deposit && !gateway_available && (
                            <p className="text-center text-xs text-slate-500">
                                Pembayaran online belum aktif. Bayar deposit di cabang / transfer — staf akan konfirmasi.
                            </p>
                        )}

                        {booking.payment.can_pay_balance && booking.payment.invoices.length > 0 && (
                            <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                                <p className="text-sm font-medium text-slate-800">Bayar sisa tagihan</p>
                                {booking.payment.invoices.map((invoice) => (
                                    <button
                                        key={invoice.id}
                                        type="button"
                                        className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm"
                                        onClick={() => setPayingInvoiceId(invoice.id)}
                                    >
                                        <span>
                                            {invoice.code}
                                            <span className="ml-2 text-xs text-slate-400">{invoice.status}</span>
                                        </span>
                                        <span className="font-medium">{money(invoice.balance)}</span>
                                    </button>
                                ))}
                                {payingInvoiceId !== null && (
                                    <form onSubmit={payInvoice} className="space-y-2 border-t border-slate-200 pt-2">
                                        <input
                                            className={fieldClassName}
                                            value={invoiceForm.data.booker_phone}
                                            onChange={(e) => invoiceForm.setData('booker_phone', e.target.value)}
                                            placeholder="Nomor HP"
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                className={fieldClassName}
                                                value={invoiceForm.data.otp_code}
                                                onChange={(e) => invoiceForm.setData('otp_code', e.target.value)}
                                                placeholder="OTP"
                                                maxLength={6}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="mt-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                                onClick={() => void sendOtp(invoiceForm.data.booker_phone)}
                                            >
                                                OTP
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={invoiceForm.processing}
                                            className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white"
                                            style={{ background: brand.color }}
                                        >
                                            Bayar invoice
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        <form onSubmit={uploadDocuments} className="space-y-2 rounded-xl bg-slate-50 p-3">
                            <p className="text-sm font-medium text-slate-800">Unggah KTP / SIM</p>
                            <p className="text-xs text-slate-500">
                                KTP: {booking.documents.ktp_uploaded ? 'sudah' : 'belum'} · SIM:{' '}
                                {booking.documents.sim_uploaded ? 'sudah' : 'belum'}
                            </p>
                            {(booking.documents.ktp_url || booking.documents.sim_url) && (
                                <div className="flex gap-3 text-xs">
                                    {booking.documents.ktp_url && (
                                        <a href={booking.documents.ktp_url} target="_blank" rel="noreferrer" className="text-teal-700 underline">
                                            Lihat KTP
                                        </a>
                                    )}
                                    {booking.documents.sim_url && (
                                        <a href={booking.documents.sim_url} target="_blank" rel="noreferrer" className="text-teal-700 underline">
                                            Lihat SIM
                                        </a>
                                    )}
                                </div>
                            )}
                            <input
                                className={fieldClassName}
                                value={docsForm.data.booker_phone}
                                onChange={(e) => docsForm.setData('booker_phone', e.target.value)}
                                placeholder="Nomor HP"
                                required
                            />
                            <div className="flex gap-2">
                                <input
                                    className={fieldClassName}
                                    value={docsForm.data.otp_code}
                                    onChange={(e) => docsForm.setData('otp_code', e.target.value)}
                                    placeholder="OTP"
                                    maxLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    className="mt-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                    onClick={() => void sendOtp(docsForm.data.booker_phone)}
                                >
                                    OTP
                                </button>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">KTP</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="mt-1 block w-full text-sm"
                                    onChange={(e) => docsForm.setData('ktp', e.target.files?.[0] ?? null)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">SIM</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="mt-1 block w-full text-sm"
                                    onChange={(e) => docsForm.setData('sim', e.target.files?.[0] ?? null)}
                                />
                            </div>
                            {errors.ktp && <p className="text-xs text-red-600">{errors.ktp}</p>}
                            <button
                                type="submit"
                                disabled={docsForm.processing}
                                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
                            >
                                Unggah dokumen
                            </button>
                        </form>

                        {booking.can_request_extend && !booking.extend_request && !showExtend && (
                            <button
                                type="button"
                                className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                                onClick={() => setShowExtend(true)}
                            >
                                Ajukan perpanjangan
                            </button>
                        )}

                        {booking.can_request_extend && !booking.extend_request && showExtend && (
                            <form onSubmit={requestExtend} className="space-y-2 rounded-xl bg-slate-50 p-3">
                                <p className="text-sm font-medium text-slate-800">Ajukan perpanjangan</p>
                                <p className="text-xs text-slate-500">Staf akan meninjau sebelum tanggal selesai berubah.</p>
                                <input
                                    type="date"
                                    className={fieldClassName}
                                    value={extendForm.data.new_end_date}
                                    onChange={(e) => extendForm.setData('new_end_date', e.target.value)}
                                    required
                                />
                                <input
                                    className={fieldClassName}
                                    value={extendForm.data.notes}
                                    onChange={(e) => extendForm.setData('notes', e.target.value)}
                                    placeholder="Catatan (opsional)"
                                />
                                <input
                                    className={fieldClassName}
                                    value={extendForm.data.booker_phone}
                                    onChange={(e) => extendForm.setData('booker_phone', e.target.value)}
                                    placeholder="Nomor HP"
                                    required
                                />
                                <div className="flex gap-2">
                                    <input
                                        className={fieldClassName}
                                        value={extendForm.data.otp_code}
                                        onChange={(e) => extendForm.setData('otp_code', e.target.value)}
                                        placeholder="OTP"
                                        maxLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="mt-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                        onClick={() => void sendOtp(extendForm.data.booker_phone)}
                                    >
                                        OTP
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={extendForm.processing}
                                    className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white"
                                    style={{ background: brand.color }}
                                >
                                    Kirim permintaan
                                </button>
                            </form>
                        )}

                        {booking.cancel.can_cancel && !showCancel && (
                            <div className="space-y-2">
                                {booking.cancel.charge_fee && (
                                    <p className="text-center text-xs text-amber-700">
                                        {booking.cancel.reason ??
                                            `Pembatalan dikenakan biaya Rp ${Number(booking.cancel.fee_amount).toLocaleString('id-ID')}`}
                                    </p>
                                )}
                                {!booking.cancel.charge_fee && booking.cancel.free_until && (
                                    <p className="text-center text-xs text-slate-500">
                                        Batas batal gratis: {new Date(booking.cancel.free_until).toLocaleString('id-ID')}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    className="w-full rounded-md border border-red-200 px-4 py-2 text-sm text-red-700"
                                    onClick={() => setShowCancel(true)}
                                >
                                    Batalkan reservasi
                                    {booking.cancel.charge_fee
                                        ? ` · biaya Rp ${Number(booking.cancel.fee_amount).toLocaleString('id-ID')}`
                                        : ''}
                                </button>
                            </div>
                        )}

                        {booking.cancel.can_cancel && showCancel && (
                            <form onSubmit={cancel} className="space-y-2 rounded-xl border border-red-100 bg-red-50/50 p-3">
                                <input
                                    className={fieldClassName}
                                    value={cancelForm.data.booker_phone}
                                    onChange={(e) => cancelForm.setData('booker_phone', e.target.value)}
                                    placeholder="Nomor HP"
                                    required
                                />
                                <div className="flex gap-2">
                                    <input
                                        className={fieldClassName}
                                        value={cancelForm.data.otp_code}
                                        onChange={(e) => cancelForm.setData('otp_code', e.target.value)}
                                        placeholder="OTP"
                                        maxLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="mt-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                        onClick={() => void sendOtp(cancelForm.data.booker_phone)}
                                    >
                                        OTP
                                    </button>
                                </div>
                                <input
                                    className={fieldClassName}
                                    value={cancelForm.data.cancelled_reason}
                                    onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)}
                                    placeholder="Alasan"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white"
                                >
                                    Konfirmasi batal
                                </button>
                            </form>
                        )}

                        <button
                            type="button"
                            className="w-full text-center text-xs text-slate-400"
                            onClick={() => router.reload({ only: ['booking', 'gateway_available'] })}
                        >
                            Muat ulang status
                        </button>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Pengambilan & pengembalian dilakukan di cabang sesuai jadwal.
                </p>
            </div>
        </div>
    );
}
