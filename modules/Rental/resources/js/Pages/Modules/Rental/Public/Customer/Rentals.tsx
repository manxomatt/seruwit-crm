import { Link } from '@inertiajs/react';
import CustomerPortalLayout from './CustomerPortalLayout';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

interface RentalItem {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    deposit_amount: number;
    deposit_status: string | null;
    vehicle?: {
        id: number;
        name: string;
        plate_number: string;
        photo_url: string | null;
        rental_class_label: string | null;
    } | null;
    pickup_location?: { name: string } | null;
    return_location?: { name: string } | null;
}

interface Props {
    brand: Brand;
    customer: { id: number; name: string; phone: string };
    rentals: {
        data: RentalItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        total: number;
    };
    currentTab: string;
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

export default function Rentals({ brand, rentals, currentTab }: Props) {
    const tabs = [
        { key: 'all', label: 'Semua Pesanan' },
        { key: 'active', label: 'Aktif Berjalan' },
        { key: 'completed', label: 'Selesai' },
        { key: 'cancelled', label: 'Dibatalkan' },
    ];

    return (
        <CustomerPortalLayout
            brand={brand}
            title="Daftar Sewa Kendaraan Saya"
            headerAction={
                <Link
                    href={route('book.rental.search')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition hover:scale-102"
                    style={{ backgroundColor: 'var(--brand-color)' }}
                >
                    <span>+</span>
                    <span>Pesan Mobil Baru</span>
                </Link>
            }
        >
            <div className="space-y-6">
                {/* Tabs Filter */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const active = currentTab === tab.key;
                        return (
                            <Link
                                key={tab.key}
                                href={route('book.rental.portal.rentals.index') + (tab.key !== 'all' ? `?tab=${tab.key}` : '')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Rentals List */}
                {rentals.data.length === 0 ? (
                    <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="text-3xl">📋</div>
                        <h4 className="text-base font-bold text-slate-900">Belum Ada Transaksi Pada Kategori Ini</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Anda belum memiliki riwayat pemesanan untuk filter status yang dipilih.
                        </p>
                        <Link
                            href={route('book.rental.search')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs mt-2"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            Cari Mobil Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rentals.data.map((rental) => {
                            const badge = statusBadge(rental.status);
                            return (
                                <div
                                    key={rental.id}
                                    className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-2xs hover:border-slate-350 transition flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                                >
                                    <div className="flex items-start gap-4">
                                        {rental.vehicle?.photo_url ? (
                                            <img
                                                src={rental.vehicle.photo_url}
                                                alt={rental.vehicle.name}
                                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                                                🚗
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                                                    {badge.label}
                                                </span>
                                                <span className="text-xs font-mono font-bold text-slate-400">
                                                    Kode: {rental.code}
                                                </span>
                                            </div>

                                            <h4 className="text-base font-black text-slate-900">
                                                {rental.vehicle?.name || 'Armada Rental'}
                                            </h4>

                                            <p className="text-xs text-slate-500 font-medium">
                                                <span>🗓️ {rental.start_date} – {rental.end_date}</span>
                                                {rental.pickup_location && (
                                                    <span className="block mt-0.5 text-[11px] text-slate-400">
                                                        📍 Ambil: {rental.pickup_location.name}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-2 shrink-0">
                                        <div className="text-left sm:text-right">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Biaya</span>
                                            <span className="text-base font-black text-slate-900 block">{money(rental.total_amount)}</span>
                                        </div>

                                        <Link
                                            href={route('book.rental.portal.rentals.show', rental.code)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                                            style={{ backgroundColor: 'var(--brand-color)' }}
                                        >
                                            <span>Kelola Sewa</span>
                                            <span>→</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {rentals.links && rentals.links.length > 3 && (
                    <div className="flex justify-center gap-1 pt-4">
                        {rentals.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    link.active
                                        ? 'bg-slate-900 text-white'
                                        : link.url
                                          ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                          : 'text-slate-300 cursor-not-allowed'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </CustomerPortalLayout>
    );
}
