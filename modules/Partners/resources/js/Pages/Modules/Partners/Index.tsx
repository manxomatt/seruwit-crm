import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface Industry {
    id: number;
    name: string;
}

interface Partner {
    id: number;
    code: string;
    name: string;
    account_type: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    customer_rank: number;
    supplier_rank: number;
    status: string;
    industry: Industry | null;
    tags: Tag[];
}

interface PaginatedPartners {
    data: Partner[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    account_type: string | null;
    role: string | null;
}

interface Props {
    partners: PaginatedPartners;
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
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

export default function Index({ partners, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
    const [processing, setProcessing] = useState(false);

    const getRoleBadges = (partner: Partner) => {
        const badges: Array<{ key: string; label: string; className: string }> = [];
        if (partner.customer_rank > 0) {
            badges.push({ key: 'customer', label: t('partners.role.customer'), className: 'bg-blue-100 text-blue-800' });
        }
        if (partner.supplier_rank > 0) {
            badges.push({ key: 'supplier', label: t('partners.role.supplier'), className: 'bg-purple-100 text-purple-800' });
        }
        return badges;
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('partners.index'), {
            search: search || undefined,
            status: filters.status || undefined,
            account_type: filters.account_type || undefined,
            role: filters.role || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(prefixedRoute('partners.index'), {
            search: search || undefined,
            status: key === 'status' ? value || undefined : filters.status || undefined,
            account_type: key === 'account_type' ? value || undefined : filters.account_type || undefined,
            role: key === 'role' ? value || undefined : filters.role || undefined,
        }, { preserveState: true, replace: true });
    };

    const openDeleteDialog = (partner: Partner) => {
        setPartnerToDelete(partner);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setPartnerToDelete(null);
    };

    const confirmDelete = () => {
        if (!partnerToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('partners.destroy', partnerToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('partners.index.head')}</h2>
                    <div className="flex items-center gap-3">
                        <Link href={prefixedRoute('partners.locations.index')} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                            {t('partners.locations.nav')}
                        </Link>
                        {can.create && (
                            <Link href={prefixedRoute('partners.create')}>
                                <PrimaryButton>{t('partners.index.new')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={t('partners.title')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('partners.placeholders.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-40"
                            value={filters.role || ''}
                            onChange={(value) => handleFilter('role', value)}
                            placeholder={t('partners.role.all')}
                            options={[
                                { value: '', label: t('partners.role.all') },
                                { value: 'customer', label: t('partners.role.customer') },
                                { value: 'supplier', label: t('partners.role.supplier') },
                            ]}
                        />
                        <Select
                            className="w-40"
                            value={filters.account_type || ''}
                            onChange={(value) => handleFilter('account_type', value)}
                            placeholder={t('partners.account_type.all')}
                            options={[
                                { value: '', label: t('partners.account_type.all') },
                                { value: 'company', label: t('partners.account_type.company') },
                                { value: 'individual', label: t('partners.account_type.individual') },
                            ]}
                        />
                        <Select
                            className="w-36"
                            value={filters.status || ''}
                            onChange={(value) => handleFilter('status', value)}
                            placeholder={t('partners.status.all')}
                            options={[
                                { value: '', label: t('partners.status.all') },
                                { value: 'active', label: t('partners.status.active') },
                                { value: 'inactive', label: t('partners.status.inactive') },
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {partners.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('partners.index.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('partners.index.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.index.columns.code')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.index.columns.name')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.index.columns.role')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.index.columns.phone')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.index.columns.industry')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.index.columns.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {partners.data.map((partner) => (
                                            <tr key={partner.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{partner.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {t(`partners.account_type.${partner.account_type}`)}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex gap-1">
                                                        {getRoleBadges(partner).map((badge) => (
                                                            <span key={badge.key} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                                                                {badge.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {partner.phone || partner.mobile || '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {partner.industry?.name || '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(partner.status)}`}>
                                                        {t(`partners.status.${partner.status}`, undefined, partner.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={prefixedRoute('partners.show', partner.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                        {can.update && (
                                                            <Link
                                                                href={prefixedRoute('partners.edit', partner.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title={t('common.edit')}
                                                            >
                                                                <PencilIcon />
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                onClick={() => openDeleteDialog(partner)}
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

                            {partners.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (partners.current_page - 1) * partners.per_page + 1,
                                            to: Math.min(partners.current_page * partners.per_page, partners.total),
                                            total: partners.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {partners.links.map((link, index) => (
                                            <button
                                                key={index}
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
                title={t('partners.index.delete_title')}
                message={
                    partnerToDelete
                        ? t('partners.index.delete_confirm', { name: partnerToDelete.name, code: partnerToDelete.code })
                        : t('partners.index.delete_confirm_generic')
                }
            />
        </DynamicLayout>
    );
}
