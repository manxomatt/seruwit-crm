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
    affects_customer_rank: boolean;
    affects_supplier_rank: boolean;
}

interface Props {
    industries: Industry[];
    titles: Title[];
    tags: Tag[];
    partners: ParentPartner[];
    priceLists?: Array<{ id: number; name: string; code: string | null }>;
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

export default function Create({
    industries,
    titles,
    tags,
    partners,
    priceLists = [],
    partnerTypes,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const defaultCustomerId = partnerTypes.find((type) => type.code === 'customer')?.id;
    const { data, setData, post, processing, errors } = useForm({
        account_type: 'company',
        name: '',
        picture_url: '',
        email: '',
        phone: '',
        mobile: '',
        job_title: '',
        website: '',
        tax_id: '',
        company_registry: '',
        reference: '',
        parent_id: '',
        industry_id: '',
        title_id: '',
        type_ids: defaultCustomerId ? [defaultCustomerId] : ([] as number[]),
        credit_limit: '',
        price_list_id: '',
        address: '',
        notes: '',
        comment: '',
        status: 'active',
        tag_ids: [] as number[],
    });

    const isIndividual = data.account_type === 'individual';
    const avatarTone =
        data.account_type === 'company'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'border-sky-200 bg-sky-50 text-sky-700';
    const displayName = data.name.trim() || t('partners.create.head');
    const selectedTypeNames = partnerTypes
        .filter((type) => data.type_ids.includes(type.id))
        .map((type) => type.name);

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
        post(prefixedRoute('partners.store'));
    };

    const textareaClass =
        'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('partners.title')}</p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('partners.create.head')}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('partners.index')}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" form="partner-create-form" disabled={processing}>
                            {t('partners.create.submit')}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title={t('partners.create.title')} />

            <PartnersNav />

            <form id="partner-create-form" onSubmit={submit} className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                        <div className="relative shrink-0">
                            {data.picture_url ? (
                                <img
                                    src={data.picture_url}
                                    alt={data.name.trim() || t('partners.create.head')}
                                    className={`h-20 w-20 rounded-2xl object-cover border-2 border-dashed ${avatarTone}`}
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
                                className={`h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 border-dashed ${avatarTone} ${data.picture_url ? 'absolute inset-0 hidden' : 'flex'
                                    }`}
                                style={data.picture_url ? { display: 'none' } : {}}
                            >
                                <span className="text-xl font-semibold">{initials(data.name) || '+'}</span>
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
                                {selectedTypeNames.slice(0, 3).map((name) => (
                                    <span
                                        key={name}
                                        className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20"
                                    >
                                        {name}
                                    </span>
                                ))}
                                {selectedTypeNames.length > 3 && (
                                    <span className="text-xs text-gray-500">+{selectedTypeNames.length - 3}</span>
                                )}
                            </div>
                            <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">{displayName}</h1>
                            <p className="text-sm text-gray-500">{t('partners.create.subtitle')}</p>
                            <p className="text-xs text-gray-400">{t('partners.create.code_hint')}</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <FormSection
                            title={t('partners.create.sections.account')}
                            subtitle={t('partners.create.sections.account_hint')}
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
                                <InputLabel value={t('partners.fields.contact_types')} />
                                <p className="mt-1 text-xs text-gray-500">{t('partners.create.types_hint')}</p>
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
                            title={t('partners.create.sections.identity')}
                            subtitle={t('partners.create.sections.identity_hint')}
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
                            title={t('partners.create.sections.contact')}
                            subtitle={t('partners.create.sections.contact_hint')}
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
                            title={t('partners.create.sections.business')}
                            subtitle={t('partners.create.sections.business_hint')}
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
                        </FormSection>

                        {tags.length > 0 && (
                            <FormSection
                                title={t('partners.create.sections.tags')}
                                subtitle={t('partners.create.sections.tags_hint')}
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
                            title={t('partners.create.sections.notes')}
                            subtitle={t('partners.create.sections.notes_hint')}
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
                            <span className="font-medium text-gray-800">{displayName}</span>
                            {selectedTypeNames.length > 0 && (
                                <>
                                    <span className="mx-2 text-gray-300">·</span>
                                    <span>{selectedTypeNames.slice(0, 2).join(', ')}</span>
                                </>
                            )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('partners.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>{t('partners.create.submit')}</PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
