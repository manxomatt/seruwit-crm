import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Asset {
    id: number;
    code: string;
    name: string;
    category: string | null;
    acquisition_date: string;
    acquisition_cost: number;
    accumulated_depreciation: number;
    book_value: number;
    status: string;
    last_depreciated_on: string | null;
    asset_account: { code: string; name: string } | null;
}

interface Props {
    assets: Asset[];
    periods: Array<{ id: number; name: string }>;
    can: { manage: boolean };
}

export default function Index({ assets, periods, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({
        period_id: periods[0] ? String(periods[0].id) : '',
        fixed_asset_id: '',
    });

    const runDepreciation = (e: FormEvent) => {
        e.preventDefault();
        if (!confirm(t('accounting.fa.confirm_depreciate'))) {
            return;
        }
        form.post(prefixedRoute('accounting.fixed-assets.depreciate'));
    };

    return (
        <AccountingShell
            active="fixed_assets"
            title={t('accounting.fa.title')}
            headerActions={
                can.manage ? (
                    <Link href={prefixedRoute('accounting.fixed-assets.create')}>
                        <PrimaryButton type="button">{t('accounting.fa.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            {can.manage && periods.length > 0 && (
                <form onSubmit={runDepreciation} className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <Select
                        className="w-56"
                        value={form.data.period_id}
                        onChange={(value) => form.setData('period_id', value)}
                        options={periods.map((p) => ({ value: String(p.id), label: p.name }))}
                    />
                    <PrimaryButton disabled={form.processing}>{t('accounting.fa.run_depreciation')}</PrimaryButton>
                </form>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.fa.code')}</th>
                            <th className="px-4 py-3">{t('accounting.fa.name')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.fa.cost')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.fa.accum')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.fa.book_value')}</th>
                            <th className="px-4 py-3">{t('accounting.fa.status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map((asset) => (
                            <tr key={asset.id} className="border-b">
                                <td className="px-4 py-3 font-mono text-sm">{asset.code}</td>
                                <td className="px-4 py-3 text-sm">{asset.name}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(asset.acquisition_cost)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(asset.accumulated_depreciation)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(asset.book_value)}</td>
                                <td className="px-4 py-3 text-sm">{asset.status}</td>
                            </tr>
                        ))}
                        {assets.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.fa.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}
