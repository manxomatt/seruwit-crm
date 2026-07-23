import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Salesperson { id: number; name: string; employee_code: string | null; phone: string | null; email: string | null; area: string | null; is_active: boolean; notes: string | null; }
interface Props { salesperson: Salesperson; }

export default function EditSalesperson({ salesperson }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors } = useForm({
        name: salesperson.name,
        employee_code: salesperson.employee_code ?? '',
        phone: salesperson.phone ?? '',
        email: salesperson.email ?? '',
        area: salesperson.area ?? '',
        is_active: salesperson.is_active,
        notes: salesperson.notes ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('canvassing.salespeople.update', salesperson.id));
    };

    return (
        <DynamicLayout header="Canvassing">
            <Head title={`Edit ${salesperson.name}`} />
            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href={prefixedRoute('canvassing.salespeople.show', salesperson.id)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← {salesperson.name}</Link>
                </div>
                <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Edit {salesperson.name}</h1>
                <form onSubmit={submit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="name" value="Full Name *" />
                            <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full" />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="employee_code" value="Employee Code" />
                            <TextInput id="employee_code" value={data.employee_code} onChange={(e) => setData('employee_code', e.target.value)} className="mt-1 w-full" />
                            <InputError message={errors.employee_code} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="area" value="Area / Territory" />
                            <TextInput id="area" value={data.area} onChange={(e) => setData('area', e.target.value)} className="mt-1 w-full" />
                        </div>
                        <div>
                            <InputLabel htmlFor="phone" value="Phone" />
                            <TextInput id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="mt-1 w-full" />
                        </div>
                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1 w-full" />
                            <InputError message={errors.email} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="notes" value="Notes" />
                            <textarea id="notes" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded" />
                                Active
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={prefixedRoute('canvassing.salespeople.show', salesperson.id)}><SecondaryButton type="button">Cancel</SecondaryButton></Link>
                        <PrimaryButton disabled={processing}>Save Changes</PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
