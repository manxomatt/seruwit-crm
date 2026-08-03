import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
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
        <DynamicLayout>
            <Head title={t('maintenance.bays.head')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <MaintenanceNav />
                    <PageHeader
                        title={t('maintenance.bays.head')}
                        actions={
                            can.manage ? (
                                <PrimaryButton onClick={openCreate}>{t('maintenance.bays.new')}</PrimaryButton>
                            ) : undefined
                        }
                    />

                    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {bays.data.length === 0 ? (
                            <p className="p-6 text-sm text-gray-500">{t('maintenance.bays.empty')}</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('maintenance.bays.code')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('maintenance.bays.name')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('maintenance.bays.status')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('maintenance.bays.active_jobs')}</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bays.data.map((bay) => (
                                        <tr key={bay.id}>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{bay.code}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{bay.name}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${bay.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {bay.is_active ? t('maintenance.status.active') : t('maintenance.status.inactive')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm tabular-nums text-gray-700">{bay.active_work_orders_count}</td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                {can.manage && (
                                                    <div className="flex justify-end gap-3">
                                                        <button type="button" onClick={() => openEdit(bay)} className="text-indigo-600 hover:text-indigo-900">
                                                            {t('common.edit')}
                                                        </button>
                                                        <button type="button" onClick={() => setDeleting(bay)} className="text-red-600 hover:text-red-900">
                                                            {t('common.delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
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
