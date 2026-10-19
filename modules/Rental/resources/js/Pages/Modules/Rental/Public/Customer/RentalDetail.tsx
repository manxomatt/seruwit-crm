import { useTrans } from '@/hooks/useTrans';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CustomerPortalLayout from './CustomerPortalLayout';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

interface Rental {
    id: number;
    code: string;
    public_token: string;
    status: string;
    start_date: string;
    end_date: string;
    period_type: string;
    total_periods: number;
    rate_per_period: number;
    base_amount: number;
    total_amount: number;
    deposit_amount: number;
    deposit_status: string | null;
    deposit_received_at: string | null;
    pickup_requested_at: string | null;
    one_way_fee_amount: number | null;
    notes: string | null;
    vehicle?: {
        name: string;
        plate_number: string;
        photo_url: string | null;
        rental_class_label: string | null;
        capacity_seats: number | null;
        fuel_label: string | null;
        model_year: number | null;
    } | null;
    pickup_location?: { name: string; address: string | null; city: string | null } | null;
    return_location?: { name: string; address: string | null; city: string | null } | null;
    insurance_package?: { name: string; amount: number } | null;
}

interface Props {
    brand: Brand;
    customer: { id: number; name: string; phone: string };
    rental: Rental;
    holdTtlMinutes: number;
    gatewayAvailable: boolean;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

export default function RentalDetail({ brand, rental }: Props) {
    const { locale } = useTrans();
    const tr = (id: string, en: string) => (locale === 'en' ? en : id);

    const statusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return { label: tr('Sedang Digunakan', 'In Use'), bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
            case 'confirmed':
                return { label: tr('Terkonfirmasi · Siap Ambil', 'Confirmed · Ready for Pickup'), bg: 'bg-blue-50 text-blue-800 border-blue-300' };
            case 'pending_reserved':
                return { label: tr('Menunggu Pembayaran', 'Awaiting Payment'), bg: 'bg-amber-50 text-amber-800 border-amber-300' };
            case 'completed':
                return { label: tr('Selesai Dikembalikan', 'Returned & Completed'), bg: 'bg-slate-100 text-slate-700 border-slate-300' };
            case 'cancelled':
            case 'abandoned':
                return { label: tr('Dibatalkan', 'Cancelled'), bg: 'bg-rose-50 text-rose-800 border-rose-200' };
            default:
                return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    const badge = statusBadge(rental.status);
    const [paying] = useState(false);

    // Direct actions link to existing public token actions
    const handlePayDeposit = () => {
        router.post(route('book.rental.booking.pay_deposit', rental.public_token));
    };

    const handlePayInvoice = () => {
        router.post(route('book.rental.booking.pay_invoice', rental.public_token));
    };

    const periodLabel = rental.period_type === 'weekly'
        ? tr('minggu', 'weeks')
        : rental.period_type === 'monthly'
          ? tr('bulan', 'months')
          : tr('hari', 'days');

    return (
        <CustomerPortalLayout
            brand={brand}
            title={`${tr('Detail Sewa', 'Rental Detail')} ${rental.code}`}
            headerAction={
                <div className="flex items-center gap-2">
                    <Link
                        href={route('book.rental.portal.rentals.index')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                    >
                        <span>←</span>
                        <span>{tr('Semua Pesanan', 'All Bookings')}</span>
                    </Link>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Vehicle and Booking Summary */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Status Card Banner */}
                    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                    {tr('Nomor Reservasi', 'Reservation Number')}
                                </span>
                                <h3 className="text-xl font-mono font-black text-slate-900">{rental.code}</h3>
                            </div>
                            <span className={`text-xs font-black px-3 py-1 rounded-full border ${badge.bg}`}>
                                {badge.label}
                            </span>
                        </div>

                        {/* Vehicle Showcase */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2">
                            {rental.vehicle?.photo_url ? (
                                <img
                                    src={rental.vehicle.photo_url}
                                    alt={rental.vehicle.name}
                                    className="h-24 w-full sm:w-36 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                                />
                            ) : (
                                <div className="h-24 w-full sm:w-36 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl shrink-0">
                                    🚗
                                </div>
                            )}

                            <div className="space-y-1.5 flex-1">
                                {rental.vehicle?.rental_class_label && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                        {rental.vehicle.rental_class_label}
                                    </span>
                                )}
                                <h4 className="text-lg font-black text-slate-900">{rental.vehicle?.name}</h4>
                                <p className="text-xs font-mono font-bold text-slate-500">
                                    {tr('Pelat Nomor:', 'License Plate:')} {rental.vehicle?.plate_number || tr('Ditentukan saat serah terima', 'Assigned at handover')}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                                    {rental.vehicle?.capacity_seats && <span>👥 {rental.vehicle.capacity_seats} {tr('Kursi', 'Seats')}</span>}
                                    {rental.vehicle?.fuel_label && <span>⛽ {rental.vehicle.fuel_label}</span>}
                                    {rental.vehicle?.model_year && <span>📅 {tr('Th', 'Yr')} {rental.vehicle.model_year}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule & Depot Card */}
                    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-2xs space-y-5">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400">
                            {tr('Jadwal & Lokasi Serah Terima', 'Schedule & Handover Location')}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {tr('Penjemputan / Ambil Mobil', 'Pickup / Vehicle Handover')}
                                </span>
                                <div className="text-sm font-black text-slate-900">{rental.start_date}</div>
                                <div className="text-xs text-slate-600 font-semibold pt-1">
                                    📍 {rental.pickup_location?.name || tr('Depot Resmi Tenant', 'Official Tenant Depot')}
                                </div>
                                {rental.pickup_location?.address && (
                                    <p className="text-[11px] text-slate-500">{rental.pickup_location.address}</p>
                                )}
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {tr('Pengembalian Mobil', 'Vehicle Return')}
                                </span>
                                <div className="text-sm font-black text-slate-900">{rental.end_date}</div>
                                <div className="text-xs text-slate-600 font-semibold pt-1">
                                    🏁 {rental.return_location?.name || tr('Depot Resmi Tenant', 'Official Tenant Depot')}
                                </div>
                                {rental.return_location?.address && (
                                    <p className="text-[11px] text-slate-500">{rental.return_location.address}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Direct Public Link Helper */}
                    <div className="rounded-3xl bg-slate-100/80 border border-slate-200/80 p-5 flex items-center justify-between gap-3 text-xs">
                        <div>
                            <span className="font-bold text-slate-800 block">{tr('Tautan Pesanan Publik', 'Public Booking Link')}</span>
                            <span className="text-slate-500">
                                {tr(
                                    'Gunakan tautan ini jika ingin membuka pesanan di perangkat lain tanpa login.',
                                    'Use this link to open your booking on another device without signing in.',
                                )}
                            </span>
                        </div>
                        <Link
                            href={route('book.rental.booking.show', rental.public_token)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 hover:bg-slate-50 transition shrink-0"
                        >
                            {tr('Buka Tautan Publik ↗', 'Open Public Link ↗')}
                        </Link>
                    </div>
                </div>

                {/* Right: Payment Breakdown & Action Center */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
                        <h4 className="text-sm font-black text-slate-900">{tr('Rincian Pembayaran', 'Payment Breakdown')}</h4>

                        <div className="space-y-3 text-xs divide-y divide-slate-100">
                            <div className="flex justify-between pt-2">
                                <span className="text-slate-500">{tr('Tarif Sewa', 'Rental Rate')} ({rental.total_periods} {periodLabel})</span>
                                <span className="font-bold text-slate-800">{money(rental.base_amount)}</span>
                            </div>

                            {rental.one_way_fee_amount != null && rental.one_way_fee_amount > 0 && (
                                <div className="flex justify-between pt-2">
                                    <span className="text-slate-500">{tr('Biaya Antar Cabang (One-Way)', 'Inter-Branch Fee (One-Way)')}</span>
                                    <span className="font-bold text-slate-800">{money(rental.one_way_fee_amount)}</span>
                                </div>
                            )}

                            {rental.insurance_package && (
                                <div className="flex justify-between pt-2">
                                    <span className="text-slate-500">{tr('Proteksi:', 'Protection:')} {rental.insurance_package.name}</span>
                                    <span className="font-bold text-slate-800">{money(rental.insurance_package.amount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-3 text-sm font-black text-slate-900">
                                <span>{tr('Total Tagihan Sewa', 'Total Rental Charge')}</span>
                                <span>{money(rental.total_amount)}</span>
                            </div>

                            {rental.deposit_amount > 0 && (
                                <div className="pt-3 space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>{tr('Jaminan Deposit', 'Security Deposit')}</span>
                                        <span>{money(rental.deposit_amount)}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block">
                                        {tr(
                                            '*Deposit dikembalikan penuh setelah unit diperiksa saat pengembalian.',
                                            '*Deposit is refunded in full after the vehicle is inspected upon return.',
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons depending on status */}
                        <div className="border-t border-slate-100 pt-4 space-y-2">
                            {rental.status === 'pending_reserved' && (
                                <button
                                    type="button"
                                    disabled={paying}
                                    onClick={handlePayDeposit}
                                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102 flex items-center justify-center gap-1.5"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <span>💳</span>
                                    <span>{tr('Bayar Sekarang (Online / Transfer)', 'Pay Now (Online / Transfer)')}</span>
                                </button>
                            )}

                            {rental.status === 'confirmed' && (
                                <button
                                    type="button"
                                    disabled={paying}
                                    onClick={handlePayInvoice}
                                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102 flex items-center justify-center gap-1.5"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <span>💳</span>
                                    <span>{tr('Bayar Biaya Sewa Mobil', 'Pay Car Rental Fee')}</span>
                                </button>
                            )}

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}?text=${encodeURIComponent(tr('Halo ' + brand.name + ', saya ingin bertanya mengenai pesanan rental nomor: ' + rental.code, 'Hello ' + brand.name + ', I would like to ask about rental booking number: ' + rental.code))}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                                >
                                    <span>💬</span>
                                    <span>{tr('Hubungi CS WhatsApp', 'Contact WhatsApp CS')}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerPortalLayout>
    );
}
