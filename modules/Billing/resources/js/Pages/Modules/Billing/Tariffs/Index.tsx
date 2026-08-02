import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';
import PageHeader from '@/Components/PageHeader';

interface Partner {
    id: number;
    code: string;
    name: string;
}

interface LocationOption {
    id: number;
    code: string;
    name: string;
    city: string | null;
}

interface Tariff {
    id: number;
    partner_id: number | null;
    origin_location_id: number | null;
    destination_location_id: number | null;
    origin: string;
    destination: string;
    price: string;
    is_active: boolean;
    partner: Partner | null;
    origin_location?: LocationOption | null;
    destination_location?: LocationOption | null;
}

interface PaginatedTariffs {
    data: Tariff[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    tariffs: PaginatedTariffs;
    partners: Partner[];
    locations: LocationOption[];
    filters: { search: string | null; partner_id: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ tariffs, partners, locations, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Tariff | null>(null);
    const [deleting, setDeleting] = useState<Tariff | null>(null);

    const form = useForm({
        partner_id: '',
        origin_location_id: '',
        destination_location_id: '',
        origin: '',
        destination: '',
        price: '',
        is_active: true,
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (tariff: Tariff) => {
        setEditing(tariff);
        form.clearErrors();
        form.setData({
            partner_id: tariff.partner_id ? String(tariff.partner_id) : '',
            origin_location_id: tariff.origin_location_id ? String(tariff.origin_location_id) : '',
            destination_location_id: tariff.destination_location_id ? String(tariff.destination_location_id) : '',
            origin: tariff.origin,
            destination: tariff.destination,
            price: tariff.price,
            is_active: tariff.is_active,
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
            form.patch(prefixedRoute('billing.tariffs.update', editing.id), options);
        } else {
            form.post(prefixedRoute('billing.tariffs.store'), options);
        }
    };

    const confirmDelete = () => {
        if (!deleting) return;
        router.delete(prefixedRoute('billing.tariffs.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('billing.tariffs.index'), {
            search: search || undefined,
            partner_id: filters.partner_id || undefined,
        }, { preserveState: true, replace: true });
    };

    const handlePartnerFilter = (partnerId: string) => {
        router.get(prefixedRoute('billing.tariffs.index'), {
            search: search || undefined,
            partner_id: partnerId || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('billing.title')}
                    actions={can.create && <PrimaryButton onClick={openCreate}>{t('billing.tariffs.new')}</PrimaryButton>}
                />
            }
        >
            <Head title={t('billing.tariffs.head')} />

            <BillingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('billing.tariffs.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-56"
                            value={filters.partner_id || ''}
                            onChange={handlePartnerFilter}
                            placeholder={t('billing.tariffs.all_partners')}
                            options={[
                                { value: '', label: t('billing.tariffs.all_partners') },
                                ...partners.map((partner) => ({ value: String(partner.id), label: partner.name })),
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {tariffs.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('billing.tariffs.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('billing.tariffs.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.tariffs.columns.route')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.tariffs.columns.partner')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.tariffs.columns.price')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.tariffs.columns.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {tariffs.data.map((tariff) => (
                                            <tr key={tariff.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {tariff.origin} → {tariff.destination}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {tariff.partner ? tariff.partner.name : (
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{t('billing.tariffs.general')}</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{formatMoney(tariff.price)}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tariff.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {tariff.is_active ? t('billing.status.active') : t('billing.status.inactive')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && (
                                                            <button onClick={() => openEdit(tariff)} className="text-indigo-600 hover:text-indigo-900">{t('common.edit')}</button>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => setDeleting(tariff)} className="text-red-600 hover:text-red-900">{t('common.delete')}</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {tariffs.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (tariffs.current_page - 1) * tariffs.per_page + 1,
                                            to: Math.min(tariffs.current_page * tariffs.per_page, tariffs.total),
                                            total: tariffs.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {tariffs.links.map((link, index) => (
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

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">{editing ? t('billing.tariffs.edit') : t('billing.tariffs.new')}</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="t_partner_id" value={t('billing.tariffs.partner_optional')} />
                            <Select
                                id="t_partner_id"
                                className="mt-1"
                                value={form.data.partner_id}
                                onChange={(value) => form.setData('partner_id', value)}
                                placeholder={t('billing.tariffs.general_tariff')}
                                options={[
                                    { value: '', label: t('billing.tariffs.general_tariff') },
                                    ...partners.map((partner) => ({ value: String(partner.id), label: `${partner.name} (${partner.code})` })),
                                ]}
                            />
                            <InputError message={form.errors.partner_id} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="t_origin_location" value={t('billing.tariffs.origin')} />
                                <Select
                                    id="t_origin_location"
                                    className="mt-1"
                                    value={form.data.origin_location_id}
                                    onChange={(value) => form.setData('origin_location_id', value)}
                                    placeholder={t('billing.tariffs.select_location')}
                                    options={locations.map((location) => ({
                                        value: String(location.id),
                                        label: `${location.name} (${location.code})`,
                                    }))}
                                />
                                <InputError message={form.errors.origin_location_id || form.errors.origin} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="t_destination_location" value={t('billing.tariffs.destination')} />
                                <Select
                                    id="t_destination_location"
                                    className="mt-1"
                                    value={form.data.destination_location_id}
                                    onChange={(value) => form.setData('destination_location_id', value)}
                                    placeholder={t('billing.tariffs.select_location')}
                                    options={locations.map((location) => ({
                                        value: String(location.id),
                                        label: `${location.name} (${location.code})`,
                                    }))}
                                />
                                <InputError message={form.errors.destination_location_id || form.errors.destination} className="mt-2" />
                            </div>
                        </div>
                        {locations.length === 0 && (
                            <p className="text-sm text-amber-700">{t('billing.tariffs.no_locations_hint')}</p>
                        )}
                        <div>
                            <InputLabel htmlFor="t_price" value={t('billing.tariffs.price')} />
                            <TextInput id="t_price" type="number" min={0} step="0.01" className="mt-1 block w-full" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} required />
                            <InputError message={form.errors.price} className="mt-2" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                            />
                            {t('billing.tariffs.active')}
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={deleting !== null} onClose={() => setDeleting(null)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{t('billing.tariffs.delete_title')}</h3>
                    <p className="text-sm text-gray-500">
                        {deleting
                            ? t('billing.tariffs.delete_confirm', { origin: deleting.origin, destination: deleting.destination })
                            : ''}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setDeleting(null)}>{t('common.cancel')}</SecondaryButton>
                        <DangerButton onClick={confirmDelete}>{t('common.delete')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
