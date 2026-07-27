import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatDateDmY } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import PromotionsNav from '../../../../PromotionsNav';

interface Award {
    id: number;
    award_type: string;
    amount: string | number | null;
    free_qty: string | number | null;
    status: string;
}

interface Realization {
    id: number;
    realized_qty: string | number;
    realized_value: string | number;
    achievement_percent: string | number;
    status: string;
    partner: { id: number; code: string; name: string } | null;
    awards: Award[];
}

interface Program {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: string;
    status: string;
    starts_at: string;
    ends_at: string;
    target_metric: string;
    target_amount: string | number | null;
    principal: { name: string } | null;
    partners: { id: number; name: string; code: string }[];
    products: { id: number; name: string; code: string }[];
    tiers: {
        id: number;
        sort_order: number;
        min_qty: string | number | null;
        discount_percent: string | number | null;
        free_qty: string | number | null;
        free_product: { name: string } | null;
    }[];
    rebate_rule: {
        rebate_percent: string | number | null;
        rebate_per_unit: string | number | null;
        calc_basis: string;
    } | null;
    realizations: Realization[];
}

interface Props {
    program: Program;
    can: { update: boolean; delete: boolean; settle: boolean };
}

export default function Show({ program, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{program.code}</h2>
                        <p className="text-sm text-gray-500">
                            {program.name} · {t(`promotions.status.${program.status}`, undefined, program.status)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can.update && program.status === 'draft' && (
                            <PrimaryButton onClick={() => router.post(prefixedRoute('promotions.programs.activate', program.id))}>
                                {t('promotions.programs.show.activate')}
                            </PrimaryButton>
                        )}
                        {can.update && (
                            <PrimaryButton onClick={() => router.post(prefixedRoute('promotions.programs.sync', program.id))}>
                                {t('promotions.programs.show.sync')}
                            </PrimaryButton>
                        )}
                        {can.update && program.status !== 'closed' && (
                            <Link href={prefixedRoute('promotions.programs.edit', program.id)}>
                                <SecondaryButton type="button">{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        {can.update && program.status === 'active' && (
                            <SecondaryButton onClick={() => router.post(prefixedRoute('promotions.programs.close', program.id))}>
                                {t('promotions.programs.show.close')}
                            </SecondaryButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={program.code} />

            <PromotionsNav />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                    <div className="text-xs text-gray-500">{t('promotions.fields.type')}</div>
                    <div className="font-semibold">{t(`promotions.types.${program.type}`, undefined, program.type)}</div>
                </div>
                <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                    <div className="text-xs text-gray-500">{t('promotions.fields.period')}</div>
                    <div className="text-xs font-medium">
                        {formatDateDmY(program.starts_at)} → {formatDateDmY(program.ends_at)}
                    </div>
                </div>
                <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                    <div className="text-xs text-gray-500">{t('promotions.fields.target')}</div>
                    <div className="font-semibold">
                        {program.target_amount ?? '—'} {t(`promotions.metrics.${program.target_metric}`, undefined, program.target_metric)}
                    </div>
                </div>
                <div className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                    <div className="text-xs text-gray-500">{t('promotions.fields.principal')}</div>
                    <div className="font-semibold">{program.principal?.name ?? '—'}</div>
                </div>
            </div>

            {program.description && <p className="mb-6 text-sm text-gray-600">{program.description}</p>}

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-2 font-medium">{t('promotions.programs.show.distributors')}</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                        {program.partners.length === 0 ? (
                            <li className="text-gray-500">{t('promotions.programs.show.all_customers')}</li>
                        ) : (
                            program.partners.map((p) => <li key={p.id}>{p.name}</li>)
                        )}
                    </ul>
                </div>
                <div className="bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-2 font-medium">{t('promotions.programs.show.products')}</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                        {program.products.length === 0 ? (
                            <li className="text-gray-500">{t('promotions.programs.show.all_products')}</li>
                        ) : (
                            program.products.map((p) => <li key={p.id}>{p.name}</li>)
                        )}
                    </ul>
                </div>
            </div>

            {program.tiers.length > 0 && (
                <div className="mb-6 bg-white p-4 shadow-sm sm:rounded-lg">
                    <h3 className="mb-2 font-medium">{t('promotions.programs.show.tiers')}</h3>
                    <ul className="space-y-2 text-sm">
                        {program.tiers.map((tier) => (
                            <li key={tier.id} className="flex justify-between border-b border-gray-50 pb-2">
                                <span>{t('promotions.programs.show.min_qty', { qty: tier.min_qty ?? '—' })}</span>
                                <span>
                                    {tier.discount_percent != null &&
                                        t('promotions.programs.show.discount_off', { percent: tier.discount_percent })}
                                    {tier.free_qty != null &&
                                        t('promotions.programs.show.free_goods', {
                                            qty: tier.free_qty,
                                            product: tier.free_product?.name ?? '',
                                        })}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {program.rebate_rule && (
                <div className="mb-6 bg-white p-4 text-sm shadow-sm sm:rounded-lg">
                    <h3 className="mb-2 font-medium">{t('promotions.programs.show.rebate_rule')}</h3>
                    <p>
                        {program.rebate_rule.rebate_percent != null && `${program.rebate_rule.rebate_percent}% `}
                        {program.rebate_rule.rebate_per_unit != null && `Rp ${program.rebate_rule.rebate_per_unit}/unit `}
                        {t('promotions.programs.show.rebate_basis', {
                            basis: t(
                                `promotions.calc_basis.${program.rebate_rule.calc_basis}`,
                                undefined,
                                program.rebate_rule.calc_basis,
                            ),
                        })}
                    </p>
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-200 px-4 py-3 font-medium">{t('promotions.programs.show.realization_title')}</div>
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('promotions.fields.distributor')}</th>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('promotions.fields.qty')}</th>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('promotions.fields.value')}</th>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('promotions.fields.achievement')}</th>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('promotions.fields.awards')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {program.realizations.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    {t('promotions.programs.show.empty_realization')}
                                </td>
                            </tr>
                        ) : (
                            program.realizations.map((row) => (
                                <tr key={row.id}>
                                    <td className="px-4 py-3">{row.partner?.name}</td>
                                    <td className="px-4 py-3">{row.realized_qty}</td>
                                    <td className="px-4 py-3">Rp {Number(row.realized_value).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{row.achievement_percent}%</div>
                                        <div className="h-1.5 w-24 overflow-hidden rounded bg-gray-100">
                                            <div
                                                className="h-full bg-indigo-500"
                                                style={{ width: `${Math.min(100, Number(row.achievement_percent))}%` }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {row.awards.map((a) => (
                                            <div key={a.id} className="flex items-center justify-between gap-2">
                                                <span>
                                                    {a.award_type}
                                                    {a.amount != null ? ` Rp ${Number(a.amount).toLocaleString()}` : ''}
                                                    {a.free_qty != null ? ` ×${a.free_qty}` : ''} ·{' '}
                                                    {t(`promotions.status.${a.status}`, undefined, a.status)}
                                                </span>
                                                {can.settle && a.status === 'accrued' && (
                                                    <button
                                                        type="button"
                                                        className="text-indigo-600 hover:underline"
                                                        onClick={() => router.post(prefixedRoute('promotions.awards.settle', a.id))}
                                                    >
                                                        {t('promotions.programs.show.settle')}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}
