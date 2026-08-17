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
import PageHeader from '@/Components/PageHeader';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';

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
                    actions={can.create && (
                        <PrimaryButton onClick={openCreate} className="!rounded-xl text-xs shadow-sm">
                            ➕ {t('billing.tariffs.new')}
                        </PrimaryButton>
                    )}
                />
            }
        >
            <Head title={t('billing.tariffs.head')} />

            <BillingNav />

            {/* Filter Bar Card */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[200px] flex-1">
                        <TextInput
                            type="text"
                            placeholder={t('billing.tariffs.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full !rounded-2xl text-xs bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
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
                    <PrimaryButton type="submit" className="!rounded-xl text-xs shadow-sm">{t('common.search')}</PrimaryButton>
                </form>
            </div>

            {/* Tariffs Table Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.tariffs.columns.route')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.tariffs.columns.partner')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('billing.tariffs.columns.price')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.tariffs.columns.status')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {tariffs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center font-bold text-slate-400">
                                        {t('billing.tariffs.empty_title')}
                                    </td>
                                </tr>
                            ) : (
                                tariffs.data.map((tariff) => (
                                    <tr key={tariff.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                            {tariff.origin} → {tariff.destination}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                                            {tariff.partner ? tariff.partner.name : (
                                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">{t('billing.tariffs.general')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(tariff.price)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${tariff.is_active ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${tariff.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                                {tariff.is_active ? t('billing.status.active') : t('billing.status.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                {can.update && (
                                                    <button onClick={() => openEdit(tariff)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{t('common.edit')}</button>
                                                )}
                                                {can.delete && (
                                                    <button onClick={() => setDeleting(tariff)} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">{t('common.delete')}</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {tariffs.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
                                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-1 text-xs font-bold transition ${
                                        link.active
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : link.url
                                              ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                              : 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{editing ? t('billing.tariffs.edit') : t('billing.tariffs.new')}</h3>
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
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{t('billing.tariffs.no_locations_hint')}</p>
                        )}
                        <div>
                            <InputLabel htmlFor="t_price" value={t('billing.tariffs.price')} />
                            <TextInput id="t_price" type="number" min={0} step="0.01" className="mt-1 block w-full !rounded-2xl text-xs font-mono" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} required />
                            <InputError message={form.errors.price} className="mt-2" />
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                            />
                            {t('billing.tariffs.active')}
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={form.processing} className="!rounded-xl text-xs shadow-sm">💾 {t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={deleting !== null} onClose={() => setDeleting(null)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t('billing.tariffs.delete_title')}</h3>
                    <p className="text-xs text-slate-500">
                        {deleting
                            ? t('billing.tariffs.delete_confirm', { origin: deleting.origin, destination: deleting.destination })
                            : ''}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setDeleting(null)} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        <DangerButton onClick={confirmDelete} className="!rounded-xl text-xs">🚫 {t('common.delete')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}
