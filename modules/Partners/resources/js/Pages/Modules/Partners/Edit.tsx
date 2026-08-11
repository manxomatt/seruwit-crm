import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, type ReactNode } from 'react';
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
    picture_url: string | null;
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

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function FormSection({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
            </div>
            <div className="space-y-5 px-6 py-5">{children}</div>
        </section>
    );
}

function ChoiceChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
            {children}
        </button>
    );
}

export default function Edit({
    partner,
    industries,
    titles,
    tags,
    partners,
    priceLists = [],
    portalUsers = [],
    partnerTypes,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        account_type: partner.account_type,
        name: partner.name,
        picture_url: partner.picture_url || '',
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
    const avatarTone =
        data.account_type === 'company'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'border-sky-200 bg-sky-50 text-sky-700';

    const toggleType = (typeId: number) => {
        setData(
            'type_ids',
            data.type_ids.includes(typeId)
                ? data.type_ids.filter((id) => id !== typeId)
                : [...data.type_ids, typeId],
        );
    };

    const toggleTag = (tagId: number) => {
        setData(
            'tag_ids',
            data.tag_ids.includes(tagId)
                ? data.tag_ids.filter((id) => id !== tagId)
                : [...data.tag_ids, tagId],
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('partners.update', partner.id));
    };

    const textareaClass =
        'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('partners.title')}</p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('partners.edit.head')}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('partners.show', partner.id)}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" form="partner-edit-form" disabled={processing}>
                            {t('partners.edit.submit')}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title={t('partners.edit.title', { name: partner.name })} />

            <PartnersNav />

            <form id="partner-edit-form" onSubmit={submit} className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                        <div className="relative shrink-0">
                            {data.picture_url ? (
                                <img
                                    src={data.picture_url}
                                    alt={data.name || partner.name}
                                    className={`h-20 w-20 rounded-2xl object-cover border-2 ${avatarTone}`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
                                        if (fallback) {
                                            fallback.style.display = 'flex';
                                        }
                                    }}
                                />
                            ) : null}
                            <div
                                className={`h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 ${avatarTone} ${data.picture_url ? 'absolute inset-0 hidden' : 'flex'
                                    }`}
                                style={data.picture_url ? { display: 'none' } : {}}
                            >
                                <span className="text-xl font-semibold">{initials(data.name || partner.name) || '—'}</span>
                            </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${data.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                                        : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20'
                                        }`}
                                >
                                    {t(`partners.status.${data.status}`)}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
                                    {t(`partners.account_type.${data.account_type}`)}
                                </span>
                                {data.is_blacklisted && (
                                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                        {t('partners.fields.is_blacklisted')}
                                    </span>
                                )}
                            </div>
                            <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
                                {data.name || partner.name}
                            </h1>
                            <p className="font-mono text-sm text-gray-600">{partner.code}</p>
                            <p className="text-sm text-gray-500">{t('partners.edit.subtitle')}</p>
                        </div>
                        <Link href={prefixedRoute('partners.show', partner.id)} className="shrink-0">
                            <SecondaryButton type="button">{t('partners.edit.view_contact')}</SecondaryButton>
                        </Link>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <FormSection
                            title={t('partners.edit.sections.account')}
                            subtitle={t('partners.edit.sections.account_hint')}
                        >
                            <div>
                                <InputLabel value={t('partners.fields.account_type')} />
                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {(['company', 'individual'] as const).map((type) => {
                                        const active = data.account_type === type;

                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setData('account_type', type)}
                                                className={`rounded-xl border px-4 py-3 text-left transition ${active
                                                    ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <p className={`text-sm font-semibold ${active ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                    {t(`partners.account_type.${type}`)}
                                                </p>
                                                <p className={`mt-0.5 text-xs ${active ? 'text-indigo-700' : 'text-gray-500'}`}>
                                                    {type === 'company'
                                                        ? t('partners.dashboard.companies')
                                                        : t('partners.dashboard.individuals')}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.account_type} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                <div>
                                    <InputLabel value={t('partners.fields.code')} />
                                    <TextInput
                                        className="mt-1 block w-full bg-gray-50 text-gray-600"
                                        value={partner.code}
                                        disabled
                                        readOnly
                                    />
                                    <p className="mt-1 text-xs text-gray-500">{t('partners.edit.code_readonly')}</p>
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t('partners.fields.contact_types')} />
                                <p className="mt-1 text-xs text-gray-500">{t('partners.edit.types_hint')}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {partnerTypes.map((type) => (
                                        <ChoiceChip
                                            key={type.id}
                                            active={data.type_ids.includes(type.id)}
                                            onClick={() => toggleType(type.id)}
                                        >
                                            {type.name}
                                        </ChoiceChip>
                                    ))}
                                </div>
                                <InputError message={errors.type_ids} className="mt-2" />
                            </div>
                        </FormSection>

                        <FormSection
                            title={t('partners.edit.sections.identity')}
                            subtitle={t('partners.edit.sections.identity_hint')}
                        >
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                                ...titles.map((title) => ({
                                                    value: String(title.id),
                                                    label: `${title.short_name} (${title.name})`,
                                                })),
                                            ]}
                                        />
                                    </div>
                                )}
                                <div className={isIndividual ? '' : 'sm:col-span-2'}>
                                    <InputLabel htmlFor="name" value={t('partners.fields.name')} />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div className="sm:col-span-2">
                                    <InputLabel value={t('partners.fields.picture')} />
                                    <ImageUploader
                                        value={data.picture_url}
                                        onChange={(value) => setData('picture_url', value)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.picture_url} className="mt-2" />
                                </div>
                                {isIndividual && (
                                    <div>
                                        <InputLabel htmlFor="job_title" value={t('partners.fields.job_title')} />
                                        <TextInput
                                            id="job_title"
                                            className="mt-1 block w-full"
                                            value={data.job_title}
                                            onChange={(e) => setData('job_title', e.target.value)}
                                        />
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
                                                ...partners.map((p) => ({
                                                    value: String(p.id),
                                                    label: `${p.name} (${p.code})`,
                                                })),
                                            ]}
                                        />
                                    </div>
                                )}
                                <div>
                                    <InputLabel htmlFor="id_number" value={t('partners.fields.id_number')} />
                                    <TextInput
                                        id="id_number"
                                        className="mt-1 block w-full"
                                        value={data.id_number}
                                        onChange={(e) => setData('id_number', e.target.value)}
                                    />
                                    <InputError message={errors.id_number} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="reference" value={t('partners.fields.reference')} />
                                    <TextInput
                                        id="reference"
                                        className="mt-1 block w-full"
                                        value={data.reference}
                                        onChange={(e) => setData('reference', e.target.value)}
                                    />
                                    <InputError message={errors.reference} className="mt-2" />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection
                            title={t('partners.edit.sections.contact')}
                            subtitle={t('partners.edit.sections.contact_hint')}
                        >
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="phone" value={t('partners.fields.phone')} />
                                    <TextInput
                                        id="phone"
                                        className="mt-1 block w-full"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="mobile" value={t('partners.fields.mobile')} />
                                    <TextInput
                                        id="mobile"
                                        className="mt-1 block w-full"
                                        value={data.mobile}
                                        onChange={(e) => setData('mobile', e.target.value)}
                                    />
                                    <InputError message={errors.mobile} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="email" value={t('partners.fields.email')} />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="website" value={t('partners.fields.website')} />
                                    <TextInput
                                        id="website"
                                        className="mt-1 block w-full"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                    />
                                    <InputError message={errors.website} className="mt-2" />
                                </div>
                                <div className="sm:col-span-2">
                                    <InputLabel htmlFor="address" value={t('partners.fields.address')} />
                                    <textarea
                                        id="address"
                                        rows={2}
                                        className={textareaClass}
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                    />
                                    <InputError message={errors.address} className="mt-2" />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <FormSection
                            title={t('partners.edit.sections.business')}
                            subtitle={t('partners.edit.sections.business_hint')}
                        >
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
                                <TextInput
                                    id="tax_id"
                                    className="mt-1 block w-full"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                />
                                <InputError message={errors.tax_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_registry" value={t('partners.fields.company_registry')} />
                                <TextInput
                                    id="company_registry"
                                    className="mt-1 block w-full"
                                    value={data.company_registry}
                                    onChange={(e) => setData('company_registry', e.target.value)}
                                />
                                <InputError message={errors.company_registry} className="mt-2" />
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="license_number" value={t('partners.fields.license_number')} />
                                    <TextInput
                                        id="license_number"
                                        className="mt-1 block w-full"
                                        value={data.license_number}
                                        onChange={(e) => setData('license_number', e.target.value)}
                                    />
                                    <InputError message={errors.license_number} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="license_expires_at" value={t('partners.fields.license_expires_at')} />
                                    <TextInput
                                        id="license_expires_at"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.license_expires_at}
                                        onChange={(e) => setData('license_expires_at', e.target.value)}
                                    />
                                    <InputError message={errors.license_expires_at} className="mt-2" />
                                </div>
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
                                <TextInput
                                    id="payment_term_days"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.payment_term_days}
                                    onChange={(e) => setData('payment_term_days', e.target.value)}
                                    min="0"
                                    max="365"
                                />
                                <InputError message={errors.payment_term_days} className="mt-2" />
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
                        </FormSection>

                        <FormSection
                            title={t('partners.edit.sections.risk')}
                            subtitle={t('partners.edit.sections.risk_hint')}
                        >
                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${data.is_blacklisted
                                    ? 'border-rose-200 bg-rose-50'
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={data.is_blacklisted}
                                    onChange={(e) => setData('is_blacklisted', e.target.checked)}
                                    className="mt-0.5 rounded border-gray-300 text-rose-600 shadow-sm focus:ring-rose-500"
                                />
                                <span>
                                    <span className="block text-sm font-medium text-gray-900">
                                        {t('partners.fields.is_blacklisted')}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-gray-500">
                                        {t('partners.edit.sections.risk_hint')}
                                    </span>
                                </span>
                            </label>
                            {data.is_blacklisted && (
                                <div>
                                    <InputLabel htmlFor="blacklist_reason" value={t('partners.fields.blacklist_reason')} />
                                    <TextInput
                                        id="blacklist_reason"
                                        className="mt-1 block w-full"
                                        value={data.blacklist_reason}
                                        onChange={(e) => setData('blacklist_reason', e.target.value)}
                                    />
                                    <InputError message={errors.blacklist_reason} className="mt-2" />
                                </div>
                            )}
                        </FormSection>

                        {tags.length > 0 && (
                            <FormSection
                                title={t('partners.edit.sections.tags')}
                                subtitle={t('partners.edit.sections.tags_hint')}
                            >
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <ChoiceChip
                                            key={tag.id}
                                            active={data.tag_ids.includes(tag.id)}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.name}
                                        </ChoiceChip>
                                    ))}
                                </div>
                            </FormSection>
                        )}

                        <FormSection
                            title={t('partners.edit.sections.notes')}
                            subtitle={t('partners.edit.sections.notes_hint')}
                        >
                            <div>
                                <InputLabel htmlFor="notes" value={t('partners.fields.notes')} />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className={textareaClass}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="comment" value={t('partners.fields.comment')} />
                                <textarea
                                    id="comment"
                                    rows={3}
                                    className={textareaClass}
                                    value={data.comment}
                                    onChange={(e) => setData('comment', e.target.value)}
                                />
                                <InputError message={errors.comment} className="mt-2" />
                            </div>
                        </FormSection>
                    </div>
                </div>

                <div className="sticky bottom-4 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur">
                        <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-800">{data.name || partner.name}</span>
                            <span className="mx-2 text-gray-300">·</span>
                            <span className="font-mono text-xs">{partner.code}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('partners.show', partner.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>{t('partners.edit.submit')}</PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
