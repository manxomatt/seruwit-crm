import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ProductNav from '../../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import PageHeader from '@/Components/PageHeader';

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

interface Principal {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
    status: string;
    products_count: number;
    principal: Principal | null;
}

interface PaginatedBrands {
    data: Brand[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    brands: PaginatedBrands;
    principals: Principal[];
    filters: { search: string | null; principal_id: string | null; status: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ brands, principals, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState<Brand | null>(null);
    const [processing, setProcessing] = useState(false);

    const applyFilters = (overrides: Record<string, string | undefined> = {}) => {
        router.get(prefixedRoute('products.brands.index'), {
            search: search || undefined,
            principal_id: filters.principal_id || undefined,
            status: filters.status || undefined,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('products.brands.destroy', toDelete.id), {
            onSuccess: () => { setShowDeleteDialog(false); setToDelete(null); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('products.brands.index.head')}
                    actions={can.create && (
                        <Link href={prefixedRoute('products.brands.create')}>
                            <PrimaryButton>{t('products.brands.index.new')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('products.brands.index.head')} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput type="text" placeholder={t('products.placeholders.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.principal_id || ''}
                            onChange={(v) => applyFilters({ principal_id: v || undefined })}
                            placeholder={t('products.placeholders.select_principal')}
                            searchable
                            maxVisibleOptions={10}
                            options={[
                                { value: '', label: t('products.placeholders.select_principal') },
                                ...principals.map((p) => ({ value: String(p.id), label: p.name })),
                            ]}
                        />
                        <Select
                            className="w-40"
                            value={filters.status || ''}
                            onChange={(v) => applyFilters({ status: v || undefined })}
                            placeholder={t('products.status.all')}
                            options={[
                                { value: '', label: t('products.status.all') },
                                { value: 'active', label: t('products.status.active') },
                                { value: 'inactive', label: t('products.status.inactive') },
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {brands.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('products.brands.index.empty')}</h3>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.brands.index.columns.name')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.brands.index.columns.principal')}</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.nav.products')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.brands.index.columns.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {brands.data.map((b) => (
                                            <tr key={b.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{b.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{b.principal?.name || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{b.products_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${b.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {t(`products.status.${b.status}`, undefined, b.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can.update && (
                                                            <Link
                                                                href={prefixedRoute('products.brands.edit', b.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title={t('common.edit')}
                                                            >
                                                                <PencilIcon />
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { setToDelete(b); setShowDeleteDialog(true); }}
                                                                className="text-red-600 hover:text-red-900"
                                                                title={t('common.delete')}
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {brands.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (brands.current_page - 1) * brands.per_page + 1,
                                            to: Math.min(brands.current_page * brands.per_page, brands.total),
                                            total: brands.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {brands.links.map((link, i) => (
                                            <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : link.url ? 'border bg-white text-gray-700 hover:bg-gray-50' : 'cursor-not-allowed bg-gray-100 text-gray-400'}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setToDelete(null); }}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('products.brands.index.delete_title')}
                message={toDelete ? t('products.brands.index.delete_confirm', { name: toDelete.name }) : ''}
            />
        </DynamicLayout>
    );
}
