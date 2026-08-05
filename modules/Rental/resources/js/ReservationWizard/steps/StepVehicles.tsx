import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import { useTrans } from '@/hooks/useTrans';
import type { AvailableVehicle, AvailableVehiclesMeta, ReservationFormData } from '../types';
import { formatMoney } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    vehicles: AvailableVehicle[];
    meta: AvailableVehiclesMeta | null;
    loading: boolean;
    loadError: string | null;
    onSelect: (vehicle: AvailableVehicle) => void;
}

export default function StepVehicles({
    data,
    setData,
    errors,
    vehicles,
    meta,
    loading,
    loadError,
    onSelect,
}: Props): JSX.Element {
    const { t } = useTrans();
    const selected = vehicles.find((v) => String(v.id) === data.vehicle_id) ?? null;
    const needsManualRate = selected !== null && selected.rate === null;

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('rental.wizard.steps.2')}
            </h2>
            <InputError message={errors.vehicle_id} />
            {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            {loading && (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-md bg-gray-100" />
                    ))}
                </div>
            )}
            {!loading && vehicles.length === 0 && (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <p>{t('rental.wizard.no_vehicles')}</p>
                    {meta && meta.has_active_rates === false && (
                        <p>{t('rental.wizard.no_rates_hint')}</p>
                    )}
                </div>
            )}
            {!loading && vehicles.length > 0 && meta?.has_active_rates === false && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {t('rental.wizard.no_rates_manual_hint')}
                </p>
            )}
            {!loading && vehicles.length > 0 && (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-md border border-gray-200">
                    {vehicles.map((vehicle) => {
                        const isSelected = data.vehicle_id === String(vehicle.id);
                        return (
                            <li key={vehicle.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(vehicle)}
                                    className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-gray-50 ${
                                        isSelected ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : 'bg-white'
                                    }`}
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {vehicle.name}{' '}
                                            <span className="text-sm font-normal text-gray-500">
                                                {vehicle.plate_number}
                                            </span>
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {[vehicle.rental_class, vehicle.type, vehicle.rate?.name]
                                                .filter(Boolean)
                                                .join(' · ') || t('rental.wizard.no_rate_label')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {vehicle.rate ? (
                                            <>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatMoney(vehicle.rate.rate_per_period)}
                                                    <span className="font-normal text-gray-500">
                                                        /
                                                        {t(
                                                            `rental.period_type.${
                                                                vehicle.rate.period_type === 'daily'
                                                                    ? 'day'
                                                                    : vehicle.rate.period_type === 'weekly'
                                                                      ? 'week'
                                                                      : 'month'
                                                            }`,
                                                            undefined,
                                                            vehicle.rate.period_type,
                                                        )}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {t('rental.fields.deposit')}:{' '}
                                                    {formatMoney(vehicle.rate.deposit_amount)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-xs font-medium text-amber-700">
                                                {t('rental.wizard.manual_rate')}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {needsManualRate && (
                <div className="grid grid-cols-1 gap-4 rounded-md border border-amber-200 bg-amber-50/50 p-4 sm:grid-cols-2">
                    <p className="sm:col-span-2 text-sm text-amber-900">{t('rental.wizard.enter_rate_manual')}</p>
                    <div>
                        <InputLabel htmlFor="rate_per_period" value={`${t('rental.fields.rate_per_period')} *`} />
                        <MoneyInput
                            id="rate_per_period"
                            value={data.rate_per_period}
                            onChange={(value) => setData('rate_per_period', value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={errors.rate_per_period} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="deposit_amount" value={t('rental.fields.deposit')} />
                        <MoneyInput
                            id="deposit_amount"
                            value={data.deposit_amount}
                            onChange={(value) => setData('deposit_amount', value)}
                            className="mt-1 w-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
