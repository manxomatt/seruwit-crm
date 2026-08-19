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
import { useState, FormEventHandler, type ReactNode } from 'react';
import PartnersNav from '../../../PartnersNav';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money';

// SVG Icons
const Icons = {
    Building: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1v-4a1 1 0 011-1h2a1 1 0 011 1v4h1m-6 0h6M10 7h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2" />
        </svg>
    ),
    User: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Check: () => (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Phone: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    Briefcase: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    ShieldAlert: () => (
        <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    Tag: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    ),
    Eye: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
};

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
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="space-y-5 p-6">{children}</div>
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
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${active
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30 dark:bg-indigo-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white'
                }`}
        >
            {active && <Icons.Check />}
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
    const [activeSection, setActiveSection] = useState<'account' | 'contact' | 'business' | 'notes'>('account');
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
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
            : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300';
    const displayName = data.name.trim() || partner.name;

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
        'mt-1 block w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-xs leading-relaxed p-3';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('partners.title')}</p>
                        <h2 className="text-xl font-black leading-tight text-slate-900 dark:text-white">{t('partners.edit.head')}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('partners.show', partner.id)}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs shadow-xs gap-1.5">
                                <Icons.Eye />
                                {t('partners.edit.view_contact')}
                            </SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" form="partner-edit-form" disabled={processing} className="!rounded-xl text-xs shadow-xs">
                            {t('partners.edit.submit')}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title={t('partners.edit.title', { name: partner.name })} />

            <PartnersNav />

            <form id="partner-edit-form" onSubmit={submit} className="space-y-6">
                {/* Header Banner & Live Preview */}
                <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="h-20 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-violet-500/10 dark:from-indigo-950/40 dark:via-sky-950/40 dark:to-violet-950/40 border-b border-slate-100 dark:border-slate-800/80" />
                    <div className="flex flex-col gap-5 p-6 pt-0 sm:flex-row sm:items-end -mt-10">
                        <div className="relative shrink-0">
                            {data.picture_url ? (
                                <img
                                    src={data.picture_url}
                                    alt={displayName}
                                    className={`h-20 w-20 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-md ${avatarTone}`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
                                        if (fallback) { fallback.style.display = 'flex'; }
                                    }}
                                />
                            ) : null}
                            <div
                                className={`h-20 w-20 flex-col items-center justify-center rounded-3xl border-4 border-white dark:border-slate-900 shadow-md ${avatarTone} ${data.picture_url ? 'absolute inset-0 hidden' : 'flex'}`}
                            >
                                <span className="text-2xl font-black">{initials(displayName) || '—'}</span>
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${data.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                >
                                    {t(`partners.status.${data.status}`)}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {data.account_type === 'company' ? <Icons.Building /> : <Icons.User />}
                                    {t(`partners.account_type.${data.account_type}`)}
                                </span>
                                {data.is_blacklisted && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-600/20">
                                        <Icons.ShieldAlert />
                                        {t('partners.fields.is_blacklisted')}
                                    </span>
                                )}
                            </div>
                            <h1 className="truncate text-xl font-black tracking-tight text-slate-900 dark:text-white">{displayName}</h1>
                            <p className="font-mono text-xs font-semibold text-slate-400">{partner.code}</p>
                        </div>
                    </div>
                </section>

                {/* Section Step Navigation */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
                    {[
                        { id: 'account', label: '1. Identitas & Tipe', icon: Icons.User },
                        { id: 'contact', label: '2. Kontak & Alamat', icon: Icons.Phone },
                        { id: 'business', label: '3. Bisnis & Keuangan', icon: Icons.Briefcase },
                        { id: 'notes', label: '4. Tag & Catatan', icon: Icons.Tag },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeSection === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${active
                                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Icon />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Form Sections */}
                {activeSection === 'account' && (
                    <div className="space-y-6">
                        <FormSection
                            title={t('partners.edit.sections.account')}
                            subtitle={t('partners.edit.sections.account_hint')}
                        >
                            <div>
                                <InputLabel value={t('partners.fields.account_type')} />
                                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {(['company', 'individual'] as const).map((type) => {
                                        const active = data.account_type === type;
                                        const Icon = type === 'company' ? Icons.Building : Icons.User;

                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setData('account_type', type)}
                                                className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${active
                                                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                    <Icon />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black ${active ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}>
                                                        {t(`partners.account_type.${type}`)}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        {type === 'company' ? 'Entitas bisnis, PT, CV, Organisasi' : 'Perorangan, Karyawan, Owner'}
                                                    </p>
                                                </div>
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
                                        className="mt-1 block w-full bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-mono text-xs"
                                        value={partner.code}
                                        disabled
                                        readOnly
                                    />
                                    <p className="mt-1 text-xs text-slate-400">{t('partners.edit.code_readonly')}</p>
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t('partners.fields.contact_types')} />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('partners.edit.types_hint')}</p>
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
                                    <>
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
                                    </>
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
                    </div>
                )}

                {activeSection === 'contact' && (
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
                                    rows={3}
                                    className={textareaClass}
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                <InputError message={errors.address} className="mt-2" />
                            </div>
                        </div>
                    </FormSection>
                )}

                {activeSection === 'business' && (
                    <div className="space-y-6">
                        <FormSection
                            title={t('partners.edit.sections.business')}
                            subtitle={t('partners.edit.sections.business_hint')}
                        >
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                            </div>
                        </FormSection>

                        <FormSection
                            title={t('partners.edit.sections.risk')}
                            subtitle={t('partners.edit.sections.risk_hint')}
                        >
                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${data.is_blacklisted
                                    ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={data.is_blacklisted}
                                    onChange={(e) => setData('is_blacklisted', e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-rose-600 shadow-xs focus:ring-rose-500"
                                />
                                <span>
                                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                                        {t('partners.fields.is_blacklisted')}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                                        Partner tidak dapat diproses dalam transaksi baru jika dimasukkan ke daftar hitam.
                                    </span>
                                </span>
                            </label>
                            {data.is_blacklisted && (
                                <div className="pt-2">
                                    <InputLabel htmlFor="blacklist_reason" value={t('partners.fields.blacklist_reason')} />
                                    <TextInput
                                        id="blacklist_reason"
                                        className="mt-1 block w-full"
                                        value={data.blacklist_reason}
                                        onChange={(e) => setData('blacklist_reason', e.target.value)}
                                        placeholder="Alasan blacklist..."
                                    />
                                    <InputError message={errors.blacklist_reason} className="mt-2" />
                                </div>
                            )}
                        </FormSection>
                    </div>
                )}

                {activeSection === 'notes' && (
                    <div className="space-y-6">
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
                                            🏷️ {tag.name}
                                        </ChoiceChip>
                                    ))}
                                </div>
                            </FormSection>
                        )}

                        <FormSection
                            title={t('partners.edit.sections.notes')}
                            subtitle={t('partners.edit.sections.notes_hint')}
                        >
                            <div className="space-y-4">
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
                            </div>
                        </FormSection>
                    </div>
                )}

                {/* Sticky Action Footer */}
                <div className="sticky bottom-4 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-5 py-4 shadow-lg backdrop-blur-md">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-900 dark:text-white">{displayName}</span>
                            <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
                            <span className="font-mono text-xs">{partner.code}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('partners.show', partner.id)}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="!rounded-xl text-xs">{t('partners.edit.submit')}</PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
