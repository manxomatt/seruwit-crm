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

const COLOR_OPTIONS = [
    { value: '', label: 'Tanpa warna' },
    { value: 'red', label: 'Merah' },
    { value: 'blue', label: 'Biru' },
    { value: 'green', label: 'Hijau' },
    { value: 'yellow', label: 'Kuning' },
    { value: 'purple', label: 'Ungu' },
    { value: 'orange', label: 'Oranye' },
    { value: 'pink', label: 'Pink' },
    { value: 'gray', label: 'Abu-abu' },
];

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        color: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.tags.store'));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Tambah Tag</h2>}>
            <Head title="Tambah Tag" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value="Nama Tag" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="color" value="Warna" />
                                <Select id="color" className="mt-1" value={data.color} onChange={(value) => setData('color', value)} options={COLOR_OPTIONS} />
                                <InputError message={errors.color} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                            <Link href={prefixedRoute('products.tags.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
