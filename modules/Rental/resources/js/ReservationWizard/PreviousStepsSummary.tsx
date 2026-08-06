import { useTrans } from '@/hooks/useTrans';
import type {
    AvailableVehicle,
    DriverOption,
    InsurancePackage,
    ReservationFormData,
} from './types';
import { formatMoney } from './types';

interface Props {
    data: ReservationFormData;
    selectedVehicle: AvailableVehicle | null;
    /** Show extras chosen on step 3 (for Customer step and later). */
    includeExtras?: boolean;
    drivers?: DriverOption[];
    insurancePackages?: InsurancePackage[];
    isOneWay?: boolean;
}

export default function PreviousStepsSummary({
    data,
    selectedVehicle,
    includeExtras = false,
    drivers = [],
    insurancePackages = [],
    isOneWay = false,
}: Props): JSX.Element {
    const { t } = useTrans();

    const periodLabel = (periodType: string): string =>
        t(
            `rental.period_type.${
                periodType === 'daily' ? 'day' : periodType === 'weekly' ? 'week' : 'month'
            }`,
            undefined,
            periodType,
        );

    const periods = selectedVehicle?.total_periods ?? 0;
    const baseAmount =
        selectedVehicle?.base_amount ??
        (data.rate_per_period && periods > 0 ? Number(data.rate_per_period) * periods : null);
    const ratePerPeriod =
        selectedVehicle?.rate?.rate_per_period ?? (data.rate_per_period ? Number(data.rate_per_period) : null);
    const depositAmount =
        selectedVehicle?.rate?.deposit_amount ?? (data.deposit_amount ? Number(data.deposit_amount) : null);

    const selectedDriver = drivers.find((driver) => String(driver.id) === data.driver_id) ?? null;
    const selectedInsurance =
        insurancePackages.find((pkg) => String(pkg.id) === data.insurance_package_id) ?? null;
    const insuranceAmount = selectedInsurance ? Number(selectedInsurance.amount) : 0;
    const oneWayAmount = isOneWay && data.one_way_fee_amount ? Number(data.one_way_fee_amount) : 0;

    return (
        <aside className="rounded-md border border-gray-200 bg-gray-50 p-4 lg:sticky lg:top-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('rental.wizard.summary.previous')}
            </h3>

            {!selectedVehicle ? (
                <p className="text-sm text-gray-500">{t('rental.wizard.summary.previous_empty')}</p>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-md bg-white ring-1 ring-gray-200">
                        {selectedVehicle.photo_url ? (
                            <img
                                src={selectedVehicle.photo_url}
                                alt={selectedVehicle.name}
                                className="h-36 w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-36 w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                                {t('rental.availability.no_photo')}
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="font-semibold text-gray-900">{selectedVehicle.name}</p>
                        <p className="font-mono text-sm text-gray-500">{selectedVehicle.plate_number}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {[selectedVehicle.rental_class, selectedVehicle.type, selectedVehicle.rate?.name]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>

                    <dl className="space-y-2 border-t border-gray-200 pt-3">
                        <SummaryRow label={t('rental.fields.start_date')} value={data.start_date || '—'} />
                        <SummaryRow label={t('rental.fields.end_date')} value={data.end_date || '—'} />
                        <SummaryRow
                            label={t('rental.fields.period_type')}
                            value={t(`rental.period_type.${data.period_type}`, undefined, data.period_type)}
                        />
                        <SummaryRow label={t('rental.fields.period')} value={String(periods || '—')} />
                        {(data.pickup_location || data.return_location) && (
                            <>
                                <SummaryRow
                                    label={t('rental.fields.pickup_location')}
                                    value={data.pickup_location || '—'}
                                />
                                <SummaryRow
                                    label={t('rental.fields.return_location')}
                                    value={data.return_location || '—'}
                                />
                            </>
                        )}
                    </dl>

                    <dl className="space-y-2 border-t border-gray-200 pt-3">
                        {ratePerPeriod !== null && (
                            <SummaryRow
                                label={t('rental.fields.rate_per_period')}
                                value={`${formatMoney(ratePerPeriod)}/${periodLabel(data.period_type)}`}
                            />
                        )}
                        {baseAmount !== null && (
                            <SummaryRow
                                label={t('rental.fields.base_amount')}
                                value={formatMoney(baseAmount)}
                                strong
                            />
                        )}
                        {depositAmount !== null && (
                            <SummaryRow label={t('rental.fields.deposit')} value={formatMoney(depositAmount)} />
                        )}
                    </dl>

                    {includeExtras && (
                        <dl className="space-y-2 border-t border-gray-200 pt-3">
                            <SummaryRow
                                label={t('rental.fields.insurance_package')}
                                value={
                                    selectedInsurance
                                        ? `${selectedInsurance.name}${insuranceAmount > 0 ? ` (${formatMoney(insuranceAmount)})` : ''}`
                                        : t('rental.placeholders.no_insurance')
                                }
                            />
                            <SummaryRow
                                label={t('rental.fields.driver')}
                                value={selectedDriver ? selectedDriver.name : t('rental.placeholders.no_driver')}
                            />
                            {isOneWay && (
                                <SummaryRow
                                    label={t('rental.fields.one_way_fee')}
                                    value={oneWayAmount > 0 ? formatMoney(oneWayAmount) : '—'}
                                />
                            )}
                            {(data.fuel_policy_notes.trim() || data.notes.trim()) && (
                                <>
                                    {data.fuel_policy_notes.trim() && (
                                        <SummaryRow
                                            label={t('rental.fields.fuel_policy_notes')}
                                            value={data.fuel_policy_notes}
                                        />
                                    )}
                                    {data.notes.trim() && (
                                        <SummaryRow label={t('rental.fields.notes')} value={data.notes} />
                                    )}
                                </>
                            )}
                        </dl>
                    )}
                </div>
            )}
        </aside>
    );
}

function SummaryRow({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}): JSX.Element {
    return (
        <div className="flex items-start justify-between gap-3 text-sm">
            <dt className="shrink-0 text-gray-500">{label}</dt>
            <dd className={`break-words text-right text-gray-900 ${strong ? 'font-semibold' : ''}`}>{value}</dd>
        </div>
    );
}
