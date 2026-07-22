import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ProductNav from '../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Product {
    id: number;
    code: string;
    sku: string | null;
    barcode: string | null;
    name: string;
    unit: string;
    description: string | null;
    price: string | null;
    status: string;
    category: string | null;
    brand: {
        id: number;
        name: string;
        principal: { id: number; name: string } | null;
    } | null;
    product_type: { id: number; name: string } | null;
}

interface Props {
    product: Product;
    can: { update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

export default function Show({ product, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('products.destroy', product.id), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{product.name}</h2>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('products.edit', product.id)}>
                                <SecondaryButton>Edit</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('products.index')}>
                            <SecondaryButton>Kembali</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={product.name} />
            <ProductNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Informasi Produk</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Kode</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.code}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(product.status)}`}>
                                        {product.status}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Satuan</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.unit}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Harga</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.price || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Kategori</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.category === 'fleet_sparepart' ? 'Fleet Sparepart' : 'Merchandise'}</dd>
                            </div>
                            {product.description && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Deskripsi</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Katalog</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Principal</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.brand?.principal?.name || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Brand</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.brand?.name || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Tipe Produk</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.product_type?.name || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-900">{product.sku || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-900">{product.barcode || '—'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Hapus produk ini</h3>
                                <p className="text-sm text-gray-500">Tindakan ini tidak bisa dibatalkan.</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Hapus Produk
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                title="Hapus Product"
                message={`Yakin ingin menghapus "${product.name}" (${product.code})?`}
            />
        </DynamicLayout>
    );
}
