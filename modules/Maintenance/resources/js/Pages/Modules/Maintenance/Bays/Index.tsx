import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';

interface Bay {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    sort_order: number;
    active_work_orders_count: number;
}

interface PaginatedBays {
    data: Bay[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    bays: PaginatedBays;
    can: { manage: boolean };
}

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-red-600 transition data-[focus]:bg-red-50 data-[focus]:text-red-700';

const menuItemDangerDisabledClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-300 cursor-not-allowed';

export default function Index({ bays, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Bay | null>(null);
    const [deleting, setDeleting] = useState<Bay | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        code: '',
        name: '',
        is_active: true as boolean,
        sort_order: '0',
    });

    const openCreate = () => {
        setEditing(null);
        reset();
        setData({ code: '', name: '', is_active: true, sort_order: '0' });
        setShowModal(true);
    };

    const openEdit = (bay: Bay) => {
        setEditing(bay);
        setData({
            code: bay.code,
            name: bay.name,
            is_active: bay.is_active,
            sort_order: String(bay.sort_order),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            patch(prefixedRoute('maintenance.bays.update', editing.id), { onSuccess: closeModal });
        } else {
            post(prefixedRoute('maintenance.bays.store'), { onSuccess: closeModal });
        }
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }
        setProcessingDelete(true);
        router.delete(prefixedRoute('maintenance.bays.destroy', deleting.id), {
            onSuccess: () => setDeleting(null),
            onFinish: () => setProcessingDelete(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('maintenance.title')}
                    actions={
                        can.manage ? (
                            <PrimaryButton onClick={openCreate}>{t('maintenance.bays.new')}</PrimaryButton>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('maintenance.bays.head')} />
            <MaintenanceNav />

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">{t('maintenance.bays.head')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('maintenance.bays.section_hint')}</p>
                </div>

                {bays.data.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500">{t('maintenance.bays.empty')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.bays.code')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.bays.name')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.bays.status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.bays.active_jobs')}</th>
                                    <th className="w-28 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        <span className="sr-only">{t('common.actions')}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {bays.data.map((bay) => (
                                    <tr key={bay.id} className="group hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{bay.code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{bay.name}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${bay.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {bay.is_active ? t('maintenance.status.active') : t('maintenance.status.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm tabular-nums text-gray-700">{bay.active_work_orders_count}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            {can.manage && (
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                        title={t('common.actions')}
                                                        aria-label={t('common.actions')}
                                                    >
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-48 origin-top-right rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                                    >
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(bay)}
                                                                className={menuItemClassName}
                                                                title={t('common.edit')}
                                                            >
                                                                <span className="text-indigo-600">
                                                                    <PencilIcon />
                                                                </span>
                                                                {t('common.edit')}
                                                            </button>
                                                        </MenuItem>
                                                        <div className="my-1 border-t border-gray-100" />
                                                        <MenuItem disabled={bay.active_work_orders_count > 0}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleting(bay)}
                                                                className={
                                                                    bay.active_work_orders_count > 0
                                                                        ? menuItemDangerDisabledClassName
                                                                        : menuItemDangerClassName
                                                                }
                                                                disabled={bay.active_work_orders_count > 0}
                                                                title={
                                                                    bay.active_work_orders_count > 0
                                                                        ? t('maintenance.messages.bay_in_use')
                                                                        : t('common.delete')
                                                                }
                                                            >
                                                                <TrashIcon />
                                                                {t('common.delete')}
                                                            </button>
                                                        </MenuItem>
                                                    </MenuItems>
                                                </Menu>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal show={showModal} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {editing ? t('maintenance.bays.edit_title') : t('maintenance.bays.create_title')}
                    </h2>
                    <div className="mt-4 space-y-4">
                        <div>
                            <InputLabel htmlFor="code" value={t('maintenance.bays.code')} />
                            <TextInput id="code" className="mt-1 block w-full uppercase" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                            <InputError message={errors.code} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="name" value={t('maintenance.bays.name')} />
                            <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="sort_order" value={t('maintenance.bays.sort_order')} />
                            <TextInput id="sort_order" type="number" className="mt-1 block w-full" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                            <InputError message={errors.sort_order} className="mt-2" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                            />
                            {t('maintenance.bays.is_active')}
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModal}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={deleting !== null}
                title={t('maintenance.bays.delete_title')}
                message={t('maintenance.bays.delete_confirm', { name: deleting?.name ?? '' })}
                processing={processingDelete}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </DynamicLayout>
    );
}
