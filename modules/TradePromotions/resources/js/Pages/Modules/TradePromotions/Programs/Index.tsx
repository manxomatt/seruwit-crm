import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';
import PromotionsNav from '../../../../PromotionsNav';

interface ProgramRow {
    id: number;
    code: string;
    name: string;
    type: string;
    status: string;
    starts_at: string;
    ends_at: string;
    target_metric: string;
    target_amount: string | number | null;
    partners_count: number;
    realizations_count: number;
    principal: { id: number; name: string } | null;
}

interface Props {
    programs: { data: ProgramRow[] };
    filters: { status?: string | null; type?: string | null };
    can: { create: boolean };
}

export default function Index({ programs, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Trade Promotions</h2>
                    {can.create && (
                        <Link href={prefixedRoute('promotions.programs.create')}>
                            <PrimaryButton>New Program</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Trade Promotions" />
            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <PromotionsNav />
                    <p className="text-sm text-gray-600">
                        Program promo distributor: diskon volume, free goods, rabat — periode aktif & realisasi vs target.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {['', 'draft', 'active', 'paused', 'closed'].map((status) => (
                            <button
                                key={status || 'all'}
                                type="button"
                                onClick={() =>
                                    router.get(prefixedRoute('promotions.programs.index'), {
                                        status: status || undefined,
                                        type: filters.type || undefined,
                                    })
                                }
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    (filters.status || '') === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {status || 'all'}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Target</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {programs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            Belum ada program promo.
                                        </td>
                                    </tr>
                                ) : (
                                    programs.data.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('promotions.programs.show', row.id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {row.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>{row.name}</div>
                                                {row.principal && <div className="text-xs text-gray-500">{row.principal.name}</div>}
                                            </td>
                                            <td className="px-4 py-3 capitalize">{row.type.replaceAll('_', ' ')}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {row.starts_at?.slice(0, 10)} → {row.ends_at?.slice(0, 10)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.target_amount ?? '—'} {row.target_metric}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">{row.status}</span>
                                                <span className="ml-2 text-xs text-gray-400">{row.realizations_count} real.</span>
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
