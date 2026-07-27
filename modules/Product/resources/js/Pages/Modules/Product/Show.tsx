import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ProductNav from '../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface Packaging {
    id: number;
    name: string;
    barcode: string | null;
    qty: string | null;
    sort: number | null;
}

interface Variant {
    id: number;
    code: string;
    name: string;
    sku: string | null;
    price: string | null;
    status: string;
}

interface AttributeOption {
    id: number;
    name: string;
    color: string | null;
}

interface ProductAttributeData {
    id: number;
    attribute: {
        id: number;
        name: string;
        type: string;
        options: AttributeOption[];
    };
}

interface Product {
    id: number;
    code: string;
    sku: string | null;
    barcode: string | null;
    name: string;
    unit: string;
    description: string | null;
    description_sale: string | null;
    description_purchase: string | null;
    price: string | null;
    cost: string | null;
    weight: string | null;
    volume: string | null;
    status: string;
    category: string | null;
    tracking: string | null;
    is_storable: boolean;
    is_favorite: boolean;
    brand: {
        id: number;
        name: string;
        principal: { id: number; name: string } | null;
    } | null;
    product_type: { id: number; name: string } | null;
    tags: Tag[];
    packagings: Packaging[];
    variants: Variant[];
    product_attributes: ProductAttributeData[];
    images: string[] | null;
}

interface Props {
    product: Product;
    can: { update: boolean; delete: boolean };
}

const TAG_COLORS: Record<string, string> = {
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    pink: 'bg-pink-100 text-pink-800',
    gray: 'bg-gray-100 text-gray-800',
};

const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

export default function Show({ product, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const formatCurrency = (value: string | null) => {
        if (!value) return '—';
        return new Intl.NumberFormat(localeTag).format(Number(value));
    };

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
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{product.name}</h2>
                        {product.is_favorite && <span className="text-yellow-500" title="Favorit">&#9733;</span>}
                    </div>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('products.edit', product.id)}>
                                <SecondaryButton>{t('products.products.show.edit')}</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('products.index')}>
                            <SecondaryButton>{t('products.products.show.back')}</SecondaryButton>
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
                        {product.images?.[0] && (
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="mb-6 h-48 w-full rounded-lg object-cover sm:w-64"
                            />
                        )}
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{t('products.products.show.general')}</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.code')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.code}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.status')}</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(product.status)}`}>
                                        {t(`products.status.${product.status}`, undefined, product.status)}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.unit')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.unit}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.category')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {product.category ? t(`products.categories.${product.category}`, undefined, product.category) : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.price')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(product.price)}</dd>
                            </div>
                            {product.category !== 'service' && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('products.fields.cost')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(product.cost)}</dd>
                                </div>
                            )}
                            {product.category !== 'service' && (
                                <>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('products.fields.weight')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{product.weight ? `${product.weight} kg` : '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('products.fields.volume')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{product.volume ? `${product.volume} m³` : '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('products.fields.tracking')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{t(`products.tracking.${product.tracking || 'qty'}`)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('products.fields.is_inventoried')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{product.is_storable ? t('common.yes') : t('common.no')}</dd>
                                    </div>
                                </>
                            )}
                        </dl>

                        {product.tags.length > 0 && (
                            <div className="mt-4">
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.tags')}</dt>
                                <dd className="mt-2 flex flex-wrap gap-2">
                                    {product.tags.map((tag) => (
                                        <span key={tag.id} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_COLORS[tag.color || ''] || 'bg-gray-100 text-gray-800'}`}>
                                            {tag.name}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        )}

                        {product.description && (
                            <div className="mt-4">
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.description')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
                            </div>
                        )}
                        {product.description_sale && (
                            <div className="mt-4">
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.description')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.description_sale}</dd>
                            </div>
                        )}
                        {product.description_purchase && (
                            <div className="mt-4">
                                <dt className="text-sm font-medium text-gray-500">{t('products.fields.notes')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.description_purchase}</dd>
                            </div>
                        )}
                    </div>
                </div>

                {product.category !== 'service' ? (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{t('products.products.show.general')}</h3>
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('products.fields.principal')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{product.brand?.principal?.name || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('products.fields.brand')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{product.brand?.name || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('products.fields.product_type')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{product.product_type?.name || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('products.fields.sku')}</dt>
                                    <dd className="mt-1 font-mono text-sm text-gray-900">{product.sku || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('products.fields.barcode')}</dt>
                                    <dd className="mt-1 font-mono text-sm text-gray-900">{product.barcode || '—'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                ) : (product.sku || product.barcode) && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{t('products.fields.code')}</h3>
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {product.sku && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('products.fields.sku')}</dt>
                                        <dd className="mt-1 font-mono text-sm text-gray-900">{product.sku}</dd>
                                    </div>
                                )}
                                {product.barcode && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('products.fields.barcode')}</dt>
                                        <dd className="mt-1 font-mono text-sm text-gray-900">{product.barcode}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                )}

                {product.packagings.length > 0 && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{t('products.products.show.packagings')}</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.name')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.barcode')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.unit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {product.packagings.map((pkg) => (
                                            <tr key={pkg.id}>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{pkg.name}</td>
                                                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-500">{pkg.barcode || '—'}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">{pkg.qty || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {product.product_attributes.length > 0 && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{t('products.products.show.attributes')}</h3>
                            <div className="space-y-3">
                                {product.product_attributes.map((pa) => (
                                    <div key={pa.id} className="flex items-start gap-4">
                                        <span className="min-w-[120px] text-sm font-medium text-gray-500">{pa.attribute.name}</span>
                                        <div className="flex flex-wrap gap-1">
                                            {pa.attribute.options.map((opt) => (
                                                <span key={opt.id} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                                    {opt.color && <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: opt.color }} />}
                                                    {opt.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {product.variants.length > 0 && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{t('products.fields.variants')} ({product.variants.length})</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.code')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.name')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.sku')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.price')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {product.variants.map((v) => (
                                            <tr key={v.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                                    <Link href={prefixedRoute('products.show', v.id)} className="text-indigo-600 hover:text-indigo-900">{v.code}</Link>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{v.name}</td>
                                                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-500">{v.sku || '—'}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(v.price)}</td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(v.status)}`}>{t(`products.status.${v.status}`, undefined, v.status)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{t('products.products.show.delete_zone_title')}</h3>
                                <p className="text-sm text-gray-500">{t('products.products.show.delete_zone_hint')}</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                {t('products.products.show.delete_action')}
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
                title={t('products.products.show.delete_title')}
                message={t('products.products.show.delete_confirm', { name: product.name, code: product.code })}
            />
        </DynamicLayout>
    );
}
