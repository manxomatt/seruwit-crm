import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentType } from '../../../../documentUtils';

interface Props {
    types: DocumentType[];
    can: { create: boolean; update: boolean; delete: boolean };
}

interface TypeForm {
    name: string;
    entity_type: string;
    key: string;
    is_required: boolean;
    has_expiry: boolean;
    typical_validity_days: string;
    reminder_days: string;
}

const emptyForm = (): TypeForm => ({
    name: '',
    entity_type: 'vehicle',
    key: '',
    is_required: false,
    has_expiry: true,
    typical_validity_days: '',
    reminder_days: '30,14,7',
});

export default function Index({ types, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<DocumentType | null>(null);
    const [toDelete, setToDelete] = useState<DocumentType | null>(null);

    const form = useForm<TypeForm>(emptyForm());
    const deleting = useForm({});

    const entityLabel = (entityType: string): string =>
        t(`document.entity.${entityType}`, undefined, entityType);

    const openCreate = () => {
        form.reset();
        setEditing(null);
        setShowCreate(true);
    };

    const openEdit = (type: DocumentType) => {
        form.setData({
            name: type.name,
            entity_type: type.entity_type,
            key: type.key,
            is_required: type.is_required,
            has_expiry: type.has_expiry,
            typical_validity_days: type.typical_validity_days ? String(type.typical_validity_days) : '',
            reminder_days: (type.reminder_days ?? []).join(','),
        });
        setEditing(type);
        setShowCreate(true);
    };

    const closeModal = () => {
        setShowCreate(false);
        setEditing(null);
        form.clearErrors();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const route = editing
            ? prefixedRoute('documents.types.update', editing.id)
            : prefixedRoute('documents.types.store');

        const method = editing ? form.patch.bind(form) : form.post.bind(form);

        method(route, {
            onSuccess: closeModal,
        });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        deleting.delete(prefixedRoute('documents.types.destroy', toDelete.id), {
            preserveScroll: true,
            onSuccess: () => setToDelete(null),
        });
    };

    const vehicleTypes = types.filter((type) => type.entity_type === 'vehicle');
    const driverTypes = types.filter((type) => type.entity_type === 'driver');

    const renderTable = (list: DocumentType[]) => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('document.types.columns.name')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('document.types.columns.key')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('document.types.columns.required')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('document.types.columns.expiry')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('document.types.columns.validity')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('document.types.columns.reminder')}
                        </th>
                        <th className="relative px-6 py-3">
                            <span className="sr-only">{t('common.actions')}</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {list.map((type) => (
                        <tr key={type.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{type.name}</td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">{type.key}</td>
                            <td className="px-6 py-4">
                                {type.is_required ? (
                                    <span className="text-green-600">✓</span>
                                ) : (
                                    <span className="text-gray-300">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {type.has_expiry ? (
                                    <span className="text-green-600">✓</span>
                                ) : (
                                    <span className="text-gray-300">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                                {type.typical_validity_days
                                    ? t('document.types.validity_days', { count: type.typical_validity_days })
                                    : '—'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {(type.reminder_days ?? []).map((d) => (
                                        <span key={d} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-3">
                                    {can.update && (
                                        <button
                                            onClick={() => openEdit(type)}
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            {t('common.edit')}
                                        </button>
                                    )}
                                    {can.delete && (
                                        <button
                                            onClick={() => setToDelete(type)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            {t('common.delete')}
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {list.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                                {t('document.types.empty')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('document.types.title')}
                    </h2>
                    {can.create && (
                        <PrimaryButton onClick={openCreate}>{t('document.types.add')}</PrimaryButton>
                    )}
                </div>
            }
        >
            <Head title={t('document.types.head')} />

            <DocumentNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="font-semibold text-gray-900">{t('document.types.vehicle_section')}</h3>
                    </div>
                    {renderTable(vehicleTypes)}
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="font-semibold text-gray-900">{t('document.types.driver_section')}</h3>
                    </div>
                    {renderTable(driverTypes)}
                </div>
            </div>

            <Modal show={showCreate} onClose={closeModal} maxWidth="lg">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-6 text-lg font-semibold text-gray-900">
                        {editing ? t('document.types.edit_title') : t('document.types.create_title')}
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="name" value={t('document.types.name')} />
                                <TextInput
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="mt-1 w-full"
                                    autoFocus
                                />
                                <InputError message={form.errors.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="key" value={t('document.types.key')} />
                                <TextInput
                                    id="key"
                                    value={form.data.key}
                                    onChange={(e) => form.setData('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                    className="mt-1 w-full font-mono text-sm"
                                    placeholder={t('document.types.key_placeholder')}
                                    disabled={!!editing}
                                />
                                <InputError message={form.errors.key} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('document.types.applies_to')} />
                            <div className="mt-2 flex gap-4">
                                {['vehicle', 'driver'].map((et) => (
                                    <label key={et} className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="entity_type"
                                            value={et}
                                            checked={form.data.entity_type === et}
                                            onChange={() => form.setData('entity_type', et)}
                                            disabled={!!editing}
                                            className="text-indigo-600"
                                        />
                                        <span className="text-sm">{entityLabel(et)}</span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={form.errors.entity_type} className="mt-1" />
                        </div>

                        <div className="flex gap-6">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_required}
                                    onChange={(e) => form.setData('is_required', e.target.checked)}
                                    className="rounded text-indigo-600"
                                />
                                <span className="text-sm">{t('document.types.required')}</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.data.has_expiry}
                                    onChange={(e) => form.setData('has_expiry', e.target.checked)}
                                    className="rounded text-indigo-600"
                                />
                                <span className="text-sm">{t('document.types.has_expiry')}</span>
                            </label>
                        </div>

                        <div>
                            <InputLabel htmlFor="typical_validity_days" value={t('document.types.validity')} />
                            <TextInput
                                id="typical_validity_days"
                                type="number"
                                min="1"
                                value={form.data.typical_validity_days}
                                onChange={(e) => form.setData('typical_validity_days', e.target.value)}
                                className="mt-1 w-full"
                                placeholder={t('document.types.validity_placeholder')}
                                disabled={!form.data.has_expiry}
                            />
                            <InputError message={form.errors.typical_validity_days} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reminder_days" value={t('document.types.reminder')} />
                            <TextInput
                                id="reminder_days"
                                value={form.data.reminder_days}
                                onChange={(e) => form.setData('reminder_days', e.target.value)}
                                className="mt-1 w-full"
                                placeholder={t('document.types.reminder_placeholder')}
                                disabled={!form.data.has_expiry}
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                {t('document.types.reminder_hint')}
                            </p>
                            <InputError message={form.errors.reminder_days} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModal}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>
                            {form.processing
                                ? t('document.types.saving')
                                : editing
                                  ? t('document.types.save')
                                  : t('document.types.create')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={toDelete !== null}
                title={t('document.types.delete_title')}
                message={t('document.types.delete_message', { name: toDelete?.name ?? '' })}
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
                processing={deleting.processing}
            />
        </DynamicLayout>
    );
}
