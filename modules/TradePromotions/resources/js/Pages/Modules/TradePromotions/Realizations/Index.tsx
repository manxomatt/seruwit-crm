import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';
import PromotionsNav from '../../../../PromotionsNav';

interface Row {
    id: number;
    realized_qty: string | number;
    realized_value: string | number;
    achievement_percent: string | number;
    status: string;
    last_synced_at: string | null;
    program: { id: number; code: string; name: string; type: string } | null;
    partner: { id: number; name: string; code: string } | null;
}

interface Props {
    realizations: { data: Row[] };
    programs: { id: number; code: string; name: string }[];
    filters: { program_id?: number | null };
}

export default function Index({ realizations, programs, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">Promo Realizations</h2>}>
            <Head title="Promo Realizations" />
            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <PromotionsNav />
                    <Select
                        className="max-w-sm"
                        value={filters.program_id ? String(filters.program_id) : ''}
                        onChange={(value) =>
                            router.get(prefixedRoute('promotions.realizations.index'), {
                                program_id: value || undefined,
                            })
                        }
                        placeholder="All programs"
                        options={programs.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` }))}
                    />

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Program</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Distributor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Value</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Achievement</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {realizations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            No realizations yet.
                                        </td>
                                    </tr>
                                ) : (
                                    realizations.data.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-3">
                                                {row.program ? (
                                                    <Link
                                                        href={prefixedRoute('promotions.programs.show', row.program.id)}
                                                        className="font-medium text-indigo-600 hover:underline"
                                                    >
                                                        {row.program.code}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{row.partner?.name}</td>
                                            <td className="px-4 py-3">{row.realized_qty}</td>
                                            <td className="px-4 py-3">Rp {Number(row.realized_value).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-semibold">{row.achievement_percent}%</td>
                                            <td className="px-4 py-3 capitalize">{row.status}</td>
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
