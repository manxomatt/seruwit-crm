import { Link, router } from '@inertiajs/react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { useState } from 'react';

interface Location {
    id: number;
    name: string;
    code: string;
    type: string;
    is_default: boolean;
    sort_order: number;
    parent: { id: number; name: string; code: string } | null;
    stock_levels_count: number;
    children_count: number;
}

interface StockLevel {
    id: number;
    on_hand: number;
    reserved: number;
    product: { id: number; name: string; category: 'merchandise' | 'fleet_sparepart' };
    location: { id: number; name: string; code: string } | null;
}

interface StockMovement {
    id: number;
    type: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    reference_code: string | null;
    notes: string | null;
    recorded_at: string | null;
    location: { id: number; name: string; code: string } | null;
}

interface Warehouse {
    id: number;
    name: string;
    location: string;
    status: 'active' | 'inactive';
    locations: Location[];
    stock_levels: StockLevel[];
    stock_movements: StockMovement[];
}

interface Props {
    warehouse: Warehouse;
}

const typeColors: Record<string, string> = {
    in: 'bg-green-100 text-green-800',
    out: 'bg-red-100 text-red-800',
    adjustment: 'bg-amber-100 text-amber-800',
    transfer: 'bg-blue-100 text-blue-800',
};

const locationTypeColors: Record<string, string> = {
    internal: 'bg-blue-100 text-blue-800',
    input: 'bg-green-100 text-green-800',
    output: 'bg-orange-100 text-orange-800',
    quality_control: 'bg-purple-100 text-purple-800',
    transit: 'bg-cyan-100 text-cyan-800',
    production: 'bg-yellow-100 text-yellow-800',
    scrap: 'bg-red-100 text-red-800',
    view: 'bg-gray-100 text-gray-800',
};

export default function WarehouseShow({ warehouse }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setProcessing(true);
        router.delete(
            prefixedRoute('inventory.warehouses.locations.destroy', [warehouse.id, deleteTarget.id]),
            { onFinish: () => { setProcessing(false); setDeleteTarget(null); } },
        );
    };

    return (
        <ModuleLayout title={warehouse.name}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{warehouse.name}</h1>
                        <p className="text-sm text-gray-600">{warehouse.location}</p>
                    </div>
                    <Link
                        href={prefixedRoute('inventory.warehouses.index')}
                        className="rounded border px-4 py-2 hover:bg-gray-50"
                    >
                        {t('inventory.warehouses.back')}
                    </Link>
                </div>

                <div>
                    <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            warehouse.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                        {t(`inventory.status.${warehouse.status}`)}
                    </span>
                </div>

                {/* Locations Section */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">{t('inventory.warehouses.locations_title')}</h2>
                        <Link href={prefixedRoute('inventory.warehouses.locations.create', warehouse.id)}>
                            <PrimaryButton>{t('inventory.warehouses.add_location')}</PrimaryButton>
                        </Link>
                    </div>
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.code')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.name')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.type')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.parent')}</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.warehouses.columns.sub')}</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouse.locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                            {t('inventory.warehouses.locations_empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    warehouse.locations.map((loc) => (
                                        <tr key={loc.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3 font-mono text-sm font-medium">{loc.code}</td>
                                            <td className="px-6 py-3 text-sm">
                                                {loc.parent && <span className="mr-1 text-gray-400">└</span>}
                                                {loc.name}
                                                {loc.is_default && (
                                                    <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">{t('inventory.warehouses.default')}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${locationTypeColors[loc.type] ?? 'bg-gray-100 text-gray-800'}`}>
                                                    {t(`inventory.location_types.short.${loc.type}`, undefined, loc.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-500">
                                                {loc.parent ? `${loc.parent.code} — ${loc.parent.name}` : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm">{loc.children_count}</td>
                                            <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
                                                <Link
                                                    href={prefixedRoute('inventory.warehouses.locations.edit', [warehouse.id, loc.id])}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {t('common.edit')}
                                                </Link>
                                                {!loc.is_default && (
                                                    <button
                                                        onClick={() => setDeleteTarget(loc)}
                                                        className="ml-3 text-red-600 hover:text-red-900"
                                                    >
                                                        {t('common.delete')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Stock Levels Section */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">{t('inventory.warehouses.stock_levels')}</h2>
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.product')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.location')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.category')}</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.warehouses.columns.on_hand')}</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.warehouses.columns.reserved')}</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.warehouses.columns.available')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouse.stock_levels.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                            {t('inventory.warehouses.stock_empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    warehouse.stock_levels.map((level) => (
                                        <tr key={level.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium">{level.product.name}</td>
                                            <td className="px-6 py-3 text-sm text-gray-500">
                                                {level.location ? (
                                                    <span className="font-mono">{level.location.code}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-xs">
                                                <span className={`inline-block rounded px-2 py-1 ${level.product.category === 'merchandise' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {t(`inventory.categories.${level.product.category}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">{level.on_hand}</td>
                                            <td className="px-6 py-3 text-right text-gray-600">{level.reserved}</td>
                                            <td className="px-6 py-3 text-right font-semibold">
                                                {level.on_hand - level.reserved}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Recent Movements Section */}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">{t('inventory.warehouses.movements')}</h2>
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.movements.columns.type')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.location')}</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.warehouses.columns.quantity')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.reference')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.notes')}</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.warehouses.columns.date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouse.stock_movements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                            {t('inventory.warehouses.movements_empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    warehouse.stock_movements.map((movement) => (
                                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3">
                                                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${typeColors[movement.type] ?? 'bg-gray-100 text-gray-800'}`}>
                                                    {t(`inventory.movement_types.${movement.type}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-500">
                                                {movement.location ? (
                                                    <span className="font-mono">{movement.location.code}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-right">{movement.quantity}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{movement.reference_code ?? '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{movement.notes ?? '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">
                                                {movement.recorded_at ? new Date(movement.recorded_at).toLocaleString(localeTag) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <ConfirmDeleteDialog
                show={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('inventory.warehouses.delete_location_title')}
                message={t('inventory.warehouses.delete_location_message', {
                    name: deleteTarget?.name ?? '',
                    code: deleteTarget?.code ?? '',
                })}
            />
        </ModuleLayout>
    );
}
