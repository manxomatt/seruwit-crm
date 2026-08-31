import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { DetailRow, SectionCard } from '../../ShowUi';
import type { Rental } from '../types';
import { locationDisplay } from './shared';

interface Props {
    rental: Rental;
    periodLabel: string;
}

export default function BookingDetailsSection({ rental, periodLabel }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.booking_details', undefined, 'Detail Reservasi & Rute')} icon="📍">
            <dl>
                <DetailRow label={t('rental.fields.vehicle', undefined, 'Armada Kendaraan')}>
                    {rental.vehicle.name}{' '}
                    <span className="font-mono text-slate-500">({rental.vehicle.plate_number})</span>
                </DetailRow>
                <DetailRow label={t('rental.fields.customer', undefined, 'Penyewa / Pelanggan')}>{rental.partner.name}</DetailRow>
                {rental.driver && (
                    <DetailRow label={t('rental.fields.driver', undefined, 'Supir (Driver)')}>{rental.driver.name}</DetailRow>
                )}
                <DetailRow label={t('rental.fields.period', undefined, 'Periode Sewa')}>
                    {formatDateDmY(rental.start_date)} → {formatDateDmY(rental.end_date)} ({rental.total_periods} {periodLabel})
                </DetailRow>
                {rental.actual_return_date && (
                    <DetailRow label={t('rental.fields.actual_return', undefined, 'Pengembalian Aktual')}>{formatDateDmY(rental.actual_return_date)}</DetailRow>
                )}
                {locationDisplay(rental.pickup_location) && (
                    <DetailRow label={t('rental.fields.pickup_location', undefined, 'Lokasi Penyerahan (Pickup)')}>
                        {locationDisplay(rental.pickup_location)}
                    </DetailRow>
                )}
                {locationDisplay(rental.return_location) && (
                    <DetailRow label={t('rental.fields.return_location', undefined, 'Lokasi Pengembalian (Return)')}>
                        {locationDisplay(rental.return_location)}
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
        </SectionCard>
    );
}
