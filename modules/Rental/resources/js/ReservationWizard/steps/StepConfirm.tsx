import { useTrans } from '@/hooks/useTrans';
import type {
    AvailableVehicle,
    DriverOption,
    InsurancePackage,
    PartnerOption,
    ReservationFormData,
    ServerQuote,
} from '../types';
import { formatMoney } from '../types';

interface Props {
    data: ReservationFormData;
    quote: ServerQuote | null;
    quoteLoading: boolean;
    quoteError: string | null;
    selectedVehicle: AvailableVehicle | null;
    partners: PartnerOption[];
    drivers?: DriverOption[];
    insurancePackages?: InsurancePackage[];
}

export default function StepConfirm({
    data,
    quote,
    quoteLoading,
    quoteError,
    selectedVehicle,
    partners,
    drivers = [],
    insurancePackages = [],
}: Props): JSX.Element {
    const { t } = useTrans();
    const partner = partners.find((p) => String(p.id) === data.partner_id) ?? null;
    const selectedDriver = drivers.find((driver) => String(driver.id) === data.driver_id) ?? null;
    const selectedInsurance =
        insurancePackages.find((pkg) => String(pkg.id) === data.insurance_package_id) ?? null;

    const periodLabel = t(
        `rental.period_type.${
            data.period_type === 'daily' ? 'day' : data.period_type === 'weekly' ? 'week' : 'month'
        }`,
        undefined,
        data.period_type,
    );

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {t('rental.wizard.steps.6')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.wizard.confirm.subtitle')}</p>
            </div>

            {quoteLoading && <ConfirmSkeleton />}

            {quoteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {quoteError}
                </div>
            )}

            {!quoteLoading && quote && (
                <>
                    <StatusBanner available={quote.available} reasons={quote.reasons} />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                        <div className="space-y-4 lg:col-span-3">
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="flex flex-col sm:flex-row">
                                    <div className="h-44 shrink-0 bg-gray-100 sm:h-auto sm:w-48">
                                        {selectedVehicle?.photo_url ? (
                                            <img
                                                src={selectedVehicle.photo_url}
                                                alt={selectedVehicle.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full min-h-[11rem] w-full items-center justify-center text-xs text-gray-400">
                                                {t('rental.availability.no_photo')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-center gap-3 p-5">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                {t('rental.fields.vehicle')}
                                            </p>
                                            <h3 className="mt-1 text-xl font-semibold text-gray-900">
                                                {selectedVehicle?.name ?? data.vehicle_id}
                                            </h3>
                                            <p className="mt-0.5 font-mono text-sm text-gray-500">
                                                {selectedVehicle?.plate_number ?? '—'}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {[
                                                    selectedVehicle?.rental_class,
                                                    selectedVehicle?.type,
                                                    quote.rate?.name ?? selectedVehicle?.rate?.name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || '—'}
                                            </p>
                                        </div>

                                        <div className="flex items-stretch gap-3 rounded-lg bg-gray-50 p-3">
                                            <DateBlock
                                                label={t('rental.fields.start_date')}
                                                value={data.start_date}
                                            />
                                            <div className="flex items-center text-gray-300" aria-hidden>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <DateBlock
                                                label={t('rental.fields.end_date')}
                                                value={data.end_date}
                                            />
                                            <div className="ml-auto hidden border-l border-gray-200 pl-3 text-right sm:block">
                                                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                                    {t('rental.fields.period')}
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                                    {quote.total_periods} {periodLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoTile
                                    title={t('rental.fields.customer')}
                                    primary={partner ? partner.name : '—'}
                                    secondary={partner ? partner.code : undefined}
                                />
                                <InfoTile
                                    title={t('rental.wizard.confirm.trip')}
                                    primary={data.pickup_location || t('rental.wizard.confirm.no_pickup')}
                                    secondary={
                                        data.return_location
                                            ? `${t('rental.fields.return_location')}: ${data.return_location}`
                                            : undefined
                                    }
                                />
                                <InfoTile
                                    title={t('rental.fields.driver')}
                                    primary={
                                        selectedDriver
                                            ? selectedDriver.name
                                            : t('rental.placeholders.no_driver')
                                    }
                                    secondary={selectedDriver?.phone ?? undefined}
                                />
                                <InfoTile
                                    title={t('rental.fields.insurance_package')}
                                    primary={
                                        selectedInsurance
                                            ? selectedInsurance.name
                                            : t('rental.placeholders.no_insurance')
                                    }
                                    secondary={
                                        selectedInsurance
                                            ? formatMoney(selectedInsurance.amount)
                                            : undefined
                                    }
                                />
                            </div>

                            {(data.fuel_policy_notes.trim() || data.notes.trim()) && (
                                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {t('rental.wizard.confirm.notes_section')}
                                    </h3>
                                    <div className="mt-3 space-y-3 text-sm text-gray-700">
                                        {data.fuel_policy_notes.trim() && (
                                            <p>
                                                <span className="font-medium text-gray-500">
                                                    {t('rental.fields.fuel_policy_notes')}:{' '}
                                                </span>
                                                {data.fuel_policy_notes}
                                            </p>
                                        )}
                                        {data.notes.trim() && (
                                            <p>
                                                <span className="font-medium text-gray-500">
                                                    {t('rental.fields.notes')}:{' '}
                                                </span>
                                                {data.notes}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        <aside className="lg:col-span-2">
                            <div className="sticky top-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {t('rental.wizard.summary.pricing')}
                                    </h3>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                                        {formatMoney(quote.total_amount)}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t('rental.wizard.confirm.total_hint')}
                                    </p>
                                </div>

                                <dl className="space-y-3 px-5 py-4">
                                    <PriceRow
                                        label={`${t('rental.fields.rate_per_period')} / ${periodLabel}`}
                                        value={formatMoney(quote.rate_per_period)}
                                    />
                                    <PriceRow
                                        label={`${t('rental.fields.base_amount')} (${quote.total_periods}×)`}
                                        value={formatMoney(quote.base_amount)}
                                    />
                                    {Number(quote.one_way_fee_amount ?? 0) > 0 && (
                                        <PriceRow
                                            label={t('rental.fields.one_way_fee')}
                                            value={formatMoney(quote.one_way_fee_amount)}
                                        />
                                    )}
                                    {Number(quote.insurance_amount ?? 0) > 0 && (
                                        <PriceRow
                                            label={t('rental.fields.insurance_package')}
                                            value={formatMoney(quote.insurance_amount)}
                                        />
                                    )}
                                    <div className="border-t border-gray-100 pt-3">
                                        <PriceRow
                                            label={t('rental.fields.deposit')}
                                            value={formatMoney(quote.deposit_amount)}
                                            hint={t('rental.wizard.confirm.deposit_hint')}
                                        />
                                    </div>
                                </dl>

                                {quote.available ? (
                                    <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
                                        {t('rental.wizard.confirm.ready')}
                                    </div>
                                ) : (
                                    <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
                                        {quote.reasons[0] ?? t('rental.wizard.quote_unavailable')}
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </>
            )}
        </div>
    );
}

function StatusBanner({ available, reasons }: { available: boolean; reasons: string[] }): JSX.Element {
    const { t } = useTrans();

    if (available) {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
                <div>
                    <p className="text-sm font-semibold text-emerald-900">{t('rental.wizard.confirm.ready_title')}</p>
                    <p className="mt-0.5 text-sm text-emerald-800">{t('rental.wizard.confirm.ready')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                !
            </span>
            <div>
                <p className="text-sm font-semibold text-red-900">{t('rental.wizard.confirm.blocked_title')}</p>
                <p className="mt-0.5 text-sm text-red-700">
                    {reasons[0] ?? t('rental.wizard.quote_unavailable')}
                </p>
            </div>
        </div>
    );
}

function DateBlock({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-gray-900">{value || '—'}</p>
        </div>
    );
}

function InfoTile({
    title,
    primary,
    secondary,
}: {
    title: string;
    primary: string;
    secondary?: string;
}): JSX.Element {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{primary}</p>
            {secondary && <p className="mt-1 text-xs text-gray-500">{secondary}</p>}
        </div>
    );
}

function PriceRow({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}): JSX.Element {
    return (
        <div>
            <div className="flex items-start justify-between gap-3 text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
            </div>
            {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
        </div>
    );
}

function ConfirmSkeleton(): JSX.Element {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
                <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
                </div>
            </div>
            <div className="h-72 animate-pulse rounded-xl bg-gray-100 lg:col-span-2" />
        </div>
    );
}
