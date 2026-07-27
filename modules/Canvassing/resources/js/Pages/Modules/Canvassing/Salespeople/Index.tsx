import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import CanvassingNav from '../../../../CanvassingNav';

interface Salesperson {
    id: number;
    name: string;
    employee_code: string | null;
    area: string | null;
    phone: string | null;
    is_active: boolean;
    visits_count: number;
}

interface PaginatedSalespeople {
    data: Salesperson[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    salespeople: PaginatedSalespeople;
    filters: { search?: string; active?: string };
}

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

export default function SalespeopleIndex({ salespeople, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [salespersonToDelete, setSalespersonToDelete] = useState<Salesperson | null>(null);
    const [processing, setProcessing] = useState(false);

    const applyFilters = (overrides: Record<string, string>): void => {
        router.get(
            prefixedRoute('canvassing.salespeople.index'),
            {
                search: overrides.search !== undefined ? overrides.search || undefined : search || undefined,
                active: overrides.active !== undefined ? overrides.active || undefined : filters.active || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const openDeleteDialog = (salesperson: Salesperson): void => {
        setSalespersonToDelete(salesperson);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = (): void => {
        setShowDeleteDialog(false);
        setSalespersonToDelete(null);
    };

    const confirmDelete = (): void => {
        if (!salespersonToDelete) {
            return;
        }

        setProcessing(true);
        router.delete(prefixedRoute('canvassing.salespeople.destroy', salespersonToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('canvassing.salespeople.title')}</h2>
                    <Link href={prefixedRoute('canvassing.salespeople.create')}>
                        <PrimaryButton>{t('canvassing.salespeople.add')}</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('canvassing.salespeople.head')} />

            <CanvassingNav />

            <p className="mb-6 text-sm text-gray-600">{t('canvassing.salespeople.total', { count: salespeople.total })}</p>

            <div className="mb-6 flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <TextInput
                        placeholder={t('canvassing.salespeople.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64"
                    />
                    <button
                        type="submit"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        {t('common.search')}
                    </button>
                </form>
                <Select
                    className="min-w-[12rem]"
                    value={filters.active ?? ''}
                    onChange={(value) => applyFilters({ active: value })}
                    placeholder={t('canvassing.status.all')}
                    searchable={false}
                    options={[
                        { value: '', label: t('canvassing.status.all') },
                        { value: '1', label: t('canvassing.status.active') },
                        { value: '0', label: t('canvassing.status.inactive') },
                    ]}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns.name')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns.code')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns.area')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns.phone')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns.visits')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.salespeople.columns.status')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('common.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {salespeople.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                    {t('canvassing.salespeople.empty')}
                                </td>
                            </tr>
                        ) : (
                            salespeople.data.map((sp) => (
                                <tr key={sp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{sp.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{sp.employee_code ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{sp.area ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{sp.phone ?? '—'}</td>
                                    <td className="px-4 py-3 tabular-nums text-gray-600">{sp.visits_count}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                                                sp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {sp.is_active ? t('canvassing.status.active') : t('canvassing.status.inactive')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={prefixedRoute('canvassing.salespeople.show', sp.id)}
                                                className="text-gray-600 hover:text-gray-900"
                                                title={t('common.view')}
                                            >
                                                <EyeIcon />
                                            </Link>
                                            <Link
                                                href={prefixedRoute('canvassing.salespeople.edit', sp.id)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title={t('common.edit')}
                                            >
                                                <PencilIcon />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteDialog(sp)}
                                                className="text-red-600 hover:text-red-900"
                                                title={t('common.delete')}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {salespeople.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (salespeople.current_page - 1) * salespeople.per_page + 1,
                                to: Math.min(salespeople.current_page * salespeople.per_page, salespeople.total),
                                total: salespeople.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {salespeople.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                message={
                    salespersonToDelete
                        ? t('canvassing.salespeople.delete_confirm', { name: salespersonToDelete.name })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
