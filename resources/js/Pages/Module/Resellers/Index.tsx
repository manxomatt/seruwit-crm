import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface ResellerRow {
    global_id: string;
    name: string;
    email: string;
    referral_code: string | null;
    status: string;
    tenants: number;
    pending: number;
    approved: number;
    paid: number;
}

interface Props {
    resellers: ResellerRow[];
    filters: { search: string | null };
}

const STATUS_CLASSES: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    suspended: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    terminated: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export default function Index({ resellers, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch: FormEventHandler = (event) => {
        event.preventDefault();
        router.get(route('module.resellers.index'), { search: search || undefined }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('reseller.admin_title')} />}>
            <Head title={t('reseller.admin_title')} />

            <div className="space-y-6">
                <form onSubmit={handleSearch}>
                    <TextInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('reseller.admin.search_placeholder')}
                        className="!rounded-xl w-full max-w-md text-sm"
                    />
                </form>

                {resellers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {t('reseller.admin.empty')}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.reseller')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.referral.code')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.status')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.admin.tenants')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.admin.outstanding')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.stats.paid')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {resellers.map((reseller) => (
                                    <tr key={reseller.global_id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900 dark:text-white">{reseller.name}</div>
                                            <div className="text-xs text-slate-400">{reseller.email}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                            {reseller.referral_code ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                                    STATUS_CLASSES[reseller.status] ?? STATUS_CLASSES.active
                                                }`}
                                            >
                                                {t(`reseller.status.${reseller.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{reseller.tenants}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                                            {formatMoney(reseller.pending + reseller.approved)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                                            {formatMoney(reseller.paid)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={route('module.resellers.show', reseller.global_id)}
                                                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                {t('reseller.admin.detail')} →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
