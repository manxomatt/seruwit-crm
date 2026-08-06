import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import Select from '@/Components/Select';
import { useTrans } from '@/hooks/useTrans';
import { useMemo } from 'react';
import PreviousStepsSummary from '../PreviousStepsSummary';
import type { AvailableVehicle, DriverOption, InsurancePackage, ReservationFormData } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    drivers: DriverOption[];
    insurancePackages: InsurancePackage[];
    isOneWay: boolean;
    selectedVehicle: AvailableVehicle | null;
}

export default function StepExtras({
    data,
    setData,
    errors,
    drivers,
    insurancePackages,
    isOneWay,
    selectedVehicle,
}: Props): JSX.Element {
    const { t } = useTrans();

    const driverOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.no_driver') },
            ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
        ],
        [drivers, t],
    );
    const insuranceOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.no_insurance') },
            ...insurancePackages.map((pkg) => ({
                value: String(pkg.id),
                label: `${pkg.name} — Rp ${Number(pkg.amount).toLocaleString('id-ID')}/${t('rental.period_type.day')}`,
            })),
        ],
        [insurancePackages, t],
    );

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('rental.wizard.steps.3')}
            </h2>

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
                    <div>
                        <InputLabel htmlFor="insurance_package_id" value={t('rental.fields.insurance_package')} />
                        <Select
                            id="insurance_package_id"
                            options={insuranceOptions}
                            value={data.insurance_package_id}
                            onChange={(value) => setData('insurance_package_id', value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={errors.insurance_package_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="driver_id" value={t('rental.fields.driver_optional')} />
                        <Select
                            id="driver_id"
                            className="mt-1"
                            value={data.driver_id}
                            onChange={(value) => setData('driver_id', value)}
                            placeholder={t('rental.placeholders.no_driver')}
                            options={driverOptions}
                        />
                        <InputError message={errors.driver_id} className="mt-1" />
                    </div>
                    {isOneWay && (
                        <div>
                            <InputLabel htmlFor="one_way_fee_amount" value={t('rental.fields.one_way_fee')} />
                            <MoneyInput
                                id="one_way_fee_amount"
                                value={data.one_way_fee_amount}
                                onChange={(value) => setData('one_way_fee_amount', value)}
                                className="mt-1 w-full"
                            />
                            <InputError message={errors.one_way_fee_amount} className="mt-1" />
                        </div>
                    )}
                    <div className={isOneWay ? '' : 'sm:col-span-2'}>
                        <InputLabel htmlFor="fuel_policy_notes" value={t('rental.fields.fuel_policy_notes')} />
                        <textarea
                            id="fuel_policy_notes"
                            rows={2}
                            value={data.fuel_policy_notes}
                            onChange={(e) => setData('fuel_policy_notes', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder={t('rental.placeholders.fuel_policy')}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="notes" value={t('rental.fields.notes')} />
                        <textarea
                            id="notes"
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <PreviousStepsSummary data={data} selectedVehicle={selectedVehicle} />
            </div>
        </div>
    );
}
