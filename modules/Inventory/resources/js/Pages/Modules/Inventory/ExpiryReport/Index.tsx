import ModuleLayout from '@/Layouts/ModuleLayout';
import InventoryNav from '../../../../InventoryNav';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Level {
    id: number;
    product: { id: number; name: string; code: string | null };
    warehouse: { id: number; name: string };
    location: { id: number; name: string; code: string } | null;
    batch_number: string | null;
    expiry_date: string | null;
    on_hand: string;
    available: number;
    status: 'expired' | 'near_expiry';
    days_left: number | null;
}

interface Props {
    levels: Level[];
    warehouses: Array<{ id: number; name: string }>;
    filters: { warehouse_id: number | null; days: number };
}

export default function ExpiryReportIndex({ levels, warehouses, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const form = useForm({
        warehouse_id: filters.warehouse_id ? String(filters.warehouse_id) : '',
        days: String(filters.days),
    });

    const apply: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('inventory.expiry-report.index'),
            {
                warehouse_id: form.data.warehouse_id || undefined,
                days: form.data.days,
            },
            { preserveState: true },
        );
    };

    return (
        <ModuleLayout title={t('inventory.expiry_report.title')}>
            <InventoryNav />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('inventory.expiry_report.title')}</h1>
                    <p className="mt-1 text-sm text-gray-600">{t('inventory.expiry_report.hint')}</p>
                </div>

                <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
                    <div className="w-full max-w-xs">
                        <InputLabel htmlFor="warehouse_id" value={t('inventory.opnames.warehouse')} />
                        <Select
                            id="warehouse_id"
                            className="mt-1 w-full"
                            value={form.data.warehouse_id}
                            onChange={(value) => form.setData('warehouse_id', value)}
                            placeholder={t('inventory.putaway.filter_warehouse')}
                            options={[
                                { value: '', label: t('inventory.putaway.filter_warehouse') },
                                ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
                            ]}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="days" value={t('inventory.expiry_report.days')} />
                        <TextInput
                            id="days"
                            type="number"
                            min={1}
                            max={365}
                            value={form.data.days}
                            onChange={(e) => form.setData('days', e.target.value)}
                            className="mt-1 w-24"
                        />
                    </div>
                    <PrimaryButton type="submit">{t('common.filter', undefined, 'Filter')}</PrimaryButton>
                </form>

                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full">
                        <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
                            <tr>
                                <th className="px-4 py-3">{t('inventory.opnames.product')}</th>
                                <th className="px-4 py-3">{t('inventory.opnames.warehouse')}</th>
                                <th className="px-4 py-3">{t('inventory.opnames.location')}</th>
                                <th className="px-4 py-3">{t('inventory.opnames.batch')}</th>
                                <th className="px-4 py-3">{t('inventory.opnames.expiry')}</th>
                                <th className="px-4 py-3 text-right">{t('inventory.putaway.available')}</th>
                                <th className="px-4 py-3">{t('inventory.opnames.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {levels.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                                        {t('inventory.expiry_report.empty')}
                                    </td>
                                </tr>
                            )}
                            {levels.map((level) => (
                                <tr key={level.id} className="border-b">
                                    <td className="px-4 py-3 font-medium">{level.product?.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{level.warehouse?.name}</td>
                                    <td className="px-4 py-3 text-sm">{level.location?.code ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm tabular-nums">{level.batch_number ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {level.expiry_date
                                            ? new Date(level.expiry_date).toLocaleDateString(localeTag)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">{level.available}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                                                level.status === 'expired'
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'bg-amber-50 text-amber-800'
                                            }`}
                                        >
                                            {level.status === 'expired'
                                                ? t('inventory.expiry_report.status_expired')
                                                : t('inventory.expiry_report.status_near')}
                                            {level.days_left !== null ? ` (${level.days_left}d)` : ''}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModuleLayout>
    );
}
