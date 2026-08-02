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
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PartnersNav from '../../../../PartnersNav';

interface Industry {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    partners_count: number;
}

interface PaginatedIndustries {
    data: Industry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    industries: PaginatedIndustries;
    filters: { search: string | null; active: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ industries, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Industry | null>(null);
    const [deleting, setDeleting] = useState<Industry | null>(null);

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const openCreate = (): void => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (industry: Industry): void => {
        setEditing(industry);
        form.clearErrors();
        form.setData({
            name: industry.name,
            description: industry.description || '',
            is_active: industry.is_active,
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
            form.patch(prefixedRoute('partners.industries.update', editing.id), options);
        } else {
            form.post(prefixedRoute('partners.industries.store'), options);
        }
    };

    const confirmDelete = (): void => {
        if (!deleting) {
            return;
        }

        router.delete(prefixedRoute('partners.industries.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('partners.industries.index'),
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
                    title={t('partners.industries.head')}
                    description={t('partners.industries.hint')}
                    actions={
                        can.create ? (
                            <PrimaryButton onClick={openCreate}>{t('partners.industries.new')}</PrimaryButton>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('partners.industries.head')} />

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
                                placeholder={t('partners.industries.search_placeholder')}
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
                                    prefixedRoute('partners.industries.index'),
                                    {
                                        search: search || undefined,
                                        active: value || undefined,
                                    },
                                    { preserveState: true, replace: true },
                                )
                            }
                            placeholder={t('partners.industries.all_status')}
                            options={[
                                { value: '', label: t('partners.industries.all_status') },
                                { value: '1', label: t('partners.status.active') },
                                { value: '0', label: t('partners.status.inactive') },
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {industries.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('partners.industries.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('partners.industries.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.fields.industry')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.industries.description')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.industries.partners_count')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('partners.fields.status')}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {t('common.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {industries.data.map((industry) => (
                                            <tr key={industry.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {industry.name}
                                                </td>
                                                <td className="max-w-md truncate px-6 py-4 text-sm text-gray-500">
                                                    {industry.description || '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm tabular-nums text-gray-700">
                                                    {industry.partners_count}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            industry.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {industry.is_active
                                                            ? t('partners.status.active')
                                                            : t('partners.status.inactive')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(industry)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                {t('common.edit')}
                                                            </button>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleting(industry)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                {t('common.delete')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {industries.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (industries.current_page - 1) * industries.per_page + 1,
                                            to: Math.min(industries.current_page * industries.per_page, industries.total),
                                            total: industries.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {industries.links.map((link, index) => (
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

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                        {editing ? t('partners.industries.edit') : t('partners.industries.new')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="industry_name" value={t('partners.fields.industry')} />
                            <TextInput
                                id="industry_name"
                                className="mt-1 block w-full"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={form.errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="industry_description" value={t('partners.industries.description')} />
                            <textarea
                                id="industry_description"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={3}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                            <InputError message={form.errors.description} className="mt-2" />
                        </div>
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
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{t('partners.industries.delete_title')}</h3>
                    <p className="text-sm text-gray-500">
                        {deleting ? t('partners.industries.delete_confirm', { name: deleting.name }) : ''}
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
