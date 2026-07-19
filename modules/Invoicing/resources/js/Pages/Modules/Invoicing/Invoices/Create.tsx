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
import InvoicingNav from '../../../../InvoicingNav';

interface Customer {
    id: number;
    code: string;
    name: string;
}

interface Props {
    customers: Customer[];
    selectedCustomerId?: number | string | null;
}

export default function Create({ customers, selectedCustomerId }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm<{
        customer_id: string;
        issue_date: string;
        due_date: string;
        notes: string;
    }>({
        customer_id: selectedCustomerId ? String(selectedCustomerId) : '',
        issue_date: '',
        due_date: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('invoicing.invoices.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">New Invoice</h2>}
        >
            <Head title="New Invoice" />

            <InvoicingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="customer_id" value="Customer" />
                                <Select
                                    id="customer_id"
                                    className="mt-1"
                                    value={data.customer_id}
                                    onChange={(value) => setData('customer_id', value)}
                                    placeholder="Select a customer"
                                    options={customers.map((customer) => ({
                                        value: String(customer.id),
                                        label: `${customer.name} (${customer.code})`,
                                    }))}
                                />
                                <InputError message={errors.customer_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="issue_date" value="Issue Date (default hari ini)" />
                                <TextInput id="issue_date" type="date" className="mt-1 block w-full" value={data.issue_date} onChange={(e) => setData('issue_date', e.target.value)} />
                                <InputError message={errors.issue_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="due_date" value="Due Date (opsional)" />
                                <TextInput id="due_date" type="date" className="mt-1 block w-full" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                                <InputError message={errors.due_date} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Notes (opsional)" />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing || !data.customer_id}>Create Draft Invoice</PrimaryButton>
                            <Link href={prefixedRoute('invoicing.invoices.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
