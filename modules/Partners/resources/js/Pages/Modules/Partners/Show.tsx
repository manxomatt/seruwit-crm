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
import { useState, FormEventHandler } from 'react';

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface Industry {
    id: number;
    name: string;
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

interface Partner {
    id: number;
    code: string;
    account_type: string;
    sub_type: string | null;
    name: string;
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
    addresses: Address[];
    bank_accounts: BankAccount[];
}

interface Props {
    partner: Partner;
    can: { update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

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
            onSuccess: () => { reset(); onCancel(); },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="addr_type" value={t('partners.fields.type')} />
                    <Select id="addr_type" className="mt-1" value={data.type} onChange={(value) => setData('type', value)} options={[
                        { value: 'shipping', label: t('partners.address_type.shipping') },
                        { value: 'billing', label: t('partners.address_type.billing') },
                        { value: 'warehouse', label: t('partners.address_type.warehouse') },
                    ]} />
                </div>
                <div>
                    <InputLabel htmlFor="addr_label" value={t('partners.fields.label')} />
                    <TextInput id="addr_label" className="mt-1 block w-full" value={data.label} onChange={(e) => setData('label', e.target.value)} placeholder={t('partners.placeholders.address_label')} />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={data.is_default} onChange={(e) => setData('is_default', e.target.checked)} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700">{t('partners.fields.is_default')}</span>
                    </label>
                </div>
            </div>
            <div>
                <InputLabel htmlFor="addr_street" value={t('partners.fields.street')} />
                <TextInput id="addr_street" className="mt-1 block w-full" value={data.street} onChange={(e) => setData('street', e.target.value)} required />
                <InputError message={errors.street} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="addr_city" value={t('partners.fields.city')} />
                    <TextInput id="addr_city" className="mt-1 block w-full" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                </div>
                <div>
                    <InputLabel htmlFor="addr_province" value={t('partners.fields.province')} />
                    <TextInput id="addr_province" className="mt-1 block w-full" value={data.province} onChange={(e) => setData('province', e.target.value)} />
                </div>
                <div>
                    <InputLabel htmlFor="addr_zip" value={t('partners.fields.zip')} />
                    <TextInput id="addr_zip" className="mt-1 block w-full" value={data.zip} onChange={(e) => setData('zip', e.target.value)} />
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
            onSuccess: () => { reset(); onCancel(); },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="bank_name" value={t('partners.fields.bank_name')} />
                    <TextInput id="bank_name" className="mt-1 block w-full" value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} required />
                    <InputError message={errors.bank_name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="account_number" value={t('partners.fields.account_number')} />
                    <TextInput id="account_number" className="mt-1 block w-full" value={data.account_number} onChange={(e) => setData('account_number', e.target.value)} required />
                    <InputError message={errors.account_number} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="account_holder_name" value={t('partners.fields.account_holder')} />
                    <TextInput id="account_holder_name" className="mt-1 block w-full" value={data.account_holder_name} onChange={(e) => setData('account_holder_name', e.target.value)} required />
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

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('partners.destroy', partner.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const deleteAddress = (addressId: number) => {
        router.delete(prefixedRoute('partners.addresses.destroy', [partner.id, addressId]));
    };

    const deleteBankAccount = (bankAccountId: number) => {
        router.delete(prefixedRoute('partners.bank-accounts.destroy', [partner.id, bankAccountId]));
    };

    const roleBadges: Array<{ key: string; label: string; className: string }> = [];
    if (partner.customer_rank > 0) {
        roleBadges.push({ key: 'customer', label: t('partners.role.customer'), className: 'bg-blue-100 text-blue-800' });
    }
    if (partner.supplier_rank > 0) {
        roleBadges.push({ key: 'supplier', label: t('partners.role.supplier'), className: 'bg-purple-100 text-purple-800' });
    }

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{partner.name}</h2>
                        <p className="mt-1 text-sm text-gray-500">{partner.code}</p>
                    </div>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('partners.edit', partner.id)}>
                                <SecondaryButton>{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('partners.index')}>
                            <SecondaryButton>{t('common.back')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={partner.name} />

            <div className="space-y-6">
                {/* Informasi Utama */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">{t('partners.show.general')}</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('partners.fields.type')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {t(`partners.account_type.${partner.account_type}`)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('partners.index.columns.role')}</dt>
                                <dd className="mt-1 flex gap-1">
                                    {roleBadges.length > 0 ? roleBadges.map((badge) => (
                                        <span key={badge.key} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                    )) : <span className="text-sm text-gray-400">—</span>}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('partners.fields.status')}</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(partner.status)}`}>
                                        {t(`partners.status.${partner.status}`, undefined, partner.status)}
                                    </span>
                                </dd>
                            </div>
                            {partner.title && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.title')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{partner.title.short_name} ({partner.title.name})</dd>
                                </div>
                            )}
                            {partner.job_title && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.job_title')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{partner.job_title}</dd>
                                </div>
                            )}
                            {partner.parent && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.parent_company')}</dt>
                                    <dd className="mt-1">
                                        <Link href={prefixedRoute('partners.show', partner.parent.id)} className="text-sm text-indigo-600 hover:text-indigo-900">
                                            {partner.parent.name}
                                        </Link>
                                    </dd>
                                </div>
                            )}
                            {partner.industry && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.industry')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{partner.industry.name}</dd>
                                </div>
                            )}
                            {partner.tax_id && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.tax_id')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{partner.tax_id}</dd>
                                </div>
                            )}
                            {partner.credit_limit && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.credit_limit')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Intl.NumberFormat(localeTag, { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(partner.credit_limit))}
                                    </dd>
                                </div>
                            )}
                        </dl>

                        {partner.tags.length > 0 && (
                            <div className="mt-4">
                                <dt className="text-sm font-medium text-gray-500">{t('partners.fields.tags')}</dt>
                                <dd className="mt-1 flex flex-wrap gap-1">
                                    {partner.tags.map((tag) => (
                                        <span key={tag.id} className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                                            {tag.name}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kontak */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">{t('partners.show.contact')}</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('partners.fields.phone')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{partner.phone || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('partners.fields.mobile')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{partner.mobile || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('partners.fields.email')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{partner.email || '—'}</dd>
                            </div>
                            {partner.website && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.website')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{partner.website}</dd>
                                </div>
                            )}
                            {partner.address && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.address')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{partner.address}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Alamat-Alamat */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{t('partners.show.addresses')}</h3>
                            {can.update && !showAddressForm && (
                                <button onClick={() => setShowAddressForm(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                    {t('partners.show.add_address')}
                                </button>
                            )}
                        </div>

                        {showAddressForm && (
                            <div className="mb-4">
                                <AddressForm partnerId={partner.id} onCancel={() => setShowAddressForm(false)} />
                            </div>
                        )}

                        {partner.addresses.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('partners.show.empty_addresses')}</p>
                        ) : (
                            <div className="space-y-3">
                                {partner.addresses.map((addr) => (
                                    <div key={addr.id} className="flex items-start justify-between rounded-lg border border-gray-200 p-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium uppercase text-gray-500">
                                                    {t(`partners.address_type.${addr.type}`, undefined, addr.type)}
                                                </span>
                                                {addr.label && <span className="text-xs text-gray-400">({addr.label})</span>}
                                                {addr.is_default && (
                                                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">{t('partners.fields.is_default')}</span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {[addr.street, addr.street2, addr.city, addr.province, addr.zip].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                        {can.update && (
                                            <button onClick={() => deleteAddress(addr.id)} className="text-sm text-red-600 hover:text-red-900">
                                                {t('common.delete')}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Rekening Bank */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{t('partners.show.bank_accounts')}</h3>
                            {can.update && !showBankForm && (
                                <button onClick={() => setShowBankForm(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                    {t('partners.show.add_bank_account')}
                                </button>
                            )}
                        </div>

                        {showBankForm && (
                            <div className="mb-4">
                                <BankAccountForm partnerId={partner.id} onCancel={() => setShowBankForm(false)} />
                            </div>
                        )}

                        {partner.bank_accounts.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('partners.show.empty_bank_accounts')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('partners.show.bank_columns.bank')}</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('partners.show.bank_columns.account_number')}</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('partners.show.bank_columns.account_holder')}</th>
                                            {can.update && (
                                                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {partner.bank_accounts.map((ba) => (
                                            <tr key={ba.id}>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{ba.bank_name}</td>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{ba.account_number}</td>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{ba.account_holder_name}</td>
                                                {can.update && (
                                                    <td className="whitespace-nowrap px-4 py-2 text-right">
                                                        <button onClick={() => deleteBankAccount(ba.id)} className="text-sm text-red-600 hover:text-red-900">
                                                            {t('common.delete')}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kontak Person (children) */}
                {partner.children.length > 0 && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">{t('partners.show.contacts')}</h3>
                            <div className="space-y-2">
                                {partner.children.map((child) => (
                                    <div key={child.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                        <div>
                                            <Link href={prefixedRoute('partners.show', child.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                                {child.name}
                                            </Link>
                                            <span className="ml-2 text-xs text-gray-500">{child.code}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Catatan */}
                {(partner.notes || partner.comment) && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">{t('partners.show.notes_section')}</h3>
                            {partner.notes && (
                                <div className="mb-3">
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.notes')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{partner.notes}</dd>
                                </div>
                            )}
                            {partner.comment && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('partners.fields.comment')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{partner.comment}</dd>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Danger Zone */}
                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{t('partners.show.delete_zone_title')}</h3>
                                <p className="text-sm text-gray-500">{t('partners.show.delete_zone_hint')}</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                {t('partners.show.delete_action')}
                            </button>
                        </div>
                    </div>
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
        </DynamicLayout>
    );
}
