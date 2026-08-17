import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import ReceivablesNav from '../../../../ReceivablesNav';

interface GatewayConfig {
    provider: string;
    is_enabled: boolean;
    is_production: boolean;
    merchant_id: string | null;
    has_server_key: boolean;
    has_client_key: boolean;
    client_key: string | null;
}

interface Props {
    config: GatewayConfig;
}

export default function Settings({ config }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        is_enabled: config.is_enabled,
        is_production: config.is_production,
        merchant_id: config.merchant_id ?? '',
        server_key: '',
        client_key: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('receivables.gateway.update'), { preserveScroll: true });
    };

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/webhooks/midtrans`
        : '/webhooks/midtrans';

    return (
        <DynamicLayout
            header={<PageHeader title={t('receivables.gateway.title')} />}
        >
            <Head title={t('receivables.gateway.title')} />
            <ReceivablesNav />

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-1">🌐 {t('receivables.gateway.title')}</h3>
                    <p className="mb-2 text-xs text-slate-400">{t('receivables.gateway.subtitle')}</p>
                    <div className="mb-6 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/50 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 text-[11px] font-mono text-indigo-900 dark:text-indigo-200">
                        {t('receivables.gateway.webhook_hint', { url: webhookUrl })}
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={data.is_enabled}
                                onChange={(e) => setData('is_enabled', e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 shadow-sm focus:ring-indigo-500"
                            />
                            {t('receivables.gateway.enabled')}
                        </label>

                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={data.is_production}
                                onChange={(e) => setData('is_production', e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 shadow-sm focus:ring-indigo-500"
                            />
                            {t('receivables.gateway.production')}
                        </label>

                        <div>
                            <InputLabel htmlFor="merchant_id" value={t('receivables.gateway.merchant_id')} />
                            <TextInput
                                id="merchant_id"
                                value={data.merchant_id}
                                onChange={(e) => setData('merchant_id', e.target.value)}
                                className="mt-1 w-full !rounded-2xl text-xs font-mono"
                            />
                            <InputError message={errors.merchant_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="server_key" value={t('receivables.gateway.server_key')} />
                            <TextInput
                                id="server_key"
                                type="password"
                                value={data.server_key}
                                onChange={(e) => setData('server_key', e.target.value)}
                                className="mt-1 w-full !rounded-2xl text-xs font-mono"
                                placeholder={config.has_server_key ? '••••••••' : ''}
                            />
                            <p className="mt-1 text-[11px] text-slate-400">{t('receivables.gateway.server_key_hint')}</p>
                            <InputError message={errors.server_key} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="client_key" value={t('receivables.gateway.client_key')} />
                            <TextInput
                                id="client_key"
                                type="password"
                                value={data.client_key}
                                onChange={(e) => setData('client_key', e.target.value)}
                                className="mt-1 w-full !rounded-2xl text-xs font-mono"
                                placeholder={config.has_client_key ? '••••••••' : ''}
                            />
                            <p className="mt-1 text-[11px] text-slate-400">{t('receivables.gateway.client_key_hint')}</p>
                            <InputError message={errors.client_key} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">💾 {t('common.save')}</PrimaryButton>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
