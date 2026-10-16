import { useTrans } from '@/hooks/useTrans';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { Link } from '@inertiajs/react';
import { DetailRow, SectionCard } from '../../ShowUi';
import type { DutyOrderSummary, Rental } from '../types';
import { locationDisplay } from './shared';

interface Props {
    rental: Rental;
    periodLabel: string;
    dutyOrders?: DutyOrderSummary[];
}

export default function BookingDetailsSection({ rental, periodLabel, dutyOrders = [] }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

    const deliveryTypeLabel = (type?: string | null) => {
        switch (type) {
            case 'airport':
                return 'Bandara (Airport Meet & Greet)';
            case 'hotel':
                return 'Hotel / Penginapan';
            case 'custom_address':
                return 'Alamat Kustom / Rumah / Kantor';
            case 'depot':
            default:
                return 'Pool / Depot Rental';
        }
    };

    const isWithDriver = rental.service_type === 'with_driver';

    return (
        <SectionCard title={t('rental.sections.booking_details', undefined, 'Detail Reservasi & Rute')} icon="📍">
            <dl>
                <DetailRow label={t('rental.fields.service_type', undefined, 'Jenis Layanan')}>
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wide border ${
                        isWithDriver
                            ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                    }`}>
                        <span>{isWithDriver ? '👨‍✈️' : '🔑'}</span>
                        <span>{isWithDriver ? 'Dengan Sopir (With Driver)' : 'Lepas Kunci (Self-Drive)'}</span>
                    </span>
                </DetailRow>

                <DetailRow label={t('rental.fields.vehicle', undefined, 'Armada Kendaraan')}>
                    {rental.vehicle.name}{' '}
                    <span className="font-mono text-slate-500">({rental.vehicle.plate_number})</span>
                </DetailRow>
                <DetailRow label={t('rental.fields.customer', undefined, 'Penyewa / Pelanggan')}>{rental.partner.name}</DetailRow>
                
                {isWithDriver && Number(rental.driver_fee_amount ?? 0) > 0 && (
                    <DetailRow label="Biaya Jasa Driver">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatMoney(rental.driver_fee_amount)}
                        </span>
                    </DetailRow>
                )}

                {rental.driver && (
                    <DetailRow label={t('rental.fields.driver', undefined, 'Supir (Driver)')}>{rental.driver.name}</DetailRow>
                )}

                <DetailRow label={t('rental.fields.period', undefined, 'Periode Sewa')}>
                    {formatDateDmY(rental.start_date)} → {formatDateDmY(rental.end_date)} ({rental.total_periods} {periodLabel})
                </DetailRow>
                {rental.actual_return_date && (
                    <DetailRow label={t('rental.fields.actual_return', undefined, 'Pengembalian Aktual')}>{formatDateDmY(rental.actual_return_date)}</DetailRow>
                )}

                {/* Delivery / Pickup Point */}
                <DetailRow label="Metode & Lokasi Pengantaran (Pickup)">
                    <div className="space-y-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {deliveryTypeLabel(rental.delivery_type)}
                        </span>
                        {rental.delivery_address && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                🏠 {rental.delivery_address}
                                {rental.delivery_landmark && <span className="italic text-slate-500"> (Patokan: {rental.delivery_landmark})</span>}
                            </p>
                        )}
                        {locationDisplay(rental.pickup_location) && !rental.delivery_address && (
                            <p className="text-xs text-slate-500">{locationDisplay(rental.pickup_location)}</p>
                        )}
                        {Number(rental.delivery_fee ?? 0) > 0 && (
                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                + Biaya Antar: {formatMoney(rental.delivery_fee)}
                            </p>
                        )}
                    </div>
                </DetailRow>

                {/* Return Point */}
                <DetailRow label="Metode & Lokasi Pengembalian (Return)">
                    <div className="space-y-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {deliveryTypeLabel(rental.return_delivery_type)}
                        </span>
                        {rental.return_delivery_address && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                🏠 {rental.return_delivery_address}
                            </p>
                        )}
                        {locationDisplay(rental.return_location) && !rental.return_delivery_address && (
                            <p className="text-xs text-slate-500">{locationDisplay(rental.return_location)}</p>
                        )}
                        {Number(rental.return_delivery_fee ?? 0) > 0 && (
                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                + Biaya Ambil: {formatMoney(rental.return_delivery_fee)}
                            </p>
                        )}
                    </div>
                </DetailRow>

                {/* Emergency Contact */}
                {(rental.emergency_contact_name || rental.emergency_contact_phone) && (
                    <DetailRow label="Kontak Darurat">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            <strong>{rental.emergency_contact_name || '-'}</strong>
                            {rental.emergency_contact_relation && <span className="text-slate-500"> ({rental.emergency_contact_relation})</span>}
                            {rental.emergency_contact_phone && (
                                <span className="ml-2 font-mono text-indigo-600 dark:text-indigo-400">
                                    📞 {rental.emergency_contact_phone}
                                </span>
                            )}
                        </div>
                    </DetailRow>
                )}

                {/* Social Media */}
                {rental.social_media_account && (
                    <DetailRow label="Media Sosial Penyewa">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            📱 {rental.social_media_account}
                        </span>
                    </DetailRow>
                )}

                {Number(rental.one_way_fee_amount ?? 0) > 0 && (
                    <DetailRow label={t('rental.fields.one_way_fee', undefined, 'Biaya One-Way (Relokasi)')}>
                        {formatMoney(rental.one_way_fee_amount)}
                    </DetailRow>
                )}
                {rental.insurance_package && (
                    <DetailRow label={t('rental.fields.insurance_package', undefined, 'Paket Asuransi')}>
                        {rental.insurance_package.name}
                    </DetailRow>
                )}
                {rental.fuel_policy_notes && (
                    <DetailRow label={t('rental.fields.fuel_policy_notes', undefined, 'Kebijakan BBM')}>
                        {rental.fuel_policy_notes}
                    </DetailRow>
                )}
            </dl>

            {/* Driver Duty Orders Card (If With Driver) */}
            {isWithDriver && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-base">📋</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                                Surat Tugas Sopir (SPPD)
                            </span>
                        </div>
                        <Link
                            href={prefixedRoute('rental.duty_orders.create', { rental_id: rental.id })}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700 shadow-2xs"
                        >
                            <span>+ Buat Surat Jalan Driver</span>
                        </Link>
                    </div>

                    {dutyOrders.length > 0 ? (
                        <div className="space-y-2 pt-1">
                            {dutyOrders.map((d) => (
                                <div key={d.id} className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-amber-100 shadow-2xs dark:bg-slate-900 dark:border-amber-900/40 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{d.duty_order_number}</span>
                                        {d.driver_name && <span className="text-slate-500">({d.driver_name})</span>}
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {d.status}
                                        </span>
                                    </div>
                                    <Link
                                        href={d.show_url}
                                        className="font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                    >
                                        Buka SPPD ↗
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                            Pemesanan ini menggunakan layanan dengan sopir, namun belum memiliki Surat Tugas Operasional (SPPD) aktif.
                        </p>
                    )}
                </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">Tugas Antar / Jemput (Runner Dispatch)</span>
                <Link
                    href={prefixedRoute('rental.dispatch.index', { search: rental.code })}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-400"
                >
                    <span>🚚 Buka Papan Dispatch</span>
                    <span>→</span>
                </Link>
            </div>
        </SectionCard>
    );
}
