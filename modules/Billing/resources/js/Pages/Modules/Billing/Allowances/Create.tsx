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
import BillingNav from '../../../../BillingNav';

interface Trip {
    id: number;
    code: string;
    origin: string;
    destination: string;
    scheduled_at: string;
    driver: { id: number; name: string } | null;
}

interface Props {
    trips: Trip[];
}

export default function Create({ trips }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        trip_id: '',
        advance_amount: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('billing.allowances.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Issue Allowance</h2>}
        >
            <Head title="Issue Allowance" />

            <BillingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div>
                            <InputLabel htmlFor="trip_id" value="Trip" />
                            <Select
                                id="trip_id"
                                className="mt-1"
                                value={data.trip_id}
                                onChange={(value) => setData('trip_id', value)}
                                placeholder="Select a trip"
                                options={trips.map((trip) => ({
                                    value: String(trip.id),
                                    label: `${trip.code} — ${trip.driver?.name || '?'} — ${trip.origin} → ${trip.destination}`,
                                }))}
                            />
                            <InputError message={errors.trip_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="advance_amount" value="Advance / Kasbon (Rp)" />
                            <TextInput id="advance_amount" type="number" min={0} step="0.01" className="mt-1 block w-full" value={data.advance_amount} onChange={(e) => setData('advance_amount', e.target.value)} required />
                            <InputError message={errors.advance_amount} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="notes" value="Notes (opsional)" />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Issue Allowance</PrimaryButton>
                            <Link href={prefixedRoute('billing.allowances.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
