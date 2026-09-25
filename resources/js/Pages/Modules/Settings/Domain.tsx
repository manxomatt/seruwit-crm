import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface DomainItem {
    id: number;
    domain: string;
    is_primary: boolean;
    status: string;
    verification_token?: string | null;
    cloudflare_status?: string | null;
    cloudflare_ssl_status?: string | null;
    verified_at?: string | null;
    last_checked_at?: string | null;
    last_error?: string | null;
}

interface Props {
    systemDomain: DomainItem | null;
    customDomains: DomainItem[];
    dnsTarget: string;
}

export default function DomainSettings({ systemDomain, customDomains, dnsTarget }: Props) {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const page = usePage();
    const flash = (page.props as any).flash;

    const [domainToDelete, setDomainToDelete] = useState<DomainItem | null>(null);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        domain: '',
    });

    const handleCopy = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const submitAddDomain: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('settings.domain.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const handleVerify = (domain: DomainItem) => {
        setVerifyingId(domain.id);
        router.post(
            prefixedRoute('settings.domain.verify', domain.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setVerifyingId(null),
            }
        );
    };

    const handleSetPrimary = (domain: DomainItem) => {
        setSettingPrimaryId(domain.id);
        router.post(
            prefixedRoute('settings.domain.primary', domain.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setSettingPrimaryId(null),
            }
        );
    };

    const confirmDelete = () => {
        if (!domainToDelete) return;
        router.delete(prefixedRoute('settings.domain.destroy', domainToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setDomainToDelete(null),
        });
    };

    // Calculate host record prefix for DNS CNAME instructions
    const getHostPrefix = (domain: string): string => {
        const parts = domain.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
        return '@';
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('settings.domain.title')}
                    subtitle={t('settings.domain.subtitle')}
                />
            }
        >
            <Head title={t('settings.domain.head')} />

            <div className="space-y-6 max-w-5xl">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            ✓
                        </span>
                        <span>{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-300">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs">
                            ✕
                        </span>
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Navigation Pill Bar to Other Settings */}
                <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
                    <Link
                        href={prefixedRoute('settings.index')}
                        className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <span>⚙️</span>
                        <span>{t('settings.domain.nav_general')}</span>
                    </Link>
                    <span className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white shadow-sm">
                        <span>🌐</span>
                        <span>{t('settings.domain.nav_custom_domain')}</span>
                    </span>
                </div>

                {/* 1. System Default Domain Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {t('settings.domain.system_subdomain')}
                                </h3>
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-[11px] font-bold">
                                    {t('settings.domain.badge_default')}
                                </span>
                                {systemDomain?.is_primary && (
                                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold">
                                        {t('settings.domain.badge_primary')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                {t('settings.domain.system_subdomain_hint')}
                            </p>
                        </div>
                        {systemDomain && (
                            <div className="flex items-center gap-2">
                                <a
                                    href={`https://${systemDomain.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
                                >
                                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{systemDomain.domain}</span>
                                    <span>↗</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Custom Domain Section */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {t('settings.domain.custom_domain_title')}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {t('settings.domain.custom_domain_desc', { example: 'sewa.bisnisanda.com' })}
                        </p>
                    </div>

                    {/* Existing Custom Domains List */}
                    {customDomains.length > 0 ? (
                        <div className="space-y-4">
                            {customDomains.map((cd) => {
                                const isVerified = cd.status === 'verified' || cd.status === 'active';
                                const hostPrefix = getHostPrefix(cd.domain);

                                return (
                                    <div
                                        key={cd.id}
                                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 p-5 space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                                    {cd.domain}
                                                </span>

                                                {/* Status Badge */}
                                                {isVerified ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        {t('settings.domain.badge_verified')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                        {t('settings.domain.badge_pending')}
                                                    </span>
                                                )}

                                                {cd.is_primary && (
                                                    <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold">
                                                        {t('settings.domain.badge_primary')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                {isVerified && !cd.is_primary && (
                                                    <SecondaryButton
                                                        onClick={() => handleSetPrimary(cd)}
                                                        disabled={settingPrimaryId === cd.id}
                                                        className="text-xs !py-1.5"
                                                    >
                                                        {settingPrimaryId === cd.id ? t('settings.domain.btn_processing') : t('settings.domain.btn_make_primary')}
                                                    </SecondaryButton>
                                                )}

                                                {!isVerified && (
                                                    <PrimaryButton
                                                        onClick={() => handleVerify(cd)}
                                                        disabled={verifyingId === cd.id}
                                                        className="text-xs !py-1.5"
                                                    >
                                                        {verifyingId === cd.id ? t('settings.domain.btn_checking') : t('settings.domain.btn_check_dns')}
                                                    </PrimaryButton>
                                                )}

                                                <DangerButton
                                                    onClick={() => setDomainToDelete(cd)}
                                                    className="text-xs !py-1.5"
                                                >
                                                    {t('settings.domain.btn_delete')}
                                                </DangerButton>
                                            </div>
                                        </div>

                                        {/* DNS Configuration Guide when not verified */}
                                        {!isVerified && (
                                            <div className="mt-4 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-500/5 p-4 space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                    <span>⚠️</span>
                                                    <span>{t('settings.domain.dns_guide_title')}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    {t('settings.domain.dns_guide_desc')}
                                                </p>

                                                {/* DNS Table */}
                                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                                                            <tr>
                                                                <th className="px-3 py-2">{t('settings.domain.th_record_type')}</th>
                                                                <th className="px-3 py-2">{t('settings.domain.th_host')}</th>
                                                                <th className="px-3 py-2">{t('settings.domain.th_target')}</th>
                                                                <th className="px-3 py-2">{t('settings.domain.th_ttl')}</th>
                                                                <th className="px-3 py-2 text-right">{t('settings.domain.th_action')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            <tr>
                                                                <td className="px-3 py-2.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                                                    CNAME
                                                                </td>
                                                                <td className="px-3 py-2.5 font-mono text-slate-800 dark:text-slate-200">
                                                                    {hostPrefix}
                                                                </td>
                                                                <td className="px-3 py-2.5 font-mono text-slate-800 dark:text-slate-200">
                                                                    {dnsTarget}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-slate-500">Auto / 3600</td>
                                                                <td className="px-3 py-2.5 text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopy(dnsTarget, `cname-${cd.id}`)}
                                                                        className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                                                    >
                                                                        {copiedField === `cname-${cd.id}` ? t('settings.domain.copied') : t('settings.domain.btn_copy_target')}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            {cd.verification_token && (
                                                                <tr>
                                                                    <td className="px-3 py-2.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                                                        TXT <span className="text-[10px] text-slate-400 font-normal">{t('settings.domain.optional_label')}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2.5 font-mono text-slate-800 dark:text-slate-200">
                                                                        _seruwit-challenge
                                                                    </td>
                                                                    <td className="px-3 py-2.5 font-mono text-slate-800 dark:text-slate-200">
                                                                        seruwit-verification={cd.verification_token}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-slate-500">Auto</td>
                                                                    <td className="px-3 py-2.5 text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleCopy(
                                                                                    `seruwit-verification=${cd.verification_token}`,
                                                                                    `txt-${cd.id}`
                                                                                )
                                                                            }
                                                                            className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                                                        >
                                                                            {copiedField === `txt-${cd.id}` ? t('settings.domain.copied') : t('settings.domain.btn_copy_value')}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Error Message if DNS query failed */}
                                                {cd.last_error && (
                                                    <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                                                        <strong>{t('settings.domain.last_check_result')}</strong> {cd.last_error}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Form to Connect a New Custom Domain */
                        <form onSubmit={submitAddDomain} className="max-w-xl space-y-4">
                            <div>
                                <InputLabel htmlFor="domain" value={t('settings.domain.input_label')} />
                                <div className="mt-1 flex rounded-xl shadow-sm">
                                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-500">
                                        https://
                                    </span>
                                    <TextInput
                                        id="domain"
                                        type="text"
                                        value={data.domain}
                                        onChange={(e) => setData('domain', e.target.value.toLowerCase().trim())}
                                        placeholder={t('settings.domain.input_placeholder')}
                                        className="!rounded-l-none font-mono text-xs w-full"
                                        required
                                    />
                                </div>
                                <InputError message={errors.domain} className="mt-1.5" />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    {t('settings.domain.input_hint', { subdomain: 'sewa.domainanda.com', app: 'app.domainanda.com' })}
                                </p>
                            </div>

                            <PrimaryButton type="submit" disabled={processing} className="text-xs">
                                {processing ? t('settings.domain.btn_connecting') : t('settings.domain.btn_connect')}
                            </PrimaryButton>
                        </form>
                    )}
                </div>

                {/* Helpful Guide Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span>💡</span>
                        <span>{t('settings.domain.guide_title')}</span>
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <li>{t('settings.domain.guide_step1')}</li>
                        <li>{t('settings.domain.guide_step2', { target: dnsTarget })}</li>
                        <li>{t('settings.domain.guide_step3')}</li>
                        <li>{t('settings.domain.guide_step4')}</li>
                    </ol>
                </div>
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDeleteDialog
                isOpen={domainToDelete !== null}
                onClose={() => setDomainToDelete(null)}
                onConfirm={confirmDelete}
                title={t('settings.domain.delete_modal_title')}
                message={t('settings.domain.delete_modal_message', { domain: domainToDelete?.domain ?? '' })}
            />
        </DynamicLayout>
    );
}
