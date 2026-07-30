import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('receivables.gateway.title')}</h2>}
        >
            <Head title={t('receivables.gateway.title')} />
            <ReceivablesNav />

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="mb-4 text-sm text-gray-500">{t('receivables.gateway.subtitle')}</p>
                    <p className="mb-6 text-xs text-gray-400">
                        {t('receivables.gateway.webhook_hint', { url: webhookUrl })}
                    </p>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_enabled}
                                onChange={(e) => setData('is_enabled', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600"
                            />
                            {t('receivables.gateway.enabled')}
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_production}
                                onChange={(e) => setData('is_production', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600"
                            />
                            {t('receivables.gateway.production')}
                        </label>

                        <div>
                            <InputLabel htmlFor="merchant_id" value={t('receivables.gateway.merchant_id')} />
                            <TextInput
                                id="merchant_id"
                                value={data.merchant_id}
                                onChange={(e) => setData('merchant_id', e.target.value)}
                                className="mt-1 w-full"
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
                                className="mt-1 w-full"
                                placeholder={config.has_server_key ? '••••••••' : ''}
                            />
                            <p className="mt-1 text-xs text-gray-400">{t('receivables.gateway.server_key_hint')}</p>
                            <InputError message={errors.server_key} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="client_key" value={t('receivables.gateway.client_key')} />
                            <TextInput
                                id="client_key"
                                type="password"
                                value={data.client_key}
                                onChange={(e) => setData('client_key', e.target.value)}
                                className="mt-1 w-full"
                                placeholder={config.has_client_key ? '••••••••' : ''}
                            />
                            <p className="mt-1 text-xs text-gray-400">{t('receivables.gateway.client_key_hint')}</p>
                            <InputError message={errors.client_key} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
