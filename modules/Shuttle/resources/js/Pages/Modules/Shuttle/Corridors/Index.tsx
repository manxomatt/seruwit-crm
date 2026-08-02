import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ShuttleNav from '../ShuttleNav';
import { ActionIconButton, PencilIcon, TrashIcon } from '../components/ActionIcons';
import ShuttlePageHeader from '../components/ShuttlePageHeader';
import ShuttlePagination, { type PaginatedMeta } from '../components/ShuttlePagination';

interface Corridor {
    id: number;
    code: string;
    name: string;
    origin_city: string | { name?: string } | null;
    destination_city: string | { name?: string } | null;
    service_type: string;
    base_fare: string | number;
    is_active: boolean;
}

interface Props {
    corridors: PaginatedMeta & { data: Corridor[] };
    filters: { search: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

const money = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

function cityLabel(value: Corridor['origin_city']): string {
    if (value == null) {
        return '—';
    }
    if (typeof value === 'string') {
        return value;
    }
    return value.name ?? '—';
}

export default function Index({ corridors, filters, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<Corridor | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('shuttle.corridors.index'), { search: search || undefined }, { preserveState: true, replace: true });
    };

    const closeDeleteDialog = () => {
        setDeleting(null);
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        setProcessingDelete(true);
        router.delete(prefixedRoute('shuttle.corridors.destroy', deleting.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessingDelete(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <ShuttlePageHeader
                    title={t('shuttle.corridors.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('shuttle.corridors.create')}>
                                <PrimaryButton type="button">{t('shuttle.corridors.create')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('shuttle.corridors.title')} />
            <ShuttleNav active="corridors" />

            <form onSubmit={submit} className="mb-6 flex flex-wrap gap-2">
                <TextInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.search', undefined, 'Search…')}
                    className="w-56"
                />
                <button type="submit" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {t('common.search', undefined, 'Search')}
                </button>
            </form>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.corridors.code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.corridors.name')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.corridors.service_type')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.corridors.base_fare')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.corridors.active')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions', undefined, 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {corridors.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    —
                                </td>
                            </tr>
                        ) : (
                            corridors.data.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{c.code}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{c.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {cityLabel(c.origin_city)} → {cityLabel(c.destination_city)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                                                c.service_type === 'door'
                                                    ? 'bg-violet-100 text-violet-800'
                                                    : 'bg-sky-100 text-sky-800'
                                            }`}
                                        >
                                            {c.service_type === 'door' ? t('shuttle.service.door_short') : t('shuttle.service.pool_short')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-900">{money(c.base_fare)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                                                c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {c.is_active ? t('common.active', undefined, 'Active') : t('common.inactive', undefined, 'Inactive')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {can.update && (
                                                <ActionIconButton
                                                    title={t('common.edit', undefined, 'Edit')}
                                                    href={prefixedRoute('shuttle.corridors.edit', c.id)}
                                                >
                                                    <PencilIcon />
                                                </ActionIconButton>
                                            )}
                                            {can.delete && (
                                                <ActionIconButton
                                                    title={t('common.delete', undefined, 'Delete')}
                                                    tone="red"
                                                    onClick={() => setDeleting(c)}
                                                >
                                                    <TrashIcon />
                                                </ActionIconButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <ShuttlePagination meta={corridors} />
            </div>

            <ConfirmDeleteDialog
                show={deleting !== null}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processingDelete}
                message={
                    deleting
                        ? t('shuttle.messages.delete_confirm', { name: deleting.name || deleting.code })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
