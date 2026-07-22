import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InventoryNav from '../../../../InventoryNav';
import { Head, Link, useForm } from '@inertiajs/react';

interface ParentOption {
    id: number;
    name: string;
    code: string;
}

interface Location {
    id: number;
    name: string;
    code: string;
    type: string;
    parent_id: number | null;
    sort_order: number;
    is_default: boolean;
}

interface Props {
    warehouse: { id: number; name: string };
    location: Location;
    parentOptions: ParentOption[];
}

const LOCATION_TYPES = [
    { value: 'internal', label: 'Internal (Penyimpanan)' },
    { value: 'input', label: 'Input (Penerimaan)' },
    { value: 'output', label: 'Output (Pengiriman)' },
    { value: 'quality_control', label: 'Quality Control' },
    { value: 'transit', label: 'Transit' },
    { value: 'production', label: 'Produksi' },
    { value: 'scrap', label: 'Scrap (Buangan)' },
    { value: 'view', label: 'View (Virtual Parent)' },
];

export default function Edit({ warehouse, location, parentOptions }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors } = useForm({
        name: location.name,
        code: location.code,
        type: location.type,
        parent_id: (location.parent_id ?? '') as string | number,
        sort_order: location.sort_order,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(prefixedRoute('inventory.warehouses.locations.update', [warehouse.id, location.id]));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Lokasi — {location.name}
                    </h2>
                    <Link href={prefixedRoute('inventory.warehouses.show', warehouse.id)}>
                        <SecondaryButton>Kembali</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={`Edit Lokasi — ${location.name}`} />
            <InventoryNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Lokasi" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                disabled={location.is_default}
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="code" value="Kode" />
                            <TextInput
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                className="mt-1 block w-full"
                                disabled={location.is_default}
                            />
                            <InputError message={errors.code} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value="Tipe Lokasi" />
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                disabled={location.is_default}
                            >
                                {LOCATION_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="parent_id" value="Parent Lokasi (Opsional)" />
                            <select
                                id="parent_id"
                                value={data.parent_id}
                                onChange={(e) => setData('parent_id', e.target.value ? Number(e.target.value) : '')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">— Tanpa Parent —</option>
                                {parentOptions.map((p) => (
                                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.parent_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="sort_order" value="Urutan" />
                            <TextInput
                                id="sort_order"
                                type="number"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', Number(e.target.value))}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.sort_order} className="mt-2" />
                        </div>
                    </div>

                    {location.is_default && (
                        <p className="text-sm text-amber-600">Lokasi default hanya bisa diubah urutan dan parent-nya.</p>
                    )}

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>Simpan Perubahan</PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
