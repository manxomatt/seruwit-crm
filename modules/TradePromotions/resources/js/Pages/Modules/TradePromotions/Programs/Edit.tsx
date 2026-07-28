import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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
    warehouses?: Array<{ id: number; name: string }>;
    canManageGlobal?: boolean;
}

function toLocal(value: string): string {
    if (!value) return '';
    return value.slice(0, 16);
}

export default function Edit({
    program,
    partners,
    products,
    principals,
    warehouses = [],
    canManageGlobal = true,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: program.name,
        description: program.description || '',
        mode: (program as Program & { mode?: string }).mode || 'trade',
        scope: (program as Program & { scope?: string }).scope || 'global',
        channels: (program as Program & { channels?: string[] | null }).channels || ['pos', 'sales'],
        warehouse_ids: ((program as Program & { warehouses?: { id: number }[] }).warehouses || []).map((w) => w.id),
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
                ? program.tiers.map((tier) => ({
                      min_qty: tier.min_qty != null ? String(tier.min_qty) : '',
                      min_value: tier.min_value != null ? String(tier.min_value) : '',
                      discount_percent: tier.discount_percent != null ? String(tier.discount_percent) : '',
                      discount_amount: tier.discount_amount != null ? String(tier.discount_amount) : '',
                      free_product_id: tier.free_product_id ? String(tier.free_product_id) : '',
                      free_qty: tier.free_qty != null ? String(tier.free_qty) : '',
                  }))
                : [{ min_qty: '', min_value: '', discount_percent: '', discount_amount: '', free_product_id: '', free_qty: '' }],
        rebate_percent: program.rebate_rule?.rebate_percent != null ? String(program.rebate_rule.rebate_percent) : '',
        rebate_per_unit: program.rebate_rule?.rebate_per_unit != null ? String(program.rebate_rule.rebate_per_unit) : '',
        calc_basis: program.rebate_rule?.calc_basis || 'qty',
    });

    void warehouses;
    void canManageGlobal;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('promotions.programs.update', program.id));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('promotions.programs.edit.title')}</h2>}>
            <Head title={t('promotions.programs.edit.title')} />

            <PromotionsNav />

            <form onSubmit={submit} className="space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <div>
                            <InputLabel value={t('promotions.fields.name')} />
                            <TextInput className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={t('promotions.fields.starts_at')} />
                                <TextInput type="datetime-local" className="mt-1 block w-full" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel value={t('promotions.fields.ends_at')} />
                                <TextInput type="datetime-local" className="mt-1 block w-full" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <InputLabel value={t('promotions.fields.target_amount')} />
                            <TextInput className="mt-1 block w-full" value={data.target_amount} onChange={(e) => setData('target_amount', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value={t('promotions.fields.principal')} />
                            <Select
                                className="mt-1"
                                value={data.principal_id}
                                onChange={(value) => setData('principal_id', value)}
                                placeholder="—"
                                options={principals.map((p) => ({ value: String(p.id), label: p.name }))}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            {t('promotions.programs.edit.hint', {
                                type: t(`promotions.types.${data.type}`, undefined, data.type),
                                partners: data.partner_ids.length || t('promotions.programs.edit.all'),
                                products: data.product_ids.length || t('promotions.programs.edit.all'),
                            })}
                        </p>
                        <div className="flex gap-3">
                            <PrimaryButton disabled={processing}>{t('promotions.programs.edit.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('promotions.programs.show', program.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
        </DynamicLayout>
    );
}
