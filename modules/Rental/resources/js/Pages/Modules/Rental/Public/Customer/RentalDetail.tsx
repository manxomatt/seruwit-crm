import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
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

const statusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return { label: 'Sedang Digunakan', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
        case 'confirmed':
            return { label: 'Terkonfirmasi · Siap Ambil', bg: 'bg-blue-50 text-blue-800 border-blue-300' };
        case 'pending_reserved':
            return { label: 'Menunggu Pembayaran', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
        case 'completed':
            return { label: 'Selesai Dikembalikan', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
        case 'cancelled':
        case 'abandoned':
            return { label: 'Dibatalkan', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
        default:
            return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
};

export default function RentalDetail({ brand, rental, gatewayAvailable }: Props) {
    const badge = statusBadge(rental.status);
    const [paying, setPaying] = useState(false);

    // Direct actions link to existing public token actions
    const handlePayDeposit = () => {
        router.post(route('book.rental.booking.pay_deposit', rental.public_token));
    };

    const handlePayInvoice = () => {
        router.post(route('book.rental.booking.pay_invoice', rental.public_token));
    };

    return (
        <CustomerPortalLayout
            brand={brand}
            title={`Detail Sewa ${rental.code}`}
            headerAction={
                <div className="flex items-center gap-2">
                    <Link
                        href={route('book.rental.portal.rentals.index')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                    >
                        <span>←</span>
                        <span>Semua Pesanan</span>
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
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nomor Reservasi</span>
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
                                    Pelat Nomor: {rental.vehicle?.plate_number || 'Ditentukan saat serah terima'}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                                    {rental.vehicle?.capacity_seats && <span>👥 {rental.vehicle.capacity_seats} Kursi</span>}
                                    {rental.vehicle?.fuel_label && <span>⛽ {rental.vehicle.fuel_label}</span>}
                                    {rental.vehicle?.model_year && <span>📅 Th {rental.vehicle.model_year}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule & Depot Card */}
                    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-2xs space-y-5">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400">
                            Jadwal & Lokasi Serah Terima
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penjemputan / Ambil Mobil</span>
                                <div className="text-sm font-black text-slate-900">{rental.start_date}</div>
                                <div className="text-xs text-slate-600 font-semibold pt-1">
                                    📍 {rental.pickup_location?.name || 'Depot Resmi Tenant'}
                                </div>
                                {rental.pickup_location?.address && (
                                    <p className="text-[11px] text-slate-500">{rental.pickup_location.address}</p>
                                )}
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pengembalian Mobil</span>
                                <div className="text-sm font-black text-slate-900">{rental.end_date}</div>
                                <div className="text-xs text-slate-600 font-semibold pt-1">
                                    🏁 {rental.return_location?.name || 'Depot Resmi Tenant'}
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
                            <span className="font-bold text-slate-800 block">Tautan Pesanan Publik</span>
                            <span className="text-slate-500">Gunakan tautan ini jika ingin membuka pesanan di perangkat lain tanpa login.</span>
                        </div>
                        <Link
                            href={route('book.rental.booking.show', rental.public_token)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 hover:bg-slate-50 transition shrink-0"
                        >
                            Buka Tautan Publik ↗
                        </Link>
                    </div>
                </div>

                {/* Right: Payment Breakdown & Action Center */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
                        <h4 className="text-sm font-black text-slate-900">Rincian Pembayaran</h4>

                        <div className="space-y-3 text-xs divide-y divide-slate-100">
                            <div className="flex justify-between pt-2">
                                <span className="text-slate-500">Tarif Sewa ({rental.total_periods} {rental.period_type})</span>
                                <span className="font-bold text-slate-800">{money(rental.base_amount)}</span>
                            </div>

                            {rental.one_way_fee_amount != null && rental.one_way_fee_amount > 0 && (
                                <div className="flex justify-between pt-2">
                                    <span className="text-slate-500">Biaya Antar Cabang (One-Way)</span>
                                    <span className="font-bold text-slate-800">{money(rental.one_way_fee_amount)}</span>
                                </div>
                            )}

                            {rental.insurance_package && (
                                <div className="flex justify-between pt-2">
                                    <span className="text-slate-500">Proteksi: {rental.insurance_package.name}</span>
                                    <span className="font-bold text-slate-800">{money(rental.insurance_package.amount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-3 text-sm font-black text-slate-900">
                                <span>Total Tagihan Sewa</span>
                                <span>{money(rental.total_amount)}</span>
                            </div>

                            {rental.deposit_amount > 0 && (
                                <div className="pt-3 space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Jaminan Deposit</span>
                                        <span>{money(rental.deposit_amount)}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block">
                                        *Deposit dikembalikan penuh setelah unit diperiksa saat pengembalian.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons depending on status */}
                        <div className="border-t border-slate-100 pt-4 space-y-2">
                            {rental.status === 'pending_reserved' && (
                                <button
                                    type="button"
                                    onClick={handlePayDeposit}
                                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102 flex items-center justify-center gap-1.5"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <span>💳</span>
                                    <span>Bayar Sekarang (Online / Transfer)</span>
                                </button>
                            )}

                            {rental.status === 'confirmed' && (
                                <button
                                    type="button"
                                    onClick={handlePayInvoice}
                                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102 flex items-center justify-center gap-1.5"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <span>💳</span>
                                    <span>Bayar Biaya Sewa Mobil</span>
                                </button>
                            )}

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}?text=${encodeURIComponent('Halo ' + brand.name + ', saya ingin bertanya mengenai pesanan rental nomor: ' + rental.code)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                                >
                                    <span>💬</span>
                                    <span>Hubungi CS WhatsApp</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerPortalLayout>
    );
}
