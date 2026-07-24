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
}

interface Program {
    id: number;
    name: string;
    description: string | null;
    type: string;
    starts_at: string;
    ends_at: string;
    principal_id: number | null;
    target_metric: string;
    target_amount: string | number | null;
    notes: string | null;
    partners: { id: number }[];
    products: { id: number }[];
    tiers: {
        min_qty: string | number | null;
        min_value: string | number | null;
        discount_percent: string | number | null;
        discount_amount: string | number | null;
        free_product_id: number | null;
        free_qty: string | number | null;
    }[];
    rebate_rule: {
        rebate_percent: string | number | null;
        rebate_per_unit: string | number | null;
        calc_basis: string;
    } | null;
}

interface Props {
    program: Program;
    partners: Option[];
    products: Option[];
    principals: Option[];
}

function toLocal(value: string): string {
    if (!value) return '';
    return value.slice(0, 16);
}

export default function Edit({ program, partners, products, principals }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors } = useForm({
        name: program.name,
        description: program.description || '',
        type: program.type,
        starts_at: toLocal(program.starts_at),
        ends_at: toLocal(program.ends_at),
        principal_id: program.principal_id ? String(program.principal_id) : '',
        target_metric: program.target_metric,
        target_amount: program.target_amount != null ? String(program.target_amount) : '',
        notes: program.notes || '',
        partner_ids: program.partners.map((p) => p.id),
        product_ids: program.products.map((p) => p.id),
        tiers:
            program.tiers.length > 0
                ? program.tiers.map((t) => ({
                      min_qty: t.min_qty != null ? String(t.min_qty) : '',
                      min_value: t.min_value != null ? String(t.min_value) : '',
                      discount_percent: t.discount_percent != null ? String(t.discount_percent) : '',
                      discount_amount: t.discount_amount != null ? String(t.discount_amount) : '',
                      free_product_id: t.free_product_id ? String(t.free_product_id) : '',
                      free_qty: t.free_qty != null ? String(t.free_qty) : '',
                  }))
                : [{ min_qty: '', min_value: '', discount_percent: '', discount_amount: '', free_product_id: '', free_qty: '' }],
        rebate_percent: program.rebate_rule?.rebate_percent != null ? String(program.rebate_rule.rebate_percent) : '',
        rebate_per_unit: program.rebate_rule?.rebate_per_unit != null ? String(program.rebate_rule.rebate_per_unit) : '',
        calc_basis: program.rebate_rule?.calc_basis || 'qty',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('promotions.programs.update', program.id));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">Edit Program</h2>}>
            <Head title="Edit Program" />
            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <PromotionsNav />
                    <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
                        <div>
                            <InputLabel value="Name" />
                            <TextInput className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Starts at" />
                                <TextInput type="datetime-local" className="mt-1 block w-full" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel value="Ends at" />
                                <TextInput type="datetime-local" className="mt-1 block w-full" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <InputLabel value="Target amount" />
                            <TextInput className="mt-1 block w-full" value={data.target_amount} onChange={(e) => setData('target_amount', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value="Principal" />
                            <Select
                                className="mt-1"
                                value={data.principal_id}
                                onChange={(value) => setData('principal_id', value)}
                                placeholder="—"
                                options={principals.map((p) => ({ value: String(p.id), label: p.name }))}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Type: {data.type}. Distributors selected: {data.partner_ids.length || 'all'}. Products: {data.product_ids.length || 'all'}.
                            Use Create for full tier editing on new programs; here you can adjust period and target.
                        </p>
                        <div className="flex gap-3">
                            <PrimaryButton disabled={processing}>Save</PrimaryButton>
                            <Link href={prefixedRoute('promotions.programs.show', program.id)}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
