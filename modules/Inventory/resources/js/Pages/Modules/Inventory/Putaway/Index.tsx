import ModuleLayout from '@/Layouts/ModuleLayout';
import InventoryNav from '../../../../InventoryNav';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Level {
    id: number;
    product_id: number;
    warehouse_id: number;
    location_id: number;
    batch_number: string | null;
    expiry_date: string | null;
    available: number;
    product: { id: number; name: string; code: string | null };
    location: { id: number; name: string; code: string };
    warehouse: { id: number; name: string };
}

interface Warehouse {
    id: number;
    name: string;
}

interface Props {
    levels: Level[];
    warehouses: Warehouse[];
    filters: { warehouse_id: number | null };
}

export default function PutawayIndex({ levels, warehouses, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [busyId, setBusyId] = useState<number | null>(null);

    const filterForm = useForm({
        warehouse_id: filters.warehouse_id ? String(filters.warehouse_id) : '',
    });

    const applyFilter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('inventory.putaway.index'),
            { warehouse_id: filterForm.data.warehouse_id || undefined },
            { preserveState: true },
        );
    };

    const putaway = (level: Level) => {
        const qty = window.prompt(t('inventory.putaway.quantity'), String(level.available));
        if (qty === null) {
            return;
        }

        setBusyId(level.id);
        router.post(
            prefixedRoute('inventory.putaway.store'),
            {
                product_id: level.product_id,
                warehouse_id: level.warehouse_id,
                from_location_id: level.location_id,
                quantity: qty,
                batch_number: level.batch_number,
                expiry_date: level.expiry_date,
            },
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    };

    return (
        <ModuleLayout title={t('inventory.putaway.title')}>
            <InventoryNav />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('inventory.putaway.title')}</h1>
                    <p className="mt-1 text-sm text-gray-600">{t('inventory.putaway.hint')}</p>
                </div>

                <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-3">
                    <div className="w-full max-w-xs">
                        <InputLabel htmlFor="warehouse_id" value={t('inventory.opnames.warehouse')} />
                        <Select
                            id="warehouse_id"
                            className="mt-1 w-full"
                            value={filterForm.data.warehouse_id}
                            onChange={(value) => filterForm.setData('warehouse_id', value)}
                            placeholder={t('inventory.putaway.filter_warehouse')}
                            options={[
                                { value: '', label: t('inventory.putaway.filter_warehouse') },
                                ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
                            ]}
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
                                <th className="px-4 py-3">{t('inventory.putaway.from')}</th>
                                <th className="px-4 py-3">{t('inventory.putaway.batch')}</th>
                                <th className="px-4 py-3">{t('inventory.putaway.expiry')}</th>
                                <th className="px-4 py-3 text-right">{t('inventory.putaway.available')}</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {levels.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                                        {t('inventory.putaway.empty')}
                                    </td>
                                </tr>
                            )}
                            {levels.map((level) => (
                                <tr key={level.id} className="border-b">
                                    <td className="px-4 py-3 font-medium">{level.product?.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{level.warehouse?.name}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {level.location?.code} — {level.location?.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm tabular-nums">{level.batch_number ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {level.expiry_date
                                            ? new Date(level.expiry_date).toLocaleDateString(localeTag)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">{level.available}</td>
                                    <td className="px-4 py-3 text-right">
                                        <PrimaryButton
                                            type="button"
                                            disabled={busyId === level.id || level.available <= 0}
                                            onClick={() => putaway(level)}
                                        >
                                            {t('inventory.putaway.confirm')}
                                        </PrimaryButton>
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
