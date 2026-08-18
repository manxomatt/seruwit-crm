import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, FormEventHandler, type ReactNode } from 'react';
import PartnersNav from '../../../PartnersNav';

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PlusIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface Industry {
    id: number;
    name: string | Record<string, string>;
    label?: string;
}

interface Title {
    id: number;
    name: string;
    short_name: string;
}

interface Address {
    id: number;
    type: string;
    label: string | null;
    street: string | null;
    street2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    latitude: string | null;
    longitude: string | null;
    is_default: boolean;
}

interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_active: boolean;
    can_send_money: boolean;
}

interface ParentPartner {
    id: number;
    name: string;
    code: string;
}

interface ChildPartner {
    id: number;
    name: string;
    code: string;
    account_type: string;
}

interface PartnerTypeRef {
    id: number;
    code: string;
    label?: string;
}

interface Partner {
    id: number;
    code: string;
    account_type: string;
    sub_type: string | null;
    name: string;
    picture_url: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    job_title: string | null;
    website: string | null;
    tax_id: string | null;
    company_registry: string | null;
    reference: string | null;
    customer_rank: number;
    supplier_rank: number;
    credit_limit: string | null;
    address: string | null;
    notes: string | null;
    comment: string | null;
    status: string;
    industry: Industry | null;
    title: Title | null;
    parent: ParentPartner | null;
    children: ChildPartner[];
    tags: Tag[];
    types: PartnerTypeRef[];
    addresses: Address[];
    bank_accounts: BankAccount[];
}

interface Props {
    partner: Partner;
    can: { update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string): string => {
    return status === 'active'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
        : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
};

const typeBadgeColors = [
    'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
    'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
    'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20',
];

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function whatsappHref(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');

    if (digits.startsWith('0')) {
        return `https://wa.me/62${digits.slice(1)}`;
    }

    return `https://wa.me/${digits}`;
}

function formatWebsiteUrl(website: string): string {
    return website.startsWith('http') ? website : `https://${website}`;
}

function StatCard({
    label,
    value,
    hint,
    tone = 'default',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'default' | 'success' | 'warning';
}): JSX.Element {
    const valueTone =
        tone === 'success'
            ? 'text-emerald-600 dark:text-emerald-400'
            : tone === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-white';

    return (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/50 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`mt-1 text-xl font-black tabular-nums ${valueTone}`}>{value}</p>
            {hint && <p className="mt-0.5 text-[11px] font-medium text-slate-500">{hint}</p>}
        </div>
    );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800/80 py-3.5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="shrink-0 text-xs font-bold text-slate-400">{label}</dt>
            <dd className="text-xs font-bold text-slate-900 dark:text-white sm:text-right">{children}</dd>
        </div>
    );
}

function SectionCard({
    title,
    subtitle,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </section>
    );
}

function EmptyState({ message, hint }: { message: string; hint?: string }): JSX.Element {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{message}</p>
            {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
        </div>
    );
}

function AddressForm({ partnerId, onCancel }: { partnerId: number; onCancel: () => void }) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'shipping',
        label: '',
        street: '',
        street2: '',
        city: '',
        province: '',
        zip: '',
        country: 'Indonesia',
        is_default: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('partners.addresses.store', partnerId), {
            onSuccess: () => {
                reset();
                onCancel();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="addr_type" value={t('partners.fields.type')} />
                    <Select
                        id="addr_type"
                        className="mt-1"
                        value={data.type}
                        onChange={(value) => setData('type', value)}
                        options={[
                            { value: 'shipping', label: t('partners.address_type.shipping') },
                            { value: 'billing', label: t('partners.address_type.billing') },
                            { value: 'warehouse', label: t('partners.address_type.warehouse') },
                        ]}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="addr_label" value={t('partners.fields.label')} />
                    <TextInput
                        id="addr_label"
                        className="mt-1 block w-full"
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                        placeholder={t('partners.placeholders.address_label')}
                    />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={data.is_default}
                            onChange={(e) => setData('is_default', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{t('partners.fields.is_default')}</span>
                    </label>
                </div>
            </div>
            <div>
                <InputLabel htmlFor="addr_street" value={t('partners.fields.street')} />
                <TextInput
                    id="addr_street"
                    className="mt-1 block w-full"
                    value={data.street}
                    onChange={(e) => setData('street', e.target.value)}
                    required
                />
                <InputError message={errors.street} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="addr_city" value={t('partners.fields.city')} />
                    <TextInput
                        id="addr_city"
                        className="mt-1 block w-full"
                        value={data.city}
                        onChange={(e) => setData('city', e.target.value)}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="addr_province" value={t('partners.fields.province')} />
                    <TextInput
                        id="addr_province"
                        className="mt-1 block w-full"
                        value={data.province}
                        onChange={(e) => setData('province', e.target.value)}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="addr_zip" value={t('partners.fields.zip')} />
                    <TextInput
                        id="addr_zip"
                        className="mt-1 block w-full"
                        value={data.zip}
                        onChange={(e) => setData('zip', e.target.value)}
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <PrimaryButton disabled={processing}>{t('partners.show.save_address')}</PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>{t('common.cancel')}</SecondaryButton>
            </div>
        </form>
    );
}

function BankAccountForm({ partnerId, onCancel }: { partnerId: number; onCancel: () => void }) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors, reset } = useForm({
        bank_name: '',
        account_number: '',
        account_holder_name: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('partners.bank-accounts.store', partnerId), {
            onSuccess: () => {
                reset();
                onCancel();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="bank_name" value={t('partners.fields.bank_name')} />
                    <TextInput
                        id="bank_name"
                        className="mt-1 block w-full"
                        value={data.bank_name}
                        onChange={(e) => setData('bank_name', e.target.value)}
                        required
                    />
                    <InputError message={errors.bank_name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="account_number" value={t('partners.fields.account_number')} />
                    <TextInput
                        id="account_number"
                        className="mt-1 block w-full"
                        value={data.account_number}
                        onChange={(e) => setData('account_number', e.target.value)}
                        required
                    />
                    <InputError message={errors.account_number} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="account_holder_name" value={t('partners.fields.account_holder')} />
                    <TextInput
                        id="account_holder_name"
                        className="mt-1 block w-full"
                        value={data.account_holder_name}
                        onChange={(e) => setData('account_holder_name', e.target.value)}
                        required
                    />
                    <InputError message={errors.account_holder_name} className="mt-1" />
                </div>
            </div>
            <div className="flex gap-2">
                <PrimaryButton disabled={processing}>{t('partners.show.save_bank_account')}</PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>{t('common.cancel')}</SecondaryButton>
            </div>
        </form>
    );
}

export default function Show({ partner, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showBankForm, setShowBankForm] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
    const [bankAccountToDelete, setBankAccountToDelete] = useState<BankAccount | null>(null);
    const [deletingAddress, setDeletingAddress] = useState(false);
    const [deletingBankAccount, setDeletingBankAccount] = useState(false);

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('partners.destroy', partner.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDeleteAddress = () => {
        if (!addressToDelete) {
            return;
        }

        setDeletingAddress(true);
        router.delete(prefixedRoute('partners.addresses.destroy', [partner.id, addressToDelete.id]), {
            preserveScroll: true,
            onSuccess: () => setAddressToDelete(null),
            onFinish: () => setDeletingAddress(false),
        });
    };

    const confirmDeleteBankAccount = () => {
        if (!bankAccountToDelete) {
            return;
        }

        setDeletingBankAccount(true);
        router.delete(prefixedRoute('partners.bank-accounts.destroy', [partner.id, bankAccountToDelete.id]), {
            preserveScroll: true,
            onSuccess: () => setBankAccountToDelete(null),
            onFinish: () => setDeletingBankAccount(false),
        });
    };

    const addressDeleteDetail = addressToDelete
        ? [
            t(`partners.address_type.${addressToDelete.type}`, undefined, addressToDelete.type),
            addressToDelete.label,
            addressToDelete.street,
        ]
            .filter(Boolean)
            .join(' — ')
        : '';

    const bankAccountLastDigits = bankAccountToDelete ? bankAccountToDelete.account_number.slice(-4) : '';

    const typeBadges =
        partner.types?.length > 0
            ? partner.types.map((type, index) => ({
                key: type.code,
                label: type.label || type.code,
                className: typeBadgeColors[index % typeBadgeColors.length],
            }))
            : [];

    const roleBadges: Array<{ key: string; label: string; className: string }> =
        typeBadges.length > 0
            ? typeBadges
            : (() => {
                const badges: Array<{ key: string; label: string; className: string }> = [];
                if (partner.customer_rank > 0) {
                    badges.push({
                        key: 'customer',
                        label: t('partners.role.customer'),
                        className: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
                    });
                }
                if (partner.supplier_rank > 0) {
                    badges.push({
                        key: 'supplier',
                        label: t('partners.role.supplier'),
                        className: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
                    });
                }
                return badges;
            })();

    const creditLimitFormatted = partner.credit_limit
        ? new Intl.NumberFormat(localeTag, { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
            Number(partner.credit_limit),
        )
        : null;

    const primaryPhone = partner.mobile || partner.phone;
    const avatarTone =
        partner.account_type === 'company'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'border-sky-200 bg-sky-50 text-sky-700';

    const formatAddressLine = (addr: Address): string => {
        return [addr.street, addr.street2, addr.city, addr.province, addr.zip].filter(Boolean).join(', ');
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('partners.title')}</p>
                        <h2 className="text-xl font-black leading-tight text-slate-900 dark:text-white">{partner.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('partners.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs shadow-sm">{t('common.back')}</SecondaryButton>
                        </Link>
                        {can.update && (
                            <Link href={prefixedRoute('partners.edit', partner.id)}>
                                <PrimaryButton type="button" className="!rounded-xl text-xs shadow-sm">{t('common.edit')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${partner.name} · ${partner.code}`} />

            <PartnersNav />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex flex-col gap-6 border-b border-slate-100 dark:border-slate-800 p-6 sm:flex-row sm:items-start">
                        <div className="relative shrink-0">
                            {partner.picture_url ? (
                                <img
                                    src={partner.picture_url}
                                    alt={partner.name}
                                    className={`h-28 w-28 rounded-3xl object-cover border-2 ${avatarTone}`}
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
                                className={`h-28 w-28 flex-col items-center justify-center rounded-3xl border-2 px-2 text-center ${avatarTone} ${partner.picture_url ? 'absolute inset-0 hidden' : 'flex'
                                    }`}
                                style={partner.picture_url ? { display: 'none' } : {}}
                            >
                                <span className="text-3xl font-black">{initials(partner.name) || '—'}</span>
                                <p className="mt-1 text-[10px] font-bold uppercase leading-tight tracking-wider opacity-80">
                                    {t(`partners.account_type.${partner.account_type}`)}
                                </p>
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-4">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${getStatusBadgeColor(partner.status)}`}
                                    >
                                        {t(`partners.status.${partner.status}`, undefined, partner.status)}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {t(`partners.account_type.${partner.account_type}`)}
                                    </span>
                                    {roleBadges.map((badge) => (
                                        <span
                                            key={badge.key}
                                            className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${badge.className}`}
                                        >
                                            {badge.label}
                                        </span>
                                    ))}
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{partner.name}</h1>
                                <p className="font-mono text-xs text-slate-400">{partner.code}</p>
                                {(partner.job_title || partner.title) && (
                                    <p className="text-xs font-semibold text-slate-500">
                                        {partner.title ? `${partner.title.short_name} ` : ''}
                                        {partner.job_title ?? ''}
                                    </p>
                                )}
                            </div>

                            {partner.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {partner.tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300"
                                        >
                                            🏷️ {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                                {primaryPhone && (
                                    <a href={`tel:${primaryPhone}`}>
                                        <SecondaryButton type="button" className="!rounded-xl text-xs shadow-sm">📞 {t('partners.show.call')}</SecondaryButton>
                                    </a>
                                )}
                                {partner.mobile && (
                                    <a href={whatsappHref(partner.mobile)} target="_blank" rel="noopener noreferrer">
                                        <SecondaryButton type="button" className="!rounded-xl text-xs shadow-sm">💬 {t('partners.show.whatsapp')}</SecondaryButton>
                                    </a>
                                )}
                                {partner.email && (
                                    <a href={`mailto:${partner.email}`}>
                                        <SecondaryButton type="button" className="!rounded-xl text-xs shadow-sm">✉️ {t('partners.show.email_action')}</SecondaryButton>
                                    </a>
                                )}
                                {partner.website && (
                                    <a href={formatWebsiteUrl(partner.website)} target="_blank" rel="noopener noreferrer">
                                        <SecondaryButton type="button" className="!rounded-xl text-xs shadow-sm">🌐 {t('partners.show.visit_website')}</SecondaryButton>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-6 lg:grid-cols-4">
                        <StatCard
                            label={t('partners.show.stats.credit_limit')}
                            value={creditLimitFormatted ?? '—'}
                            hint={creditLimitFormatted ? undefined : t('partners.show.stats.no_limit')}
                            tone={creditLimitFormatted ? 'default' : 'warning'}
                        />
                        <StatCard
                            label={t('partners.show.stats.addresses')}
                            value={String(partner.addresses.length)}
                            hint={t('partners.show.addresses')}
                        />
                        <StatCard
                            label={t('partners.show.stats.bank_accounts')}
                            value={String(partner.bank_accounts.length)}
                            hint={t('partners.show.bank_accounts')}
                        />
                        <StatCard
                            label={t('partners.show.stats.linked_contacts')}
                            value={String(partner.children.length)}
                            hint={t('partners.show.contacts')}
                            tone={partner.children.length > 0 ? 'success' : 'default'}
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <SectionCard
                            title={t('partners.show.sections.contact')}
                            subtitle={t('partners.show.sections.contact_hint')}
                        >
                            <dl>
                                <DetailRow label={t('partners.fields.phone')}>
                                    {partner.phone ? (
                                        <a href={`tel:${partner.phone}`} className="text-indigo-600 hover:underline">
                                            {partner.phone}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.mobile')}>
                                    {partner.mobile ? (
                                        <a
                                            href={whatsappHref(partner.mobile)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {partner.mobile}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.email')}>
                                    {partner.email ? (
                                        <a href={`mailto:${partner.email}`} className="text-indigo-600 hover:underline">
                                            {partner.email}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                {partner.website && (
                                    <DetailRow label={t('partners.fields.website')}>
                                        <a
                                            href={formatWebsiteUrl(partner.website)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {partner.website}
                                        </a>
                                    </DetailRow>
                                )}
                                {partner.address && (
                                    <DetailRow label={t('partners.fields.address')}>
                                        <span className="text-left sm:text-right">{partner.address}</span>
                                    </DetailRow>
                                )}
                            </dl>
                        </SectionCard>

                        <SectionCard
                            title={t('partners.show.addresses')}
                            action={
                                can.update && !showAddressForm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressForm(true)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                    >
                                        <PlusIcon />
                                        {t('partners.show.add_address')}
                                    </button>
                                ) : undefined
                            }
                        >
                            {showAddressForm && (
                                <div className="mb-4">
                                    <AddressForm partnerId={partner.id} onCancel={() => setShowAddressForm(false)} />
                                </div>
                            )}

                            {partner.addresses.length === 0 ? (
                                <EmptyState
                                    message={t('partners.show.empty_addresses')}
                                    hint={t('partners.show.empty_addresses_hint')}
                                />
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {partner.addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            className="group relative rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-colors hover:border-gray-300 hover:bg-white"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                            {t(`partners.address_type.${addr.type}`, undefined, addr.type)}
                                                        </span>
                                                        {addr.label && (
                                                            <span className="text-xs text-gray-400">({addr.label})</span>
                                                        )}
                                                        {addr.is_default && (
                                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                                {t('partners.fields.is_default')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">{formatAddressLine(addr)}</p>
                                                    {addr.country && (
                                                        <p className="text-xs text-gray-500">{addr.country}</p>
                                                    )}
                                                </div>
                                                {can.update && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddressToDelete(addr)}
                                                        className="shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                        title={t('common.delete')}
                                                        aria-label={t('common.delete')}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title={t('partners.show.bank_accounts')}
                            action={
                                can.update && !showBankForm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowBankForm(true)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                    >
                                        <PlusIcon />
                                        {t('partners.show.add_bank_account')}
                                    </button>
                                ) : undefined
                            }
                        >
                            {showBankForm && (
                                <div className="mb-4">
                                    <BankAccountForm partnerId={partner.id} onCancel={() => setShowBankForm(false)} />
                                </div>
                            )}

                            {partner.bank_accounts.length === 0 ? (
                                <EmptyState
                                    message={t('partners.show.empty_bank_accounts')}
                                    hint={t('partners.show.empty_bank_accounts_hint')}
                                />
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {partner.bank_accounts.map((ba) => (
                                        <div
                                            key={ba.id}
                                            className="group relative rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-colors hover:border-gray-300 hover:bg-white"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-sm font-semibold text-gray-900">{ba.bank_name}</p>
                                                    <p className="font-mono text-sm text-gray-700">{ba.account_number}</p>
                                                    <p className="text-xs text-gray-500">{ba.account_holder_name}</p>
                                                </div>
                                                {can.update && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setBankAccountToDelete(ba)}
                                                        className="shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                        title={t('common.delete')}
                                                        aria-label={t('common.delete')}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <SectionCard
                            title={t('partners.show.sections.profile')}
                            subtitle={t('partners.show.sections.profile_hint')}
                        >
                            <dl>
                                <DetailRow label={t('partners.fields.account_type')}>
                                    {t(`partners.account_type.${partner.account_type}`)}
                                </DetailRow>
                                <DetailRow label={t('partners.index.columns.role')}>
                                    {roleBadges.length > 0 ? (
                                        <span className="flex flex-wrap justify-end gap-1">
                                            {roleBadges.map((badge) => (
                                                <span
                                                    key={badge.key}
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            ))}
                                        </span>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                {partner.industry && (
                                    <DetailRow label={t('partners.fields.industry')}>
                                        {partner.industry.label || String(partner.industry.name)}
                                    </DetailRow>
                                )}
                                {partner.parent && (
                                    <DetailRow label={t('partners.fields.parent_company')}>
                                        <Link
                                            href={prefixedRoute('partners.show', partner.parent.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {partner.parent.name}
                                        </Link>
                                    </DetailRow>
                                )}
                                {partner.tax_id && (
                                    <DetailRow label={t('partners.fields.tax_id')}>
                                        <span className="font-mono">{partner.tax_id}</span>
                                    </DetailRow>
                                )}
                                {partner.company_registry && (
                                    <DetailRow label={t('partners.fields.company_registry')}>
                                        {partner.company_registry}
                                    </DetailRow>
                                )}
                                {partner.reference && (
                                    <DetailRow label={t('partners.fields.reference')}>
                                        {partner.reference}
                                    </DetailRow>
                                )}
                            </dl>
                        </SectionCard>

                        {partner.children.length > 0 && (
                            <SectionCard title={t('partners.show.contacts')}>
                                <div className="space-y-2">
                                    {partner.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={prefixedRoute('partners.show', child.id)}
                                            className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                                                {initials(child.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900">{child.name}</p>
                                                <p className="font-mono text-xs text-gray-500">{child.code}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {(partner.notes || partner.comment) && (
                            <SectionCard title={t('partners.show.notes_section')}>
                                {partner.notes && (
                                    <div className="mb-4 last:mb-0">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            {t('partners.fields.notes')}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{partner.notes}</p>
                                    </div>
                                )}
                                {partner.comment && (
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            {t('partners.fields.comment')}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{partner.comment}</p>
                                    </div>
                                )}
                            </SectionCard>
                        )}
                    </div>
                </div>

                {can.delete && (
                    <section className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50/50">
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-rose-900">{t('partners.show.delete_zone_title')}</h3>
                                <p className="mt-0.5 text-sm text-rose-700/80">{t('partners.show.delete_zone_hint')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50"
                            >
                                {t('partners.show.delete_action')}
                            </button>
                        </div>
                    </section>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('partners.show.delete_title')}
                message={t('partners.show.delete_confirm', { name: partner.name, code: partner.code })}
            />

            <ConfirmDeleteDialog
                show={addressToDelete !== null}
                onClose={() => !deletingAddress && setAddressToDelete(null)}
                onConfirm={confirmDeleteAddress}
                processing={deletingAddress}
                title={t('partners.show.delete_address_title')}
                message={t('partners.show.delete_address_confirm', {
                    detail: addressDeleteDetail,
                })}
            />

            <ConfirmDeleteDialog
                show={bankAccountToDelete !== null}
                onClose={() => !deletingBankAccount && setBankAccountToDelete(null)}
                onConfirm={confirmDeleteBankAccount}
                processing={deletingBankAccount}
                title={t('partners.show.delete_bank_account_title')}
                message={t('partners.show.delete_bank_account_confirm', {
                    bank: bankAccountToDelete?.bank_name ?? '',
                    account: bankAccountLastDigits,
                })}
            />
        </DynamicLayout>
    );
}
