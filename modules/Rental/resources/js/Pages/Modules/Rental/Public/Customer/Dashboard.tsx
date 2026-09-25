import { Link } from '@inertiajs/react';
import CustomerPortalLayout from './CustomerPortalLayout';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    has_password: boolean;
}

interface Kyc {
    status: string;
    rejected_reason: string | null;
    has_id_card: boolean;
    has_driver_license: boolean;
    id_number: string | null;
    license_number: string | null;
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
    customer: Customer;
    kyc: Kyc;
    activeRentals: RentalItem[];
    recentRentals: RentalItem[];
    stats: {
        total: number;
        active: number;
        pending_action: number;
    };
    holdTtlMinutes: number;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const statusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return { label: 'Sedang Berjalan', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
        case 'confirmed':
            return { label: 'Terkonfirmasi · Siap Ambil', bg: 'bg-blue-50 text-blue-800 border-blue-300' };
        case 'pending_reserved':
            return { label: 'Menunggu Pembayaran', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
        case 'completed':
            return { label: 'Selesai', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
        case 'cancelled':
        case 'abandoned':
            return { label: 'Dibatalkan', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
        default:
            return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
};

export default function Dashboard({
    brand,
    customer,
    kyc,
    activeRentals,
    recentRentals,
    stats,
}: Props) {
    const isKycVerified = kyc.status === 'verified';
    const isKycPending = kyc.status === 'pending';
    const isKycRejected = kyc.status === 'rejected';

    return (
        <CustomerPortalLayout
            brand={brand}
            title={`Halo, ${customer.name}!`}
            headerAction={
                <Link
                    href={route('book.rental.search')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102"
                    style={{ backgroundColor: 'var(--brand-color)' }}
                >
                    <span>🚗</span>
                    <span>Sewa Mobil Baru</span>
                </Link>
            }
        >
            <div className="space-y-8">
                {/* KYC Verification Status Banner */}
                {isKycVerified ? (
                    <div className="rounded-3xl bg-emerald-50/80 border border-emerald-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                                🛡️
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                                    <span>Akun Terverifikasi Resmi</span>
                                    <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-full font-bold">
                                        KYC Valid
                                    </span>
                                </h4>
                                <p className="text-xs text-emerald-800 mt-0.5">
                                    KTP & SIM Anda sudah terverifikasi. Anda dapat menyewa mobil kapan saja tanpa perlu mengunggah ulang dokumen.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('book.rental.portal.documents.index')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs shrink-0 self-start sm:self-auto"
                        >
                            <span>Lihat Dokumen</span>
                            <span>→</span>
                        </Link>
                    </div>
                ) : isKycPending ? (
                    <div className="rounded-3xl bg-blue-50/80 border border-blue-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl shrink-0">
                                ⏳
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-blue-950">Dokumen KYC Sedang Ditinjau</h4>
                                <p className="text-xs text-blue-800 mt-0.5">
                                    Tim kami sedang memverifikasi KTP & SIM Anda. Anda tetap dapat melakukan reservasi armada.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('book.rental.portal.documents.index')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 bg-white border border-blue-300 hover:bg-blue-100 transition shadow-2xs shrink-0 self-start sm:self-auto"
                        >
                            <span>Periksa Dokumen</span>
                            <span>→</span>
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-3xl bg-amber-50/90 border border-amber-300 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0">
                                ⚠️
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-amber-950">
                                    {isKycRejected ? 'Verifikasi Dokumen Memerlukan Revisi' : 'Lengkapi Dokumen Identitas (KTP & SIM)'}
                                </h4>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    {kyc.rejected_reason
                                        ? `Alasan penolakan: ${kyc.rejected_reason}. Silakan unggah foto dokumen yang lebih jelas.`
                                        : 'Unggah KTP dan SIM Anda satu kali agar pesanan sewa Anda dapat disetujui secara instan.'}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('book.rental.portal.documents.index')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 transition shadow-xs shrink-0 self-start sm:self-auto"
                        >
                            <span>Unggah Dokumen Sekarang</span>
                            <span>→</span>
                        </Link>
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-2xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Riwayat Sewa</div>
                        <div className="text-2xl font-black text-slate-900">{stats.total} Pesanan</div>
                        <p className="text-[11px] text-slate-500">Sejak bergabung dengan {brand.name}</p>
                    </div>

                    <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-2xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sewa Aktif Berjalan</div>
                        <div className="text-2xl font-black text-teal-700">{stats.active} Armada</div>
                        <p className="text-[11px] text-slate-500">Unit sedang disewa / siap serah terima</p>
                    </div>

                    <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-2xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Identitas KYC</div>
                        <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <span>{isKycVerified ? '✅ Terverifikasi' : isKycPending ? '⏳ Dalam Peninjauan' : '📋 Belum Lengkap'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            {kyc.has_id_card && kyc.has_driver_license ? 'KTP & SIM terunggah' : 'KTP / SIM belum lengkap'}
                        </p>
                    </div>
                </div>

                {/* Active Rentals Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Sewa Kendaraan Aktif</h3>
                            <p className="text-xs text-slate-500 font-medium">Armada yang sedang berjalan atau menunggu jadwal keberangkatan.</p>
                        </div>
                        <Link
                            href={route('book.rental.portal.rentals.index') + '?tab=active'}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                        >
                            Lihat Semua ({activeRentals.length})
                        </Link>
                    </div>

                    {activeRentals.length === 0 ? (
                        <div className="rounded-3xl bg-white p-8 text-center border border-slate-200/80 shadow-2xs space-y-3">
                            <div className="text-3xl">🚗</div>
                            <h4 className="text-sm font-bold text-slate-800">Tidak Ada Sewa yang Sedang Berjalan</h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Anda sedang tidak memiliki unit mobil yang disewa. Ingin bepergian atau liburan akhir pekan ini?
                            </p>
                            <Link
                                href={route('book.rental.search')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
                                style={{ backgroundColor: 'var(--brand-color)' }}
                            >
                                Cari Ketersediaan Mobil
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {activeRentals.map((rental) => {
                                const badge = statusBadge(rental.status);
                                return (
                                    <div
                                        key={rental.id}
                                        className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-350 transition"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {rental.vehicle?.photo_url ? (
                                                    <img
                                                        src={rental.vehicle.photo_url}
                                                        alt={rental.vehicle.name}
                                                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                                                        🚗
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900">
                                                        {rental.vehicle?.name || 'Armada Rental'}
                                                    </h4>
                                                    <span className="text-xs font-mono font-bold text-slate-500 block">
                                                        {rental.vehicle?.plate_number || rental.code}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${badge.bg}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Mulai Sewa</span>
                                                <span className="font-bold text-slate-800">{rental.start_date}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Selesai Sewa</span>
                                                <span className="font-bold text-slate-800">{rental.end_date}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Biaya</span>
                                                <span className="text-sm font-black text-slate-900">{money(rental.total_amount)}</span>
                                            </div>

                                            <Link
                                                href={route('book.rental.portal.rentals.show', rental.code)}
                                                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                                                style={{ backgroundColor: 'var(--brand-color)' }}
                                            >
                                                <span>Detail Sewa</span>
                                                <span>→</span>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Bookings History */}
                {recentRentals.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Riwayat Pemesanan Terakhir</h3>
                                <p className="text-xs text-slate-500">Daftar transaksi dan rental sebelumnya.</p>
                            </div>
                            <Link
                                href={route('book.rental.portal.rentals.index')}
                                className="text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                            >
                                Lihat Semua Riwayat →
                            </Link>
                        </div>

                        <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                            {recentRentals.map((item) => {
                                const badge = statusBadge(item.status);
                                return (
                                    <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                                        <div className="flex items-center gap-3.5">
                                            <span className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0">
                                                🚘
                                            </span>
                                            <div>
                                                <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                                                    {item.vehicle?.name || 'Armada Rental'}
                                                </h5>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    Kode: <span className="font-mono">{item.code}</span> · {item.start_date} → {item.end_date}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <span className="text-xs font-black text-slate-900 block">{money(item.total_amount)}</span>
                                                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            <Link
                                                href={route('book.rental.portal.rentals.show', item.code)}
                                                className="hidden sm:inline-flex p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                            >
                                                →
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </CustomerPortalLayout>
    );
}
