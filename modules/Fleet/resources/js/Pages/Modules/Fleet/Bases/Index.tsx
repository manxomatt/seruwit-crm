import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';

interface Manager {
    id: number;
    name: string;
    email: string;
}

interface FleetBaseRow {
    id: number;
    code: string;
    name: string;
    kind: string;
    status: string;
    city: string | null;
    phone: string | null;
    vehicles_count: number;
    manager: Manager | null;
}

interface PaginatedBases {
    data: FleetBaseRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    kind: string | null;
}

interface Props {
    bases: PaginatedBases;
    filters: Filters;
    kinds: string[];
    can: { create: boolean; update: boolean; delete: boolean };
}

const STATUSES = ['active', 'inactive'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

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

export default function Index({ bases, filters, kinds, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [baseToDelete, setBaseToDelete] = useState<FleetBaseRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('fleet.bases.index'), {
            search: search || undefined,
            status: filters.status || undefined,
            kind: filters.kind || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('fleet.bases.index'), {
            search: search || undefined,
            status: status || undefined,
            kind: filters.kind || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleKindFilter = (kind: string) => {
        router.get(prefixedRoute('fleet.bases.index'), {
            search: search || undefined,
            status: filters.status || undefined,
            kind: kind || undefined,
        }, { preserveState: true, replace: true });
    };

    const openDeleteDialog = (base: FleetBaseRow) => {
        setBaseToDelete(base);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setBaseToDelete(null);
    };

    const confirmDelete = () => {
        if (!baseToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.bases.destroy', baseToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('fleet.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('fleet.bases.create')}>
                            <PrimaryButton>{t('fleet.bases.add')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('fleet.bases.title')} />

            <FleetNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('fleet.bases.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.status || ''}
                            onChange={handleStatusFilter}
                            placeholder={t('fleet.vehicles.all_statuses')}
                            options={[
                                { value: '', label: t('fleet.vehicles.all_statuses') },
                                ...STATUSES.map((status) => ({
                                    value: status,
                                    label: t(`fleet.status.${status}`),
                                })),
                            ]}
                        />
                        <Select
                            className="w-48"
                            value={filters.kind || ''}
                            onChange={handleKindFilter}
                            placeholder={t('fleet.bases.all_kinds')}
                            options={[
                                { value: '', label: t('fleet.bases.all_kinds') },
                                ...kinds.map((kind) => ({
                                    value: kind,
                                    label: t(`fleet.base_kinds.${kind}`),
                                })),
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {bases.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('fleet.bases.empty')}</h3>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('fleet.bases.code')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('fleet.bases.name')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('fleet.bases.kind')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('fleet.bases.city')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('fleet.bases.manager')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('fleet.bases.vehicles')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('fleet.bases.status')}</th>
                                            <th className="w-28 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                <span className="sr-only">{t('common.actions')}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {bases.data.map((base) => (
                                            <tr key={base.id} className="group hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{base.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{base.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{t(`fleet.base_kinds.${base.kind}`)}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{base.city || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{base.manager?.name || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{base.vehicles_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(base.status)}`}>
                                                        {t(`fleet.status.${base.status}`)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                                        <Link
                                                            href={prefixedRoute('fleet.bases.show', base.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title={t('common.view', undefined, 'View')}
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                        {can.update && (
                                                            <Link
                                                                href={prefixedRoute('fleet.bases.edit', base.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title={t('common.edit')}
                                                            >
                                                                <PencilIcon />
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(base)}
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

                            {bases.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (bases.current_page - 1) * bases.per_page + 1,
                                            to: Math.min(bases.current_page * bases.per_page, bases.total),
                                            total: bases.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {bases.links.map((link, index) => (
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
                        </>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                message={
                    baseToDelete
                        ? t('fleet.bases.delete_confirm', { name: baseToDelete.name })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
