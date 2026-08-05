import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import PageHeader from '@/Components/PageHeader';
import PartnersNav from '../../../PartnersNav';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money';

interface Industry {
    id: number;
    name: string;
}

interface Title {
    id: number;
    name: string;
    short_name: string;
}

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface ParentPartner {
    id: number;
    name: string;
    code: string;
}

interface PartnerTypeOption {
    id: number;
    code: string;
    name: string;
}

interface PartnerTypeRef {
    id: number;
    code: string;
    label?: string;
    name?: string | Record<string, string>;
}

interface PartnerData {
    id: number;
    code: string;
    account_type: string;
    sub_type: string | null;
    types?: PartnerTypeRef[];
    name: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    job_title: string | null;
    website: string | null;
    tax_id: string | null;
    id_number: string | null;
    license_number: string | null;
    license_expires_at: string | null;
    company_registry: string | null;
    reference: string | null;
    parent_id: number | null;
    industry_id: number | null;
    title_id: number | null;
    customer_rank: number;
    supplier_rank: number;
    credit_limit: string | null;
    payment_term_days: number | null;
    price_list_id?: number | null;
    address: string | null;
    notes: string | null;
    comment: string | null;
    status: string;
    is_blacklisted: boolean;
    blacklist_reason: string | null;
    portal_user_id: number | null;
    tags: Tag[];
}

interface PortalUser {
    id: number;
    name: string;
    email: string;
}

interface Props {
    partner: PartnerData;
    industries: Industry[];
    titles: Title[];
    tags: Tag[];
    partners: ParentPartner[];
    priceLists?: Array<{ id: number; name: string; code: string | null }>;
    portalUsers?: PortalUser[];
    partnerTypes: PartnerTypeOption[];
}

export default function Edit({ partner, industries, titles, tags, partners, priceLists = [], portalUsers = [], partnerTypes }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        account_type: partner.account_type,
        name: partner.name,
        email: partner.email || '',
        phone: partner.phone || '',
        mobile: partner.mobile || '',
        job_title: partner.job_title || '',
        website: partner.website || '',
        tax_id: partner.tax_id || '',
        id_number: partner.id_number || '',
        license_number: partner.license_number || '',
        license_expires_at: partner.license_expires_at || '',
        company_registry: partner.company_registry || '',
        reference: partner.reference || '',
        parent_id: partner.parent_id ? String(partner.parent_id) : '',
        industry_id: partner.industry_id ? String(partner.industry_id) : '',
        title_id: partner.title_id ? String(partner.title_id) : '',
        type_ids: partner.types?.map((type) => type.id) ?? [],
        credit_limit: partner.credit_limit ? parseMoneyInput(formatMoneyInput(partner.credit_limit)) : '',
        payment_term_days: partner.payment_term_days != null ? String(partner.payment_term_days) : '',
        price_list_id: partner.price_list_id ? String(partner.price_list_id) : '',
        address: partner.address || '',
        notes: partner.notes || '',
        comment: partner.comment || '',
        status: partner.status,
        is_blacklisted: !!partner.is_blacklisted,
        blacklist_reason: partner.blacklist_reason || '',
        portal_user_id: partner.portal_user_id ? String(partner.portal_user_id) : '',
        tag_ids: partner.tags.map((tag) => tag.id),
    });

    const isIndividual = data.account_type === 'individual';

    const toggleType = (typeId: number) => {
        setData(
            'type_ids',
            data.type_ids.includes(typeId)
                ? data.type_ids.filter((id) => id !== typeId)
                : [...data.type_ids, typeId],
        );
    };

    const toggleTag = (tagId: number) => {
        setData('tag_ids', data.tag_ids.includes(tagId)
            ? data.tag_ids.filter((id) => id !== tagId)
            : [...data.tag_ids, tagId]);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('partners.update', partner.id));
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('partners.edit.head')} />}
        >
            <Head title={t('partners.edit.title', { name: partner.name })} />

            <PartnersNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        {/* Tipe Akun & Peran */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="account_type" value={t('partners.fields.account_type')} />
                                <Select
                                    id="account_type"
                                    className="mt-1"
                                    value={data.account_type}
                                    onChange={(value) => setData('account_type', value)}
                                    options={[
                                        { value: 'company', label: t('partners.account_type.company') },
                                        { value: 'individual', label: t('partners.account_type.individual') },
                                    ]}
                                />
                                <InputError message={errors.account_type} className="mt-2" />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel value={t('partners.fields.contact_types')} />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {partnerTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => toggleType(type.id)}
                                            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                                data.type_ids.includes(type.id)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {type.name}
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.type_ids} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value={t('partners.fields.status')} />
                                <Select
                                    id="status"
                                    className="mt-1"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    options={[
                                        { value: 'active', label: t('partners.status.active') },
                                        { value: 'inactive', label: t('partners.status.inactive') },
                                    ]}
                                />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Identitas */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {isIndividual && (
                                <div>
                                    <InputLabel htmlFor="title_id" value={t('partners.fields.title')} />
                                    <Select
                                        id="title_id"
                                        className="mt-1"
                                        value={data.title_id}
                                        onChange={(value) => setData('title_id', value)}
                                        placeholder={t('partners.placeholders.select_title')}
                                        options={[
                                            { value: '', label: t('partners.placeholders.none') },
                                            ...titles.map((title) => ({ value: String(title.id), label: `${title.short_name} (${title.name})` })),
                                        ]}
                                    />
                                </div>
                            )}
                            <div className={isIndividual ? '' : 'sm:col-span-2'}>
                                <InputLabel htmlFor="name" value={t('partners.fields.name')} />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            {isIndividual && (
                                <div>
                                    <InputLabel htmlFor="job_title" value={t('partners.fields.job_title')} />
                                    <TextInput id="job_title" className="mt-1 block w-full" value={data.job_title} onChange={(e) => setData('job_title', e.target.value)} />
                                    <InputError message={errors.job_title} className="mt-2" />
                                </div>
                            )}
                            {isIndividual && (
                                <div>
                                    <InputLabel htmlFor="parent_id" value={t('partners.fields.parent_company')} />
                                    <Select
                                        id="parent_id"
                                        className="mt-1"
                                        value={data.parent_id}
                                        onChange={(value) => setData('parent_id', value)}
                                        placeholder={t('partners.placeholders.select_company')}
                                        options={[
                                            { value: '', label: t('partners.placeholders.none') },
                                            ...partners.map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
                                        ]}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Kontak */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="phone" value={t('partners.fields.phone')} />
                                <TextInput id="phone" className="mt-1 block w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="mobile" value={t('partners.fields.mobile')} />
                                <TextInput id="mobile" className="mt-1 block w-full" value={data.mobile} onChange={(e) => setData('mobile', e.target.value)} />
                                <InputError message={errors.mobile} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value={t('partners.fields.email')} />
                                <TextInput id="email" type="email" className="mt-1 block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="website" value={t('partners.fields.website')} />
                                <TextInput id="website" className="mt-1 block w-full" value={data.website} onChange={(e) => setData('website', e.target.value)} />
                                <InputError message={errors.website} className="mt-2" />
                            </div>
                        </div>

                        {/* Bisnis */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="industry_id" value={t('partners.fields.industry')} />
                                <Select
                                    id="industry_id"
                                    className="mt-1"
                                    value={data.industry_id}
                                    onChange={(value) => setData('industry_id', value)}
                                    placeholder={t('partners.placeholders.select_industry')}
                                    options={[
                                        { value: '', label: t('partners.placeholders.none') },
                                        ...industries.map((i) => ({ value: String(i.id), label: i.name })),
                                    ]}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="tax_id" value={t('partners.fields.tax_id')} />
                                <TextInput id="tax_id" className="mt-1 block w-full" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} />
                                <InputError message={errors.tax_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="id_number" value={t('partners.fields.id_number')} />
                                <TextInput id="id_number" className="mt-1 block w-full" value={data.id_number} onChange={(e) => setData('id_number', e.target.value)} />
                                <InputError message={errors.id_number} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="license_number" value={t('partners.fields.license_number')} />
                                <TextInput id="license_number" className="mt-1 block w-full" value={data.license_number} onChange={(e) => setData('license_number', e.target.value)} />
                                <InputError message={errors.license_number} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="license_expires_at" value={t('partners.fields.license_expires_at')} />
                                <TextInput id="license_expires_at" type="date" className="mt-1 block w-full" value={data.license_expires_at} onChange={(e) => setData('license_expires_at', e.target.value)} />
                                <InputError message={errors.license_expires_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="credit_limit" value={t('partners.fields.credit_limit')} />
                                <MoneyInput
                                    id="credit_limit"
                                    className="mt-1 block w-full"
                                    value={data.credit_limit}
                                    onChange={(value) => setData('credit_limit', value)}
                                />
                                <InputError message={errors.credit_limit} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="payment_term_days" value={t('partners.fields.payment_term_days')} />
                                <TextInput id="payment_term_days" type="number" className="mt-1 block w-full" value={data.payment_term_days} onChange={(e) => setData('payment_term_days', e.target.value)} min="0" max="365" />
                                <InputError message={errors.payment_term_days} className="mt-2" />
                            </div>
                            <div className="sm:col-span-3 space-y-3 rounded-md border border-gray-200 p-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_blacklisted}
                                        onChange={(e) => setData('is_blacklisted', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{t('partners.fields.is_blacklisted')}</span>
                                </label>
                                {data.is_blacklisted && (
                                    <div>
                                        <InputLabel htmlFor="blacklist_reason" value={t('partners.fields.blacklist_reason')} />
                                        <TextInput id="blacklist_reason" className="mt-1 block w-full" value={data.blacklist_reason} onChange={(e) => setData('blacklist_reason', e.target.value)} />
                                        <InputError message={errors.blacklist_reason} className="mt-2" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <InputLabel htmlFor="portal_user_id" value={t('partners.fields.portal_user')} />
                                <Select
                                    id="portal_user_id"
                                    className="mt-1"
                                    value={data.portal_user_id}
                                    onChange={(value) => setData('portal_user_id', value)}
                                    placeholder={t('partners.placeholders.no_portal_user')}
                                    options={[
                                        { value: '', label: t('partners.placeholders.no_portal_user') },
                                        ...portalUsers.map((user) => ({
                                            value: String(user.id),
                                            label: `${user.name} (${user.email})`,
                                        })),
                                    ]}
                                />
                                <InputError message={errors.portal_user_id} className="mt-2" />
                            </div>
                            {priceLists.length > 0 && (
                                <div>
                                    <InputLabel value={t('partners.fields.price_list')} />
                                    <Select
                                        className="mt-1"
                                        value={data.price_list_id}
                                        onChange={(value) => setData('price_list_id', value)}
                                        placeholder={t('partners.placeholders.none')}
                                        options={[
                                            { value: '', label: t('partners.placeholders.none') },
                                            ...priceLists.map((list) => ({
                                                value: String(list.id),
                                                label: list.code ? `${list.code} — ${list.name}` : list.name,
                                            })),
                                        ]}
                                    />
                                    <InputError message={errors.price_list_id} className="mt-2" />
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div>
                                <InputLabel value={t('partners.fields.tags')} />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleTag(tag.id)}
                                            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                                data.tag_ids.includes(tag.id)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alamat & Catatan */}
                        <div>
                            <InputLabel htmlFor="address" value={t('partners.fields.address')} />
                            <textarea id="address" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                            <InputError message={errors.address} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value={t('partners.fields.notes')} />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('partners.edit.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('partners.show', partner.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
