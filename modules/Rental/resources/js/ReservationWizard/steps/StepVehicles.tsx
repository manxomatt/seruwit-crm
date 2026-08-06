import InputError from '@/Components/InputError';
import { useTrans } from '@/hooks/useTrans';
import type { AvailableVehicle, AvailableVehiclesMeta, ReservationFormData } from '../types';
import { formatMoney } from '../types';

interface Props {
    data: ReservationFormData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    vehicles: AvailableVehicle[];
    meta: AvailableVehiclesMeta | null;
    loading: boolean;
    loadError: string | null;
    onSelect: (vehicle: AvailableVehicle) => void;
}

export default function StepVehicles({
    data,
    errors,
    vehicles,
    meta,
    loading,
    loadError,
    onSelect,
}: Props): JSX.Element {
    const { t } = useTrans();
    const selected =
        vehicles.find((vehicle) => String(vehicle.id) === data.vehicle_id) ?? null;
    const showInitialLoader = loading && vehicles.length === 0;
    const showRefreshIndicator = loading && vehicles.length > 0;

    const periodLabel = (periodType: string): string =>
        t(
            `rental.period_type.${
                periodType === 'daily' ? 'day' : periodType === 'weekly' ? 'week' : 'month'
            }`,
            undefined,
            periodType,
        );

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('rental.wizard.steps.2')}
            </h2>
            <InputError message={errors.vehicle_id} />
            {loadError && <p className="text-sm text-red-600">{loadError}</p>}

            {showInitialLoader && (
                <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-6 text-sm text-gray-600">
                    <Spinner />
                    <span>{t('rental.wizard.vehicles_loading')}</span>
                </div>
            )}

            {!showInitialLoader && vehicles.length === 0 && (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <p>{t('rental.wizard.no_vehicles')}</p>
                    {meta && (meta.has_active_rates === false || (meta.skipped_no_rate ?? 0) > 0) && (
                        <p>{t('rental.wizard.no_rates_hint')}</p>
                    )}
                </div>
            )}

            {vehicles.length > 0 && (
                <div className="relative grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                    {showRefreshIndicator && (
                        <div className="absolute inset-x-0 top-0 z-10 flex justify-center lg:col-span-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
                                <Spinner className="h-3.5 w-3.5" />
                                {t('rental.wizard.vehicles_refreshing')}
                            </div>
                        </div>
                    )}

                    <ul
                        className={`divide-y divide-gray-100 overflow-hidden rounded-md border border-gray-200 lg:col-span-2 ${
                            showRefreshIndicator ? 'opacity-60' : ''
                        }`}
                    >
                        {vehicles.map((vehicle) => {
                            const isSelected = data.vehicle_id === String(vehicle.id);
                            return (
                                <li key={vehicle.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(vehicle)}
                                        disabled={showRefreshIndicator}
                                        className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-gray-50 disabled:cursor-wait ${
                                            isSelected
                                                ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200'
                                                : 'bg-white'
                                        }`}
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100 ring-1 ring-gray-200">
                                                {vehicle.photo_url ? (
                                                    <img
                                                        src={vehicle.photo_url}
                                                        alt={vehicle.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                                        {t('rental.availability.no_photo')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900">
                                                    {vehicle.name}{' '}
                                                    <span className="text-sm font-normal text-gray-500">
                                                        {vehicle.plate_number}
                                                    </span>
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {[vehicle.rental_class, vehicle.type, vehicle.rate?.name]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            {vehicle.rate && (
                                                <>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatMoney(vehicle.rate.rate_per_period)}
                                                        <span className="font-normal text-gray-500">
                                                            /{periodLabel(vehicle.rate.period_type)}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {t('rental.fields.deposit')}:{' '}
                                                        {formatMoney(vehicle.rate.deposit_amount)}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <aside className="rounded-md border border-gray-200 bg-gray-50 p-4 lg:sticky lg:top-4">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {t('rental.wizard.summary.selection')}
                        </h3>

                        {!selected ? (
                            <p className="text-sm text-gray-500">{t('rental.wizard.summary.select_hint')}</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md bg-white ring-1 ring-gray-200">
                                    {selected.photo_url ? (
                                        <img
                                            src={selected.photo_url}
                                            alt={selected.name}
                                            className="h-36 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-36 w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                                            {t('rental.availability.no_photo')}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="font-semibold text-gray-900">{selected.name}</p>
                                    <p className="font-mono text-sm text-gray-500">{selected.plate_number}</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {[selected.rental_class, selected.type, selected.rate?.name]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>

                                <dl className="space-y-2 border-t border-gray-200 pt-3">
                                    <SummaryRow
                                        label={t('rental.fields.start_date')}
                                        value={data.start_date || '—'}
                                    />
                                    <SummaryRow
                                        label={t('rental.fields.end_date')}
                                        value={data.end_date || '—'}
                                    />
                                    <SummaryRow
                                        label={t('rental.fields.period')}
                                        value={String(selected.total_periods)}
                                    />
                                    {selected.rate && (
                                        <>
                                            <SummaryRow
                                                label={t('rental.fields.rate_per_period')}
                                                value={`${formatMoney(selected.rate.rate_per_period)}/${periodLabel(selected.rate.period_type)}`}
                                            />
                                            <SummaryRow
                                                label={t('rental.fields.base_amount')}
                                                value={formatMoney(selected.base_amount)}
                                                strong
                                            />
                                            <SummaryRow
                                                label={t('rental.fields.deposit')}
                                                value={formatMoney(selected.rate.deposit_amount)}
                                            />
                                        </>
                                    )}
                                </dl>
                            </div>
                        )}
                    </aside>
                </div>
            )}
        </div>
    );
}

function Spinner({ className = 'h-4 w-4' }: { className?: string }): JSX.Element {
    return (
        <svg
            className={`animate-spin text-indigo-600 ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
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
            <dt className="text-gray-500">{label}</dt>
            <dd className={`text-right text-gray-900 ${strong ? 'font-semibold' : ''}`}>{value}</dd>
        </div>
    );
}
