import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ProductNav from '../../../../ProductNav';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Principal {
    id: number;
    name: string;
}

interface Props {
    principals: Principal[];
}

export default function Create({ principals }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        principal_id: '',
        name: '',
        status: 'active',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.brands.store'));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Tambah Brand</h2>}>
            <Head title="Tambah Brand" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-xl space-y-6">
                        <div>
                            <InputLabel htmlFor="principal_id" value="Principal" />
                            <Select
                                id="principal_id"
                                className="mt-1"
                                value={data.principal_id}
                                onChange={(value) => setData('principal_id', value)}
                                placeholder="Pilih principal..."
                                options={principals.map((p) => ({ value: String(p.id), label: p.name }))}
                            />
                            <InputError message={errors.principal_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="name" value="Nama Brand" />
                            <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <Select id="status" className="mt-1" value={data.status} onChange={(value) => setData('status', value)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                            <InputError message={errors.status} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                            <Link href={prefixedRoute('products.brands.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
