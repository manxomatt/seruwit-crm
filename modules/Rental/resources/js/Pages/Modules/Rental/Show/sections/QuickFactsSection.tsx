import { useTrans } from '@/hooks/useTrans';
import { DetailRow, SectionCard, StatusBadge } from '../../ShowUi';
import type { Rental } from '../types';

interface Props {
    rental: Rental;
}

export default function QuickFactsSection({ rental }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.quick_facts', undefined, 'Ringkasan Cepat')} subtitle={t('rental.sections.quick_facts_hint', undefined, 'Informasi operasional')} icon="ℹ️">
            <dl>
                <DetailRow label={t('rental.fields.code', undefined, 'Kode Rental')} compact>
                    <span className="font-mono">{rental.code}</span>
                </DetailRow>
                <DetailRow label={t('rental.fields.status', undefined, 'Status')} compact>
                    <StatusBadge
                        status={rental.status}
                        label={t(`rental.status.${rental.status}`, undefined, rental.status)}
                    />
                </DetailRow>
                {rental.confirmed_by && (
                    <DetailRow label={t('rental.timeline.confirmed', undefined, 'Dikonfirmasi')} compact>{rental.confirmed_by.name}</DetailRow>
                )}
                {rental.partner.phone && (
                    <DetailRow label={t('rental.fields.phone', undefined, 'Kontak Pelanggan')} compact>{rental.partner.phone}</DetailRow>
                )}
            </dl>
        </SectionCard>
    );
}
