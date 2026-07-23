import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Vehicle { id: number; name: string; plate_number: string; }
interface Driver { id: number; name: string; }
interface Partner { id: number; name: string; code: string; }
interface Rate { id: number; name: string; period_type: string; rate_per_period: string; km_limit_per_period: number | null; excess_km_rate: string | null; deposit_amount: string; }
interface Rental { id: number; code: string; vehicle_id: number; driver_id: number | null; partner_id: number; start_date: string; end_date: string; period_type: string; rate_per_period: string; km_limit_per_period: number | null; excess_km_rate: string | null; deposit_amount: string; notes: string | null; }

interface Props { rental: Rental; vehicles: Vehicle[]; drivers: Driver[]; partners: Partner[]; rates: Rate[]; }

export default function Edit({ rental, vehicles, drivers, partners, rates }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors } = useForm({
        vehicle_id: String(rental.vehicle_id),
        driver_id: String(rental.driver_id ?? ''),
        partner_id: String(rental.partner_id),
        start_date: rental.start_date,
        end_date: rental.end_date,
        period_type: rental.period_type,
        rate_per_period: rental.rate_per_period,
        km_limit_per_period: String(rental.km_limit_per_period ?? ''),
        excess_km_rate: rental.excess_km_rate ?? '',
        deposit_amount: rental.deposit_amount,
        notes: rental.notes ?? '',
    });

    const applyRate = (rateId: string) => {
        const rate = rates.find((r) => r.id === Number(rateId));
        if (!rate) return;
        setData((prev) => ({ ...prev, period_type: rate.period_type, rate_per_period: rate.rate_per_period, km_limit_per_period: rate.km_limit_per_period?.toString() ?? '', excess_km_rate: rate.excess_km_rate ?? '', deposit_amount: rate.deposit_amount }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.update', rental.id));
    };

    return (
        <DynamicLayout header="Rental">
            <Head title={`Edit ${rental.code}`} />
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Link href={prefixedRoute('rental.show', rental.id)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Back</Link>
                </div>
                <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Edit Rental {rental.code}</h1>
                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Booking</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="partner_id" value="Customer *" />
                                <Select id="partner_id" value={data.partner_id} onChange={(e) => setData('partner_id', e.target.value)} className="mt-1 w-full">
                                    {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                                <InputError message={errors.partner_id} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="vehicle_id" value="Vehicle *" />
                                <Select id="vehicle_id" value={data.vehicle_id} onChange={(e) => setData('vehicle_id', e.target.value)} className="mt-1 w-full">
                                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.plate_number}</option>)}
                                </Select>
                                <InputError message={errors.vehicle_id} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="driver_id" value="Driver" />
                                <Select id="driver_id" value={data.driver_id} onChange={(e) => setData('driver_id', e.target.value)} className="mt-1 w-full">
                                    <option value="">No driver</option>
                                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </Select>
                            </div>
                            <div />
                            <div>
                                <InputLabel htmlFor="start_date" value="Start Date *" />
                                <TextInput id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.start_date} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="end_date" value="End Date *" />
                                <TextInput id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.end_date} className="mt-1" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pricing</h2>
                            {rates.length > 0 && (
                                <Select onChange={(e) => applyRate(e.target.value)} defaultValue="" className="text-xs">
                                    <option value="">Apply rate…</option>
                                    {rates.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </Select>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="period_type" value="Period Type *" />
                                <Select id="period_type" value={data.period_type} onChange={(e) => setData('period_type', e.target.value)} className="mt-1 w-full">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </Select>
                            </div>
                            <div>
                                <InputLabel htmlFor="rate_per_period" value="Rate per Period (Rp) *" />
                                <TextInput id="rate_per_period" type="number" min="0" value={data.rate_per_period} onChange={(e) => setData('rate_per_period', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.rate_per_period} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="km_limit" value="KM Limit per Period" />
                                <TextInput id="km_limit" type="number" min="0" value={data.km_limit_per_period} onChange={(e) => setData('km_limit_per_period', e.target.value)} className="mt-1 w-full" />
                            </div>
                            <div>
                                <InputLabel htmlFor="excess_km_rate" value="Excess KM Rate (Rp/km)" />
                                <TextInput id="excess_km_rate" type="number" min="0" value={data.excess_km_rate} onChange={(e) => setData('excess_km_rate', e.target.value)} className="mt-1 w-full" />
                            </div>
                            <div>
                                <InputLabel htmlFor="deposit_amount" value="Deposit (Rp)" />
                                <TextInput id="deposit_amount" type="number" min="0" value={data.deposit_amount} onChange={(e) => setData('deposit_amount', e.target.value)} className="mt-1 w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <InputLabel htmlFor="notes" value="Notes" />
                        <textarea id="notes" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Link href={prefixedRoute('rental.show', rental.id)}><SecondaryButton type="button">Cancel</SecondaryButton></Link>
                        <PrimaryButton disabled={processing}>Save Changes</PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
