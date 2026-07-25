import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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

interface Props {
    warehouse: { id: number; name: string };
    parentOptions: ParentOption[];
}

const LOCATION_TYPE_VALUES = [
    'internal',
    'input',
    'output',
    'quality_control',
    'transit',
    'production',
    'scrap',
    'view',
] as const;

export default function Create({ warehouse, parentOptions }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        type: 'internal',
        parent_id: '' as string | number,
        sort_order: 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('inventory.warehouses.locations.store', warehouse.id));
    };

    const title = t('inventory.locations.create_title', { name: warehouse.name });

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {title}
                    </h2>
                    <Link href={prefixedRoute('inventory.warehouses.show', warehouse.id)}>
                        <SecondaryButton>{t('inventory.locations.back')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={title} />
            <InventoryNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value={t('inventory.locations.name')} />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="code" value={t('inventory.locations.code')} />
                            <TextInput
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                className="mt-1 block w-full"
                                placeholder={t('inventory.locations.code_placeholder')}
                            />
                            <InputError message={errors.code} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value={t('inventory.locations.type')} />
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {LOCATION_TYPE_VALUES.map((value) => (
                                    <option key={value} value={value}>{t(`inventory.location_types.${value}`)}</option>
                                ))}
                            </select>
                            <InputError message={errors.type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="parent_id" value={t('inventory.locations.parent')} />
                            <select
                                id="parent_id"
                                value={data.parent_id}
                                onChange={(e) => setData('parent_id', e.target.value ? Number(e.target.value) : '')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">{t('inventory.locations.no_parent')}</option>
                                {parentOptions.map((p) => (
                                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.parent_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="sort_order" value={t('inventory.locations.sort')} />
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

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>{t('inventory.locations.save')}</PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
