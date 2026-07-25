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

interface Principal {
    id: number;
    code: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    brands_count: number;
}

interface PaginatedPrincipals {
    data: Principal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    principals: PaginatedPrincipals;
    filters: { search: string | null; status: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ principals, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState<Principal | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('products.principals.index'), {
            search: search || undefined,
            status: filters.status || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('products.principals.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('products.principals.destroy', toDelete.id), {
            onSuccess: () => { setShowDeleteDialog(false); setToDelete(null); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('products.principals.index.head')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('products.principals.create')}>
                            <PrimaryButton>{t('products.principals.index.new')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('products.principals.index.head')} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput type="text" placeholder={t('products.placeholders.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.status || ''}
                            onChange={handleStatusFilter}
                            placeholder={t('products.status.all')}
                            options={[
                                { value: '', label: t('products.status.all') },
                                { value: 'active', label: t('products.status.active') },
                                { value: 'inactive', label: t('products.status.inactive') },
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {principals.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('products.principals.index.empty')}</h3>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.principals.index.columns.code')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.principals.index.columns.name')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.contact')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.phone')}</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.nav.brands')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.principals.index.columns.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {principals.data.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{p.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{p.contact_person || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{p.phone || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{p.brands_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {t(`products.status.${p.status}`, undefined, p.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && (
                                                            <Link href={prefixedRoute('products.principals.edit', p.id)} className="text-indigo-600 hover:text-indigo-900">{t('common.edit')}</Link>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => { setToDelete(p); setShowDeleteDialog(true); }} className="text-red-600 hover:text-red-900">{t('common.delete')}</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {principals.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (principals.current_page - 1) * principals.per_page + 1,
                                            to: Math.min(principals.current_page * principals.per_page, principals.total),
                                            total: principals.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {principals.links.map((link, i) => (
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
                title={t('products.principals.index.delete_title')}
                message={toDelete ? t('products.principals.index.delete_confirm', { name: toDelete.name }) : ''}
            />
        </DynamicLayout>
    );
}
