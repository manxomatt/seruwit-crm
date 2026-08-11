import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PartnersNav from '../../../../PartnersNav';

type LocaleMap = { id?: string; en?: string };

interface PartnerTypeRow {
    id: number;
    code: string;
    name: LocaleMap | string;
    description: LocaleMap | string | null;
    label?: string;
    description_label?: string | null;
    affects_customer_rank: boolean;
    affects_supplier_rank: boolean;
    is_active: boolean;
    partners_count: number;
}

interface PaginatedTypes {
    data: PartnerTypeRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    types: PaginatedTypes;
    filters: { search: string | null; active: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

function localeValue(value: LocaleMap | string | null | undefined, locale: 'id' | 'en'): string {
    if (value == null) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    return value[locale] ?? '';
}

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

export default function Index({ types, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<PartnerTypeRow | null>(null);
    const [deleting, setDeleting] = useState<PartnerTypeRow | null>(null);

    const form = useForm({
        code: '',
        name: { id: '', en: '' },
        description: { id: '', en: '' },
        affects_customer_rank: false,
        affects_supplier_rank: false,
        is_active: true,
    });

    const openCreate = (): void => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (type: PartnerTypeRow): void => {
        setEditing(type);
        form.clearErrors();
        form.setData({
            code: type.code,
            name: {
                id: localeValue(type.name, 'id'),
                en: localeValue(type.name, 'en'),
            },
            description: {
                id: localeValue(type.description, 'id'),
                en: localeValue(type.description, 'en'),
            },
            affects_customer_rank: type.affects_customer_rank,
            affects_supplier_rank: type.affects_supplier_rank,
            is_active: type.is_active,
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowModal(false);
                form.reset();
            },
        };

        if (editing) {
            form.patch(prefixedRoute('partners.types.update', editing.id), options);
        } else {
            form.post(prefixedRoute('partners.types.store'), options);
        }
    };

    const confirmDelete = (): void => {
        if (!deleting) {
            return;
        }

        router.delete(prefixedRoute('partners.types.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('partners.types.index'),
            {
                search: search || undefined,
                active: filters.active || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('partners.types.head')}
                    description={t('partners.types.hint')}
                    actions={
                        can.create ? (
                            <PrimaryButton onClick={openCreate}>{t('partners.types.new')}</PrimaryButton>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('partners.types.head')} />

            <PartnersNav />

            {flash?.success && (
                <div className="mb-4 rounded-md bg-green-100 px-4 py-3 text-sm text-green-800">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-md bg-red-100 px-4 py-3 text-sm text-red-800">{flash.error}</div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('partners.types.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-44"
                            value={filters.active || ''}
                            onChange={(value) =>
                                router.get(
                                    prefixedRoute('partners.types.index'),
                                    {
                                        search: search || undefined,
                                        active: value || undefined,
                                    },
                                    { preserveState: true, replace: true },
                                )
                            }
                            placeholder={t('partners.types.all_status')}
                            options={[
                                { value: '', label: t('partners.types.all_status') },
                                { value: '1', label: t('partners.status.active') },
                                { value: '0', label: t('partners.status.inactive') },
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {types.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('partners.types.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('partners.types.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.fields.type')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.types.roles')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.types.contacts_count')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.fields.status')}
                                            </th>
                                            <th className="w-28 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                <span className="sr-only">{t('common.actions')}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {types.data.map((type) => (
                                            <tr key={type.id} className="group hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {type.label || localeValue(type.name, 'id')}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-gray-500">
                                                        {type.code} · ID: {localeValue(type.name, 'id') || '—'} · EN:{' '}
                                                        {localeValue(type.name, 'en') || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <div className="flex flex-wrap gap-1">
                                                        {type.affects_customer_rank && (
                                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                                                                {t('partners.role.customer')}
                                                            </span>
                                                        )}
                                                        {type.affects_supplier_rank && (
                                                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                                                                {t('partners.role.supplier')}
                                                            </span>
                                                        )}
                                                        {!type.affects_customer_rank && !type.affects_supplier_rank && (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm tabular-nums text-gray-700">
                                                    {type.partners_count}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${type.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {type.is_active
                                                            ? t('partners.status.active')
                                                            : t('partners.status.inactive')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
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
                                                            {can.update && (
                                                                <MenuItem>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEdit(type)}
                                                                        className={menuItemClassName}
                                                                    >
                                                                        <span className="text-indigo-600">
                                                                            <PencilIcon />
                                                                        </span>
                                                                        {t('common.edit')}
                                                                    </button>
                                                                </MenuItem>
                                                            )}
                                                            {(can.update && can.delete) && (
                                                                <div className="my-1 border-t border-gray-100" />
                                                            )}
                                                            {can.delete && (
                                                                <MenuItem>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeleting(type)}
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
                                    </tbody>
                                </table>
                            </div>

                            {types.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (types.current_page - 1) * types.per_page + 1,
                                            to: Math.min(types.current_page * types.per_page, types.total),
                                            total: types.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {types.links.map((link, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${link.active
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

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                        {editing ? t('partners.types.edit') : t('partners.types.new')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="type_code" value={t('partners.fields.code')} />
                            <TextInput
                                id="type_code"
                                className="mt-1 block w-full"
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value)}
                                required
                                disabled={editing !== null}
                            />
                            <InputError message={form.errors.code} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="type_name_id" value={t('partners.types.name_id')} />
                                <TextInput
                                    id="type_name_id"
                                    className="mt-1 block w-full"
                                    value={form.data.name.id}
                                    onChange={(e) => form.setData('name', { ...form.data.name, id: e.target.value })}
                                    required
                                />
                                <InputError message={form.errors['name.id'] || form.errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="type_name_en" value={t('partners.types.name_en')} />
                                <TextInput
                                    id="type_name_en"
                                    className="mt-1 block w-full"
                                    value={form.data.name.en}
                                    onChange={(e) => form.setData('name', { ...form.data.name, en: e.target.value })}
                                    required
                                />
                                <InputError message={form.errors['name.en']} className="mt-2" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={form.data.affects_customer_rank}
                                    onChange={(e) => form.setData('affects_customer_rank', e.target.checked)}
                                />
                                {t('partners.types.affects_customer')}
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={form.data.affects_supplier_rank}
                                    onChange={(e) => form.setData('affects_supplier_rank', e.target.checked)}
                                />
                                {t('partners.types.affects_supplier')}
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                {t('partners.status.active')}
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={deleting !== null} onClose={() => setDeleting(null)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{t('partners.types.delete_title')}</h3>
                    <p className="text-sm text-gray-500">
                        {deleting
                            ? t('partners.types.delete_confirm', {
                                name: deleting.label || localeValue(deleting.name, 'id'),
                            })
                            : ''}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setDeleting(null)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <DangerButton onClick={confirmDelete}>{t('common.delete')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
