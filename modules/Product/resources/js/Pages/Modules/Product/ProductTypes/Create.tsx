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

interface ParentOption {
    id: number;
    name: string;
}

interface Props {
    parentOptions: ParentOption[];
}

export default function Create({ parentOptions }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        parent_id: '',
        sort_order: '0',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.product-types.store'));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Tambah Tipe Produk</h2>}>
            <Head title="Tambah Tipe Produk" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-xl space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Tipe" />
                            <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="parent_id" value="Parent (opsional)" />
                            <Select
                                id="parent_id"
                                className="mt-1"
                                value={data.parent_id}
                                onChange={(value) => setData('parent_id', value)}
                                placeholder="Tidak ada (top-level)"
                                options={[
                                    { value: '', label: 'Tidak ada (top-level)' },
                                    ...parentOptions.map((p) => ({ value: String(p.id), label: p.name })),
                                ]}
                            />
                            <InputError message={errors.parent_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="sort_order" value="Urutan" />
                            <TextInput id="sort_order" type="number" min="0" className="mt-1 block w-full" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                            <InputError message={errors.sort_order} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                            <Link href={prefixedRoute('products.product-types.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
