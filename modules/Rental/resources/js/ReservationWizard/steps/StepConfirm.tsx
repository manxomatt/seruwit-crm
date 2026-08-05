import { useTrans } from '@/hooks/useTrans';
import type { ReactNode } from 'react';
import type { AvailableVehicle, PartnerOption, ReservationFormData, ServerQuote } from '../types';
import { formatMoney } from '../types';

interface Props {
    data: ReservationFormData;
    quote: ServerQuote | null;
    quoteLoading: boolean;
    quoteError: string | null;
    selectedVehicle: AvailableVehicle | null;
    partners: PartnerOption[];
}

export default function StepConfirm({
    data,
    quote,
    quoteLoading,
    quoteError,
    selectedVehicle,
    partners,
}: Props): JSX.Element {
    const { t } = useTrans();
    const partner = partners.find((p) => String(p.id) === data.partner_id);

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('rental.wizard.steps.5')}
            </h2>

            {quoteLoading && <div className="h-24 animate-pulse rounded-md bg-gray-100" />}
            {quoteError && <p className="text-sm text-red-600">{quoteError}</p>}

            {!quoteLoading && quote && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SummaryCard title={t('rental.wizard.summary.dates')}>
                        <Row label={t('rental.fields.start_date')} value={data.start_date} />
                        <Row label={t('rental.fields.end_date')} value={data.end_date} />
                        <Row
                            label={t('rental.fields.period_type')}
                            value={t(`rental.period_type.${data.period_type}`, undefined, data.period_type)}
                        />
                        <Row label={t('rental.fields.period')} value={String(quote.total_periods)} />
                    </SummaryCard>

                    <SummaryCard title={t('rental.wizard.summary.vehicle')}>
                        <Row
                            label={t('rental.fields.vehicle')}
                            value={
                                selectedVehicle
                                    ? `${selectedVehicle.name} — ${selectedVehicle.plate_number}`
                                    : data.vehicle_id
                            }
                        />
                        <Row label={t('rental.fields.customer')} value={partner ? `${partner.name} (${partner.code})` : '—'} />
                        <Row
                            label={t('rental.fields.pickup_location')}
                            value={data.pickup_location || '—'}
                        />
                        <Row
                            label={t('rental.fields.return_location')}
                            value={data.return_location || '—'}
                        />
                    </SummaryCard>

                    <SummaryCard title={t('rental.wizard.summary.pricing')} className="sm:col-span-2">
                        {!quote.available && (
                            <p className="mb-2 text-sm text-red-600">
                                {quote.reasons[0] ?? t('rental.wizard.quote_unavailable')}
                            </p>
                        )}
                        <Row label={t('rental.fields.rate_per_period')} value={formatMoney(quote.rate_per_period)} />
                        <Row label={t('rental.fields.base_amount')} value={formatMoney(quote.base_amount)} />
                        {Number(quote.one_way_fee_amount ?? 0) > 0 && (
                            <Row label={t('rental.fields.one_way_fee')} value={formatMoney(quote.one_way_fee_amount)} />
                        )}
                        {Number(quote.insurance_amount ?? 0) > 0 && (
                            <Row label={t('rental.fields.insurance_package')} value={formatMoney(quote.insurance_amount)} />
                        )}
                        <Row label={t('rental.fields.total_amount')} value={formatMoney(quote.total_amount)} strong />
                        <Row label={t('rental.fields.deposit')} value={formatMoney(quote.deposit_amount)} />
                    </SummaryCard>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    title,
    children,
    className = '',
}: {
    title: string;
    children: ReactNode;
    className?: string;
}): JSX.Element {
    return (
        <div className={`rounded-md border border-gray-200 bg-gray-50 p-4 ${className}`}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
            <dl className="space-y-2">{children}</dl>
        </div>
    );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }): JSX.Element {
    return (
        <div className="flex items-start justify-between gap-3 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className={`text-right text-gray-900 ${strong ? 'font-semibold' : ''}`}>{value}</dd>
        </div>
    );
}
