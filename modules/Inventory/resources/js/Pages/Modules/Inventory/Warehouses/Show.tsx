import { Link, router } from '@inertiajs/react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
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

const locationTypeLabels: Record<string, string> = {
    view: 'View',
    internal: 'Internal',
    input: 'Input',
    output: 'Output',
    quality_control: 'QC',
    transit: 'Transit',
    production: 'Produksi',
    scrap: 'Scrap',
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
                        Kembali
                    </Link>
                </div>

                <div>
                    <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            warehouse.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                        {warehouse.status}
                    </span>
                </div>

                {/* Locations Section */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Lokasi / Zona</h2>
                        <Link href={prefixedRoute('inventory.warehouses.locations.create', warehouse.id)}>
                            <PrimaryButton>Tambah Lokasi</PrimaryButton>
                        </Link>
                    </div>
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Kode</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Nama</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Tipe</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Parent</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Sub</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouse.locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                            Belum ada lokasi.
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
                                                    <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">default</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${locationTypeColors[loc.type] ?? 'bg-gray-100 text-gray-800'}`}>
                                                    {locationTypeLabels[loc.type] ?? loc.type}
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
                                                    Edit
                                                </Link>
                                                {!loc.is_default && (
                                                    <button
                                                        onClick={() => setDeleteTarget(loc)}
                                                        className="ml-3 text-red-600 hover:text-red-900"
                                                    >
                                                        Hapus
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
                    <h2 className="text-xl font-semibold">Stock Levels</h2>
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Lokasi</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">On Hand</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Reserved</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Available</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouse.stock_levels.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                            No stock recorded yet.
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
                                                    {level.product.category === 'merchandise' ? 'Merchandise' : 'Sparepart'}
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
                    <h2 className="text-xl font-semibold">Recent Movements</h2>
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Lokasi</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Quantity</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Reference</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Notes</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouse.stock_movements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                            No movements yet.
                                        </td>
                                    </tr>
                                ) : (
                                    warehouse.stock_movements.map((movement) => (
                                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3">
                                                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${typeColors[movement.type] ?? 'bg-gray-100 text-gray-800'}`}>
                                                    {movement.type}
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
                                                {movement.recorded_at ? new Date(movement.recorded_at).toLocaleString('id-ID') : '-'}
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
                title="Hapus Lokasi"
                message={`Yakin ingin menghapus lokasi "${deleteTarget?.name}" (${deleteTarget?.code})?`}
            />
        </ModuleLayout>
    );
}
