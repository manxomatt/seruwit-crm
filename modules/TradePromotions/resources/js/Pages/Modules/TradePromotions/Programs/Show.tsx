import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{program.code}</h2>
                        <p className="text-sm text-gray-500">{program.name} · {program.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can.update && program.status === 'draft' && (
                            <PrimaryButton onClick={() => router.post(prefixedRoute('promotions.programs.activate', program.id))}>
                                Activate
                            </PrimaryButton>
                        )}
                        {can.update && (
                            <PrimaryButton onClick={() => router.post(prefixedRoute('promotions.programs.sync', program.id))}>
                                Sync realization
                            </PrimaryButton>
                        )}
                        {can.update && program.status !== 'closed' && (
                            <Link href={prefixedRoute('promotions.programs.edit', program.id)}>
                                <SecondaryButton type="button">Edit</SecondaryButton>
                            </Link>
                        )}
                        {can.update && program.status === 'active' && (
                            <SecondaryButton onClick={() => router.post(prefixedRoute('promotions.programs.close', program.id))}>
                                Close
                            </SecondaryButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={program.code} />
            <div className="py-6">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <PromotionsNav />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm">
                            <div className="text-xs text-gray-500">Type</div>
                            <div className="font-semibold capitalize">{program.type.replaceAll('_', ' ')}</div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm">
                            <div className="text-xs text-gray-500">Period</div>
                            <div className="text-xs font-medium">
                                {program.starts_at?.slice(0, 10)} → {program.ends_at?.slice(0, 10)}
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm">
                            <div className="text-xs text-gray-500">Target</div>
                            <div className="font-semibold">
                                {program.target_amount ?? '—'} {program.target_metric}
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm">
                            <div className="text-xs text-gray-500">Principal</div>
                            <div className="font-semibold">{program.principal?.name ?? '—'}</div>
                        </div>
                    </div>

                    {program.description && <p className="text-sm text-gray-600">{program.description}</p>}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-2 font-medium">Distributors</h3>
                            <ul className="space-y-1 text-sm text-gray-700">
                                {program.partners.length === 0 ? (
                                    <li className="text-gray-500">All customers</li>
                                ) : (
                                    program.partners.map((p) => <li key={p.id}>{p.name}</li>)
                                )}
                            </ul>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-2 font-medium">Products</h3>
                            <ul className="space-y-1 text-sm text-gray-700">
                                {program.products.length === 0 ? (
                                    <li className="text-gray-500">All products</li>
                                ) : (
                                    program.products.map((p) => <li key={p.id}>{p.name}</li>)
                                )}
                            </ul>
                        </div>
                    </div>

                    {program.tiers.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-2 font-medium">Tiers</h3>
                            <ul className="space-y-2 text-sm">
                                {program.tiers.map((tier) => (
                                    <li key={tier.id} className="flex justify-between border-b border-gray-50 pb-2">
                                        <span>Min qty {tier.min_qty ?? '—'}</span>
                                        <span>
                                            {tier.discount_percent != null && `${tier.discount_percent}% off`}
                                            {tier.free_qty != null && ` free ${tier.free_qty} ${tier.free_product?.name ?? ''}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {program.rebate_rule && (
                        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
                            <h3 className="mb-2 font-medium">Rebate rule</h3>
                            <p>
                                {program.rebate_rule.rebate_percent != null && `${program.rebate_rule.rebate_percent}% `}
                                {program.rebate_rule.rebate_per_unit != null && `Rp ${program.rebate_rule.rebate_per_unit}/unit `}
                                · basis {program.rebate_rule.calc_basis}
                            </p>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <div className="border-b px-4 py-3 font-medium">Realization vs target</div>
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Distributor</th>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Qty</th>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Value</th>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Achievement</th>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Awards</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {program.realizations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            Belum ada realisasi. Klik Sync setelah ada DO dalam periode.
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
                                                            {a.free_qty != null ? ` ×${a.free_qty}` : ''} · {a.status}
                                                        </span>
                                                        {can.settle && a.status === 'accrued' && (
                                                            <button
                                                                type="button"
                                                                className="text-indigo-600 hover:underline"
                                                                onClick={() => router.post(prefixedRoute('promotions.awards.settle', a.id))}
                                                            >
                                                                Settle
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
                </div>
            </div>
        </DynamicLayout>
    );
}
