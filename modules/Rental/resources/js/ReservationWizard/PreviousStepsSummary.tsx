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
    /** Show extras chosen on step 4 (for Customer step and later). */
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
        <aside className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    📋 {t('rental.wizard.summary.previous', undefined, 'Ringkasan Pilihan')}
                </h3>
                {selectedVehicle && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {periods} {periodLabel(data.period_type)}
                    </span>
                )}
            </div>

            {!selectedVehicle ? (
                <div className="py-6 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('rental.wizard.summary.previous_empty', undefined, 'Lengkapi langkah tanggal dan pilih kendaraan untuk melihat ringkasan.')}
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {/* Vehicle Card Preview */}
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                            {selectedVehicle.photo_url ? (
                                <img
                                    src={selectedVehicle.photo_url}
                                    alt={selectedVehicle.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                                    🚗
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                                {selectedVehicle.name}
                            </p>
                            <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {selectedVehicle.plate_number}
                            </span>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                                {[
                                    selectedVehicle.rental_class
                                        ? t(`fleet.rental_class.${selectedVehicle.rental_class}`, undefined, selectedVehicle.rental_class)
                                        : null,
                                    selectedVehicle.type,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                    </div>

                    {/* Rental Period & Route */}
                    <dl className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <SummaryRow label={t('rental.fields.start_date', undefined, 'Mulai')} value={data.start_date || '—'} />
                        <SummaryRow label={t('rental.fields.end_date', undefined, 'Selesai')} value={data.end_date || '—'} />
                        {(data.pickup_location || data.return_location) && (
                            <>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                <SummaryRow
                                    label="📍 Pickup"
                                    value={data.pickup_location || '—'}
                                />
                                <SummaryRow
                                    label="🏁 Return"
                                    value={data.return_location || '—'}
                                />
                            </>
                        )}
                    </dl>

                    {/* Pricing Detail */}
                    <dl className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        {ratePerPeriod !== null && (
                            <SummaryRow
                                label={t('rental.fields.rate_per_period', undefined, 'Tarif')}
                                value={`${formatMoney(ratePerPeriod)}/${periodLabel(data.period_type)}`}
                            />
                        )}
                        {baseAmount !== null && (
                            <SummaryRow
                                label={t('rental.fields.base_amount', undefined, 'Total Pokok')}
                                value={formatMoney(baseAmount)}
                                strong
                            />
                        )}
                        {depositAmount !== null && (
                            <SummaryRow
                                label={t('rental.fields.deposit', undefined, 'Deposit Jaminan')}
                                value={formatMoney(depositAmount)}
                            />
                        )}
                    </dl>

                    {/* Extras Summary if available */}
                    {includeExtras && (
                        <dl className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                            <SummaryRow
                                label={t('rental.fields.insurance_package', undefined, 'Asuransi')}
                                value={
                                    selectedInsurance
                                        ? `${selectedInsurance.name}${insuranceAmount > 0 ? ` (${formatMoney(insuranceAmount)})` : ''}`
                                        : 'Tanpa Asuransi'
                                }
                            />
                            <SummaryRow
                                label={t('rental.fields.driver', undefined, 'Layanan Supir')}
                                value={selectedDriver ? selectedDriver.name : 'Lepas Kunci (Tanpa Supir)'}
                            />
                            {isOneWay && (
                                <SummaryRow
                                    label={t('rental.fields.one_way_fee', undefined, 'Biaya One-Way')}
                                    value={oneWayAmount > 0 ? formatMoney(oneWayAmount) : '—'}
                                />
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
        <div className="flex items-start justify-between gap-3 text-xs">
            <dt className="shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className={`break-words text-right ${strong ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-200 font-medium'}`}>
                {value}
            </dd>
        </div>
    );
}

