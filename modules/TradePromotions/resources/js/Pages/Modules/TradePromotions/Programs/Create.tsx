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
import PromotionsNav from '../../../../PromotionsNav';

interface Option {
    id: number;
    code: string;
    name: string;
    sku?: string | null;
    price?: string | number | null;
}

interface Props {
    partners: Option[];
    products: Option[];
    principals: Option[];
}

type Tier = {
    min_qty: string;
    min_value: string;
    discount_percent: string;
    discount_amount: string;
    free_product_id: string;
    free_qty: string;
};

export default function Create({ partners, products, principals }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        type: 'volume_discount',
        starts_at: '',
        ends_at: '',
        principal_id: '',
        target_metric: 'volume',
        target_amount: '',
        notes: '',
        partner_ids: [] as number[],
        product_ids: [] as number[],
        tiers: [{ min_qty: '100', min_value: '', discount_percent: '5', discount_amount: '', free_product_id: '', free_qty: '' }] as Tier[],
        rebate_percent: '',
        rebate_per_unit: '',
        calc_basis: 'qty',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('promotions.programs.store'));
    };

    const toggleId = (field: 'partner_ids' | 'product_ids', id: number): void => {
        const list = data[field];
        setData(field, list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    };

    const updateTier = (index: number, key: keyof Tier, value: string): void => {
        const next = data.tiers.map((tier, i) => (i === index ? { ...tier, [key]: value } : tier));
        setData('tiers', next);
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">New Promo Program</h2>}>
            <Head title="New Promo Program" />
            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <PromotionsNav />
                    <form onSubmit={submit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel value="Name" />
                                <TextInput className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Type" />
                                <Select
                                    className="mt-1"
                                    value={data.type}
                                    onChange={(value) => setData('type', value)}
                                    options={[
                                        { value: 'volume_discount', label: 'Volume discount' },
                                        { value: 'free_goods', label: 'Free goods' },
                                        { value: 'rebate', label: 'Rebate / rabat' },
                                    ]}
                                />
                            </div>
                            <div>
                                <InputLabel value="Principal (optional)" />
                                <Select
                                    className="mt-1"
                                    value={data.principal_id}
                                    onChange={(value) => setData('principal_id', value)}
                                    placeholder="—"
                                    options={principals.map((p) => ({ value: String(p.id), label: p.name }))}
                                />
                            </div>
                            <div>
                                <InputLabel value="Starts at" />
                                <TextInput type="datetime-local" className="mt-1 block w-full" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} required />
                                <InputError message={errors.starts_at} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Ends at" />
                                <TextInput type="datetime-local" className="mt-1 block w-full" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} required />
                                <InputError message={errors.ends_at} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Target metric" />
                                <Select
                                    className="mt-1"
                                    value={data.target_metric}
                                    onChange={(value) => setData('target_metric', value)}
                                    options={[
                                        { value: 'volume', label: 'Volume (qty)' },
                                        { value: 'value', label: 'Value (Rp)' },
                                    ]}
                                />
                            </div>
                            <div>
                                <InputLabel value="Target amount" />
                                <TextInput type="number" className="mt-1 block w-full" value={data.target_amount} onChange={(e) => setData('target_amount', e.target.value)} />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel value="Description" />
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-medium">Eligible distributors (empty = all customers)</h3>
                            <div className="max-h-40 overflow-y-auto rounded border border-gray-200">
                                {partners.map((p) => (
                                    <label key={p.id} className="flex items-center gap-2 border-b border-gray-50 px-3 py-2 text-sm">
                                        <input type="checkbox" checked={data.partner_ids.includes(p.id)} onChange={() => toggleId('partner_ids', p.id)} />
                                        {p.name} <span className="text-xs text-gray-400">({p.code})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-medium">Eligible products (empty = all)</h3>
                            <div className="max-h-40 overflow-y-auto rounded border border-gray-200">
                                {products.map((p) => (
                                    <label key={p.id} className="flex items-center gap-2 border-b border-gray-50 px-3 py-2 text-sm">
                                        <input type="checkbox" checked={data.product_ids.includes(p.id)} onChange={() => toggleId('product_ids', p.id)} />
                                        {p.name} <span className="text-xs text-gray-400">({p.sku || p.code})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {data.type !== 'rebate' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Tiers</h3>
                                    <SecondaryButton
                                        type="button"
                                        onClick={() =>
                                            setData('tiers', [
                                                ...data.tiers,
                                                { min_qty: '', min_value: '', discount_percent: '', discount_amount: '', free_product_id: '', free_qty: '' },
                                            ])
                                        }
                                    >
                                        Add tier
                                    </SecondaryButton>
                                </div>
                                {data.tiers.map((tier, index) => (
                                    <div key={index} className="grid grid-cols-2 gap-3 rounded border border-gray-100 p-3 sm:grid-cols-3">
                                        <div>
                                            <InputLabel value="Min qty" />
                                            <TextInput className="mt-1 block w-full" value={tier.min_qty} onChange={(e) => updateTier(index, 'min_qty', e.target.value)} />
                                        </div>
                                        {data.type === 'volume_discount' ? (
                                            <div>
                                                <InputLabel value="Discount %" />
                                                <TextInput className="mt-1 block w-full" value={tier.discount_percent} onChange={(e) => updateTier(index, 'discount_percent', e.target.value)} />
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <InputLabel value="Free product" />
                                                    <Select
                                                        className="mt-1"
                                                        value={tier.free_product_id}
                                                        onChange={(value) => updateTier(index, 'free_product_id', value)}
                                                        placeholder="—"
                                                        options={products.map((p) => ({ value: String(p.id), label: p.name }))}
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel value="Free qty" />
                                                    <TextInput className="mt-1 block w-full" value={tier.free_qty} onChange={(e) => updateTier(index, 'free_qty', e.target.value)} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.type === 'rebate' && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <InputLabel value="Rebate %" />
                                    <TextInput className="mt-1 block w-full" value={data.rebate_percent} onChange={(e) => setData('rebate_percent', e.target.value)} />
                                </div>
                                <div>
                                    <InputLabel value="Rebate per unit" />
                                    <TextInput className="mt-1 block w-full" value={data.rebate_per_unit} onChange={(e) => setData('rebate_per_unit', e.target.value)} />
                                </div>
                                <div>
                                    <InputLabel value="Calc basis" />
                                    <Select
                                        className="mt-1"
                                        value={data.calc_basis}
                                        onChange={(value) => setData('calc_basis', value)}
                                        options={[
                                            { value: 'qty', label: 'Per unit qty' },
                                            { value: 'net_value', label: '% of value' },
                                        ]}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <PrimaryButton disabled={processing}>Create program</PrimaryButton>
                            <Link href={prefixedRoute('promotions.programs.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
