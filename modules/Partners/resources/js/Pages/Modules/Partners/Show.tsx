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

// SVG Icons
const Icons = {
    Phone: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    WhatsApp: () => (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
    ),
    Email: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    Globe: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
    ),
    Copy: () => (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    Check: () => (
        <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Trash: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    Plus: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Edit: () => (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
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
    Location: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Bank: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h1m4 0h1m-7-8h1m4 0h1m4 0h1M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    ShieldAlert: () => (
        <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    CreditCard: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h1m4 0h1M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    Users: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
};

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

const typeBadgeColors = [
    'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-500/30',
    'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-500/30',
    'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-500/30',
    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-500/30',
    'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-500/30',
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
    icon: Icon,
    label,
    value,
    hint,
    tone = 'default',
}: {
    icon: () => JSX.Element;
    label: string;
    value: string;
    hint?: string;
    tone?: 'default' | 'success' | 'warning' | 'indigo';
}): JSX.Element {
    const toneStyles = {
        default: 'border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 text-slate-900 dark:text-white',
        success: 'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
        warning: 'border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
        indigo: 'border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300',
    };

    const iconBg = {
        default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
        success: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400',
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md backdrop-blur-xs ${toneStyles[tone]}`}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg[tone]}`}>
                    <Icon />
                </div>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums tracking-tight">{value}</p>
            {hint && <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
    );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800/80 py-3.5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-xs font-bold text-slate-900 dark:text-white sm:text-right">{children}</dd>
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
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                {t('partners.show.add_address')}
            </h4>
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
                <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.is_default}
                            onChange={(e) => setData('is_default', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 shadow-xs focus:ring-indigo-500"
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('partners.fields.is_default')}</span>
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
            <div className="flex gap-2 pt-2">
                <PrimaryButton disabled={processing} className="!rounded-xl text-xs">{t('partners.show.save_address')}</PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
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
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                {t('partners.show.add_bank_account')}
            </h4>
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
            <div className="flex gap-2 pt-2">
                <PrimaryButton disabled={processing} className="!rounded-xl text-xs">{t('partners.show.save_bank_account')}</PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
            </div>
        </form>
    );
}

export default function Show({ partner, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [activeTab, setActiveTab] = useState<'overview' | 'locations_banks' | 'contacts' | 'risk_notes'>('overview');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showBankForm, setShowBankForm] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
    const [bankAccountToDelete, setBankAccountToDelete] = useState<BankAccount | null>(null);
    const [deletingAddress, setDeletingAddress] = useState(false);
    const [deletingBankAccount, setDeletingBankAccount] = useState(false);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('partners.destroy', partner.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDeleteAddress = () => {
        if (!addressToDelete) { return; }
        setDeletingAddress(true);
        router.delete(prefixedRoute('partners.addresses.destroy', [partner.id, addressToDelete.id]), {
            preserveScroll: true,
            onSuccess: () => setAddressToDelete(null),
            onFinish: () => setDeletingAddress(false),
        });
    };

    const confirmDeleteBankAccount = () => {
        if (!bankAccountToDelete) { return; }
        setDeletingBankAccount(true);
        router.delete(prefixedRoute('partners.bank-accounts.destroy', [partner.id, bankAccountToDelete.id]), {
            preserveScroll: true,
            onSuccess: () => setBankAccountToDelete(null),
            onFinish: () => setDeletingBankAccount(false),
        });
    };

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
                        className: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-300',
                    });
                }
                if (partner.supplier_rank > 0) {
                    badges.push({
                        key: 'supplier',
                        label: t('partners.role.supplier'),
                        className: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-300',
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
            ? 'border-indigo-200/80 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            : 'border-sky-200/80 bg-sky-500/10 text-sky-600 dark:text-sky-400';

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
                            <SecondaryButton type="button" className="!rounded-xl text-xs shadow-xs">{t('common.back')}</SecondaryButton>
                        </Link>
                        {can.update && (
                            <Link href={prefixedRoute('partners.edit', partner.id)}>
                                <PrimaryButton type="button" className="!rounded-xl text-xs shadow-xs gap-1.5">
                                    <Icons.Edit />
                                    {t('common.edit')}
                                </PrimaryButton>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${partner.name} · ${partner.code}`} />

            <PartnersNav />

            <div className="space-y-6">
                {/* Hero Profile Banner */}
                <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="h-28 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-violet-500/10 dark:from-indigo-950/40 dark:via-sky-950/40 dark:to-violet-950/40 border-b border-slate-100 dark:border-slate-800/80" />

                    <div className="relative px-6 pb-6 pt-0">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end justify-between -mt-12">
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                                <div className="relative shrink-0">
                                    {partner.picture_url ? (
                                        <img
                                            src={partner.picture_url}
                                            alt={partner.name}
                                            className="h-24 w-24 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-md"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
                                                if (fallback) { fallback.style.display = 'flex'; }
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`h-24 w-24 flex-col items-center justify-center rounded-3xl border-4 border-white dark:border-slate-900 shadow-md ${avatarTone} ${partner.picture_url ? 'absolute inset-0 hidden' : 'flex'}`}
                                    >
                                        <span className="text-3xl font-black">{initials(partner.name) || '—'}</span>
                                    </div>
                                    <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${partner.status === 'active' ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-400'}`} />
                                </div>

                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${partner.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {t(`partners.status.${partner.status}`, undefined, partner.status)}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {partner.account_type === 'company' ? <Icons.Building /> : <Icons.User />}
                                            {t(`partners.account_type.${partner.account_type}`)}
                                        </span>

                                        {roleBadges.map((badge) => (
                                            <span key={badge.key} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        ))}
                                    </div>

                                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3 flex-wrap">
                                        <span>{partner.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(partner.code, 'code')}
                                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                            title="Click to copy code"
                                        >
                                            {partner.code}
                                            {copiedKey === 'code' ? <Icons.Check /> : <Icons.Copy />}
                                        </button>
                                    </h1>

                                    {(partner.job_title || partner.title) && (
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {partner.title ? `${partner.title.short_name} ` : ''}
                                            {partner.job_title ?? ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Communication Actions */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                                {primaryPhone && (
                                    <a href={`tel:${primaryPhone}`}>
                                        <SecondaryButton type="button" className="!rounded-xl text-xs gap-1.5 shadow-xs">
                                            <Icons.Phone />
                                            {t('partners.show.call')}
                                        </SecondaryButton>
                                    </a>
                                )}
                                {partner.mobile && (
                                    <a href={whatsappHref(partner.mobile)} target="_blank" rel="noopener noreferrer">
                                        <SecondaryButton type="button" className="!rounded-xl text-xs gap-1.5 shadow-xs !border-emerald-200 !bg-emerald-50/50 !text-emerald-700 dark:!border-emerald-900 dark:!bg-emerald-950/40 dark:!text-emerald-300">
                                            <Icons.WhatsApp />
                                            {t('partners.show.whatsapp')}
                                        </SecondaryButton>
                                    </a>
                                )}
                                {partner.email && (
                                    <a href={`mailto:${partner.email}`}>
                                        <SecondaryButton type="button" className="!rounded-xl text-xs gap-1.5 shadow-xs">
                                            <Icons.Email />
                                            {t('partners.show.email_action')}
                                        </SecondaryButton>
                                    </a>
                                )}
                                {partner.website && (
                                    <a href={formatWebsiteUrl(partner.website)} target="_blank" rel="noopener noreferrer">
                                        <SecondaryButton type="button" className="!rounded-xl text-xs gap-1.5 shadow-xs">
                                            <Icons.Globe />
                                            {t('partners.show.visit_website')}
                                        </SecondaryButton>
                                    </a>
                                )}
                            </div>
                        </div>

                        {partner.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                {partner.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                                    >
                                        🏷️ {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4 lg:grid-cols-4">
                        <StatCard
                            icon={Icons.CreditCard}
                            label={t('partners.show.stats.credit_limit')}
                            value={creditLimitFormatted ?? '—'}
                            hint={creditLimitFormatted ? undefined : t('partners.show.stats.no_limit')}
                            tone={creditLimitFormatted ? 'indigo' : 'warning'}
                        />
                        <StatCard
                            icon={Icons.Location}
                            label={t('partners.show.stats.addresses')}
                            value={String(partner.addresses.length)}
                            hint={t('partners.show.addresses')}
                            tone="default"
                        />
                        <StatCard
                            icon={Icons.Bank}
                            label={t('partners.show.stats.bank_accounts')}
                            value={String(partner.bank_accounts.length)}
                            hint={t('partners.show.bank_accounts')}
                            tone="default"
                        />
                        <StatCard
                            icon={Icons.Users}
                            label={t('partners.show.stats.linked_contacts')}
                            value={String(partner.children.length)}
                            hint={t('partners.show.contacts')}
                            tone={partner.children.length > 0 ? 'success' : 'default'}
                        />
                    </div>
                </section>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Ringkasan & Kontak', icon: Icons.User },
                        { id: 'locations_banks', label: `Alamat (${partner.addresses.length}) & Rekening (${partner.bank_accounts.length})`, icon: Icons.Location },
                        { id: 'contacts', label: `Kontak Terkait (${partner.children.length})`, icon: Icons.Users },
                        { id: 'risk_notes', label: 'Informasi Bisnis & Catatan', icon: Icons.Building },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

                {/* Tab Contents */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Contact Card */}
                        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                                <Icons.Phone />
                                {t('partners.show.sections.contact')}
                            </h3>
                            <dl className="space-y-1">
                                <DetailRow label={t('partners.fields.phone')}>
                                    {partner.phone ? (
                                        <a href={`tel:${partner.phone}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {partner.phone}
                                        </a>
                                    ) : '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.mobile')}>
                                    {partner.mobile ? (
                                        <a href={whatsappHref(partner.mobile)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {partner.mobile}
                                        </a>
                                    ) : '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.email')}>
                                    {partner.email ? (
                                        <a href={`mailto:${partner.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {partner.email}
                                        </a>
                                    ) : '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.website')}>
                                    {partner.website ? (
                                        <a href={formatWebsiteUrl(partner.website)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {partner.website}
                                        </a>
                                    ) : '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.address')}>
                                    {partner.address ? <span className="text-left sm:text-right">{partner.address}</span> : '—'}
                                </DetailRow>
                            </dl>
                        </section>

                        {/* Profile & Business Overview Card */}
                        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                                <Icons.Building />
                                {t('partners.show.sections.profile')}
                            </h3>
                            <dl className="space-y-1">
                                <DetailRow label={t('partners.fields.account_type')}>
                                    {t(`partners.account_type.${partner.account_type}`)}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.industry')}>
                                    {partner.industry ? (partner.industry.label || String(partner.industry.name)) : '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.parent_company')}>
                                    {partner.parent ? (
                                        <Link href={prefixedRoute('partners.show', partner.parent.id)} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {partner.parent.name} ({partner.parent.code})
                                        </Link>
                                    ) : '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.tax_id')}>
                                    {partner.tax_id ? (
                                        <span className="font-mono flex items-center gap-1.5 justify-end">
                                            {partner.tax_id}
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(partner.tax_id!, 'tax_id')}
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {copiedKey === 'tax_id' ? <Icons.Check /> : <Icons.Copy />}
                                            </button>
                                        </span>
                                    ) : '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.company_registry')}>
                                    {partner.company_registry || '—'}
                                </DetailRow>
                                <DetailRow label={t('partners.fields.reference')}>
                                    {partner.reference || '—'}
                                </DetailRow>
                            </dl>
                        </section>
                    </div>
                )}

                {activeTab === 'locations_banks' && (
                    <div className="space-y-6">
                        {/* Addresses Section */}
                        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Icons.Location />
                                        {t('partners.show.addresses')}
                                    </h3>
                                </div>
                                {can.update && !showAddressForm && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressForm(true)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        <Icons.Plus />
                                        {t('partners.show.add_address')}
                                    </button>
                                )}
                            </div>

                            {showAddressForm && (
                                <AddressForm partnerId={partner.id} onCancel={() => setShowAddressForm(false)} />
                            )}

                            {partner.addresses.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('partners.show.empty_addresses')}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">{t('partners.show.empty_addresses_hint')}</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {partner.addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                            {t(`partners.address_type.${addr.type}`, undefined, addr.type)}
                                                        </span>
                                                        {addr.label && <span className="text-xs text-slate-400">({addr.label})</span>}
                                                        {addr.is_default && (
                                                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20">
                                                                {t('partners.fields.is_default')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">{formatAddressLine(addr)}</p>
                                                    {addr.country && <p className="text-[11px] text-slate-500 dark:text-slate-400">{addr.country}</p>}
                                                </div>
                                                {can.update && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddressToDelete(addr)}
                                                        className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 group-hover:opacity-100"
                                                    >
                                                        <Icons.Trash />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Bank Accounts Section */}
                        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Icons.Bank />
                                        {t('partners.show.bank_accounts')}
                                    </h3>
                                </div>
                                {can.update && !showBankForm && (
                                    <button
                                        type="button"
                                        onClick={() => setShowBankForm(true)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        <Icons.Plus />
                                        {t('partners.show.add_bank_account')}
                                    </button>
                                )}
                            </div>

                            {showBankForm && (
                                <BankAccountForm partnerId={partner.id} onCancel={() => setShowBankForm(false)} />
                            )}

                            {partner.bank_accounts.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('partners.show.empty_bank_accounts')}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">{t('partners.show.empty_bank_accounts_hint')}</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {partner.bank_accounts.map((ba) => (
                                        <div
                                            key={ba.id}
                                            className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{ba.bank_name}</p>
                                                    <p className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{ba.account_number}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{ba.account_holder_name}</p>
                                                </div>
                                                {can.update && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setBankAccountToDelete(ba)}
                                                        className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 group-hover:opacity-100"
                                                    >
                                                        <Icons.Trash />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                            <Icons.Users />
                            {t('partners.show.contacts')}
                        </h3>

                        {partner.children.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Tidak ada kontak individual terkait</p>
                                <p className="mt-1 text-[11px] text-slate-400">Kontak individual yang memilih perusahaan ini sebagai induk akan muncul di sini.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {partner.children.map((child) => (
                                    <Link
                                        key={child.id}
                                        href={prefixedRoute('partners.show', child.id)}
                                        className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-xs font-black text-indigo-700 dark:text-indigo-300">
                                            {initials(child.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{child.name}</p>
                                            <p className="font-mono text-[11px] text-slate-400">{child.code}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'risk_notes' && (
                    <div className="space-y-6">
                        {/* Risk & Notes */}
                        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                                <Icons.ShieldAlert />
                                {t('partners.show.notes_section')}
                            </h3>

                            <div className="space-y-4">
                                {partner.notes && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {t('partners.fields.notes')}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-slate-100 dark:border-slate-800">
                                            {partner.notes}
                                        </p>
                                    </div>
                                )}
                                {partner.comment && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {t('partners.fields.comment')}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-slate-100 dark:border-slate-800">
                                            {partner.comment}
                                        </p>
                                    </div>
                                )}
                                {!partner.notes && !partner.comment && (
                                    <p className="text-xs text-slate-400 italic">Tidak ada catatan atau komentar tambahan.</p>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {/* Danger Zone */}
                {can.delete && (
                    <section className="overflow-hidden rounded-3xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">{t('partners.show.delete_zone_title')}</h3>
                                <p className="mt-0.5 text-xs text-rose-700/80 dark:text-rose-400">{t('partners.show.delete_zone_hint')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 shadow-xs hover:bg-rose-50 dark:hover:bg-rose-950"
                            >
                                {t('partners.show.delete_action')}
                            </button>
                        </div>
                    </section>
                )}
            </div>

            {/* Dialog Confirmations */}
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
                    detail: addressToDelete ? [addressToDelete.label, addressToDelete.street].filter(Boolean).join(' — ') : '',
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
                    account: bankAccountToDelete?.account_number.slice(-4) ?? '',
                })}
            />
        </DynamicLayout>
    );
}
