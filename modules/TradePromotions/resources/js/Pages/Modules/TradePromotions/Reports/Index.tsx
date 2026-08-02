import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PromotionsNav from '../../../../PromotionsNav';
import { formatMoney } from '@/utils/money';
import PageHeader from '@/Components/PageHeader';

interface Summary {
    checkout_by_channel: Array<{ channel: string; applications: number; discount_total: number }>;
    checkout_by_site: Array<{ warehouse_id: number | null; warehouse_name: string; applications: number; discount_total: number }>;
    trade_awards: { accrued: number; settled: number; accrued_count: number; settled_count: number };
    settlements_by_type: Array<{ settlement_type: string; count: number; amount: number }>;
}

interface Props {
    summary: Summary;
    filters: {
        from?: string | null;
        to?: string | null;
        warehouse_id?: number | null;
        program_id?: number | null;
    };
    programs: Array<{ id: number; code: string; name: string }>;
    warehouses: Array<{ id: number; name: string }>;
}

export default function Index({ summary, filters, programs, warehouses }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [local, setLocal] = useState({
        from: filters.from ?? '',
        to: filters.to ?? '',
        warehouse_id: filters.warehouse_id ? String(filters.warehouse_id) : '',
        program_id: filters.program_id ? String(filters.program_id) : '',
    });

    const apply: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('promotions.reports.index'), {
            from: local.from || undefined,
            to: local.to || undefined,
            warehouse_id: local.warehouse_id || undefined,
            program_id: local.program_id || undefined,
        }, { preserveState: true });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('promotions.reports.title')} />}>
            <Head title={t('promotions.reports.title')} />
            <PromotionsNav />

            <form onSubmit={apply} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-5">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">{t('promotions.reports.from')}</label>
                    <TextInput type="date" className="w-full" value={local.from} onChange={(e) => setLocal({ ...local, from: e.target.value })} />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">{t('promotions.reports.to')}</label>
                    <TextInput type="date" className="w-full" value={local.to} onChange={(e) => setLocal({ ...local, to: e.target.value })} />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">{t('promotions.reports.program')}</label>
                    <Select
                        className="mt-0"
                        value={local.program_id}
                        onChange={(value) => setLocal({ ...local, program_id: value })}
                        placeholder={t('promotions.reports.all_programs')}
                        options={programs.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` }))}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">{t('promotions.reports.site')}</label>
                    <Select
                        className="mt-0"
                        value={local.warehouse_id}
                        onChange={(value) => setLocal({ ...local, warehouse_id: value })}
                        placeholder={t('promotions.reports.all_sites')}
                        options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                    />
                </div>
                <div className="flex items-end">
                    <button type="submit" className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        {t('promotions.reports.apply')}
                    </button>
                </div>
            </form>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase text-gray-500">{t('promotions.reports.accrued')}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{formatMoney(summary.trade_awards.accrued)}</p>
                    <p className="mt-1 text-xs text-gray-500">{summary.trade_awards.accrued_count} awards</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase text-gray-500">{t('promotions.reports.settled')}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">{formatMoney(summary.trade_awards.settled)}</p>
                    <p className="mt-1 text-xs text-gray-500">{summary.trade_awards.settled_count} awards</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:col-span-2">
                    <p className="mb-2 text-xs font-medium uppercase text-gray-500">{t('promotions.reports.settlement_mix')}</p>
                    {summary.settlements_by_type.length === 0 ? (
                        <p className="text-sm text-gray-400">{t('promotions.reports.empty')}</p>
                    ) : (
                        <ul className="space-y-1 text-sm">
                            {summary.settlements_by_type.map((row) => (
                                <li key={row.settlement_type} className="flex justify-between">
                                    <span>{t(`promotions.settlement_types.${row.settlement_type}`, undefined, row.settlement_type)}</span>
                                    <span className="tabular-nums">{row.count} · {formatMoney(row.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
                        {t('promotions.reports.by_channel')}
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('promotions.reports.channel')}</th>
                                <th className="px-4 py-2 text-right text-xs uppercase text-gray-500">{t('promotions.reports.apps')}</th>
                                <th className="px-4 py-2 text-right text-xs uppercase text-gray-500">{t('promotions.reports.discount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary.checkout_by_channel.length === 0 ? (
                                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">{t('promotions.reports.empty')}</td></tr>
                            ) : (
                                summary.checkout_by_channel.map((row) => (
                                    <tr key={row.channel}>
                                        <td className="px-4 py-2">{t(`promotions.channels.${row.channel}`, undefined, row.channel)}</td>
                                        <td className="px-4 py-2 text-right tabular-nums">{row.applications}</td>
                                        <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.discount_total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
                        {t('promotions.reports.by_site')}
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('promotions.reports.site')}</th>
                                <th className="px-4 py-2 text-right text-xs uppercase text-gray-500">{t('promotions.reports.apps')}</th>
                                <th className="px-4 py-2 text-right text-xs uppercase text-gray-500">{t('promotions.reports.discount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary.checkout_by_site.length === 0 ? (
                                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">{t('promotions.reports.empty')}</td></tr>
                            ) : (
                                summary.checkout_by_site.map((row) => (
                                    <tr key={row.warehouse_id ?? 'none'}>
                                        <td className="px-4 py-2">{row.warehouse_name}</td>
                                        <td className="px-4 py-2 text-right tabular-nums">{row.applications}</td>
                                        <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.discount_total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DynamicLayout>
    );
}
