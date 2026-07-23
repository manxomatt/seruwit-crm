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

interface Option {
    id: number;
    name: string;
    color: string | null;
    extra_price: string | null;
    sort: number | null;
}

interface ProductAttribute {
    id: number;
    name: string;
    type: string;
    sort: number | null;
    options: Option[];
}

interface OptionRow {
    id: number | null;
    name: string;
    color: string;
    extra_price: string;
    sort: string;
}

interface Props {
    attribute: ProductAttribute;
}

export default function Edit({ attribute }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors } = useForm<{
        name: string;
        type: string;
        sort: string;
        options: OptionRow[];
    }>({
        name: attribute.name,
        type: attribute.type,
        sort: attribute.sort !== null ? String(attribute.sort) : '',
        options: attribute.options.map((o) => ({
            id: o.id,
            name: o.name,
            color: o.color || '',
            extra_price: o.extra_price !== null ? String(o.extra_price) : '',
            sort: o.sort !== null ? String(o.sort) : '',
        })),
    });

    const addOption = () => {
        setData('options', [...data.options, { id: null, name: '', color: '', extra_price: '', sort: String(data.options.length) }]);
    };

    const updateOption = (index: number, field: keyof OptionRow, value: string) => {
        const updated = [...data.options];
        updated[index] = { ...updated[index], [field]: value };
        setData('options', updated);
    };

    const removeOption = (index: number) => {
        setData('options', data.options.filter((_, i) => i !== index));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('products.attributes.update', attribute.id));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Atribut</h2>}>
            <Head title="Edit Atribut" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="name" value="Nama Atribut" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="type" value="Tipe" />
                                <Select id="type" className="mt-1" value={data.type} onChange={(value) => setData('type', value)} options={[
                                    { value: 'select', label: 'Select' },
                                    { value: 'color', label: 'Color' },
                                    { value: 'radio', label: 'Radio' },
                                    { value: 'checkbox', label: 'Checkbox' },
                                ]} />
                                <InputError message={errors.type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="sort" value="Urutan" />
                                <TextInput id="sort" type="number" className="mt-1 block w-full" value={data.sort} onChange={(e) => setData('sort', e.target.value)} />
                                <InputError message={errors.sort} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <InputLabel value="Opsi Atribut" />
                                <SecondaryButton type="button" onClick={addOption}>+ Tambah Opsi</SecondaryButton>
                            </div>

                            {data.options.length > 0 && (
                                <div className="space-y-3">
                                    {data.options.map((opt, i) => (
                                        <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="flex-1">
                                                <TextInput placeholder="Nama opsi" className="w-full" value={opt.name} onChange={(e) => updateOption(i, 'name', e.target.value)} required />
                                                <InputError message={(errors as Record<string, string>)[`options.${i}.name`]} className="mt-1" />
                                            </div>
                                            {data.type === 'color' && (
                                                <div className="w-20">
                                                    <input type="color" className="h-10 w-full cursor-pointer rounded border border-gray-300" value={opt.color || '#000000'} onChange={(e) => updateOption(i, 'color', e.target.value)} />
                                                </div>
                                            )}
                                            <div className="w-32">
                                                <TextInput type="number" placeholder="Harga extra" className="w-full" value={opt.extra_price} onChange={(e) => updateOption(i, 'extra_price', e.target.value)} />
                                            </div>
                                            <div className="w-20">
                                                <TextInput type="number" placeholder="Urutan" className="w-full" value={opt.sort} onChange={(e) => updateOption(i, 'sort', e.target.value)} />
                                            </div>
                                            <button type="button" onClick={() => removeOption(i)} className="mt-2 text-red-500 hover:text-red-700">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                            <Link href={prefixedRoute('products.attributes.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
