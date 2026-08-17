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
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentType } from '../../../../documentUtils';
import PageHeader from '@/Components/PageHeader';

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

const PencilIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors';

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
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-3.5">{t('document.types.columns.name')}</th>
                        <th className="px-6 py-3.5">{t('document.types.columns.key')}</th>
                        <th className="px-6 py-3.5">{t('document.types.columns.required')}</th>
                        <th className="px-6 py-3.5">{t('document.types.columns.expiry')}</th>
                        <th className="px-6 py-3.5">{t('document.types.columns.validity')}</th>
                        <th className="px-6 py-3.5">{t('document.types.columns.reminder')}</th>
                        <th className="w-24 px-6 py-3.5 text-right">
                            <span className="sr-only">{t('common.actions')}</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {list.map((type) => (
                        <tr key={type.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{type.name}</td>
                            <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{type.key}</td>
                            <td className="px-6 py-4">
                                {type.is_required ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                        ✓
                                    </span>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-700">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {type.has_expiry ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                        ✓
                                    </span>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-700">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                                {type.typical_validity_days
                                    ? t('document.types.validity_days', { count: type.typical_validity_days })
                                    : '—'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {(type.reminder_days ?? []).map((d) => (
                                        <span key={d} className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                                            {d}d
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                <Menu as="div" className="relative inline-block text-right">
                                    <MenuButton
                                        className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                        title={t('common.actions')}
                                    >
                                        <EllipsisVerticalIcon />
                                    </MenuButton>

                                    <MenuItems
                                        transition
                                        anchor="bottom end"
                                        className="z-50 w-44 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                    >
                                        {can.update && (
                                            <MenuItem>
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(type)}
                                                    className={menuItemClassName}
                                                >
                                                    <span className="text-indigo-600 dark:text-indigo-400">
                                                        <PencilIcon />
                                                    </span>
                                                    {t('common.edit')}
                                                </button>
                                            </MenuItem>
                                        )}
                                        {(can.update && can.delete) && (
                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                        )}
                                        {can.delete && (
                                            <MenuItem>
                                                <button
                                                    type="button"
                                                    onClick={() => setToDelete(type)}
                                                    className={menuItemDangerClassName}
                                                >
                                                    <TrashIcon />
                                                    {t('common.delete')}
                                                </button>
                                            </MenuItem>
                                        )}
                                    </MenuItems>
                                </Menu>
                            </td>
                        </tr>
                    ))}
                    {list.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">
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
                <PageHeader
                    title={t('document.types.title')}
                    actions={can.create && (
                        <PrimaryButton onClick={openCreate} className="!rounded-xl text-xs shadow-sm">
                            ✨ {t('document.types.add')}
                        </PrimaryButton>
                    )}
                />
            }
        >
            <Head title={t('document.types.head')} />

            <DocumentNav />

            <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            🚘 {t('document.types.vehicle_section')}
                        </h3>
                    </div>
                    {renderTable(vehicleTypes)}
                </div>

                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            👤 {t('document.types.driver_section')}
                        </h3>
                    </div>
                    {renderTable(driverTypes)}
                </div>
            </div>

            {/* Modal Dialog Form */}
            <Modal show={showCreate} onClose={closeModal} maxWidth="lg">
                <form onSubmit={submit} className="p-6 bg-white dark:bg-slate-900 rounded-3xl">
                    <h3 className="mb-6 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {editing ? `✏️ ${t('document.types.edit_title')}` : `✨ ${t('document.types.create_title')}`}
                    </h3>

                    <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="name" value={t('document.types.name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="mt-1 w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    autoFocus
                                />
                                <InputError message={form.errors.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="key" value={t('document.types.key')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="key"
                                    value={form.data.key}
                                    onChange={(e) => form.setData('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                    className="mt-1 w-full !rounded-xl font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    placeholder={t('document.types.key_placeholder')}
                                    disabled={!!editing}
                                />
                                <InputError message={form.errors.key} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('document.types.applies_to')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <div className="mt-2 flex gap-4">
                                {['vehicle', 'driver'].map((et) => (
                                    <label key={et} className="flex cursor-pointer items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                        <input
                                            type="radio"
                                            name="entity_type"
                                            value={et}
                                            checked={form.data.entity_type === et}
                                            onChange={() => form.setData('entity_type', et)}
                                            disabled={!!editing}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>{entityLabel(et)}</span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={form.errors.entity_type} className="mt-1" />
                        </div>

                        <div className="flex gap-6 pt-2">
                            <label className="flex cursor-pointer items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_required}
                                    onChange={(e) => form.setData('is_required', e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{t('document.types.required')}</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={form.data.has_expiry}
                                    onChange={(e) => form.setData('has_expiry', e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{t('document.types.has_expiry')}</span>
                            </label>
                        </div>

                        <div>
                            <InputLabel htmlFor="typical_validity_days" value={t('document.types.validity')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="typical_validity_days"
                                type="number"
                                min="1"
                                value={form.data.typical_validity_days}
                                onChange={(e) => form.setData('typical_validity_days', e.target.value)}
                                className="mt-1 w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                placeholder={t('document.types.validity_placeholder')}
                                disabled={!form.data.has_expiry}
                            />
                            <InputError message={form.errors.typical_validity_days} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reminder_days" value={t('document.types.reminder')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="reminder_days"
                                value={form.data.reminder_days}
                                onChange={(e) => form.setData('reminder_days', e.target.value)}
                                className="mt-1 w-full !rounded-xl font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                placeholder={t('document.types.reminder_placeholder')}
                                disabled={!form.data.has_expiry}
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                                {t('document.types.reminder_hint')}
                            </p>
                            <InputError message={form.errors.reminder_days} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={closeModal} className="!rounded-xl text-xs">
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing} className="!rounded-xl text-xs shadow-sm">
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

