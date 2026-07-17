import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        license_number: '',
        license_type: '',
        license_expires_at: '',
        phone: '',
        email: '',
        status: 'available',
        photo_url: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('fleet.drivers.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Add Driver</h2>}
        >
            <Head title="Add Driver" />

            <FleetNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="license_number" value="License Number (SIM)" />
                                <TextInput id="license_number" className="mt-1 block w-full" value={data.license_number} onChange={(e) => setData('license_number', e.target.value)} required />
                                <InputError message={errors.license_number} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="license_type" value="License Type (optional)" />
                                <TextInput id="license_type" placeholder="e.g. A, B1, B2" className="mt-1 block w-full" value={data.license_type} onChange={(e) => setData('license_type', e.target.value)} />
                                <InputError message={errors.license_type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="license_expires_at" value="License Expiry (optional)" />
                                <TextInput id="license_expires_at" type="date" className="mt-1 block w-full" value={data.license_expires_at} onChange={(e) => setData('license_expires_at', e.target.value)} />
                                <InputError message={errors.license_expires_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="phone" value="Phone" />
                                <TextInput id="phone" className="mt-1 block w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} required />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value="Email (optional)" />
                                <TextInput id="email" type="email" className="mt-1 block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <select id="status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                    <option value="available">Available</option>
                                    <option value="on_trip">On Trip</option>
                                    <option value="off_duty">Off Duty</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Photo (optional)" />
                            <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} className="mt-1" />
                            <InputError message={errors.photo_url} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Notes (optional)" />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Add Driver</PrimaryButton>
                            <Link href={prefixedRoute('fleet.drivers.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
