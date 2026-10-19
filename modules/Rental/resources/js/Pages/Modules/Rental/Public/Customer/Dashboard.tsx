import { useTrans } from '@/hooks/useTrans';
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

export default function Dashboard({
    brand,
    customer,
    kyc,
    activeRentals,
    recentRentals,
    stats,
}: Props) {
    const { locale } = useTrans();
    const tr = (id: string, en: string) => (locale === 'en' ? en : id);

    const statusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return { label: tr('Sedang Berjalan', 'Active / In Progress'), bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
            case 'confirmed':
                return { label: tr('Terkonfirmasi · Siap Ambil', 'Confirmed · Ready for Pickup'), bg: 'bg-blue-50 text-blue-800 border-blue-300' };
            case 'pending_reserved':
                return { label: tr('Menunggu Pembayaran', 'Awaiting Payment'), bg: 'bg-amber-50 text-amber-800 border-amber-300' };
            case 'completed':
                return { label: tr('Selesai', 'Completed'), bg: 'bg-slate-100 text-slate-700 border-slate-300' };
            case 'cancelled':
            case 'abandoned':
                return { label: tr('Dibatalkan', 'Cancelled'), bg: 'bg-rose-50 text-rose-800 border-rose-200' };
            default:
                return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    const isKycVerified = kyc.status === 'verified';
    const isKycPending = kyc.status === 'pending';
    const isKycRejected = kyc.status === 'rejected';

    return (
        <CustomerPortalLayout
            brand={brand}
            title={tr(`Halo, ${customer.name}!`, `Hello, ${customer.name}!`)}
            headerAction={
                <Link
                    href={route('book.rental.search')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102"
                    style={{ backgroundColor: 'var(--brand-color)' }}
                >
                    <span>🚗</span>
                    <span>{tr('Sewa Mobil Baru', 'Rent a New Car')}</span>
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
                                    <span>{tr('Akun Terverifikasi Resmi', 'Officially Verified Account')}</span>
                                    <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-full font-bold">
                                        {tr('KYC Valid', 'KYC Valid')}
                                    </span>
                                </h4>
                                <p className="text-xs text-emerald-800 mt-0.5">
                                    {tr(
                                        'KTP & SIM Anda sudah terverifikasi. Anda dapat menyewa mobil kapan saja tanpa perlu mengunggah ulang dokumen.',
                                        'Your ID Card & Driver License are verified. You can rent a car anytime without re-uploading documents.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('book.rental.portal.documents.index')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs shrink-0 self-start sm:self-auto"
                        >
                            <span>{tr('Lihat Dokumen', 'View Documents')}</span>
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
                                <h4 className="text-sm font-black text-blue-950">{tr('Dokumen KYC Sedang Ditinjau', 'KYC Documents Under Review')}</h4>
                                <p className="text-xs text-blue-800 mt-0.5">
                                    {tr(
                                        'Tim kami sedang memverifikasi KTP & SIM Anda. Anda tetap dapat melakukan reservasi armada.',
                                        'Our team is verifying your ID Card & Driver License. You can still place vehicle reservations.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('book.rental.portal.documents.index')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 bg-white border border-blue-300 hover:bg-blue-100 transition shadow-2xs shrink-0 self-start sm:self-auto"
                        >
                            <span>{tr('Periksa Dokumen', 'Check Documents')}</span>
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
                                    {isKycRejected
                                        ? tr('Verifikasi Dokumen Memerlukan Revisi', 'Document Verification Needs Revision')
                                        : tr('Lengkapi Dokumen Identitas (KTP & SIM)', 'Complete Identity Documents (ID Card & Driver License)')}
                                </h4>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    {kyc.rejected_reason
                                        ? tr(
                                              `Alasan penolakan: ${kyc.rejected_reason}. Silakan unggah foto dokumen yang lebih jelas.`,
                                              `Rejection reason: ${kyc.rejected_reason}. Please upload a clearer document photo.`,
                                          )
                                        : tr(
                                              'Unggah KTP dan SIM Anda satu kali agar pesanan sewa Anda dapat disetujui secara instan.',
                                              'Upload your ID Card and Driver License once so your rental bookings can be approved instantly.',
                                          )}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('book.rental.portal.documents.index')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 transition shadow-xs shrink-0 self-start sm:self-auto"
                        >
                            <span>{tr('Unggah Dokumen Sekarang', 'Upload Documents Now')}</span>
                            <span>→</span>
                        </Link>
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-2xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tr('Total Riwayat Sewa', 'Total Rental History')}</div>
                        <div className="text-2xl font-black text-slate-900">{stats.total} {tr('Pesanan', 'Bookings')}</div>
                        <p className="text-[11px] text-slate-500">{tr(`Sejak bergabung dengan ${brand.name}`, `Since joining ${brand.name}`)}</p>
                    </div>

                    <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-2xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tr('Sewa Aktif Berjalan', 'Active Rentals')}</div>
                        <div className="text-2xl font-black text-teal-700">{stats.active} {tr('Armada', 'Vehicles')}</div>
                        <p className="text-[11px] text-slate-500">{tr('Unit sedang disewa / siap serah terima', 'Units currently rented / ready for handover')}</p>
                    </div>

                    <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-2xs space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tr('Status Identitas KYC', 'KYC Identity Status')}</div>
                        <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <span>
                                {isKycVerified
                                    ? tr('✅ Terverifikasi', '✅ Verified')
                                    : isKycPending
                                      ? tr('⏳ Dalam Peninjauan', '⏳ Under Review')
                                      : tr('📋 Belum Lengkap', '📋 Incomplete')}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            {kyc.has_id_card && kyc.has_driver_license
                                ? tr('KTP & SIM terunggah', 'ID Card & Driver License uploaded')
                                : tr('KTP / SIM belum lengkap', 'ID Card / Driver License incomplete')}
                        </p>
                    </div>
                </div>

                {/* Active Rentals Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{tr('Sewa Kendaraan Aktif', 'Active Vehicle Rentals')}</h3>
                            <p className="text-xs text-slate-500 font-medium">{tr('Armada yang sedang berjalan atau menunggu jadwal keberangkatan.', 'Vehicles currently in use or awaiting departure schedule.')}</p>
                        </div>
                        <Link
                            href={route('book.rental.portal.rentals.index') + '?tab=active'}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                        >
                            {tr('Lihat Semua', 'View All')} ({activeRentals.length})
                        </Link>
                    </div>

                    {activeRentals.length === 0 ? (
                        <div className="rounded-3xl bg-white p-8 text-center border border-slate-200/80 shadow-2xs space-y-3">
                            <div className="text-3xl">🚗</div>
                            <h4 className="text-sm font-bold text-slate-800">{tr('Tidak Ada Sewa yang Sedang Berjalan', 'No Active Rentals right now')}</h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                {tr(
                                    'Anda sedang tidak memiliki unit mobil yang disewa. Ingin bepergian atau liburan akhir pekan ini?',
                                    'You do not have any active rented vehicles at the moment. Planning a trip or weekend getaway?',
                                )}
                            </p>
                            <Link
                                href={route('book.rental.search')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
                                style={{ backgroundColor: 'var(--brand-color)' }}
                            >
                                {tr('Cari Ketersediaan Mobil', 'Search Car Availability')}
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
                                                        {rental.vehicle?.name || tr('Armada Rental', 'Rental Vehicle')}
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
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr('Mulai Sewa', 'Start Date')}</span>
                                                <span className="font-bold text-slate-800">{rental.start_date}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr('Selesai Sewa', 'End Date')}</span>
                                                <span className="font-bold text-slate-800">{rental.end_date}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr('Total Biaya', 'Total Amount')}</span>
                                                <span className="text-sm font-black text-slate-900">{money(rental.total_amount)}</span>
                                            </div>

                                            <Link
                                                href={route('book.rental.portal.rentals.show', rental.code)}
                                                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                                                style={{ backgroundColor: 'var(--brand-color)' }}
                                            >
                                                <span>{tr('Detail Sewa', 'Rental Detail')}</span>
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
                                <h3 className="text-base font-black text-slate-900 tracking-tight">{tr('Riwayat Pemesanan Terakhir', 'Recent Booking History')}</h3>
                                <p className="text-xs text-slate-500">{tr('Daftar transaksi dan rental sebelumnya.', 'List of previous transactions and rentals.')}</p>
                            </div>
                            <Link
                                href={route('book.rental.portal.rentals.index')}
                                className="text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                            >
                                {tr('Lihat Semua Riwayat →', 'View All History →')}
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
                                                    {item.vehicle?.name || tr('Armada Rental', 'Rental Vehicle')}
                                                </h5>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    {tr('Kode:', 'Code:')} <span className="font-mono">{item.code}</span> · {item.start_date} → {item.end_date}
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
