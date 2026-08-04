import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { formatDate } from '@/utils/date';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, type ReactNode } from 'react';
import FleetNav from '../../../../FleetNav';

interface DriverUser {
    id: number;
    name: string;
    username: string | null;
    email: string;
}

interface Driver {
    id: number;
    name: string;
    license_number: string;
    license_type: string | null;
    license_expires_at: string | null;
    phone: string;
    email: string | null;
    status: string;
    photo_url: string | null;
    notes: string | null;
    user: DriverUser | null;
}

interface DocumentSummary {
    total: number;
    expired: number;
    expiring_soon: number;
    nearest_expiry: string | null;
}

interface Props {
    driver: Driver;
    documentsEnabled?: boolean;
    documentSummary?: DocumentSummary | null;
    can: { update: boolean; delete: boolean };
}

type ExpiryTone = 'ok' | 'soon' | 'expired' | 'empty';

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'available':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        case 'on_trip':
            return 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20';
        case 'off_duty':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
    }
};

function StatCard({
    label,
    value,
    hint,
    tone = 'default',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'default' | 'warning' | 'danger' | 'success';
}): JSX.Element {
    const valueTone =
        tone === 'danger'
            ? 'text-rose-700'
            : tone === 'warning'
              ? 'text-amber-700'
              : tone === 'success'
                ? 'text-emerald-700'
                : 'text-gray-900';

    return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${valueTone}`}>{value}</p>
            {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div className="flex flex-col gap-0.5 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="shrink-0 text-sm text-gray-500">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 sm:text-right">{children}</dd>
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
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            <div className="px-6 py-4">{children}</div>
        </section>
    );
}

function expiryTone(date: string | null): ExpiryTone {
    if (!date) {
        return 'empty';
    }

    const target = new Date(`${date}T00:00:00`);
    if (Number.isNaN(target.getTime())) {
        return 'empty';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);

    if (diffDays < 0) {
        return 'expired';
    }

    if (diffDays <= 30) {
        return 'soon';
    }

    return 'ok';
}

function expiryBadgeClass(tone: ExpiryTone): string {
    switch (tone) {
        case 'expired':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
        case 'soon':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'ok':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
    }
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function Show({
    driver,
    documentsEnabled = false,
    documentSummary = null,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const accountForm = useForm({
        name: driver.name,
        username: '',
        email: driver.email ?? '',
        password: '',
    });

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.drivers.destroy', driver.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const submitAccount: FormEventHandler = (event) => {
        event.preventDefault();
        accountForm.post(prefixedRoute('fleet.drivers.account.store', driver.id), {
            preserveScroll: true,
            onSuccess: () => accountForm.reset('password'),
        });
    };

    const licenseTone = expiryTone(driver.license_expires_at);
    const docsAttention = (documentSummary?.expired ?? 0) + (documentSummary?.expiring_soon ?? 0);

    const licenseLabel = (): string => {
        if (licenseTone === 'expired') {
            return t('fleet.drivers.license_expired');
        }
        if (licenseTone === 'soon') {
            return t('fleet.drivers.license_soon');
        }
        if (licenseTone === 'ok') {
            return t('fleet.drivers.license_ok');
        }

        return t('fleet.drivers.license_missing');
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('fleet.title')}</p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{driver.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('fleet.drivers.index')}>
                            <SecondaryButton>{t('common.back')}</SecondaryButton>
                        </Link>
                        {can.update && (
                            <Link href={prefixedRoute('fleet.drivers.edit', driver.id)}>
                                <PrimaryButton type="button">{t('common.edit')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${driver.name} · ${driver.license_number}`} />

            <FleetNav />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-5 border-b border-gray-100 p-6 sm:flex-row sm:items-start">
                        <div className="shrink-0">
                            {driver.photo_url ? (
                                <img
                                    src={driver.photo_url}
                                    alt={driver.name}
                                    className="h-28 w-28 rounded-2xl object-cover ring-1 ring-gray-200"
                                />
                            ) : (
                                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-2 text-center">
                                    <span className="text-lg font-semibold text-gray-500">{initials(driver.name) || '—'}</span>
                                    <p className="mt-1 text-[10px] leading-tight text-gray-400">{t('fleet.drivers.no_photo_hint')}</p>
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-4">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(driver.status)}`}>
                                        {t(`fleet.status.${driver.status}`)}
                                    </span>
                                    {driver.license_type && (
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                                            SIM {driver.license_type}
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${expiryBadgeClass(licenseTone)}`}>
                                        {licenseLabel()}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            driver.user
                                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                                                : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20'
                                        }`}
                                    >
                                        {driver.user ? t('fleet.drivers.has_login') : t('fleet.drivers.needs_login')}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{driver.name}</h1>
                                <p className="font-mono text-sm text-gray-600">{driver.license_number}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {driver.phone && (
                                    <a href={`tel:${driver.phone}`}>
                                        <SecondaryButton type="button">{t('fleet.drivers.call')}</SecondaryButton>
                                    </a>
                                )}
                                {driver.email && (
                                    <a href={`mailto:${driver.email}`}>
                                        <SecondaryButton type="button">{t('fleet.drivers.email_action')}</SecondaryButton>
                                    </a>
                                )}
                                {documentsEnabled && (
                                    <Link href={prefixedRoute('fleet.drivers.documents.index', driver.id)}>
                                        <SecondaryButton type="button">{t('fleet.drivers.documents')}</SecondaryButton>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 px-6 py-4 lg:grid-cols-4">
                        <StatCard
                            label={t('fleet.drivers.license_expires')}
                            value={formatDate(driver.license_expires_at, localeTag)}
                            hint={licenseLabel()}
                            tone={
                                licenseTone === 'expired'
                                    ? 'danger'
                                    : licenseTone === 'soon'
                                      ? 'warning'
                                      : licenseTone === 'ok'
                                        ? 'success'
                                        : 'default'
                            }
                        />
                        <StatCard
                            label={t('fleet.drivers.license_type')}
                            value={driver.license_type || '—'}
                            hint={t('fleet.drivers.sections.license')}
                        />
                        {documentsEnabled ? (
                            <StatCard
                                label={t('fleet.drivers.documents')}
                                value={String(docsAttention)}
                                hint={
                                    docsAttention > 0
                                        ? t('fleet.drivers.docs_attention_hint')
                                        : t('fleet.drivers.docs_ok_hint')
                                }
                                tone={docsAttention > 0 ? 'danger' : 'success'}
                            />
                        ) : (
                            <StatCard
                                label={t('fleet.drivers.phone')}
                                value={driver.phone || '—'}
                                hint={t('fleet.drivers.sections.contact')}
                            />
                        )}
                        <StatCard
                            label={t('fleet.drivers.sections.account')}
                            value={driver.user ? t('fleet.drivers.has_login') : t('fleet.drivers.needs_login')}
                            hint={driver.user?.username || driver.user?.email || t('fleet.drivers.sections.account_hint')}
                            tone={driver.user ? 'success' : 'warning'}
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <SectionCard title={t('fleet.drivers.sections.contact')}>
                            <dl>
                                <DetailRow label={t('fleet.drivers.phone')}>
                                    {driver.phone ? (
                                        <a href={`tel:${driver.phone}`} className="text-indigo-600 hover:underline">
                                            {driver.phone}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                <DetailRow label={t('fleet.drivers.email')}>
                                    {driver.email ? (
                                        <a href={`mailto:${driver.email}`} className="text-indigo-600 hover:underline">
                                            {driver.email}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                <DetailRow label={t('fleet.drivers.license_number')}>
                                    <span className="font-mono">{driver.license_number}</span>
                                </DetailRow>
                                <DetailRow label={t('fleet.drivers.license_type')}>{driver.license_type || '—'}</DetailRow>
                                <DetailRow label={t('fleet.drivers.status')}>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(driver.status)}`}>
                                        {t(`fleet.status.${driver.status}`)}
                                    </span>
                                </DetailRow>
                                {driver.notes && <DetailRow label={t('fleet.drivers.notes')}>{driver.notes}</DetailRow>}
                            </dl>
                        </SectionCard>

                        {can.update && (
                            <SectionCard
                                title={t('fleet.drivers.sections.account')}
                                subtitle={t('fleet.drivers.sections.account_hint')}
                            >
                                {driver.user ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-4">
                                        <p className="text-sm font-medium text-emerald-800">{t('fleet.drivers.login_created')}</p>
                                        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">
                                                    {t('fleet.drivers.account_username')}
                                                </dt>
                                                <dd className="mt-1 text-sm font-semibold text-gray-900">{driver.user.username || '—'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">
                                                    {t('fleet.drivers.email')}
                                                </dt>
                                                <dd className="mt-1 text-sm font-semibold text-gray-900">{driver.user.email}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                ) : (
                                    <>
                                        <p className="mb-4 text-sm text-gray-500">{t('fleet.drivers.no_login')}</p>
                                        <form onSubmit={submitAccount} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <InputLabel htmlFor="account_name" value={t('fleet.drivers.name')} />
                                                <TextInput
                                                    id="account_name"
                                                    className="mt-1 block w-full"
                                                    value={accountForm.data.name}
                                                    onChange={(e) => accountForm.setData('name', e.target.value)}
                                                />
                                                <InputError message={accountForm.errors.name} className="mt-1" />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="account_username" value={t('fleet.drivers.account_username')} />
                                                <TextInput
                                                    id="account_username"
                                                    className="mt-1 block w-full"
                                                    value={accountForm.data.username}
                                                    onChange={(e) => accountForm.setData('username', e.target.value)}
                                                    autoComplete="off"
                                                />
                                                <InputError message={accountForm.errors.username} className="mt-1" />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="account_email" value={t('fleet.drivers.email')} />
                                                <TextInput
                                                    id="account_email"
                                                    type="email"
                                                    className="mt-1 block w-full"
                                                    value={accountForm.data.email}
                                                    onChange={(e) => accountForm.setData('email', e.target.value)}
                                                    autoComplete="off"
                                                />
                                                <InputError message={accountForm.errors.email} className="mt-1" />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="account_password" value={t('fleet.drivers.account_password')} />
                                                <TextInput
                                                    id="account_password"
                                                    type="password"
                                                    className="mt-1 block w-full"
                                                    value={accountForm.data.password}
                                                    onChange={(e) => accountForm.setData('password', e.target.value)}
                                                    autoComplete="new-password"
                                                />
                                                <InputError message={accountForm.errors.password} className="mt-1" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <PrimaryButton disabled={accountForm.processing}>
                                                    {t('fleet.drivers.create_login')}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </SectionCard>
                        )}
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <SectionCard
                            title={t('fleet.drivers.sections.license')}
                            subtitle={t('fleet.drivers.sections.license_hint')}
                        >
                            <div className="space-y-4">
                                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            {t('fleet.drivers.license_expires')}
                                        </p>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${expiryBadgeClass(licenseTone)}`}>
                                            {licenseLabel()}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatDate(driver.license_expires_at, localeTag)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        {t('fleet.drivers.license_number')}
                                    </p>
                                    <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{driver.license_number}</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {driver.license_type ? `SIM ${driver.license_type}` : t('fleet.drivers.license_missing')}
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        {documentsEnabled && (
                            <SectionCard
                                title={t('fleet.drivers.documents')}
                                action={
                                    <Link
                                        href={prefixedRoute('fleet.drivers.documents.index', driver.id)}
                                        className="text-sm font-medium text-indigo-600 hover:underline"
                                    >
                                        {t('fleet.drivers.manage_documents')}
                                    </Link>
                                }
                            >
                                {!documentSummary || documentSummary.total === 0 ? (
                                    <p className="text-sm text-gray-500">{t('fleet.drivers.no_documents')}</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_total')}</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums">{documentSummary.total}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_nearest')}</p>
                                            <p className="mt-1 font-medium">{formatDate(documentSummary.nearest_expiry, localeTag)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_expired')}</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums text-rose-700">{documentSummary.expired}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_expiring')}</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700">{documentSummary.expiring_soon}</p>
                                        </div>
                                    </div>
                                )}
                            </SectionCard>
                        )}
                    </div>
                </div>

                {can.delete && (
                    <section className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50/40">
                        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-rose-900">{t('common.delete')}</h3>
                                <p className="text-sm text-rose-700/80">{t('common.confirm_delete_message')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="inline-flex items-center justify-center rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                            >
                                {t('common.delete')}
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
                message={t('fleet.drivers.delete_confirm', { name: driver.name })}
            />
        </DynamicLayout>
    );
}
